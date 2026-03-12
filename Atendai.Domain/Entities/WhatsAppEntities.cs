namespace Atendai.Domain.Entities;

public sealed record WhatsAppConnection(
    Guid TenantId,
    string? WabaId,
    string? PhoneNumberId,
    string VerifyToken,
    bool IsActive,
    DateTimeOffset? LastTestedAt,
    string? LastStatus,
    string? LastError,
    DateTimeOffset UpdatedAt);

public sealed record WhatsAppChannel(
    Guid Id,
    Guid TenantId,
    string DisplayName,
    string? WabaId,
    string PhoneNumberId,
    string VerifyToken,
    bool IsActive,
    bool IsPrimary,
    DateTimeOffset? LastTestedAt,
    string? LastStatus,
    string? LastError,
    DateTimeOffset UpdatedAt);

public sealed record WhatsAppMessageLog(
    Guid Id,
    Guid TenantId,
    Guid? ConversationId,
    string ToPhone,
    string Direction,
    string Status,
    string? ErrorDetail,
    DateTimeOffset CreatedAt);
