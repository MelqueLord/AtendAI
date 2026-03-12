namespace Atendai.Domain.Entities;

public sealed class User
{
    public required Guid Id { get; init; }
    public required Guid TenantId { get; init; }
    public required string TenantName { get; init; }
    public required string Name { get; init; }
    public required string Email { get; init; }
    public required string PasswordHash { get; init; }
    public required string Role { get; init; }
}
