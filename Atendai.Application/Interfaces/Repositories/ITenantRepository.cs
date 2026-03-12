using Atendai.Domain.Entities;

namespace Atendai.Application.Interfaces.Repositories;

public interface ITenantRepository
{
    Task<List<Tenant>> GetTenantsAsync(CancellationToken cancellationToken = default);
    Task<Tenant?> GetTenantByIdAsync(Guid tenantId, CancellationToken cancellationToken = default);
}
