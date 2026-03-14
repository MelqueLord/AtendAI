using System.Net.Http.Json;
using System.Net.Sockets;
using System.Text.Json;
using Atendai.Application.Interfaces;
using Atendai.Application.DTOs;

namespace Atendai.Infrastructure.Services;

public sealed class WhatsAppWebSessionService(
    IConfiguration configuration,
    IHttpClientFactory httpClientFactory) : IWhatsAppWebSessionService
{
    private static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web);
    private static readonly TimeSpan BridgeRequestTimeout = TimeSpan.FromSeconds(10);
    private static readonly TimeSpan BridgeStateFallbackTimeout = TimeSpan.FromSeconds(3);
    private static readonly TimeSpan BridgeHealthProbeTimeout = TimeSpan.FromSeconds(2);

    private string? BridgeBaseUrl => NormalizeBaseUrl(configuration["WhatsAppWebBridge:BaseUrl"]);
    private string? BridgeApiKey => configuration["WhatsAppWebBridge:ApiKey"];

    public async Task<WhatsAppWebSessionStateResponse> GetStateAsync(Guid tenantId, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(BridgeBaseUrl))
        {
            return BuildNotConfiguredState();
        }

        try
        {
            using var client = CreateClient();
            using var response = await client.GetAsync($"/sessions/{tenantId}", cancellationToken);
            if (!response.IsSuccessStatusCode)
            {
                var body = await response.Content.ReadAsStringAsync(cancellationToken);
                return new WhatsAppWebSessionStateResponse(
                    true,
                    "bridge_error",
                    $"A bridge QR respondeu com erro {(int)response.StatusCode}: {body}",
                    null,
                    null,
                    null,
                    null,
                    null,
                    DateTimeOffset.UtcNow,
                    true,
                    false,
                    false,
                    0,
                    null);
            }

            var payload = await response.Content.ReadFromJsonAsync<WhatsAppWebSessionStateResponse>(JsonOptions, cancellationToken);
            return payload ?? new WhatsAppWebSessionStateResponse(
                true,
                "empty_response",
                "A bridge QR nao retornou estado da sessao.",
                null,
                null,
                null,
                null,
                null,
                DateTimeOffset.UtcNow,
                true,
                false,
                false,
                0,
                null);
        }
        catch (Exception ex)
        {
            var isHealthy = await ProbeBridgeHealthAsync();
            return new WhatsAppWebSessionStateResponse(
                true,
                "bridge_unreachable",
                BuildBridgeUnavailableMessage("consultar", ex, isHealthy),
                null,
                null,
                null,
                null,
                null,
                DateTimeOffset.UtcNow,
                true,
                false,
                false,
                0,
                null);
        }
    }

    public Task<WhatsAppWebSessionActionResponse> StartAsync(Guid tenantId, StartWhatsAppWebSessionRequest request, CancellationToken cancellationToken = default)
    {
        return SendActionAsync(tenantId, $"/sessions/{tenantId}/start", request, cancellationToken);
    }

    public Task<WhatsAppWebSessionActionResponse> RestartAsync(Guid tenantId, CancellationToken cancellationToken = default)
    {
        return SendActionAsync(tenantId, $"/sessions/{tenantId}/restart", new { }, cancellationToken);
    }

    public Task<WhatsAppWebSessionActionResponse> DisconnectAsync(Guid tenantId, CancellationToken cancellationToken = default)
    {
        return SendActionAsync(tenantId, $"/sessions/{tenantId}/disconnect", new { }, cancellationToken);
    }

    public Task<WhatsAppWebSessionActionResponse> SyncHistoryAsync(Guid tenantId, CancellationToken cancellationToken = default)
    {
        return SendActionAsync(tenantId, $"/sessions/{tenantId}/sync-history", new { }, cancellationToken);
    }

    public Task<WhatsAppWebSessionActionResponse> SendMessageAsync(Guid tenantId, SendWhatsAppWebSessionMessageRequest request, CancellationToken cancellationToken = default)
    {
        return SendActionAsync(tenantId, $"/sessions/{tenantId}/send", request, cancellationToken);
    }

    private async Task<WhatsAppWebSessionActionResponse> SendActionAsync(Guid tenantId, string path, object body, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(BridgeBaseUrl))
        {
            return new WhatsAppWebSessionActionResponse(
                false,
                "not_configured",
                "Configure WhatsAppWebBridge:BaseUrl para usar o modulo QR experimental.",
                BuildNotConfiguredState());
        }

        try
        {
            using var client = CreateClient();
            using var response = await client.PostAsJsonAsync(path, body, JsonOptions, cancellationToken);
            if (!response.IsSuccessStatusCode)
            {
                var error = await response.Content.ReadAsStringAsync(cancellationToken);
                var state = await GetStateAsyncFromBridgeSafe(tenantId, cancellationToken);

                try
                {
                    var errorPayload = JsonSerializer.Deserialize<WhatsAppWebSessionActionResponse>(error, JsonOptions);
                    if (errorPayload is not null)
                    {
                        return new WhatsAppWebSessionActionResponse(
                            false,
                            string.IsNullOrWhiteSpace(errorPayload.Status) ? "bridge_error" : errorPayload.Status,
                            string.IsNullOrWhiteSpace(errorPayload.Message) ? $"A bridge QR respondeu com erro {(int)response.StatusCode}." : errorPayload.Message,
                            errorPayload.Session ?? state);
                    }
                }
                catch
                {
                    // Fall back to the raw bridge error below when the payload is not JSON.
                }

                return new WhatsAppWebSessionActionResponse(
                    false,
                    "bridge_error",
                    $"A bridge QR respondeu com erro {(int)response.StatusCode}: {error}",
                    state);
            }

            var payload = await response.Content.ReadFromJsonAsync<WhatsAppWebSessionActionResponse>(JsonOptions, cancellationToken);
            return payload ?? new WhatsAppWebSessionActionResponse(
                false,
                "empty_response",
                "A bridge QR nao retornou payload da operacao.",
                await GetStateAsyncFromBridgeSafe(tenantId, cancellationToken));
        }
        catch (Exception ex)
        {
            var isHealthy = await ProbeBridgeHealthAsync();
            return new WhatsAppWebSessionActionResponse(
                false,
                "bridge_unreachable",
                BuildBridgeUnavailableMessage("falar com", ex, isHealthy),
                await GetStateAsyncFromBridgeSafe(tenantId, cancellationToken));
        }
    }

    private async Task<WhatsAppWebSessionStateResponse?> GetStateAsyncFromBridgeSafe(Guid tenantId, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(BridgeBaseUrl))
        {
            return BuildNotConfiguredState();
        }

        try
        {
            using var client = CreateClient(BridgeStateFallbackTimeout);
            using var response = await client.GetAsync($"/sessions/{tenantId}", cancellationToken);
            if (!response.IsSuccessStatusCode)
            {
                return null;
            }

            return await response.Content.ReadFromJsonAsync<WhatsAppWebSessionStateResponse>(JsonOptions, cancellationToken);
        }
        catch
        {
            return null;
        }
    }

    private async Task<bool> ProbeBridgeHealthAsync()
    {
        if (string.IsNullOrWhiteSpace(BridgeBaseUrl))
        {
            return false;
        }

        try
        {
            using var client = CreateClient(BridgeHealthProbeTimeout);
            using var response = await client.GetAsync("/health", CancellationToken.None);
            return response.IsSuccessStatusCode;
        }
        catch
        {
            return false;
        }
    }

    private HttpClient CreateClient(TimeSpan? timeout = null)
    {
        var client = httpClientFactory.CreateClient();
        client.BaseAddress = new Uri(BridgeBaseUrl!);
        client.Timeout = timeout ?? BridgeRequestTimeout;

        if (!string.IsNullOrWhiteSpace(BridgeApiKey) && !client.DefaultRequestHeaders.Contains("X-Atendai-Bridge-Key"))
        {
            client.DefaultRequestHeaders.Add("X-Atendai-Bridge-Key", BridgeApiKey);
        }

        return client;
    }

    private static string? NormalizeBaseUrl(string? value)
    {
        if (string.IsNullOrWhiteSpace(value))
        {
            return null;
        }

        return value.Trim().TrimEnd('/');
    }

    private string BuildBridgeUnavailableMessage(string action, Exception exception, bool bridgeHealthOk)
    {
        var baseUrl = BridgeBaseUrl ?? "a URL configurada";
        var rootCause = exception.GetBaseException();
        var isConnectionRefused = rootCause is SocketException socket && socket.SocketErrorCode == SocketError.ConnectionRefused
            || exception.Message.Contains("Connection refused", StringComparison.OrdinalIgnoreCase);
        var isTimeout = exception is TaskCanceledException or TimeoutException
            || exception.Message.Contains("Timeout", StringComparison.OrdinalIgnoreCase)
            || exception.Message.Contains("timed out", StringComparison.OrdinalIgnoreCase)
            || exception.Message.Contains("tempo limite", StringComparison.OrdinalIgnoreCase);

        if (isConnectionRefused)
        {
            var guidance = $"Nao foi possivel {action} a bridge QR em {baseUrl}. A porta recusou conexao, o que normalmente significa que a bridge nao esta rodando. Suba a bridge com 'cd whatsapp-web-bridge && npm start'.";
            if (baseUrl.Contains("localhost", StringComparison.OrdinalIgnoreCase) || baseUrl.Contains("127.0.0.1", StringComparison.OrdinalIgnoreCase))
            {
                guidance += " Se o backend estiver rodando em container, WSL ou outra VM, 'localhost' aponta para esse ambiente. Nesse caso, troque WhatsAppWebBridge:BaseUrl para 'http://host.docker.internal:3011' ou para o IP da maquina host.";
            }

            return guidance;
        }

        if (isTimeout)
        {
            if (bridgeHealthOk)
            {
                return $"Nao foi possivel {action} a bridge QR em {baseUrl}: a bridge respondeu ao /health, mas a operacao da sessao excedeu o tempo limite. Isso normalmente indica uma sessao QR travada ou reiniciando. Recarregue o CRM e, se persistir, reinicie a bridge com 'cd whatsapp-web-bridge && node server.mjs'.";
            }

            return $"Nao foi possivel {action} a bridge QR em {baseUrl}: a operacao excedeu o tempo limite e a bridge nao respondeu ao /health. Suba a bridge com 'cd whatsapp-web-bridge && node server.mjs'.";
        }

        return $"Nao foi possivel {action} a bridge QR em {baseUrl}: {exception.Message}";
    }

    private static WhatsAppWebSessionStateResponse BuildNotConfiguredState()
    {
        return new WhatsAppWebSessionStateResponse(
            false,
            "not_configured",
            "A bridge QR experimental ainda nao foi configurada para esta instalacao.",
            null,
            null,
            null,
            null,
            null,
            null,
            true,
            false,
            false,
            0,
            null);
    }
}
