using System.Collections.Concurrent;
using System.Security.Cryptography;
using System.Text;
using Atendai.Application.DTOs;
using Atendai.Application.Interfaces;
using Atendai.Application.Interfaces.Repositories;
using Atendai.Application.Support;

namespace Atendai.Application.Services;

public sealed class AuthService(
    IAuthTokenIssuer authTokenIssuer,
    IAuthRepository authRepository,
    ITenantRepository tenantRepository) : IAuthService
{
    private static readonly ConcurrentDictionary<string, FailedLoginState> FailedLogins = new(StringComparer.OrdinalIgnoreCase);

    public async Task<AuthResponse?> LoginAsync(LoginRequest request, CancellationToken cancellationToken = default)
    {
        var email = request.Email.Trim().ToLowerInvariant();

        var user = await authRepository.FindUserByEmailAsync(email, cancellationToken);
        if (user is null)
        {
            if (IsLocked(email))
            {
                return null;
            }

            RegisterFailedLogin(email);
            return null;
        }

        var hash = PasswordHasher.HashPassword(request.Password.Trim());
        if (string.Equals(hash, user.PasswordHash, StringComparison.OrdinalIgnoreCase))
        {
            FailedLogins.TryRemove(email, out _);
            return await BuildAuthResponseAsync(user.Id, user.Email, user.Name, user.Role, user.TenantId, user.TenantName, cancellationToken);
        }

        if (IsLocked(email))
        {
            return null;
        }

        RegisterFailedLogin(email);
        return null;
    }

    public async Task<AuthResponse?> RefreshAsync(RefreshTokenRequest request, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(request.RefreshToken))
        {
            return null;
        }

        var refreshHash = HashRefreshToken(request.RefreshToken);
        var session = await authRepository.GetRefreshSessionAsync(refreshHash, cancellationToken);
        if (session is null || session.ExpiresAt <= DateTimeOffset.UtcNow)
        {
            return null;
        }

        var user = await authRepository.FindUserByIdAsync(session.UserId, cancellationToken);
        if (user is null)
        {
            return null;
        }

        var tenant = await tenantRepository.GetTenantByIdAsync(session.TenantId, cancellationToken);
        var tenantId = tenant?.Id ?? user.TenantId;
        var tenantName = tenant?.Name ?? user.TenantName;

        await authRepository.RevokeRefreshSessionAsync(refreshHash, cancellationToken);

        return await BuildAuthResponseAsync(user.Id, user.Email, user.Name, user.Role, tenantId, tenantName, cancellationToken);
    }

    public Task LogoutAsync(LogoutRequest request, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(request.RefreshToken))
        {
            return Task.CompletedTask;
        }

        var refreshHash = HashRefreshToken(request.RefreshToken);
        return authRepository.RevokeRefreshSessionAsync(refreshHash, cancellationToken);
    }

    public async Task<AuthResponse?> SwitchTenantAsync(Guid userId, Guid tenantId, CancellationToken cancellationToken = default)
    {
        var user = await authRepository.FindUserByIdAsync(userId, cancellationToken);
        if (user is null || !string.Equals(user.Role, "SuperAdmin", StringComparison.OrdinalIgnoreCase))
        {
            return null;
        }

        var tenant = await tenantRepository.GetTenantByIdAsync(tenantId, cancellationToken);
        if (tenant is null)
        {
            return null;
        }

        return await BuildAuthResponseAsync(user.Id, user.Email, user.Name, user.Role, tenant.Id, tenant.Name, cancellationToken);
    }

    private async Task<AuthResponse> BuildAuthResponseAsync(Guid userId, string email, string name, string role, Guid tenantId, string tenantName, CancellationToken cancellationToken)
    {
        var accessToken = authTokenIssuer.Issue(new AuthTokenDescriptor(userId, tenantId, email, name, role));

        var refreshToken = GenerateRefreshToken();
        var refreshHash = HashRefreshToken(refreshToken);
        var refreshExpires = DateTimeOffset.UtcNow.AddDays(15);

        await authRepository.CreateRefreshSessionAsync(userId, tenantId, refreshHash, refreshExpires, cancellationToken);

        return new AuthResponse(accessToken.Token, refreshToken, accessToken.ExpiresAtUtc, name, role, tenantId, tenantName);
    }

    private static string GenerateRefreshToken()
    {
        return Convert.ToBase64String(RandomNumberGenerator.GetBytes(48));
    }

    private static string HashRefreshToken(string refreshToken)
    {
        var bytes = SHA256.HashData(Encoding.UTF8.GetBytes(refreshToken));
        return Convert.ToHexString(bytes);
    }

    private static bool IsLocked(string email)
    {
        if (!FailedLogins.TryGetValue(email, out var state))
        {
            return false;
        }

        if (state.LockedUntilUtc <= DateTimeOffset.UtcNow)
        {
            FailedLogins.TryRemove(email, out _);
            return false;
        }

        return true;
    }

    private static void RegisterFailedLogin(string email)
    {
        var now = DateTimeOffset.UtcNow;

        FailedLogins.AddOrUpdate(
            email,
            _ => new FailedLoginState(1, now, null),
            (_, current) =>
            {
                var attempts = current.Attempts + 1;
                DateTimeOffset? lockUntil = null;

                if (attempts >= 5)
                {
                    lockUntil = now.AddMinutes(15);
                    attempts = 0;
                }

                return new FailedLoginState(attempts, now, lockUntil);
            });
    }

    private sealed record FailedLoginState(int Attempts, DateTimeOffset LastAttemptUtc, DateTimeOffset? LockedUntilUtc);
}
