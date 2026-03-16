using Atendai.Application.DTOs;

namespace Atendai.Application.Interfaces;

public interface IAdminService
{
    Task<List<TenantResponse>> GetTenantsAsync(CancellationToken cancellationToken = default);
}
