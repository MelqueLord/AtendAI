namespace Atendai.Domain.Entities;

public sealed record Tenant(
    Guid Id,
    string Name,
    string Segment);

public sealed record ManagedCompany(
    Guid Id,
    string Name,
    string Segment,
    DateTimeOffset CreatedAt);

public sealed record ManagedUser(
    Guid Id,
    Guid TenantId,
    string TenantName,
    string Name,
    string Email,
    string Role,
    DateTimeOffset CreatedAt);
