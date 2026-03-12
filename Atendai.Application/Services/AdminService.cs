using Atendai.Application.DTOs;
using Atendai.Application.Interfaces;
using Atendai.Application.Interfaces.Repositories;

namespace Atendai.Application.Services;

public sealed class AdminService(ITenantRepository tenantRepository) : IAdminService
{
    public async Task<List<TenantResponse>> GetTenantsAsync(CancellationToken cancellationToken = default)
    {
        var tenants = await tenantRepository.GetTenantsAsync(cancellationToken);
        return tenants.Select(tenant => new TenantResponse(tenant.Id, tenant.Name, tenant.Segment)).ToList();
    }
}
