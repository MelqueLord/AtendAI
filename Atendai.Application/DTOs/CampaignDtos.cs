namespace Atendai.Application.DTOs;

public sealed record CampaignRuleResponse(
    Guid Id,
    Guid TenantId,
    string Name,
    int DelayHours,
    string Template,
    bool IsActive,
    DateTimeOffset CreatedAt,
    DateTimeOffset UpdatedAt);

public sealed record CampaignRuleUpsertRequest(string Name, int DelayHours, string Template, bool IsActive);

public sealed record ScheduledBroadcastResponse(
    Guid Id,
    Guid TenantId,
    string Name,
    string MessageTemplate,
    DateTimeOffset ScheduledAt,
    string Status,
    string? TagFilter,
    int TargetCount,
    int DeliveredCount,
    DateTimeOffset CreatedAt);

public sealed record ScheduleBroadcastRequest(
    string Name,
    string MessageTemplate,
    DateTimeOffset ScheduledAt,
    string? TagFilter,
    Guid[] ContactIds);
