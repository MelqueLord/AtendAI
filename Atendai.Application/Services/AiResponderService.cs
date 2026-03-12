using Atendai.Application.Interfaces;
using Atendai.Application.Interfaces.Repositories;
using Atendai.Domain.Entities;

namespace Atendai.Application.Services;

public sealed class AiResponderService(
    ISettingsRepository settingsRepository,
    IAutomationRepository automationRepository,
    IChatCompletionService groqChatService) : IAiResponderService
{
    private static readonly string[] ComplexKeywords =
    [
        "processo", "reclama", "advogado", "judicial", "urgente", "emergencia"
    ];

    public async Task<(string Reply, bool Escalate)> BuildReplyAsync(Guid tenantId, Conversation conversation, string message, CancellationToken cancellationToken = default)
    {
        var settings = await settingsRepository.GetSettingsAsync(tenantId, cancellationToken);
        var automationOptions = await automationRepository.GetAutomationOptionsAsync(tenantId, cancellationToken);
        var businessName = ResolveBusinessName(settings);
        var welcomeMessage = ResolveWelcomeMessage(settings);
        var humanFallbackMessage = ResolveHumanFallback(settings);

        var configuredOption = automationOptions
            .Where(option => option.IsActive)
            .OrderBy(option => option.SortOrder)
            .FirstOrDefault(option => MatchesConfiguredOption(option.TriggerKeywords, message));

        if (configuredOption is not null)
        {
            return (ApplyTemplate(configuredOption.ResponseTemplate, conversation.CustomerName, businessName), configuredOption.EscalateToHuman);
        }

        if (IsComplex(message))
        {
            return (humanFallbackMessage, true);
        }

        var lowerText = message.ToLowerInvariant();
        var customAnswer = settings.TrainingEntries
            .FirstOrDefault(t => lowerText.Contains(t.Keyword.ToLowerInvariant()));

        if (customAnswer is not null)
        {
            return (ApplyTemplate(customAnswer.AnswerTemplate, conversation.CustomerName, businessName), false);
        }

        var trainingRules = settings.TrainingEntries
            .Select(entry => $"Se a pergunta tiver '{entry.Keyword}', responda: {entry.AnswerTemplate}")
            .ToList();

        var optionRules = automationOptions
            .Where(option => option.IsActive)
            .Select(option => $"Se a mensagem mencionar {option.TriggerKeywords}, responda: {option.ResponseTemplate}")
            .ToList();

        var groqReply = await groqChatService.GenerateReplyAsync(
            businessName,
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
            return ($"{conversation.CustomerName}, posso te ajudar com agendamento. Me passe o melhor dia e horario para {businessName}.", false);
        }

        if (lowerText.Contains("valor") || lowerText.Contains("preco") || lowerText.Contains("orcamento"))
        {
            return ($"Consigo verificar valores para voce. Me diga qual servico deseja em {businessName}.", false);
        }

        return (ApplyTemplate(welcomeMessage, conversation.CustomerName, businessName), false);
    }

    private static string ResolveBusinessName(BusinessSettings settings)
    {
        return string.IsNullOrWhiteSpace(settings.BusinessName) ? "nosso atendimento" : settings.BusinessName;
    }

    private static string ResolveWelcomeMessage(BusinessSettings settings)
    {
        return string.IsNullOrWhiteSpace(settings.WelcomeMessage)
            ? "Oi, {cliente}. Sou o assistente virtual da {negocio}. Como posso ajudar?"
            : settings.WelcomeMessage;
    }

    private static string ResolveHumanFallback(BusinessSettings settings)
    {
        return string.IsNullOrWhiteSpace(settings.HumanFallbackMessage)
            ? "Sua solicitacao precisa de um atendente humano. Vou encaminhar agora."
            : settings.HumanFallbackMessage;
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
