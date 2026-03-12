using Atendai.Application.DTOs;
using Atendai.Application.Interfaces;
using Atendai.Application.Interfaces.Repositories;
using Atendai.Domain.Entities;

namespace Atendai.Application.Services;

public sealed class ManagementService(
    ICompanyRepository companyRepository,
    IUserRepository userRepository) : IManagementService
{
    public async Task<List<ManagedCompanyResponse>> GetCompaniesAsync(string? search = null, int page = 1, int pageSize = 20, CancellationToken cancellationToken = default)
    {
        var companies = await companyRepository.GetCompaniesAsync(search, NormalizePage(page), NormalizePageSize(pageSize), cancellationToken);
        return companies.Select(MapCompany).ToList();
    }

    public async Task<ManagedCompanyResponse?> GetCompanyByIdAsync(Guid companyId, CancellationToken cancellationToken = default)
    {
        return MapCompanyOrNull(await companyRepository.GetCompanyByIdAsync(companyId, cancellationToken));
    }

    public async Task<ManagedCompanyResponse> CreateCompanyAsync(CompanyUpsertRequest request, CancellationToken cancellationToken = default)
    {
        ValidateCompanyRequest(request);
        return MapCompany(await companyRepository.CreateCompanyAsync(request.Name, request.Segment, cancellationToken));
    }

    public async Task<ManagedCompanyResponse?> UpdateCompanyAsync(Guid companyId, CompanyUpsertRequest request, CancellationToken cancellationToken = default)
    {
        ValidateCompanyRequest(request);
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
            NormalizePage(page),
            NormalizePageSize(pageSize),
            cancellationToken);

        if (!string.Equals(currentRole, "SuperAdmin", StringComparison.OrdinalIgnoreCase))
        {
            users = users.Where(u => !string.Equals(u.Role, "SuperAdmin", StringComparison.OrdinalIgnoreCase)).ToList();
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

        if (!CanAccessUser(currentRole, currentTenantId, user))
        {
            throw new UnauthorizedAccessException("Acesso negado ao usuario solicitado.");
        }

        return MapUser(user);
    }

    public async Task<ManagedUserResponse> CreateUserAsync(Guid currentTenantId, string? currentRole, UserCreateRequest request, CancellationToken cancellationToken = default)
    {
        ValidateCreateUserRequest(request);

        if (!string.Equals(currentRole, "SuperAdmin", StringComparison.OrdinalIgnoreCase) && request.TenantId != currentTenantId)
        {
            throw new UnauthorizedAccessException("Nao e permitido criar usuario fora do tenant atual.");
        }

        var created = await userRepository.CreateManagedUserAsync(request.TenantId, request.Name, request.Email, request.Password, request.Role, cancellationToken);
        return MapUser(created);
    }

    public async Task<ManagedUserResponse?> UpdateUserAsync(Guid currentTenantId, string? currentRole, Guid userId, UserUpdateRequest request, CancellationToken cancellationToken = default)
    {
        ValidateUpdateUserRequest(request);

        var current = await userRepository.GetManagedUserByIdAsync(userId, cancellationToken);
        if (current is null)
        {
            return null;
        }

        if (!CanAccessUser(currentRole, currentTenantId, current))
        {
            throw new UnauthorizedAccessException("Nao e permitido alterar este usuario.");
        }

        var updated = await userRepository.UpdateManagedUserAsync(userId, request.Name, request.Email, request.Role, request.Password, cancellationToken);
        return updated is null ? null : MapUser(updated);
    }

    public async Task<bool> DeleteUserAsync(Guid currentTenantId, Guid currentUserId, string? currentRole, Guid userId, CancellationToken cancellationToken = default)
    {
        if (currentUserId == userId)
        {
            throw new InvalidOperationException("Nao e permitido excluir o proprio usuario logado.");
        }

        var current = await userRepository.GetManagedUserByIdAsync(userId, cancellationToken);
        if (current is null)
        {
            return false;
        }

        if (!CanAccessUser(currentRole, currentTenantId, current))
        {
            throw new UnauthorizedAccessException("Nao e permitido excluir este usuario.");
        }

        return await userRepository.DeleteManagedUserAsync(userId, cancellationToken);
    }

    private static void ValidateCompanyRequest(CompanyUpsertRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Name) || string.IsNullOrWhiteSpace(request.Segment))
        {
            throw new ArgumentException("Nome e segmento sao obrigatorios.");
        }
    }

    private static void ValidateCreateUserRequest(UserCreateRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Name) || string.IsNullOrWhiteSpace(request.Email) || string.IsNullOrWhiteSpace(request.Password))
        {
            throw new ArgumentException("Nome, email e senha sao obrigatorios.");
        }

        if (!IsAllowedRole(request.Role))
        {
            throw new ArgumentException("Role invalida. Use Admin ou Agent.");
        }

        if (!IsStrongPassword(request.Password))
        {
            throw new ArgumentException("Senha fraca. Minimo 8 caracteres, com maiuscula, minuscula, numero e simbolo.");
        }
    }

    private static void ValidateUpdateUserRequest(UserUpdateRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Name) || string.IsNullOrWhiteSpace(request.Email))
        {
            throw new ArgumentException("Nome e email sao obrigatorios.");
        }

        if (!IsAllowedRole(request.Role))
        {
            throw new ArgumentException("Role invalida. Use Admin ou Agent.");
        }

        if (!string.IsNullOrWhiteSpace(request.Password) && !IsStrongPassword(request.Password))
        {
            throw new ArgumentException("Senha fraca. Minimo 8 caracteres, com maiuscula, minuscula, numero e simbolo.");
        }
    }

    private static int NormalizePage(int page) => page < 1 ? 1 : page;
    private static int NormalizePageSize(int pageSize) => pageSize is < 1 or > 100 ? 20 : pageSize;

    private static bool IsAllowedRole(string role)
    {
        return string.Equals(role, "Admin", StringComparison.OrdinalIgnoreCase)
            || string.Equals(role, "Agent", StringComparison.OrdinalIgnoreCase);
    }

    private static bool IsStrongPassword(string password)
    {
        return password.Length >= 8
            && password.Any(char.IsUpper)
            && password.Any(char.IsLower)
            && password.Any(char.IsDigit)
            && password.Any(ch => !char.IsLetterOrDigit(ch));
    }

    private static bool CanAccessUser(string? currentRole, Guid currentTenantId, ManagedUser managedUser)
    {
        if (string.Equals(currentRole, "SuperAdmin", StringComparison.OrdinalIgnoreCase))
        {
            return true;
        }

        return managedUser.TenantId == currentTenantId
            && !string.Equals(managedUser.Role, "SuperAdmin", StringComparison.OrdinalIgnoreCase);
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
