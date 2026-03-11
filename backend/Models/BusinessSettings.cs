namespace backend.Models;

public sealed class BusinessSettings
{
    public string BusinessName { get; set; } = string.Empty;
    public string WelcomeMessage { get; set; } = string.Empty;
    public string HumanFallbackMessage { get; set; } = string.Empty;
    public List<TrainingEntry> TrainingEntries { get; init; } = [];
}
