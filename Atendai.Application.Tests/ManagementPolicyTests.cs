using Atendai.Application.DTOs;
using Atendai.Application.Exceptions;
using Atendai.Application.Policies;
using Atendai.Domain.Entities;

namespace Atendai.Application.Tests;

public sealed class ManagementPolicyTests
{
    [Fact]
    public void EnsureCreateUserRequestIsValid_AllowsStrongAdminRequest()
    {
        var request = new UserCreateRequest(Guid.NewGuid(), "Maria Silva", "maria@tenant.com", "Senha@123", "Admin");

        ManagementPolicy.EnsureCreateUserRequestIsValid(request);
    }

    [Fact]
    public void EnsureCreateUserRequestIsValid_ThrowsForWeakPassword()
    {
        var request = new UserCreateRequest(Guid.NewGuid(), "Maria Silva", "maria@tenant.com", "123456", "Admin");

        var action = () => ManagementPolicy.EnsureCreateUserRequestIsValid(request);

        var exception = Assert.Throws<ApplicationValidationException>(action);
        Assert.Equal("Senha fraca. Minimo 8 caracteres, com maiuscula, minuscula, numero e simbolo.", exception.Message);
    }

    [Fact]
    public void EnsureUserCreationTenantAccess_ThrowsForCrossTenantAdminRequest()
    {
        var currentTenantId = Guid.NewGuid();
        var requestedTenantId = Guid.NewGuid();

        var action = () => ManagementPolicy.EnsureUserCreationTenantAccess("Admin", currentTenantId, requestedTenantId);

        var exception = Assert.Throws<ApplicationForbiddenException>(action);
        Assert.Equal("Nao e permitido criar usuario fora do tenant atual.", exception.Message);
    }

    [Fact]
    public void EnsureUserAccess_AllowsSuperAdminToInspectAnyUser()
    {
        var managedUser = new ManagedUser(Guid.NewGuid(), Guid.NewGuid(), "Tenant A", "Maria", "maria@tenant.com", "Admin", DateTimeOffset.UtcNow);

        ManagementPolicy.EnsureUserAccess("SuperAdmin", Guid.NewGuid(), managedUser, "forbidden");
    }

    [Fact]
    public void EnsureSelfDeletionIsAllowed_ThrowsWhenDeletingOwnUser()
    {
        var userId = Guid.NewGuid();

        var action = () => ManagementPolicy.EnsureSelfDeletionIsAllowed(userId, userId);

        var exception = Assert.Throws<BusinessRuleViolationException>(action);
        Assert.Equal("Nao e permitido excluir o proprio usuario logado.", exception.Message);
    }
}
