namespace Atendai.Application.DTOs;

public sealed record BillingPlanResponse(
    string Code,
    string Name,
    decimal MonthlyPrice,
    string Currency,
    int IncludedMessages,
    int IncludedAgents,
    int IncludedWhatsAppNumbers,
    bool IsPopular);

public sealed record BillingSubscriptionResponse(
    Guid TenantId,
    string PlanCode,
    string PlanName,
    string Status,
    string EffectiveStatus,
    DateTimeOffset CreatedAt,
    DateTimeOffset? TrialEndsAt,
    int? TrialDaysRemaining,
    bool IsTrialExpired,
    DateTimeOffset? CurrentPeriodEnd,
    int? CurrentPeriodDaysRemaining,
    DateTimeOffset UpdatedAt);

public sealed record SubscriptionCheckoutRequest(string PlanCode);

public sealed record ValueMetricsResponse(
    int Conversations30d,
    int Messages30d,
    int HumanHandoffs30d,
    double AutomationRate,
    double EstimatedHoursSaved,
    double EstimatedRevenueProtected);
