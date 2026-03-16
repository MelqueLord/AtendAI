using Atendai.Application.DTOs;

namespace Atendai.Application.Interfaces;

public interface IBillingService
{
    Task<List<BillingPlanResponse>> GetPlansAsync(CancellationToken cancellationToken = default);
    Task<BillingSubscriptionResponse> GetSubscriptionAsync(Guid tenantId, CancellationToken cancellationToken = default);
    Task<BillingSubscriptionResponse> SubscribeAsync(Guid tenantId, string planCode, CancellationToken cancellationToken = default);
    Task<ValueMetricsResponse> GetValueMetricsAsync(Guid tenantId, CancellationToken cancellationToken = default);
}
