using backend.Application.Interfaces;
using backend.Contracts;

namespace backend.Services;

public sealed class ManagementService(IDataStore store) : IManagementService
{
    public Task<List<ManagedCompanyResponse>> GetCompaniesAsync(string? search = null, int page = 1, int pageSize = 20, CancellationToken cancellationToken = default)
    {
        return store.GetCompaniesAsync(search, NormalizePage(page), NormalizePageSize(pageSize), cancellationToken);
    }

    public Task<ManagedCompanyResponse?> GetCompanyByIdAsync(Guid companyId, CancellationToken cancellationToken = default)
    {
        return store.GetCompanyByIdAsync(companyId, cancellationToken);
    }

    public Task<ManagedCompanyResponse> CreateCompanyAsync(CompanyUpsertRequest request, CancellationToken cancellationToken = default)
    {
        ValidateCompanyRequest(request);
        return store.CreateCompanyAsync(request, cancellationToken);
    }

    public Task<ManagedCompanyResponse?> UpdateCompanyAsync(Guid companyId, CompanyUpsertRequest request, CancellationToken cancellationToken = default)
    {
        ValidateCompanyRequest(request);
        return store.UpdateCompanyAsync(companyId, request, cancellationToken);
    }

    public Task<bool> DeleteCompanyAsync(Guid companyId, CancellationToken cancellationToken = default)
    {
        return store.DeleteCompanyAsync(companyId, cancellationToken);
    }

    public async Task<List<ManagedUserResponse>> GetUsersAsync(Guid currentTenantId, string? currentRole, Guid? requestedTenantId, string? search, string? role, int page, int pageSize, CancellationToken cancellationToken = default)
    {
        var effectiveTenant = string.Equals(currentRole, "SuperAdmin", StringComparison.OrdinalIgnoreCase)
            ? requestedTenantId ?? currentTenantId
            : currentTenantId;

        var users = await store.GetManagedUsersAsync(
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

        return users;
    }

    public async Task<ManagedUserResponse?> GetUserByIdAsync(Guid currentTenantId, string? currentRole, Guid userId, CancellationToken cancellationToken = default)
    {
        var user = await store.GetManagedUserByIdAsync(userId, cancellationToken);
        if (user is null)
        {
            return null;
        }

        if (!CanAccessUser(currentRole, currentTenantId, user))
        {
            throw new UnauthorizedAccessException("Acesso negado ao usuario solicitado.");
        }

        return user;
    }

    public async Task<ManagedUserResponse> CreateUserAsync(Guid currentTenantId, string? currentRole, UserCreateRequest request, CancellationToken cancellationToken = default)
    {
        ValidateCreateUserRequest(request);

        if (!string.Equals(currentRole, "SuperAdmin", StringComparison.OrdinalIgnoreCase) && request.TenantId != currentTenantId)
        {
            throw new UnauthorizedAccessException("Nao e permitido criar usuario fora do tenant atual.");
        }

        return await store.CreateManagedUserAsync(request, cancellationToken);
    }

    public async Task<ManagedUserResponse?> UpdateUserAsync(Guid currentTenantId, string? currentRole, Guid userId, UserUpdateRequest request, CancellationToken cancellationToken = default)
    {
        ValidateUpdateUserRequest(request);

        var current = await store.GetManagedUserByIdAsync(userId, cancellationToken);
        if (current is null)
        {
            return null;
        }

        if (!CanAccessUser(currentRole, currentTenantId, current))
        {
            throw new UnauthorizedAccessException("Nao e permitido alterar este usuario.");
        }

        return await store.UpdateManagedUserAsync(userId, request, cancellationToken);
    }

    public async Task<bool> DeleteUserAsync(Guid currentTenantId, Guid currentUserId, string? currentRole, Guid userId, CancellationToken cancellationToken = default)
    {
        if (currentUserId == userId)
        {
            throw new InvalidOperationException("Nao e permitido excluir o proprio usuario logado.");
        }

        var current = await store.GetManagedUserByIdAsync(userId, cancellationToken);
        if (current is null)
        {
            return false;
        }

        if (!CanAccessUser(currentRole, currentTenantId, current))
        {
            throw new UnauthorizedAccessException("Nao e permitido excluir este usuario.");
        }

        return await store.DeleteManagedUserAsync(userId, cancellationToken);
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

    private static bool CanAccessUser(string? currentRole, Guid currentTenantId, ManagedUserResponse managedUser)
    {
        if (string.Equals(currentRole, "SuperAdmin", StringComparison.OrdinalIgnoreCase))
        {
            return true;
        }

        return managedUser.TenantId == currentTenantId
            && !string.Equals(managedUser.Role, "SuperAdmin", StringComparison.OrdinalIgnoreCase);
    }
}
