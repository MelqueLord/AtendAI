using Atendai.Domain.Entities;

namespace Atendai.Application.Interfaces.Repositories;

public interface IAuthRepository
{
    Task<User?> FindUserByEmailAsync(string email, CancellationToken cancellationToken = default);
    Task<User?> FindUserByIdAsync(Guid userId, CancellationToken cancellationToken = default);
    Task CreateRefreshSessionAsync(Guid userId, Guid tenantId, string refreshTokenHash, DateTimeOffset expiresAt, CancellationToken cancellationToken = default);
    Task<RefreshTokenSession?> GetRefreshSessionAsync(string refreshTokenHash, CancellationToken cancellationToken = default);
    Task RevokeRefreshSessionAsync(string refreshTokenHash, CancellationToken cancellationToken = default);
}
