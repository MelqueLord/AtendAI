using Atendai.Application.DTOs;

namespace Atendai.Application.Interfaces;

public interface IAuthService
{
    Task<AuthResponse?> LoginAsync(LoginRequest request, CancellationToken cancellationToken = default);
    Task<AuthResponse?> RefreshAsync(RefreshTokenRequest request, CancellationToken cancellationToken = default);
    Task LogoutAsync(LogoutRequest request, CancellationToken cancellationToken = default);
    Task<AuthResponse?> SwitchTenantAsync(Guid userId, Guid tenantId, CancellationToken cancellationToken = default);
}
