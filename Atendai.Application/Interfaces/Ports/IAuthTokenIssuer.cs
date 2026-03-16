namespace Atendai.Application.Interfaces;

public interface IAuthTokenIssuer
{
    IssuedAccessToken Issue(AuthTokenDescriptor descriptor);
}

public sealed record AuthTokenDescriptor(
    Guid UserId,
    Guid TenantId,
    string Email,
    string Name,
    string Role);

public sealed record IssuedAccessToken(
    string Token,
    DateTimeOffset ExpiresAtUtc);
