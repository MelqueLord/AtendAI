namespace Atendai.Domain.Entities;

public sealed class RefreshTokenSession
{
    public required Guid UserId { get; init; }
    public required Guid TenantId { get; init; }
    public required DateTimeOffset ExpiresAt { get; init; }
}
