namespace Atendai.Domain.Entities;

public sealed record ConversationNote(
    Guid Id,
    Guid ConversationId,
    Guid UserId,
    string UserName,
    string Note,
    DateTimeOffset CreatedAt);

public sealed record QuickReplyTemplate(
    Guid Id,
    Guid TenantId,
    string Title,
    string Body,
    DateTimeOffset CreatedAt,
    DateTimeOffset UpdatedAt);
