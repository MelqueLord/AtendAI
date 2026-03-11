namespace backend.Models;

public sealed class TrainingEntry
{
    public required Guid Id { get; init; }
    public required string Keyword { get; init; }
    public required string AnswerTemplate { get; init; }
}
