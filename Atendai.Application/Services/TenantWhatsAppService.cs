using Atendai.Application.Interfaces;
using Atendai.Application.DTOs;
using Atendai.Application.Interfaces.Repositories;
using Atendai.Domain.Entities;
using System.Security.Cryptography;
using System.Text.Json;
using System.Text.Json.Serialization;

namespace Atendai.Application.Services;

public sealed class TenantWhatsAppService(
    IWhatsAppRepository whatsAppRepository,
    IBillingRepository billingRepository,
    IConversationRepository conversationRepository,
    ISecretProtector protector,
    IWhatsAppGateway whatsAppCloudService,
    IConfiguration configuration,
    IHttpClientFactory httpClientFactory,
    IWhatsAppWebSessionService whatsAppWebSessionService) : ITenantWhatsAppService
{
    private string ApiVersion => configuration["WhatsApp:ApiVersion"] ?? "v22.0";
    private string MetaGraphApiVersion => configuration["MetaEmbeddedSignup:GraphApiVersion"] ?? ApiVersion;

    public async Task<WhatsAppConnectionResponse?> GetConnectionAsync(Guid tenantId, CancellationToken cancellationToken = default)
    {
        return MapConnection(await whatsAppRepository.GetWhatsAppConnectionAsync(tenantId, cancellationToken));
    }

    public async Task<List<WhatsAppChannelResponse>> GetChannelsAsync(Guid tenantId, CancellationToken cancellationToken = default)
    {
        var channels = await whatsAppRepository.GetWhatsAppChannelsAsync(tenantId, cancellationToken);
        return channels.Select(MapChannel).OfType<WhatsAppChannelResponse>().ToList();
    }

    public async Task<WhatsAppConnectionResponse> UpsertConnectionAsync(Guid tenantId, UpsertWhatsAppConnectionRequest request, CancellationToken cancellationToken = default)
    {
        var encryptedToken = await whatsAppRepository.GetWhatsAppEncryptedTokenAsync(tenantId, cancellationToken);

        if (!string.IsNullOrWhiteSpace(request.AccessToken))
        {
            encryptedToken = protector.Protect(request.AccessToken.Trim());
        }

        var channels = await whatsAppRepository.GetWhatsAppChannelsAsync(tenantId, cancellationToken);
        if (channels.Count == 0)
        {
            await EnsureChannelLimitAsync(tenantId, channels.Count, cancellationToken);
        }

        var connection = await whatsAppRepository.UpsertWhatsAppConnectionAsync(
            tenantId,
            request.WabaId?.Trim(),
            request.PhoneNumberId.Trim(),
            request.VerifyToken.Trim(),
            encryptedToken,
            request.IsActive,
            cancellationToken);
        return MapConnection(connection)!;
    }

    public async Task<WhatsAppChannelResponse> CreateChannelAsync(Guid tenantId, UpsertWhatsAppChannelRequest request, CancellationToken cancellationToken = default)
    {
        var currentCount = await whatsAppRepository.GetWhatsAppChannelsCountAsync(tenantId, cancellationToken);
        await EnsureChannelLimitAsync(tenantId, currentCount, cancellationToken);

        var encryptedToken = string.IsNullOrWhiteSpace(request.AccessToken)
            ? null
            : protector.Protect(request.AccessToken.Trim());

        var channel = await whatsAppRepository.CreateWhatsAppChannelAsync(
            tenantId,
            request.DisplayName,
            request.WabaId,
            request.PhoneNumberId,
            request.VerifyToken,
            encryptedToken,
            request.IsActive,
            request.IsPrimary,
            cancellationToken);
        return MapChannel(channel)!;
    }

    public async Task<WhatsAppChannelResponse?> UpdateChannelAsync(Guid tenantId, Guid channelId, UpsertWhatsAppChannelRequest request, CancellationToken cancellationToken = default)
    {
        var encryptedToken = await whatsAppRepository.GetWhatsAppEncryptedTokenAsync(tenantId, cancellationToken, channelId);
        if (!string.IsNullOrWhiteSpace(request.AccessToken))
        {
            encryptedToken = protector.Protect(request.AccessToken.Trim());
        }

        var channel = await whatsAppRepository.UpdateWhatsAppChannelAsync(
            tenantId,
            channelId,
            request.DisplayName,
            request.WabaId,
            request.PhoneNumberId,
            request.VerifyToken,
            encryptedToken,
            request.IsActive,
            request.IsPrimary,
            cancellationToken);
        return MapChannel(channel);
    }

    public Task<bool> DeleteChannelAsync(Guid tenantId, Guid channelId, CancellationToken cancellationToken = default)
    {
        return whatsAppRepository.DeleteWhatsAppChannelAsync(tenantId, channelId, cancellationToken);
    }

    public async Task<WhatsAppTestResponse> TestConnectionAsync(Guid tenantId, CancellationToken cancellationToken = default)
    {
        var primary = (await whatsAppRepository.GetWhatsAppChannelsAsync(tenantId, cancellationToken)).FirstOrDefault(channel => channel.IsPrimary);
        if (primary is null)
        {
            await whatsAppRepository.MarkWhatsAppConnectionTestResultAsync(tenantId, false, "not_configured", "Configure ao menos um canal.", cancellationToken);
            return new WhatsAppTestResponse(false, "not_configured", "Configure ao menos um canal.");
        }

        return await TestChannelAsync(tenantId, primary.Id, cancellationToken);
    }

    public async Task<WhatsAppTestResponse> TestChannelAsync(Guid tenantId, Guid channelId, CancellationToken cancellationToken = default)
    {
        var credentials = await GetCredentialsAsync(tenantId, cancellationToken, channelId);
        if (credentials is null)
        {
            await whatsAppRepository.MarkWhatsAppConnectionTestResultAsync(tenantId, false, "not_configured", "Configure phone_number_id e access_token.", cancellationToken, channelId);
            return new WhatsAppTestResponse(false, "not_configured", "Configure phone_number_id e access_token.");
        }

        var result = await whatsAppCloudService.TestCredentialsAsync(credentials.Value.PhoneNumberId, credentials.Value.AccessToken, ApiVersion, cancellationToken);
        await whatsAppRepository.MarkWhatsAppConnectionTestResultAsync(tenantId, result.Success, result.Status, result.Error, cancellationToken, channelId);
        return result;
    }

    public Task<Guid?> ResolveTenantIdByPhoneNumberIdAsync(string phoneNumberId, CancellationToken cancellationToken = default)
    {
        return whatsAppRepository.FindTenantIdByPhoneNumberIdAsync(phoneNumberId, cancellationToken);
    }

    public async Task<WhatsAppChannelResponse?> GetChannelByPhoneNumberIdAsync(Guid tenantId, string phoneNumberId, CancellationToken cancellationToken = default)
    {
        return MapChannel(await whatsAppRepository.GetWhatsAppChannelByPhoneNumberIdAsync(tenantId, phoneNumberId, cancellationToken));
    }

    public Task<Guid?> ResolveTenantIdByVerifyTokenAsync(string verifyToken, CancellationToken cancellationToken = default)
    {
        return whatsAppRepository.FindTenantIdByVerifyTokenAsync(verifyToken, cancellationToken);
    }

    public async Task<WhatsAppSendResult> SendMessageAsync(Guid tenantId, Guid? conversationId, string toPhone, string message, CancellationToken cancellationToken = default, Guid? channelId = null)
    {
        var conversationTransport = conversationId.HasValue
            ? await conversationRepository.GetConversationTransportAsync(tenantId, conversationId.Value, cancellationToken)
            : null;

        if (string.Equals(conversationTransport, "qr", StringComparison.OrdinalIgnoreCase))
        {
            var qrSend = await TrySendViaQrSessionAsync(tenantId, toPhone, message, cancellationToken);
            if (qrSend is not null)
            {
                await whatsAppRepository.AddWhatsAppMessageLogAsync(
                    tenantId,
                    conversationId,
                    toPhone,
                    "outbound",
                    qrSend.Status,
                    qrSend.Error,
                    message,
                    cancellationToken);

                return qrSend;
            }
        }

        var credentials = await GetCredentialsAsync(tenantId, cancellationToken, channelId);
        if (credentials is null)
        {
            var qrFallback = await TrySendViaQrSessionAsync(tenantId, toPhone, message, cancellationToken);
            if (qrFallback is not null)
            {
                await whatsAppRepository.AddWhatsAppMessageLogAsync(
                    tenantId,
                    conversationId,
                    toPhone,
                    "outbound",
                    qrFallback.Status,
                    qrFallback.Error,
                    message,
                    cancellationToken);

                return qrFallback;
            }

            var notConfigured = new WhatsAppSendResult
            {
                Success = false,
                Status = "not_configured",
                Error = "WhatsApp nao configurado para este tenant."
            };

            await whatsAppRepository.AddWhatsAppMessageLogAsync(tenantId, conversationId, toPhone, "outbound", notConfigured.Status, notConfigured.Error, message, cancellationToken);
            return notConfigured;
        }

        var send = await whatsAppCloudService.SendTextMessageWithCredentialsAsync(
            credentials.Value.PhoneNumberId,
            credentials.Value.AccessToken,
            toPhone,
            message,
            ApiVersion,
            cancellationToken);

        await whatsAppRepository.AddWhatsAppMessageLogAsync(
            tenantId,
            conversationId,
            toPhone,
            "outbound",
            send.Status,
            send.Error,
            message,
            cancellationToken);

        return send;
    }

    public async Task<List<WhatsAppMessageLogResponse>> GetLogsAsync(Guid tenantId, int limit = 100, CancellationToken cancellationToken = default)
    {
        var logs = await whatsAppRepository.GetWhatsAppMessageLogsAsync(tenantId, limit, cancellationToken);
        return logs.Select(MapLog).ToList();
    }

    public async Task<int> GetAllowedChannelsAsync(Guid tenantId, CancellationToken cancellationToken = default)
    {
        var subscription = await billingRepository.GetTenantSubscriptionAsync(tenantId, cancellationToken);
        var plans = await billingRepository.GetBillingPlansAsync(cancellationToken);
        return plans.FirstOrDefault(plan => string.Equals(plan.Code, subscription.PlanCode, StringComparison.OrdinalIgnoreCase))?.IncludedWhatsAppNumbers ?? 1;
    }

    public async Task<MetaWhatsAppSetupResponse> GetMetaSetupAsync(Guid tenantId, string? publicBaseUrl, CancellationToken cancellationToken = default)
    {
        var channels = await whatsAppRepository.GetWhatsAppChannelsAsync(tenantId, cancellationToken);
        var channel = channels.FirstOrDefault(current => current.IsPrimary) ?? channels.FirstOrDefault();
        var callbackUrl = BuildWebhookUrl(publicBaseUrl);

        var isReady = channel is not null
            && channel.IsActive
            && !string.IsNullOrWhiteSpace(channel.PhoneNumberId)
            && string.Equals(channel.LastStatus, "connected", StringComparison.OrdinalIgnoreCase)
            && string.IsNullOrWhiteSpace(channel.LastError);

        return new MetaWhatsAppSetupResponse(
            isReady,
            callbackUrl,
            channel?.VerifyToken ?? string.Empty,
            channel?.PhoneNumberId,
            channel?.WabaId,
            channel?.Id,
            channel?.DisplayName,
            channel?.LastStatus,
            channel?.LastError,
            channel?.LastTestedAt,
            "messages",
            "/api/whatsapp/webhook");
    }

    public async Task<MetaWhatsAppBootstrapResponse> BootstrapMetaChannelAsync(Guid tenantId, MetaWhatsAppBootstrapRequest request, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(request.PhoneNumberId) || string.IsNullOrWhiteSpace(request.AccessToken))
        {
            throw new ArgumentException("PhoneNumberId e AccessToken sao obrigatorios.");
        }

        var channels = await whatsAppRepository.GetWhatsAppChannelsAsync(tenantId, cancellationToken);
        var normalizedPhoneNumberId = request.PhoneNumberId.Trim();
        var existing = channels.FirstOrDefault(channel => string.Equals(channel.PhoneNumberId, normalizedPhoneNumberId, StringComparison.Ordinal));
        var displayName = string.IsNullOrWhiteSpace(request.DisplayName)
            ? existing?.DisplayName ?? "WhatsApp principal"
            : request.DisplayName.Trim();
        var verifyToken = string.IsNullOrWhiteSpace(request.VerifyToken)
            ? (!string.IsNullOrWhiteSpace(existing?.VerifyToken) ? existing.VerifyToken : GenerateVerifyToken())
            : request.VerifyToken.Trim();
        var upsert = new UpsertWhatsAppChannelRequest(
            displayName,
            string.IsNullOrWhiteSpace(request.WabaId) ? existing?.WabaId : request.WabaId.Trim(),
            normalizedPhoneNumberId,
            verifyToken,
            request.AccessToken.Trim(),
            request.IsActive,
            request.IsPrimary);

        WhatsAppChannelResponse channel;
        if (existing is null)
        {
            channel = await CreateChannelAsync(tenantId, upsert, cancellationToken);
        }
        else
        {
            channel = await UpdateChannelAsync(tenantId, existing.Id, upsert, cancellationToken)
                ?? throw new InvalidOperationException("Nao foi possivel atualizar o canal WhatsApp informado.");
        }

        var test = await TestChannelAsync(tenantId, channel.Id, cancellationToken);
        return new MetaWhatsAppBootstrapResponse(
            channel.Id,
            channel.DisplayName,
            BuildWebhookUrl(request.PublicBaseUrl),
            channel.VerifyToken,
            channel.PhoneNumberId,
            channel.WabaId,
            channel.IsActive,
            channel.IsPrimary,
            test.Success,
            test.Status,
            test.Error);
    }

    public Task<MetaEmbeddedSignupConfigResponse> GetEmbeddedSignupConfigAsync(CancellationToken cancellationToken = default)
    {
        var appId = configuration["MetaEmbeddedSignup:AppId"];
        var configurationId = configuration["MetaEmbeddedSignup:ConfigurationId"];
        var isReady = !string.IsNullOrWhiteSpace(appId) && !string.IsNullOrWhiteSpace(configurationId);
        var error = isReady
            ? null
            : "Configure MetaEmbeddedSignup:AppId e MetaEmbeddedSignup:ConfigurationId para usar o fluxo oficial da Meta.";

        return Task.FromResult(new MetaEmbeddedSignupConfigResponse(
            isReady,
            appId,
            configurationId,
            MetaGraphApiVersion,
            error));
    }

    public async Task<MetaEmbeddedSignupExchangeResponse> CompleteEmbeddedSignupAsync(Guid tenantId, CompleteMetaEmbeddedSignupRequest request, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(request.Code))
        {
            throw new ArgumentException("O code retornado pela Meta e obrigatorio.");
        }

        if (string.IsNullOrWhiteSpace(request.PhoneNumberId))
        {
            return new MetaEmbeddedSignupExchangeResponse(
                false,
                "missing_phone_number",
                "O fluxo oficial terminou sem phone_number_id. Use o fluxo padrao Cloud API da Meta para concluir a conexao deste CRM.",
                null,
                null,
                null,
                null,
                null,
                request.WabaId,
                false,
                null,
                null);
        }

        var accessToken = await ExchangeEmbeddedSignupCodeAsync(request.Code.Trim(), cancellationToken);
        var bootstrap = await BootstrapMetaChannelAsync(
            tenantId,
            new MetaWhatsAppBootstrapRequest(
                request.DisplayName ?? "WhatsApp oficial",
                request.WabaId,
                request.PhoneNumberId,
                null,
                accessToken,
                true,
                request.IsPrimary,
                request.PublicBaseUrl),
            cancellationToken);

        return new MetaEmbeddedSignupExchangeResponse(
            true,
            request.FinishType,
            $"Cadastro incorporado concluido com sucesso. Canal {bootstrap.DisplayName} preparado no CRM.",
            bootstrap.ChannelId,
            bootstrap.DisplayName,
            bootstrap.CallbackUrl,
            bootstrap.VerifyToken,
            bootstrap.PhoneNumberId,
            bootstrap.WabaId,
            bootstrap.TestSucceeded,
            bootstrap.TestStatus,
            bootstrap.TestError);
    }

    private string BuildWebhookUrl(string? publicBaseUrl)
    {
        var normalized = NormalizePublicBaseUrl(publicBaseUrl)
            ?? NormalizePublicBaseUrl(configuration["PublicApi:BaseUrl"])
            ?? NormalizePublicBaseUrl(configuration["PublicApi:NgrokUrl"]);

        return string.IsNullOrWhiteSpace(normalized)
            ? "/api/whatsapp/webhook"
            : $"{normalized}/api/whatsapp/webhook";
    }

    private static string? NormalizePublicBaseUrl(string? baseUrl)
    {
        if (string.IsNullOrWhiteSpace(baseUrl))
        {
            return null;
        }

        return baseUrl.Trim().TrimEnd('/');
    }

    private static string GenerateVerifyToken()
    {
        return Convert.ToHexString(RandomNumberGenerator.GetBytes(18)).ToLowerInvariant();
    }

    private async Task EnsureChannelLimitAsync(Guid tenantId, int currentCount, CancellationToken cancellationToken)
    {
        var allowed = await GetAllowedChannelsAsync(tenantId, cancellationToken);
        if (currentCount >= allowed)
        {
            throw new InvalidOperationException($"O plano atual permite ate {allowed} canal(is) de WhatsApp.");
        }
    }

    private async Task<(string PhoneNumberId, string AccessToken)?> GetCredentialsAsync(Guid tenantId, CancellationToken cancellationToken, Guid? channelId = null)
    {
        WhatsAppChannel? channel = null;

        if (channelId.HasValue)
        {
            channel = await whatsAppRepository.GetWhatsAppChannelByIdAsync(tenantId, channelId.Value, cancellationToken);
        }
        else
        {
            var channels = await whatsAppRepository.GetWhatsAppChannelsAsync(tenantId, cancellationToken);
            channel = channels.FirstOrDefault(current => current.IsPrimary) ?? channels.FirstOrDefault();
        }

        if (channel is null || !channel.IsActive || string.IsNullOrWhiteSpace(channel.PhoneNumberId))
        {
            return null;
        }

        var encryptedToken = await whatsAppRepository.GetWhatsAppEncryptedTokenAsync(tenantId, cancellationToken, channel.Id);
        var token = protector.UnprotectOrNull(encryptedToken);
        if (string.IsNullOrWhiteSpace(token))
        {
            return null;
        }

        return (channel.PhoneNumberId, token);
    }

    private async Task<WhatsAppSendResult?> TrySendViaQrSessionAsync(Guid tenantId, string toPhone, string message, CancellationToken cancellationToken)
    {
        var qrState = await whatsAppWebSessionService.GetStateAsync(tenantId, cancellationToken);
        if (!qrState.IsConfigured || !string.Equals(qrState.Status, "connected", StringComparison.OrdinalIgnoreCase))
        {
            return null;
        }

        var qrSend = await whatsAppWebSessionService.SendMessageAsync(
            tenantId,
            new SendWhatsAppWebSessionMessageRequest(toPhone, message),
            cancellationToken);

        return new WhatsAppSendResult
        {
            Success = qrSend.Success,
            Status = qrSend.Success ? "sent_qr" : qrSend.Status,
            Error = qrSend.Success ? null : qrSend.Message
        };
    }

    private async Task<string> ExchangeEmbeddedSignupCodeAsync(string code, CancellationToken cancellationToken)
    {
        var appId = configuration["MetaEmbeddedSignup:AppId"];
        var appSecret = configuration["MetaEmbeddedSignup:AppSecret"];

        if (string.IsNullOrWhiteSpace(appId) || string.IsNullOrWhiteSpace(appSecret))
        {
            throw new InvalidOperationException("Configure MetaEmbeddedSignup:AppId e MetaEmbeddedSignup:AppSecret para trocar o code da Meta.");
        }

        var client = httpClientFactory.CreateClient();
        var endpoint = $"https://graph.facebook.com/{MetaGraphApiVersion}/oauth/access_token?client_id={Uri.EscapeDataString(appId)}&client_secret={Uri.EscapeDataString(appSecret)}&code={Uri.EscapeDataString(code)}";

        using var response = await client.GetAsync(endpoint, cancellationToken);
        var body = await response.Content.ReadAsStringAsync(cancellationToken);
        if (!response.IsSuccessStatusCode)
        {
            throw new InvalidOperationException($"A Meta recusou a troca do code. Status {(int)response.StatusCode}: {body}");
        }

        var payload = JsonSerializer.Deserialize<MetaAccessTokenResponse>(body, new JsonSerializerOptions(JsonSerializerDefaults.Web));
        if (string.IsNullOrWhiteSpace(payload?.AccessToken))
        {
            throw new InvalidOperationException("A Meta nao retornou access_token na troca do code.");
        }

        return payload.AccessToken;
    }

    private static WhatsAppConnectionResponse? MapConnection(WhatsAppConnection? connection)
    {
        return connection is null
            ? null
            : new WhatsAppConnectionResponse(
                connection.TenantId,
                connection.WabaId,
                connection.PhoneNumberId,
                connection.VerifyToken,
                connection.IsActive,
                connection.LastTestedAt,
                connection.LastStatus,
                connection.LastError,
                connection.UpdatedAt);
    }

    private static WhatsAppChannelResponse? MapChannel(WhatsAppChannel? channel)
    {
        return channel is null
            ? null
            : new WhatsAppChannelResponse(
                channel.Id,
                channel.TenantId,
                channel.DisplayName,
                channel.WabaId,
                channel.PhoneNumberId,
                channel.VerifyToken,
                channel.IsActive,
                channel.IsPrimary,
                channel.LastTestedAt,
                channel.LastStatus,
                channel.LastError,
                channel.UpdatedAt);
    }

    private static WhatsAppMessageLogResponse MapLog(WhatsAppMessageLog log)
    {
        return new WhatsAppMessageLogResponse(
            log.Id,
            log.TenantId,
            log.ConversationId,
            log.ToPhone,
            log.Direction,
            log.Status,
            log.ErrorDetail,
            log.CreatedAt);
    }

    private sealed class MetaAccessTokenResponse
    {
        [JsonPropertyName("access_token")]
        public string? AccessToken { get; set; }
    }
}
