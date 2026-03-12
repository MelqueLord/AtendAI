namespace Atendai.Application.DTOs;

public sealed record ContactResponse(
    Guid Id,
    string Name,
    string Phone,
    string? State,
    string? Status,
    string[] Tags,
    string? OwnerName,
    DateTimeOffset CreatedAt);

public sealed record ContactUpsertRequest(
    string Name,
    string Phone,
    string? State,
    string? Status,
    string[] Tags,
    Guid? OwnerUserId);

public sealed record ContactImportLineRequest(
    string Name,
    string Phone,
    string? State,
    string? Status,
    string[] Tags,
    Guid? OwnerUserId);

public sealed record ContactImportRequest(List<ContactImportLineRequest> Contacts);

public sealed record QueueAttentionItemResponse(
    Guid ConversationId,
    string CustomerName,
    string CustomerPhone,
    string Status,
    DateTimeOffset CreatedAt,
    DateTimeOffset UpdatedAt,
    double WaitingMinutes,
    double? FirstHumanReplyMinutes);

public sealed record QueueHealthResponse(
    int UnattendedCount,
    double AverageFirstHumanReplyMinutes,
    double AverageCustomerRating,
    int FeedbackCount,
    List<QueueAttentionItemResponse> Unattended);

public sealed record CustomerFeedbackResponse(
    Guid Id,
    Guid ConversationId,
    string CustomerName,
    string CustomerPhone,
    int Rating,
    string? Comment,
    DateTimeOffset CreatedAt);

public sealed record SubmitCustomerFeedbackRequest(int Rating, string? Comment);
