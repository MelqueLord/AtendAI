namespace Atendai.Application.DTOs;

public sealed record WhatsAppWebSessionStateResponse(
    bool IsConfigured,
    string Status,
    string Detail,
    string? SessionId,
    string? QrCodeDataUrl,
    string? PairingCode,
    string? PhoneNumber,
    string? DisplayName,
    DateTimeOffset? LastUpdatedAt,
    bool CanStart,
    bool CanRestart,
    bool CanDisconnect,
    int CachedChatsCount,
    DateTimeOffset? LastHistorySyncAt);

public sealed record WhatsAppWebSessionListResponse(
    List<WhatsAppWebSessionStateResponse> Sessions);

public sealed record StartWhatsAppWebSessionRequest(
    string? DisplayName,
    bool ForceRestart,
    string? SessionId = null);

public sealed record WhatsAppWebSessionActionResponse(
    bool Success,
    string Status,
    string Message,
    WhatsAppWebSessionStateResponse? Session);

public sealed record SendWhatsAppWebSessionMessageRequest(
    string ToPhone,
    string Message);

public sealed record SyncWhatsAppWebHistoryRequest(
    string? SessionKey,
    string? SessionDisplayName,
    string? SessionPhoneNumber,
    List<SyncWhatsAppWebHistoryChatRequest> Chats);

public sealed record SyncWhatsAppWebHistoryChatRequest(
    string CustomerPhone,
    string? CustomerName,
    string? LastMessage,
    bool LastMessageFromMe,
    DateTimeOffset? LastMessageAt,
    int UnreadCount);

public sealed record SyncWhatsAppWebHistoryResponse(
    int Imported,
    int Skipped,
    int Total);
