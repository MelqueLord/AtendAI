namespace backend.Models;

public sealed class ScheduledCampaignJob
{
    public Guid Id { get; set; }
    public Guid TenantId { get; set; }
    public Guid ConversationId { get; set; }
    public Guid RuleId { get; set; }
    public string CustomerPhone { get; set; } = string.Empty;
    public string CustomerName { get; set; } = "Cliente";
    public string Template { get; set; } = string.Empty;
    public DateTimeOffset ScheduledAt { get; set; }
    public int AttemptCount { get; set; }
}
