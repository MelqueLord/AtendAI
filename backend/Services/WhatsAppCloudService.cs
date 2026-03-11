using backend.Application.Interfaces;
using backend.Contracts;
using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;

namespace backend.Services;

public sealed class WhatsAppCloudService : IWhatsAppGateway
{
    private readonly HttpClient _http;
    private readonly IConfiguration _configuration;
    private readonly ILogger<WhatsAppCloudService> _logger;

    public WhatsAppCloudService(HttpClient http, IConfiguration configuration, ILogger<WhatsAppCloudService> logger)
    {
        _http = http;
        _configuration = configuration;
        _logger = logger;
    }

    public string VerifyToken => _configuration["WhatsApp:VerifyToken"] ?? "troque-verify-token";

    public async Task<bool> SendTextMessageAsync(string to, string message, CancellationToken cancellationToken = default)
    {
        var accessToken = _configuration["WhatsApp:AccessToken"];
        var phoneNumberId = _configuration["WhatsApp:PhoneNumberId"];
        var apiVersion = _configuration["WhatsApp:ApiVersion"] ?? "v22.0";

        if (string.IsNullOrWhiteSpace(accessToken) || string.IsNullOrWhiteSpace(phoneNumberId))
        {
            _logger.LogInformation("WhatsApp nao configurado. Mensagem nao enviada para {Phone}", to);
            return false;
        }

        var result = await SendTextMessageWithCredentialsAsync(phoneNumberId, accessToken, to, message, apiVersion, cancellationToken);
        return result.Success;
    }

    public async Task<WhatsAppSendResult> SendTextMessageWithCredentialsAsync(
        string phoneNumberId,
        string accessToken,
        string to,
        string message,
        string? apiVersion = null,
        CancellationToken cancellationToken = default)
    {
        var version = string.IsNullOrWhiteSpace(apiVersion) ? "v22.0" : apiVersion;
        var endpoint = $"https://graph.facebook.com/{version}/{phoneNumberId}/messages";

        using var request = new HttpRequestMessage(HttpMethod.Post, endpoint)
        {
            Content = new StringContent(JsonSerializer.Serialize(new
            {
                messaging_product = "whatsapp",
                to,
                type = "text",
                text = new { body = message }
            }), Encoding.UTF8, "application/json")
        };

        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", accessToken);

        using var response = await _http.SendAsync(request, cancellationToken);
        var body = await response.Content.ReadAsStringAsync(cancellationToken);

        if (response.IsSuccessStatusCode)
        {
            return new WhatsAppSendResult
            {
                Success = true,
                Status = "sent",
                ProviderMessageId = TryExtractMessageId(body)
            };
        }

        if ((int)response.StatusCode == 401 && body.Contains("\"code\":190", StringComparison.Ordinal))
        {
            _logger.LogWarning("Token/Aplicacao WhatsApp invalido (erro 190). Body: {Body}", body);
        }
        else
        {
            _logger.LogWarning("Falha ao enviar mensagem WhatsApp. Status: {Status}, Body: {Body}", response.StatusCode, body);
        }

        return new WhatsAppSendResult
        {
            Success = false,
            Status = ((int)response.StatusCode).ToString(),
            Error = HumanizeMetaError(body)
        };
    }

    public async Task<WhatsAppTestResponse> TestCredentialsAsync(
        string phoneNumberId,
        string accessToken,
        string? apiVersion = null,
        CancellationToken cancellationToken = default)
    {
        var version = string.IsNullOrWhiteSpace(apiVersion) ? "v22.0" : apiVersion;
        var endpoint = $"https://graph.facebook.com/{version}/{phoneNumberId}?fields=verified_name,display_phone_number";

        using var request = new HttpRequestMessage(HttpMethod.Get, endpoint);
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", accessToken);

        using var response = await _http.SendAsync(request, cancellationToken);
        var body = await response.Content.ReadAsStringAsync(cancellationToken);

        if (response.IsSuccessStatusCode)
        {
            return new WhatsAppTestResponse(true, "connected", null);
        }

        return new WhatsAppTestResponse(false, ((int)response.StatusCode).ToString(), HumanizeMetaError(body));
    }

    private static string HumanizeMetaError(string responseBody)
    {
        try
        {
            using var document = JsonDocument.Parse(responseBody);
            if (!document.RootElement.TryGetProperty("error", out var error))
            {
                return responseBody;
            }

            var code = error.TryGetProperty("code", out var codeElement) ? codeElement.GetInt32() : 0;
            var message = error.TryGetProperty("message", out var messageElement) ? messageElement.GetString() : null;
            var details = error.TryGetProperty("error_data", out var errorData) && errorData.TryGetProperty("details", out var detailsElement)
                ? detailsElement.GetString()
                : null;

            if (code == 131030)
            {
                return "O numero do destinatario nao esta liberado no ambiente de teste da Meta. Adicione esse telefone na lista de numeros permitidos e tente novamente.";
            }

            if (code == 190)
            {
                return "A Meta rejeitou a aplicacao ou o token informado. Gere um novo token e confirme se o app do WhatsApp continua ativo.";
            }

            var friendlyMessage = string.Join(" ", new[] { message, details }.Where(value => !string.IsNullOrWhiteSpace(value)));
            return string.IsNullOrWhiteSpace(friendlyMessage) ? responseBody : friendlyMessage;
        }
        catch
        {
            return responseBody;
        }
    }

    private static string? TryExtractMessageId(string responseBody)
    {
        try
        {
            using var document = JsonDocument.Parse(responseBody);
            if (document.RootElement.TryGetProperty("messages", out var messages) && messages.GetArrayLength() > 0)
            {
                var first = messages[0];
                if (first.TryGetProperty("id", out var idElement))
                {
                    return idElement.GetString();
                }
            }
        }
        catch
        {
            // ignore parse failures
        }

        return null;
    }
}
