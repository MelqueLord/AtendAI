using backend.Application.Interfaces;
using backend.Contracts;

namespace backend.Services;

public sealed class AdminService(IDataStore store) : IAdminService
{
    public Task<List<TenantResponse>> GetTenantsAsync(CancellationToken cancellationToken = default)
    {
        return store.GetTenantsAsync(cancellationToken);
    }
}
