using Atendai.Application.DTOs;
using Atendai.Application.Interfaces;
using Atendai.Application.Interfaces.Repositories;
using Atendai.Application.Policies;
using Atendai.Domain.Entities;

namespace Atendai.Application.Services;

public sealed class ManagementService(
    ICompanyRepository companyRepository,
    IUserRepository userRepository) : IManagementService
{
    public async Task<List<ManagedCompanyResponse>> GetCompaniesAsync(string? search = null, int page = 1, int pageSize = 20, CancellationToken cancellationToken = default)
    {
        var companies = await companyRepository.GetCompaniesAsync(
            search,
            ManagementPolicy.NormalizePage(page),
            ManagementPolicy.NormalizePageSize(pageSize),
            cancellationToken);

        return companies.Select(MapCompany).ToList();
    }

    public async Task<ManagedCompanyResponse?> GetCompanyByIdAsync(Guid companyId, CancellationToken cancellationToken = default)
    {
        return MapCompanyOrNull(await companyRepository.GetCompanyByIdAsync(companyId, cancellationToken));
    }

    public async Task<ManagedCompanyResponse> CreateCompanyAsync(CompanyUpsertRequest request, CancellationToken cancellationToken = default)
    {
        ManagementPolicy.EnsureCompanyRequestIsValid(request);
        return MapCompany(await companyRepository.CreateCompanyAsync(request.Name, request.Segment, cancellationToken));
    }

    public async Task<ManagedCompanyResponse?> UpdateCompanyAsync(Guid companyId, CompanyUpsertRequest request, CancellationToken cancellationToken = default)
    {
        ManagementPolicy.EnsureCompanyRequestIsValid(request);
        return MapCompanyOrNull(await companyRepository.UpdateCompanyAsync(companyId, request.Name, request.Segment, cancellationToken));
    }

    public Task<bool> DeleteCompanyAsync(Guid companyId, CancellationToken cancellationToken = default)
    {
        return companyRepository.DeleteCompanyAsync(companyId, cancellationToken);
    }

    public async Task<List<ManagedUserResponse>> GetUsersAsync(Guid currentTenantId, string? currentRole, Guid? requestedTenantId, string? search, string? role, int page, int pageSize, CancellationToken cancellationToken = default)
    {
        var effectiveTenant = string.Equals(currentRole, "SuperAdmin", StringComparison.OrdinalIgnoreCase)
            ? requestedTenantId ?? currentTenantId
            : currentTenantId;

        var users = await userRepository.GetManagedUsersAsync(
            effectiveTenant,
            search,
            role,
            ManagementPolicy.NormalizePage(page),
            ManagementPolicy.NormalizePageSize(pageSize),
            cancellationToken);

        if (!string.Equals(currentRole, "SuperAdmin", StringComparison.OrdinalIgnoreCase))
        {
            users = users.Where(user => !string.Equals(user.Role, "SuperAdmin", StringComparison.OrdinalIgnoreCase)).ToList();
        }

        return users.Select(MapUser).ToList();
    }

    public async Task<ManagedUserResponse?> GetUserByIdAsync(Guid currentTenantId, string? currentRole, Guid userId, CancellationToken cancellationToken = default)
    {
        var user = await userRepository.GetManagedUserByIdAsync(userId, cancellationToken);
        if (user is null)
        {
            return null;
        }

        ManagementPolicy.EnsureUserAccess(currentRole, currentTenantId, user, "Acesso negado ao usuario solicitado.");
        return MapUser(user);
    }

    public async Task<ManagedUserResponse> CreateUserAsync(Guid currentTenantId, string? currentRole, UserCreateRequest request, CancellationToken cancellationToken = default)
    {
        ManagementPolicy.EnsureCreateUserRequestIsValid(request);
        ManagementPolicy.EnsureUserCreationTenantAccess(currentRole, currentTenantId, request.TenantId);

        var created = await userRepository.CreateManagedUserAsync(
            request.TenantId,
            request.Name,
            request.Email,
            request.Password,
            request.Role,
            cancellationToken);

        return MapUser(created);
    }

    public async Task<ManagedUserResponse?> UpdateUserAsync(Guid currentTenantId, string? currentRole, Guid userId, UserUpdateRequest request, CancellationToken cancellationToken = default)
    {
        ManagementPolicy.EnsureUpdateUserRequestIsValid(request);

        var current = await userRepository.GetManagedUserByIdAsync(userId, cancellationToken);
        if (current is null)
        {
            return null;
        }

        ManagementPolicy.EnsureUserAccess(currentRole, currentTenantId, current, "Nao e permitido alterar este usuario.");

        var updated = await userRepository.UpdateManagedUserAsync(
            userId,
            request.Name,
            request.Email,
            request.Role,
            request.Password,
            cancellationToken);

        return updated is null ? null : MapUser(updated);
    }

    public async Task<bool> DeleteUserAsync(Guid currentTenantId, Guid currentUserId, string? currentRole, Guid userId, CancellationToken cancellationToken = default)
    {
        ManagementPolicy.EnsureSelfDeletionIsAllowed(currentUserId, userId);

        var current = await userRepository.GetManagedUserByIdAsync(userId, cancellationToken);
        if (current is null)
        {
            return false;
        }

        ManagementPolicy.EnsureUserAccess(currentRole, currentTenantId, current, "Nao e permitido excluir este usuario.");
        return await userRepository.DeleteManagedUserAsync(userId, cancellationToken);
    }

    private static ManagedCompanyResponse MapCompany(ManagedCompany company)
    {
        return new ManagedCompanyResponse(company.Id, company.Name, company.Segment, company.CreatedAt);
    }

    private static ManagedCompanyResponse? MapCompanyOrNull(ManagedCompany? company)
    {
        return company is null ? null : MapCompany(company);
    }

    private static ManagedUserResponse MapUser(ManagedUser user)
    {
        return new ManagedUserResponse(user.Id, user.TenantId, user.TenantName, user.Name, user.Email, user.Role, user.CreatedAt);
    }
}
