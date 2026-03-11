using backend.Application.Interfaces;
using backend.Contracts;

namespace backend.Services;

public sealed class BillingService(IDataStore store) : IBillingService
{
    public Task<List<BillingPlanResponse>> GetPlansAsync(CancellationToken cancellationToken = default)
    {
        return store.GetBillingPlansAsync(cancellationToken);
    }

    public Task<BillingSubscriptionResponse> GetSubscriptionAsync(Guid tenantId, CancellationToken cancellationToken = default)
    {
        return store.GetTenantSubscriptionAsync(tenantId, cancellationToken);
    }

    public Task<BillingSubscriptionResponse> SubscribeAsync(Guid tenantId, string planCode, CancellationToken cancellationToken = default)
    {
        return store.UpsertTenantSubscriptionAsync(tenantId, planCode, cancellationToken);
    }

    public async Task<ValueMetricsResponse> GetValueMetricsAsync(Guid tenantId, CancellationToken cancellationToken = default)
    {
        var conversations = await store.GetConversationsWithMessagesAsync(tenantId, cancellationToken);
        var threshold = DateTimeOffset.UtcNow.AddDays(-30);
        var last30 = conversations.Where(c => c.CreatedAt >= threshold).ToList();

        var total = last30.Count;
        if (total == 0)
        {
            return new ValueMetricsResponse(0, 0, 0, 0, 0);
        }

        var humanHandoffs = last30.Count(c => c.Messages.Any(m => string.Equals(m.Sender, "HumanAgent", StringComparison.OrdinalIgnoreCase)));
        var automated = total - humanHandoffs;
        var automationRate = Math.Round((double)automated / total * 100, 1);

        var estimatedHoursSaved = Math.Round(automated * 6.5 / 60.0, 1);
        var estimatedRevenueProtected = Math.Round(humanHandoffs * 38.0, 2);

        return new ValueMetricsResponse(total, humanHandoffs, automationRate, estimatedHoursSaved, estimatedRevenueProtected);
    }
}
