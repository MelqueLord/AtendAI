using Atendai.Application.DTOs;
using Atendai.Application.Exceptions;
using Atendai.Domain.Entities;

namespace Atendai.Application.Policies;

public static class ManagementPolicy
{
    public static void EnsureCompanyRequestIsValid(CompanyUpsertRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Name) || string.IsNullOrWhiteSpace(request.Segment))
        {
            throw new ApplicationValidationException("Nome e segmento sao obrigatorios.");
        }
    }

    public static void EnsureCreateUserRequestIsValid(UserCreateRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Name) || string.IsNullOrWhiteSpace(request.Email) || string.IsNullOrWhiteSpace(request.Password))
        {
            throw new ApplicationValidationException("Nome, email e senha sao obrigatorios.");
        }

        EnsureRoleIsAllowed(request.Role);
        EnsurePasswordStrength(request.Password);
    }

    public static void EnsureUpdateUserRequestIsValid(UserUpdateRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Name) || string.IsNullOrWhiteSpace(request.Email))
        {
            throw new ApplicationValidationException("Nome e email sao obrigatorios.");
        }

        EnsureRoleIsAllowed(request.Role);

        if (!string.IsNullOrWhiteSpace(request.Password))
        {
            EnsurePasswordStrength(request.Password);
        }
    }

    public static void EnsureUserAccess(string? currentRole, Guid currentTenantId, ManagedUser managedUser, string message)
    {
        if (!CanAccessUser(currentRole, currentTenantId, managedUser))
        {
            throw new ApplicationForbiddenException(message);
        }
    }

    public static void EnsureUserCreationTenantAccess(string? currentRole, Guid currentTenantId, Guid requestedTenantId)
    {
        if (!string.Equals(currentRole, "SuperAdmin", StringComparison.OrdinalIgnoreCase) && requestedTenantId != currentTenantId)
        {
            throw new ApplicationForbiddenException("Nao e permitido criar usuario fora do tenant atual.");
        }
    }

    public static void EnsureSelfDeletionIsAllowed(Guid currentUserId, Guid targetUserId)
    {
        if (currentUserId == targetUserId)
        {
            throw new BusinessRuleViolationException("Nao e permitido excluir o proprio usuario logado.");
        }
    }

    public static int NormalizePage(int page) => page < 1 ? 1 : page;
    public static int NormalizePageSize(int pageSize) => pageSize is < 1 or > 100 ? 20 : pageSize;

    private static bool CanAccessUser(string? currentRole, Guid currentTenantId, ManagedUser managedUser)
    {
        if (string.Equals(currentRole, "SuperAdmin", StringComparison.OrdinalIgnoreCase))
        {
            return true;
        }

        return managedUser.TenantId == currentTenantId
            && !string.Equals(managedUser.Role, "SuperAdmin", StringComparison.OrdinalIgnoreCase);
    }

    private static void EnsureRoleIsAllowed(string role)
    {
        if (string.Equals(role, "Admin", StringComparison.OrdinalIgnoreCase)
            || string.Equals(role, "Agent", StringComparison.OrdinalIgnoreCase))
        {
            return;
        }

        throw new ApplicationValidationException("Role invalida. Use Admin ou Agent.");
    }

    private static void EnsurePasswordStrength(string password)
    {
        var isStrong = password.Length >= 8
            && password.Any(char.IsUpper)
            && password.Any(char.IsLower)
            && password.Any(char.IsDigit)
            && password.Any(ch => !char.IsLetterOrDigit(ch));

        if (!isStrong)
        {
            throw new ApplicationValidationException("Senha fraca. Minimo 8 caracteres, com maiuscula, minuscula, numero e simbolo.");
        }
    }
}
