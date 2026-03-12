using Atendai.Domain.Entities;

namespace Atendai.Application.Interfaces.Repositories;

public interface IBillingRepository
{
    Task<List<BillingPlan>> GetBillingPlansAsync(CancellationToken cancellationToken = default);
    Task<BillingSubscription> GetTenantSubscriptionAsync(Guid tenantId, CancellationToken cancellationToken = default);
    Task<BillingSubscription> UpsertTenantSubscriptionAsync(Guid tenantId, string planCode, CancellationToken cancellationToken = default);
}
