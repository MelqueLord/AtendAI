using System.Text.Json;
using System.Text.Json.Serialization;
using Atendai.Application.Interfaces;

namespace Atendai.Infrastructure.Services;

public sealed class MetaEmbeddedSignupGateway(
    IHttpClientFactory httpClientFactory,
    IConfiguration configuration,
    IWhatsAppPlatformSettings platformSettings) : IMetaEmbeddedSignupGateway
{
    public async Task<string> ExchangeCodeAsync(string code, CancellationToken cancellationToken = default)
    {
        var appId = configuration["MetaEmbeddedSignup:AppId"];
        var appSecret = configuration["MetaEmbeddedSignup:AppSecret"];

        if (string.IsNullOrWhiteSpace(appId) || string.IsNullOrWhiteSpace(appSecret))
        {
            throw new InvalidOperationException("Configure MetaEmbeddedSignup:AppId e MetaEmbeddedSignup:AppSecret para trocar o code da Meta.");
        }

        var client = httpClientFactory.CreateClient();
        var endpoint = $"https://graph.facebook.com/{platformSettings.MetaGraphApiVersion}/oauth/access_token?client_id={Uri.EscapeDataString(appId)}&client_secret={Uri.EscapeDataString(appSecret)}&code={Uri.EscapeDataString(code)}";

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

    private sealed class MetaAccessTokenResponse
    {
        [JsonPropertyName("access_token")]
        public string? AccessToken { get; set; }
    }
}
