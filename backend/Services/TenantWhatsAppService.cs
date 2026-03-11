using backend.Application.Interfaces;
using backend.Contracts;
using System.Security.Cryptography;

namespace backend.Services;

public sealed class TenantWhatsAppService(
    IDataStore store,
    ISecretProtector protector,
    IWhatsAppGateway whatsAppCloudService,
    IConfiguration configuration) : ITenantWhatsAppService
{
    private string ApiVersion => configuration["WhatsApp:ApiVersion"] ?? "v22.0";

    public Task<WhatsAppConnectionResponse?> GetConnectionAsync(Guid tenantId, CancellationToken cancellationToken = default)
    {
        return store.GetWhatsAppConnectionAsync(tenantId, cancellationToken);
    }

    public Task<List<WhatsAppChannelResponse>> GetChannelsAsync(Guid tenantId, CancellationToken cancellationToken = default)
    {
        return store.GetWhatsAppChannelsAsync(tenantId, cancellationToken);
    }

    public async Task<WhatsAppConnectionResponse> UpsertConnectionAsync(Guid tenantId, UpsertWhatsAppConnectionRequest request, CancellationToken cancellationToken = default)
    {
        var encryptedToken = await store.GetWhatsAppEncryptedTokenAsync(tenantId, cancellationToken);

        if (!string.IsNullOrWhiteSpace(request.AccessToken))
        {
            encryptedToken = protector.Protect(request.AccessToken.Trim());
        }

        var channels = await store.GetWhatsAppChannelsAsync(tenantId, cancellationToken);
        if (channels.Count == 0)
        {
            await EnsureChannelLimitAsync(tenantId, channels.Count, cancellationToken);
        }

        return await store.UpsertWhatsAppConnectionAsync(
            tenantId,
            request.WabaId?.Trim(),
            request.PhoneNumberId.Trim(),
            request.VerifyToken.Trim(),
            encryptedToken,
            request.IsActive,
            cancellationToken);
    }

    public async Task<WhatsAppChannelResponse> CreateChannelAsync(Guid tenantId, UpsertWhatsAppChannelRequest request, CancellationToken cancellationToken = default)
    {
        var currentCount = await store.GetWhatsAppChannelsCountAsync(tenantId, cancellationToken);
        await EnsureChannelLimitAsync(tenantId, currentCount, cancellationToken);

        var encryptedToken = string.IsNullOrWhiteSpace(request.AccessToken)
            ? null
            : protector.Protect(request.AccessToken.Trim());

        return await store.CreateWhatsAppChannelAsync(
            tenantId,
            request.DisplayName,
            request.WabaId,
            request.PhoneNumberId,
            request.VerifyToken,
            encryptedToken,
            request.IsActive,
            request.IsPrimary,
            cancellationToken);
    }

    public async Task<WhatsAppChannelResponse?> UpdateChannelAsync(Guid tenantId, Guid channelId, UpsertWhatsAppChannelRequest request, CancellationToken cancellationToken = default)
    {
        var encryptedToken = await store.GetWhatsAppEncryptedTokenAsync(tenantId, cancellationToken, channelId);
        if (!string.IsNullOrWhiteSpace(request.AccessToken))
        {
            encryptedToken = protector.Protect(request.AccessToken.Trim());
        }

        return await store.UpdateWhatsAppChannelAsync(
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
    }

    public Task<bool> DeleteChannelAsync(Guid tenantId, Guid channelId, CancellationToken cancellationToken = default)
    {
        return store.DeleteWhatsAppChannelAsync(tenantId, channelId, cancellationToken);
    }

    public async Task<WhatsAppTestResponse> TestConnectionAsync(Guid tenantId, CancellationToken cancellationToken = default)
    {
        var primary = (await store.GetWhatsAppChannelsAsync(tenantId, cancellationToken)).FirstOrDefault(channel => channel.IsPrimary);
        if (primary is null)
        {
            await store.MarkWhatsAppConnectionTestResultAsync(tenantId, false, "not_configured", "Configure ao menos um canal.", cancellationToken);
            return new WhatsAppTestResponse(false, "not_configured", "Configure ao menos um canal.");
        }

        return await TestChannelAsync(tenantId, primary.Id, cancellationToken);
    }

    public async Task<WhatsAppTestResponse> TestChannelAsync(Guid tenantId, Guid channelId, CancellationToken cancellationToken = default)
    {
        var credentials = await GetCredentialsAsync(tenantId, cancellationToken, channelId);
        if (credentials is null)
        {
            await store.MarkWhatsAppConnectionTestResultAsync(tenantId, false, "not_configured", "Configure phone_number_id e access_token.", cancellationToken, channelId);
            return new WhatsAppTestResponse(false, "not_configured", "Configure phone_number_id e access_token.");
        }

        var result = await whatsAppCloudService.TestCredentialsAsync(credentials.Value.PhoneNumberId, credentials.Value.AccessToken, ApiVersion, cancellationToken);
        await store.MarkWhatsAppConnectionTestResultAsync(tenantId, result.Success, result.Status, result.Error, cancellationToken, channelId);
        return result;
    }

    public Task<Guid?> ResolveTenantIdByPhoneNumberIdAsync(string phoneNumberId, CancellationToken cancellationToken = default)
    {
        return store.FindTenantIdByPhoneNumberIdAsync(phoneNumberId, cancellationToken);
    }

    public Task<WhatsAppChannelResponse?> GetChannelByPhoneNumberIdAsync(Guid tenantId, string phoneNumberId, CancellationToken cancellationToken = default)
    {
        return store.GetWhatsAppChannelByPhoneNumberIdAsync(tenantId, phoneNumberId, cancellationToken);
    }

    public Task<Guid?> ResolveTenantIdByVerifyTokenAsync(string verifyToken, CancellationToken cancellationToken = default)
    {
        return store.FindTenantIdByVerifyTokenAsync(verifyToken, cancellationToken);
    }

    public async Task<WhatsAppSendResult> SendMessageAsync(Guid tenantId, Guid? conversationId, string toPhone, string message, CancellationToken cancellationToken = default, Guid? channelId = null)
    {
        var credentials = await GetCredentialsAsync(tenantId, cancellationToken, channelId);
        if (credentials is null)
        {
            var notConfigured = new WhatsAppSendResult
            {
                Success = false,
                Status = "not_configured",
                Error = "WhatsApp nao configurado para este tenant."
            };

            await store.AddWhatsAppMessageLogAsync(tenantId, conversationId, toPhone, "outbound", notConfigured.Status, notConfigured.Error, message, cancellationToken);
            return notConfigured;
        }

        var send = await whatsAppCloudService.SendTextMessageWithCredentialsAsync(
            credentials.Value.PhoneNumberId,
            credentials.Value.AccessToken,
            toPhone,
            message,
            ApiVersion,
            cancellationToken);

        await store.AddWhatsAppMessageLogAsync(
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

    public Task<List<WhatsAppMessageLogResponse>> GetLogsAsync(Guid tenantId, int limit = 100, CancellationToken cancellationToken = default)
    {
        return store.GetWhatsAppMessageLogsAsync(tenantId, limit, cancellationToken);
    }

    public async Task<int> GetAllowedChannelsAsync(Guid tenantId, CancellationToken cancellationToken = default)
    {
        var subscription = await store.GetTenantSubscriptionAsync(tenantId, cancellationToken);
        var plans = await store.GetBillingPlansAsync(cancellationToken);
        return plans.FirstOrDefault(plan => string.Equals(plan.Code, subscription.PlanCode, StringComparison.OrdinalIgnoreCase))?.IncludedWhatsAppNumbers ?? 1;
    }

    public async Task<MetaWhatsAppSetupResponse> GetMetaSetupAsync(Guid tenantId, string? publicBaseUrl, CancellationToken cancellationToken = default)
    {
        var channels = await store.GetWhatsAppChannelsAsync(tenantId, cancellationToken);
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

        var channels = await store.GetWhatsAppChannelsAsync(tenantId, cancellationToken);
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
        WhatsAppChannelResponse? channel = null;

        if (channelId.HasValue)
        {
            channel = await store.GetWhatsAppChannelByIdAsync(tenantId, channelId.Value, cancellationToken);
        }
        else
        {
            var channels = await store.GetWhatsAppChannelsAsync(tenantId, cancellationToken);
            channel = channels.FirstOrDefault(current => current.IsPrimary) ?? channels.FirstOrDefault();
        }

        if (channel is null || !channel.IsActive || string.IsNullOrWhiteSpace(channel.PhoneNumberId))
        {
            return null;
        }

        var encryptedToken = await store.GetWhatsAppEncryptedTokenAsync(tenantId, cancellationToken, channel.Id);
        var token = protector.UnprotectOrNull(encryptedToken);
        if (string.IsNullOrWhiteSpace(token))
        {
            return null;
        }

        return (channel.PhoneNumberId, token);
    }
}



