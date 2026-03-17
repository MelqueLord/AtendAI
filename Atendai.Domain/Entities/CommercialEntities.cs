namespace Atendai.Domain.Entities;

public sealed record BillingPlan(
    string Code,
    string Name,
    decimal MonthlyPrice,
    string Currency,
    int IncludedMessages,
    int IncludedAgents,
    int IncludedWhatsAppNumbers,
    bool IsPopular);

public sealed record BillingSubscription(
    Guid TenantId,
    string PlanCode,
    string PlanName,
    string Status,
    DateTimeOffset? TrialEndsAt,
    DateTimeOffset? CurrentPeriodEnd,
    DateTimeOffset UpdatedAt);

public sealed record Contact(
    Guid Id,
    string Name,
    string Phone,
    string? State,
    string? Status,
    string[] Tags,
    string? OwnerName,
    DateTimeOffset CreatedAt);

public sealed record AutomationOption(
    Guid Id,
    Guid TenantId,
    string Name,
    string TriggerKeywords,
    string ResponseTemplate,
    bool EscalateToHuman,
    int SortOrder,
    bool IsActive,
    DateTimeOffset CreatedAt,
    DateTimeOffset UpdatedAt);

public sealed record CustomerFeedback(
    Guid Id,
    Guid ConversationId,
    string CustomerName,
    string CustomerPhone,
    int Rating,
    string? Comment,
    DateTimeOffset CreatedAt);

public sealed record ScheduledBroadcast(
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

public sealed record CampaignRule(
    Guid Id,
    Guid TenantId,
    string Name,
    int DelayHours,
    string Template,
    bool IsActive,
    DateTimeOffset CreatedAt,
    DateTimeOffset UpdatedAt);
