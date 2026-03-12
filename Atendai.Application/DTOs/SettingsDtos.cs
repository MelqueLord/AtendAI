namespace Atendai.Application.DTOs;

public sealed record TrainingEntryResponse(Guid Id, string Keyword, string AnswerTemplate);

public sealed record BusinessSettingsResponse(
    string BusinessName,
    string WelcomeMessage,
    string HumanFallbackMessage,
    List<TrainingEntryResponse> TrainingEntries);

public sealed record UpdateSettingsRequest(string BusinessName, string WelcomeMessage, string HumanFallbackMessage);
public sealed record AddTrainingRequest(string Keyword, string AnswerTemplate);
