namespace Atendai.Application.DTOs;

public sealed record CompanyUpsertRequest(string Name, string Segment);
public sealed record ManagedCompanyResponse(Guid Id, string Name, string Segment, DateTimeOffset CreatedAt);

public sealed record ManagedUserResponse(
    Guid Id,
    Guid TenantId,
    string TenantName,
    string Name,
    string Email,
    string Role,
    DateTimeOffset CreatedAt);

public sealed record UserCreateRequest(Guid TenantId, string Name, string Email, string Password, string Role);
public sealed record UserUpdateRequest(string Name, string Email, string Role, string? Password);
