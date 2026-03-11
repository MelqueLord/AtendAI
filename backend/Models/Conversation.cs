namespace backend.Models;

public sealed class Conversation
{
    public required Guid Id { get; init; }
    public required string CustomerPhone { get; init; }
    public string CustomerName { get; set; } = "Cliente";
    public ConversationStatus Status { get; set; } = ConversationStatus.BotHandling;
    public Guid? ChannelId { get; set; }
    public string? ChannelName { get; set; }
    public Guid? AssignedUserId { get; set; }
    public string? AssignedUserName { get; set; }
    public DateTimeOffset? LastCustomerMessageAt { get; set; }
    public DateTimeOffset? LastHumanMessageAt { get; set; }
    public DateTimeOffset? ClosedAt { get; set; }
    public DateTimeOffset CreatedAt { get; init; } = DateTimeOffset.UtcNow;
    public DateTimeOffset UpdatedAt { get; set; } = DateTimeOffset.UtcNow;
    public List<ConversationMessage> Messages { get; init; } = [];
}
