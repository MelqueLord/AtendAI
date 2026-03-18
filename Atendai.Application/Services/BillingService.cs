using Atendai.Application.DTOs;
using Atendai.Application.Interfaces;
using Atendai.Application.Interfaces.Repositories;
using Atendai.Application.Support;
using Atendai.Domain.Entities;

namespace Atendai.Application.Services;

public sealed class BillingService(
    IBillingRepository billingRepository,
    IConversationRepository conversationRepository) : IBillingService
{
    public async Task<List<BillingPlanResponse>> GetPlansAsync(CancellationToken cancellationToken = default)
    {
        var plans = await billingRepository.GetBillingPlansAsync(cancellationToken);
        return plans.Select(MapPlan).ToList();
    }

    public async Task<BillingSubscriptionResponse> GetSubscriptionAsync(Guid tenantId, CancellationToken cancellationToken = default)
    {
        var subscription = await billingRepository.GetTenantSubscriptionAsync(tenantId, cancellationToken);
        if (!string.IsNullOrWhiteSpace(subscription.PlanName))
        {
            return MapSubscription(subscription);
        }

        var fallbackPlanName = BillingCatalog.FindByCode(subscription.PlanCode)?.Name ?? subscription.PlanCode;
        return MapSubscription(subscription with { PlanName = fallbackPlanName });
    }

    public async Task<BillingSubscriptionResponse> SubscribeAsync(Guid tenantId, string planCode, CancellationToken cancellationToken = default)
    {
        var subscription = await billingRepository.UpsertTenantSubscriptionAsync(tenantId, planCode, cancellationToken);
        return MapSubscription(subscription);
    }

    public async Task<ValueMetricsResponse> GetValueMetricsAsync(Guid tenantId, CancellationToken cancellationToken = default)
    {
        var conversations = await conversationRepository.GetConversationsWithMessagesAsync(tenantId, cancellationToken);
        var threshold = DateTimeOffset.UtcNow.AddDays(-30);
        var last30 = conversations.Where(c => c.CreatedAt >= threshold).ToList();

        var total = last30.Count;
        if (total == 0)
        {
            return new ValueMetricsResponse(0, 0, 0, 0, 0, 0);
        }

        var messages30d = last30.Sum(c => c.Messages.Count);
        var humanHandoffs = last30.Count(c => c.Messages.Any(m => string.Equals(m.Sender, "HumanAgent", StringComparison.OrdinalIgnoreCase)));
        var automated = total - humanHandoffs;
        var automationRate = Math.Round((double)automated / total * 100, 1);

        var estimatedHoursSaved = Math.Round(automated * 6.5 / 60.0, 1);
        var estimatedRevenueProtected = Math.Round(humanHandoffs * 38.0, 2);

        return new ValueMetricsResponse(total, messages30d, humanHandoffs, automationRate, estimatedHoursSaved, estimatedRevenueProtected);
    }

    private static BillingPlanResponse MapPlan(BillingPlan plan)
    {
        return new BillingPlanResponse(plan.Code, plan.Name, plan.MonthlyPrice, plan.Currency, plan.IncludedMessages, plan.IncludedAgents, plan.IncludedWhatsAppNumbers, plan.IsPopular);
    }

    private static BillingSubscriptionResponse MapSubscription(BillingSubscription subscription)
    {
        var nowUtc = DateTimeOffset.UtcNow;
        var trialDaysRemaining = CalculateDaysRemaining(subscription.TrialEndsAt, nowUtc);
        var currentPeriodDaysRemaining = CalculateDaysRemaining(subscription.CurrentPeriodEnd, nowUtc);
        var isTrialExpired = subscription.TrialEndsAt.HasValue && subscription.TrialEndsAt.Value <= nowUtc;
        var effectiveStatus = ResolveEffectiveStatus(subscription, nowUtc, isTrialExpired);

        return new BillingSubscriptionResponse(
            subscription.TenantId,
            subscription.PlanCode,
            subscription.PlanName,
            subscription.Status,
            effectiveStatus,
            subscription.CreatedAt,
            subscription.TrialEndsAt,
            trialDaysRemaining,
            isTrialExpired,
            subscription.CurrentPeriodEnd,
            currentPeriodDaysRemaining,
            subscription.UpdatedAt);
    }

    private static string ResolveEffectiveStatus(BillingSubscription subscription, DateTimeOffset nowUtc, bool isTrialExpired)
    {
        if (string.Equals(subscription.Status, "trialing", StringComparison.OrdinalIgnoreCase) && isTrialExpired)
        {
            return "trial_expired";
        }

        if (string.Equals(subscription.Status, "active", StringComparison.OrdinalIgnoreCase)
            && subscription.CurrentPeriodEnd.HasValue
            && subscription.CurrentPeriodEnd.Value <= nowUtc)
        {
            return "expired";
        }

        return subscription.Status;
    }

    private static int? CalculateDaysRemaining(DateTimeOffset? deadline, DateTimeOffset nowUtc)
    {
        if (!deadline.HasValue)
        {
            return null;
        }

        var remaining = deadline.Value - nowUtc;
        if (remaining <= TimeSpan.Zero)
        {
            return 0;
        }

        return (int)Math.Ceiling(remaining.TotalDays);
    }
}
