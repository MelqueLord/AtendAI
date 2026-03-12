using Atendai.Application.Interfaces;
using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using System.Text.Json.Serialization;

namespace Atendai.Infrastructure.Services;

public sealed class GroqChatService : IChatCompletionService
{
    private static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web);

    private readonly HttpClient _httpClient;
    private readonly IConfiguration _configuration;
    private readonly ILogger<GroqChatService> _logger;

    public GroqChatService(HttpClient httpClient, IConfiguration configuration, ILogger<GroqChatService> logger)
    {
        _httpClient = httpClient;
        _configuration = configuration;
        _logger = logger;
    }

    public bool IsConfigured =>
        !string.IsNullOrWhiteSpace(_configuration["Groq:ApiKey"]) &&
        !string.IsNullOrWhiteSpace(_configuration["Groq:Model"]);

    public async Task<string?> GenerateReplyAsync(
        string businessName,
        string customerName,
        string incomingMessage,
        IReadOnlyCollection<string> trainingRules,
        CancellationToken cancellationToken = default)
    {
        var apiKey = _configuration["Groq:ApiKey"];
        var model = _configuration["Groq:Model"];

        if (string.IsNullOrWhiteSpace(apiKey) || string.IsNullOrWhiteSpace(model))
        {
            return null;
        }

        var systemPrompt = BuildSystemPrompt(businessName, trainingRules);
        var userPrompt = $"Cliente: {customerName}. Mensagem: {incomingMessage}";

        var payload = new ChatCompletionRequest
        {
            Model = model,
            Temperature = 0.3m,
            MaxTokens = 180,
            Messages =
            [
                new ChatMessage("system", systemPrompt),
                new ChatMessage("user", userPrompt)
            ]
        };

        using var request = new HttpRequestMessage(HttpMethod.Post, "https://api.groq.com/openai/v1/chat/completions")
        {
            Content = new StringContent(JsonSerializer.Serialize(payload, JsonOptions), Encoding.UTF8, "application/json")
        };

        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", apiKey);

        try
        {
            using var response = await _httpClient.SendAsync(request, cancellationToken);
            if (!response.IsSuccessStatusCode)
            {
                var body = await response.Content.ReadAsStringAsync(cancellationToken);
                _logger.LogWarning("Groq retornou erro {StatusCode}: {Body}", response.StatusCode, body);
                return null;
            }

            await using var stream = await response.Content.ReadAsStreamAsync(cancellationToken);
            var completion = await JsonSerializer.DeserializeAsync<ChatCompletionResponse>(stream, JsonOptions, cancellationToken);
            var text = completion?.Choices?.FirstOrDefault()?.Message?.Content?.Trim();

            return string.IsNullOrWhiteSpace(text) ? null : text;
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Falha ao consultar Groq. Usando fallback local.");
            return null;
        }
    }

    private static string BuildSystemPrompt(string businessName, IReadOnlyCollection<string> trainingRules)
    {
        var rules = trainingRules.Count == 0
            ? "Sem regras adicionais."
            : string.Join("\n", trainingRules.Select((rule, index) => $"{index + 1}. {rule}"));

        return
            "Voce e um assistente virtual profissional de negocios no Brasil. " +
            "Responda sempre em portugues brasileiro, de forma objetiva, cordial e curta. " +
            "Se faltar contexto, peca dados objetivos para continuar. " +
            $"Negocio: {businessName}. " +
            "Regras de atendimento personalizadas:\n" + rules;
    }

    private sealed class ChatCompletionRequest
    {
        [JsonPropertyName("model")]
        public string Model { get; set; } = string.Empty;

        [JsonPropertyName("messages")]
        public List<ChatMessage> Messages { get; set; } = [];

        [JsonPropertyName("temperature")]
        public decimal Temperature { get; set; }

        [JsonPropertyName("max_tokens")]
        public int MaxTokens { get; set; }
    }

    private sealed class ChatCompletionResponse
    {
        [JsonPropertyName("choices")]
        public List<ChatChoice>? Choices { get; set; }
    }

    private sealed class ChatChoice
    {
        [JsonPropertyName("message")]
        public ChatChoiceMessage? Message { get; set; }
    }

    private sealed class ChatChoiceMessage
    {
        [JsonPropertyName("content")]
        public string? Content { get; set; }
    }

    private sealed record ChatMessage(
        [property: JsonPropertyName("role")] string Role,
        [property: JsonPropertyName("content")] string Content);
}


