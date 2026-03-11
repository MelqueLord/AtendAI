using backend.Application.Interfaces;
using backend.Models;

namespace backend.Services;

public sealed class AiResponderService(IDataStore store, IChatCompletionService groqChatService) : IAiResponderService
{
    private static readonly string[] ComplexKeywords =
    [
        "processo", "reclama", "advogado", "judicial", "urgente", "emergencia"
    ];

    public async Task<(string Reply, bool Escalate)> BuildReplyAsync(Guid tenantId, Conversation conversation, string message, CancellationToken cancellationToken = default)
    {
        var settings = await store.GetSettingsAsync(tenantId, cancellationToken);
        var automationOptions = await store.GetAutomationOptionsAsync(tenantId, cancellationToken);

        var configuredOption = automationOptions
            .Where(option => option.IsActive)
            .OrderBy(option => option.SortOrder)
            .FirstOrDefault(option => MatchesConfiguredOption(option.TriggerKeywords, message));

        if (configuredOption is not null)
        {
            return (ApplyTemplate(configuredOption.ResponseTemplate, conversation.CustomerName, settings.BusinessName), configuredOption.EscalateToHuman);
        }

        if (IsComplex(message))
        {
            return (settings.HumanFallbackMessage, true);
        }

        var lowerText = message.ToLowerInvariant();
        var customAnswer = settings.TrainingEntries
            .FirstOrDefault(t => lowerText.Contains(t.Keyword.ToLowerInvariant()));

        if (customAnswer is not null)
        {
            return (ApplyTemplate(customAnswer.AnswerTemplate, conversation.CustomerName, settings.BusinessName), false);
        }

        var trainingRules = settings.TrainingEntries
            .Select(entry => $"Se a pergunta tiver '{entry.Keyword}', responda: {entry.AnswerTemplate}")
            .ToList();

        var optionRules = automationOptions
            .Where(option => option.IsActive)
            .Select(option => $"Se a mensagem mencionar {option.TriggerKeywords}, responda: {option.ResponseTemplate}")
            .ToList();

        var groqReply = await groqChatService.GenerateReplyAsync(
            settings.BusinessName,
            conversation.CustomerName,
            message,
            [.. trainingRules, .. optionRules],
            cancellationToken);

        if (!string.IsNullOrWhiteSpace(groqReply))
        {
            return (groqReply, false);
        }

        if (lowerText.Contains("agendar") || lowerText.Contains("consulta") || lowerText.Contains("horario"))
        {
            return ($"{conversation.CustomerName}, posso te ajudar com agendamento. Me passe o melhor dia e horario para {settings.BusinessName}.", false);
        }

        if (lowerText.Contains("valor") || lowerText.Contains("preco") || lowerText.Contains("orcamento"))
        {
            return ($"Consigo verificar valores para voce. Me diga qual servico deseja em {settings.BusinessName}.", false);
        }

        return (ApplyTemplate(settings.WelcomeMessage, conversation.CustomerName, settings.BusinessName), false);
    }

    private static bool IsComplex(string message)
    {
        if (message.Length > 220)
        {
            return true;
        }

        var lowerText = message.ToLowerInvariant();
        return ComplexKeywords.Any(keyword => lowerText.Contains(keyword));
    }

    private static bool MatchesConfiguredOption(string triggerKeywords, string message)
    {
        var lowered = message.ToLowerInvariant();
        return triggerKeywords
            .Split([',', ';', '|', '\n'], StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
            .Any(keyword => lowered.Contains(keyword.ToLowerInvariant()));
    }

    private static string ApplyTemplate(string template, string customerName, string businessName)
    {
        return template
            .Replace("{cliente}", customerName, StringComparison.OrdinalIgnoreCase)
            .Replace("{negocio}", businessName, StringComparison.OrdinalIgnoreCase)
            .Replace("{clinica}", businessName, StringComparison.OrdinalIgnoreCase);
    }
}
