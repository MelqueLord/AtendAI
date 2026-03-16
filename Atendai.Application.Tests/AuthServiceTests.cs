using Atendai.Application.DTOs;
using Atendai.Application.Interfaces;
using Atendai.Application.Interfaces.Repositories;
using Atendai.Application.Services;
using Atendai.Domain.Entities;

namespace Atendai.Application.Tests;

public sealed class AuthServiceTests
{
    [Fact]
    public async Task LoginAsync_ReturnsTokens_WhenCredentialsAreValid()
    {
        var tenantId = Guid.NewGuid();
        var user = new User
        {
            Id = Guid.NewGuid(),
            TenantId = tenantId,
            TenantName = "Tenant A",
            Name = "Maria Silva",
            Email = "maria@tenant.com",
            PasswordHash = Atendai.Application.Support.PasswordHasher.HashPassword("Senha@123"),
            Role = "Admin"
        };

        var authRepository = new FakeAuthRepository(user);
        var tenantRepository = new FakeTenantRepository(new Tenant(tenantId, "Tenant A", "SaaS"));
        var tokenIssuer = new FakeAuthTokenIssuer();
        var service = new AuthService(tokenIssuer, authRepository, tenantRepository);

        var response = await service.LoginAsync(new LoginRequest("maria@tenant.com", "Senha@123"));

        Assert.NotNull(response);
        Assert.Equal("token-1", response!.Token);
        Assert.Equal("Maria Silva", response.Name);
        Assert.Single(authRepository.CreatedSessions);
    }

    [Fact]
    public async Task SwitchTenantAsync_ReturnsNull_WhenUserIsNotSuperAdmin()
    {
        var user = new User
        {
            Id = Guid.NewGuid(),
            TenantId = Guid.NewGuid(),
            TenantName = "Tenant A",
            Name = "Maria Silva",
            Email = "maria@tenant.com",
            PasswordHash = "hash",
            Role = "Admin"
        };

        var authRepository = new FakeAuthRepository(user);
        var tenantRepository = new FakeTenantRepository(new Tenant(Guid.NewGuid(), "Tenant B", "Health"));
        var service = new AuthService(new FakeAuthTokenIssuer(), authRepository, tenantRepository);

        var response = await service.SwitchTenantAsync(user.Id, Guid.NewGuid());

        Assert.Null(response);
    }

    private sealed class FakeAuthTokenIssuer : IAuthTokenIssuer
    {
        private int _counter;

        public IssuedAccessToken Issue(AuthTokenDescriptor descriptor)
        {
            _counter++;
            return new IssuedAccessToken($"token-{_counter}", DateTimeOffset.UtcNow.AddMinutes(30));
        }
    }

    private sealed class FakeTenantRepository(Tenant tenant) : ITenantRepository
    {
        public Task<List<Tenant>> GetTenantsAsync(CancellationToken cancellationToken = default) => Task.FromResult(new List<Tenant> { tenant });
        public Task<Tenant?> GetTenantByIdAsync(Guid tenantId, CancellationToken cancellationToken = default) => Task.FromResult(tenant.Id == tenantId ? tenant : null);
    }

    private sealed class FakeAuthRepository(User user) : IAuthRepository
    {
        public List<(Guid UserId, Guid TenantId, string RefreshHash)> CreatedSessions { get; } = [];

        public Task<User?> FindUserByEmailAsync(string email, CancellationToken cancellationToken = default)
        {
            return Task.FromResult(string.Equals(email, user.Email, StringComparison.OrdinalIgnoreCase) ? user : null);
        }

        public Task<User?> FindUserByIdAsync(Guid userId, CancellationToken cancellationToken = default)
        {
            return Task.FromResult(user.Id == userId ? user : null);
        }

        public Task CreateRefreshSessionAsync(Guid userId, Guid tenantId, string refreshTokenHash, DateTimeOffset expiresAt, CancellationToken cancellationToken = default)
        {
            CreatedSessions.Add((userId, tenantId, refreshTokenHash));
            return Task.CompletedTask;
        }

        public Task<RefreshTokenSession?> GetRefreshSessionAsync(string refreshTokenHash, CancellationToken cancellationToken = default)
        {
            return Task.FromResult<RefreshTokenSession?>(null);
        }

        public Task RevokeRefreshSessionAsync(string refreshTokenHash, CancellationToken cancellationToken = default)
        {
            return Task.CompletedTask;
        }
    }
}

