using System.Collections.Concurrent;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using backend.Application.Interfaces;
using backend.Contracts;
using Microsoft.IdentityModel.Tokens;

namespace backend.Services;

public sealed class AuthService(IConfiguration configuration, IDataStore store) : IAuthService
{
    private static readonly ConcurrentDictionary<string, FailedLoginState> FailedLogins = new(StringComparer.OrdinalIgnoreCase);

    public async Task<AuthResponse?> LoginAsync(LoginRequest request, CancellationToken cancellationToken = default)
    {
        var email = request.Email.Trim().ToLowerInvariant();
        if (IsLocked(email))
        {
            return null;
        }

        var user = await store.FindUserByEmailAsync(email, cancellationToken);
        if (user is null)
        {
            RegisterFailedLogin(email);
            return null;
        }

        var hash = HashPassword(request.Password);
        if (!string.Equals(hash, user.PasswordHash, StringComparison.OrdinalIgnoreCase))
        {
            RegisterFailedLogin(email);
            return null;
        }

        FailedLogins.TryRemove(email, out _);
        return await BuildAuthResponseAsync(user.Id, user.Email, user.Name, user.Role, user.TenantId, user.TenantName, cancellationToken);
    }

    public async Task<AuthResponse?> RefreshAsync(RefreshTokenRequest request, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(request.RefreshToken))
        {
            return null;
        }

        var refreshHash = HashRefreshToken(request.RefreshToken);
        var session = await store.GetRefreshSessionAsync(refreshHash, cancellationToken);
        if (session is null || session.ExpiresAt <= DateTimeOffset.UtcNow)
        {
            return null;
        }

        var user = await store.FindUserByIdAsync(session.UserId, cancellationToken);
        if (user is null)
        {
            return null;
        }

        var tenant = await store.GetTenantByIdAsync(session.TenantId, cancellationToken);
        var tenantId = tenant?.Id ?? user.TenantId;
        var tenantName = tenant?.Name ?? user.TenantName;

        await store.RevokeRefreshSessionAsync(refreshHash, cancellationToken);

        return await BuildAuthResponseAsync(user.Id, user.Email, user.Name, user.Role, tenantId, tenantName, cancellationToken);
    }

    public Task LogoutAsync(LogoutRequest request, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(request.RefreshToken))
        {
            return Task.CompletedTask;
        }

        var refreshHash = HashRefreshToken(request.RefreshToken);
        return store.RevokeRefreshSessionAsync(refreshHash, cancellationToken);
    }

    public async Task<AuthResponse?> SwitchTenantAsync(Guid userId, Guid tenantId, CancellationToken cancellationToken = default)
    {
        var user = await store.FindUserByIdAsync(userId, cancellationToken);
        if (user is null || !string.Equals(user.Role, "SuperAdmin", StringComparison.OrdinalIgnoreCase))
        {
            return null;
        }

        var tenant = await store.GetTenantByIdAsync(tenantId, cancellationToken);
        if (tenant is null)
        {
            return null;
        }

        return await BuildAuthResponseAsync(user.Id, user.Email, user.Name, user.Role, tenant.Id, tenant.Name, cancellationToken);
    }

    public static string HashPassword(string password)
    {
        var bytes = SHA256.HashData(Encoding.UTF8.GetBytes(password));
        return Convert.ToHexString(bytes);
    }

    private async Task<AuthResponse> BuildAuthResponseAsync(Guid userId, string email, string name, string role, Guid tenantId, string tenantName, CancellationToken cancellationToken)
    {
        var (accessToken, expiresAtUtc) = GenerateAccessToken(userId, tenantId, email, name, role);

        var refreshToken = GenerateRefreshToken();
        var refreshHash = HashRefreshToken(refreshToken);
        var refreshExpires = DateTimeOffset.UtcNow.AddDays(15);

        await store.CreateRefreshSessionAsync(userId, tenantId, refreshHash, refreshExpires, cancellationToken);

        return new AuthResponse(accessToken, refreshToken, expiresAtUtc, name, role, tenantId, tenantName);
    }

    private (string Token, DateTimeOffset ExpiresAtUtc) GenerateAccessToken(Guid userId, Guid tenantId, string email, string name, string role)
    {
        var key = configuration["Jwt:Key"] ?? "change-this-key-in-production-at-least-32-chars";
        var issuer = configuration["Jwt:Issuer"] ?? "AiAtendente";
        var audience = configuration["Jwt:Audience"] ?? "AiAtendenteClient";
        var expiresAt = DateTimeOffset.UtcNow.AddMinutes(30);

        var credentials = new SigningCredentials(
            new SymmetricSecurityKey(Encoding.UTF8.GetBytes(key)),
            SecurityAlgorithms.HmacSha256);

        var claims = new List<Claim>
        {
            new(JwtRegisteredClaimNames.Sub, userId.ToString()),
            new(JwtRegisteredClaimNames.Email, email),
            new(ClaimTypes.Name, name),
            new(ClaimTypes.Role, role),
            new("tenant_id", tenantId.ToString())
        };

        var token = new JwtSecurityToken(
            issuer: issuer,
            audience: audience,
            claims: claims,
            expires: expiresAt.UtcDateTime,
            signingCredentials: credentials);

        return (new JwtSecurityTokenHandler().WriteToken(token), expiresAt);
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
