namespace Atendai.Application.DTOs;

public sealed record WhatsAppConnectionResponse(
    Guid TenantId,
    string? WabaId,
    string? PhoneNumberId,
    string VerifyToken,
    bool IsActive,
    DateTimeOffset? LastTestedAt,
    string? LastStatus,
    string? LastError,
    DateTimeOffset UpdatedAt);

public sealed record UpsertWhatsAppConnectionRequest(
    string? WabaId,
    string PhoneNumberId,
    string VerifyToken,
    string? AccessToken,
    bool IsActive);

public sealed record WhatsAppMessageLogResponse(
    Guid Id,
    Guid TenantId,
    Guid? ConversationId,
    string ToPhone,
    string Direction,
    string Status,
    string? ErrorDetail,
    DateTimeOffset CreatedAt);

public sealed record WhatsAppTestResponse(bool Success, string Status, string? Error);

public sealed record WhatsAppDeliveryEventResult(
    Guid? ConversationId,
    string ProviderMessageId,
    string Status,
    string? ErrorDetail,
    bool Failed);

public sealed record WhatsAppChannelResponse(
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

public sealed record UpsertWhatsAppChannelRequest(
    string DisplayName,
    string? WabaId,
    string PhoneNumberId,
    string VerifyToken,
    string? AccessToken,
    bool IsActive,
    bool IsPrimary);
