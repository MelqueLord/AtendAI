namespace Atendai.Application.DTOs;

public sealed record IncomingMessageRequest(string CustomerPhone, string Message, string? CustomerName);
public sealed record OutgoingMessageResponse(string Reply, bool EscalatedToHuman, Guid ConversationId);
public sealed record OutboundConversationRequest(string CustomerPhone, string? CustomerName, string Message, Guid? ChannelId);
public sealed record OutboundConversationResponse(bool Delivered, string Status, string? Error, string Message, Guid ConversationId);

public sealed record ConversationMessageResponse(
    Guid Id,
    string Sender,
    string Text,
    DateTimeOffset CreatedAt);

public sealed record ConversationResponse(
    Guid Id,
    string CustomerPhone,
    string CustomerName,
    string Status,
    string? Transport,
    Guid? ChannelId,
    string? ChannelName,
    Guid? AssignedUserId,
    string? AssignedUserName,
    DateTimeOffset? LastCustomerMessageAt,
    DateTimeOffset? LastHumanMessageAt,
    DateTimeOffset? ClosedAt,
    DateTimeOffset CreatedAt,
    DateTimeOffset UpdatedAt,
    List<ConversationMessageResponse> Messages);

public sealed record HumanReplyRequest(string Message);
public sealed record HumanReplyDispatchResponse(bool Delivered, string Status, string? Error, string Message);

public sealed record UpdateConversationAssignmentRequest(Guid? AssignedUserId);
public sealed record UpdateConversationStatusRequest(string Status);
public sealed record AddConversationNoteRequest(string Note);

public sealed record ConversationNoteResponse(
    Guid Id,
    Guid ConversationId,
    Guid UserId,
    string UserName,
    string Note,
    DateTimeOffset CreatedAt);

public sealed record QuickReplyTemplateResponse(
    Guid Id,
    Guid TenantId,
    string Title,
    string Body,
    DateTimeOffset CreatedAt,
    DateTimeOffset UpdatedAt);

public sealed record QuickReplyTemplateUpsertRequest(string Title, string Body);
