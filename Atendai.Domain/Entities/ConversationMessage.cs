namespace Atendai.Domain.Entities;

public sealed class ConversationMessage
{
    public required Guid Id { get; init; }
    public required string Sender { get; init; }
    public required string Text { get; init; }
    public required DateTimeOffset CreatedAt { get; init; }
}
