namespace Atendai.Application.DTOs;

public sealed record LoginRequest(string Email, string Password);
public sealed record AuthResponse(
    string Token,
    string RefreshToken,
    DateTimeOffset ExpiresAtUtc,
    string Name,
    string Role,
    Guid TenantId,
    string TenantName);

public sealed record RefreshTokenRequest(string RefreshToken);
public sealed record LogoutRequest(string RefreshToken);
public sealed record TenantResponse(Guid Id, string Name, string Segment);
public sealed record SwitchTenantRequest(Guid TenantId);
