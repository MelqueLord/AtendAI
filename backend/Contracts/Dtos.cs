namespace backend.Contracts;

public sealed record LoginRequest(string Email, string Password);
public sealed record AuthResponse(
    string Token,
    string RefreshToken,
    DateTimeOffset ExpiresAtUtc,
    string Name,
    string Role,
    Guid TenantId,
    string TenantName);

public sealed record RefreshTokenRequest(string RefreshToken);
public sealed record LogoutRequest(string RefreshToken);

public sealed record IncomingMessageRequest(string CustomerPhone, string Message, string? CustomerName);
public sealed record OutgoingMessageResponse(string Reply, bool EscalatedToHuman, Guid ConversationId);
public sealed record OutboundConversationRequest(string CustomerPhone, string? CustomerName, string Message, Guid? ChannelId);
public sealed record OutboundConversationResponse(bool Delivered, string Status, string? Error, string Message, Guid ConversationId);

public sealed record HumanReplyRequest(string Message);
public sealed record HumanReplyDispatchResponse(bool Delivered, string Status, string? Error, string Message);

public sealed record UpdateSettingsRequest(string BusinessName, string WelcomeMessage, string HumanFallbackMessage);
public sealed record AddTrainingRequest(string Keyword, string AnswerTemplate);

public sealed record TenantResponse(Guid Id, string Name, string Segment);
public sealed record SwitchTenantRequest(Guid TenantId);

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

public sealed record BillingPlanResponse(
    string Code,
    string Name,
    decimal MonthlyPrice,
    string Currency,
    int IncludedConversations,
    int IncludedAgents,
    int IncludedWhatsAppNumbers,
    bool IsPopular);

public sealed record BillingSubscriptionResponse(
    Guid TenantId,
    string PlanCode,
    string PlanName,
    string Status,
    DateTimeOffset? TrialEndsAt,
    DateTimeOffset? CurrentPeriodEnd,
    DateTimeOffset UpdatedAt);

public sealed record SubscriptionCheckoutRequest(string PlanCode);

public sealed record ValueMetricsResponse(
    int Conversations30d,
    int HumanHandoffs30d,
    double AutomationRate,
    double EstimatedHoursSaved,
    double EstimatedRevenueProtected);

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

public sealed record CampaignRuleResponse(
    Guid Id,
    Guid TenantId,
    string Name,
    int DelayHours,
    string Template,
    bool IsActive,
    DateTimeOffset CreatedAt,
    DateTimeOffset UpdatedAt);

public sealed record CampaignRuleUpsertRequest(string Name, int DelayHours, string Template, bool IsActive);

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

public sealed record ScheduledBroadcastResponse(
    Guid Id,
    Guid TenantId,
    string Name,
    string MessageTemplate,
    DateTimeOffset ScheduledAt,
    string Status,
    string? TagFilter,
    int TargetCount,
    int DeliveredCount,
    DateTimeOffset CreatedAt);

public sealed record ScheduleBroadcastRequest(
    string Name,
    string MessageTemplate,
    DateTimeOffset ScheduledAt,
    string? TagFilter,
    Guid[] ContactIds);

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

public sealed record AutomationOptionResponse(
    Guid Id,
    Guid TenantId,
    string Name,
    string TriggerKeywords,
    string ResponseTemplate,
    bool EscalateToHuman,
    int SortOrder,
    bool IsActive,
    DateTimeOffset CreatedAt,
    DateTimeOffset UpdatedAt);

public sealed record AutomationOptionUpsertRequest(
    string Name,
    string TriggerKeywords,
    string ResponseTemplate,
    bool EscalateToHuman,
    int SortOrder,
    bool IsActive);

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

public sealed record MetaWhatsAppBootstrapRequest(
    string DisplayName,
    string? WabaId,
    string PhoneNumberId,
    string? VerifyToken,
    string AccessToken,
    bool IsActive,
    bool IsPrimary,
    string? PublicBaseUrl);

public sealed record MetaWhatsAppSetupResponse(
    bool IsConfigured,
    string CallbackUrl,
    string VerifyToken,
    string? PhoneNumberId,
    string? WabaId,
    Guid? ChannelId,
    string? DisplayName,
    string? LastStatus,
    string? LastError,
    DateTimeOffset? LastTestedAt,
    string WebhookField,
    string WebhookPath);

public sealed record MetaWhatsAppBootstrapResponse(
    Guid ChannelId,
    string DisplayName,
    string CallbackUrl,
    string VerifyToken,
    string PhoneNumberId,
    string? WabaId,
    bool IsActive,
    bool IsPrimary,
    bool TestSucceeded,
    string TestStatus,
    string? TestError);




