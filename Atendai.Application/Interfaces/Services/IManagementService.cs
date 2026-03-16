using Atendai.Application.DTOs;

namespace Atendai.Application.Interfaces;

public interface IManagementService
{
    Task<List<ManagedCompanyResponse>> GetCompaniesAsync(string? search = null, int page = 1, int pageSize = 20, CancellationToken cancellationToken = default);
    Task<ManagedCompanyResponse?> GetCompanyByIdAsync(Guid companyId, CancellationToken cancellationToken = default);
    Task<ManagedCompanyResponse> CreateCompanyAsync(CompanyUpsertRequest request, CancellationToken cancellationToken = default);
    Task<ManagedCompanyResponse?> UpdateCompanyAsync(Guid companyId, CompanyUpsertRequest request, CancellationToken cancellationToken = default);
    Task<bool> DeleteCompanyAsync(Guid companyId, CancellationToken cancellationToken = default);
    Task<List<ManagedUserResponse>> GetUsersAsync(Guid currentTenantId, string? currentRole, Guid? requestedTenantId, string? search, string? role, int page, int pageSize, CancellationToken cancellationToken = default);
    Task<ManagedUserResponse?> GetUserByIdAsync(Guid currentTenantId, string? currentRole, Guid userId, CancellationToken cancellationToken = default);
    Task<ManagedUserResponse> CreateUserAsync(Guid currentTenantId, string? currentRole, UserCreateRequest request, CancellationToken cancellationToken = default);
    Task<ManagedUserResponse?> UpdateUserAsync(Guid currentTenantId, string? currentRole, Guid userId, UserUpdateRequest request, CancellationToken cancellationToken = default);
    Task<bool> DeleteUserAsync(Guid currentTenantId, Guid currentUserId, string? currentRole, Guid userId, CancellationToken cancellationToken = default);
}
