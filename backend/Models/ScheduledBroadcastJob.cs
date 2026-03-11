namespace backend.Models;

public sealed class ScheduledBroadcastJob
{
    public Guid Id { get; set; }
    public Guid TenantId { get; set; }
    public Guid CampaignId { get; set; }
    public Guid? ContactId { get; set; }
    public string CustomerPhone { get; set; } = string.Empty;
    public string CustomerName { get; set; } = "Cliente";
    public string MessageTemplate { get; set; } = string.Empty;
    public DateTimeOffset ScheduledAt { get; set; }
    public int AttemptCount { get; set; }
}
