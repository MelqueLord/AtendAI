using backend.Contracts;
using backend.Models;
using backend.Services;

namespace backend.Application.Interfaces;

public interface IAuthService
{
    Task<AuthResponse?> LoginAsync(LoginRequest request, CancellationToken cancellationToken = default);
    Task<AuthResponse?> RefreshAsync(RefreshTokenRequest request, CancellationToken cancellationToken = default);
    Task LogoutAsync(LogoutRequest request, CancellationToken cancellationToken = default);
    Task<AuthResponse?> SwitchTenantAsync(Guid userId, Guid tenantId, CancellationToken cancellationToken = default);
}

public interface IAnalyticsService
{
    Task<AnalyticsOverviewResponse> GetOverviewAsync(Guid tenantId, CancellationToken cancellationToken = default);
}

public interface IBillingService
{
    Task<List<BillingPlanResponse>> GetPlansAsync(CancellationToken cancellationToken = default);
    Task<BillingSubscriptionResponse> GetSubscriptionAsync(Guid tenantId, CancellationToken cancellationToken = default);
    Task<BillingSubscriptionResponse> SubscribeAsync(Guid tenantId, string planCode, CancellationToken cancellationToken = default);
    Task<ValueMetricsResponse> GetValueMetricsAsync(Guid tenantId, CancellationToken cancellationToken = default);
}

public interface IAiResponderService
{
    Task<(string Reply, bool Escalate)> BuildReplyAsync(Guid tenantId, Conversation conversation, string message, CancellationToken cancellationToken = default);
}

public interface IConversationService
{
    Task<List<Conversation>> GetConversationsAsync(Guid tenantId, CancellationToken cancellationToken = default);
    Task<Conversation?> GetConversationByIdAsync(Guid tenantId, Guid conversationId, CancellationToken cancellationToken = default);
    Task<OutgoingMessageResponse> HandleIncomingAsync(Guid tenantId, IncomingMessageRequest request, Guid? channelId = null, CancellationToken cancellationToken = default);
    Task<OutboundConversationResponse> StartOutboundConversationAsync(Guid tenantId, OutboundConversationRequest request, CancellationToken cancellationToken = default);
    Task<HumanReplyDispatchResponse?> SendHumanReplyAsync(Guid tenantId, Guid conversationId, string message, CancellationToken cancellationToken = default);
    Task<Conversation?> UpdateAssignmentAsync(Guid tenantId, Guid conversationId, Guid? assignedUserId, CancellationToken cancellationToken = default);
    Task<Conversation?> UpdateStatusAsync(Guid tenantId, Guid conversationId, string status, CancellationToken cancellationToken = default);
    Task<List<ConversationNoteResponse>> GetNotesAsync(Guid tenantId, Guid conversationId, CancellationToken cancellationToken = default);
    Task<ConversationNoteResponse> AddNoteAsync(Guid tenantId, Guid conversationId, Guid userId, string userName, string note, CancellationToken cancellationToken = default);
    Task<List<QuickReplyTemplateResponse>> GetQuickRepliesAsync(Guid tenantId, CancellationToken cancellationToken = default);
    Task<QuickReplyTemplateResponse> CreateQuickReplyAsync(Guid tenantId, QuickReplyTemplateUpsertRequest request, CancellationToken cancellationToken = default);
    Task<QuickReplyTemplateResponse?> UpdateQuickReplyAsync(Guid tenantId, Guid templateId, QuickReplyTemplateUpsertRequest request, CancellationToken cancellationToken = default);
    Task<bool> DeleteQuickReplyAsync(Guid tenantId, Guid templateId, CancellationToken cancellationToken = default);
}

public interface ICrmService
{
    Task<List<ContactResponse>> GetContactsAsync(Guid tenantId, string? search = null, string? state = null, string? status = null, string? tag = null, int page = 1, int pageSize = 50, CancellationToken cancellationToken = default);
    Task<ContactResponse> CreateContactAsync(Guid tenantId, ContactUpsertRequest request, CancellationToken cancellationToken = default);
    Task<ContactResponse?> UpdateContactAsync(Guid tenantId, Guid contactId, ContactUpsertRequest request, CancellationToken cancellationToken = default);
    Task<bool> DeleteContactAsync(Guid tenantId, Guid contactId, CancellationToken cancellationToken = default);
    Task<List<ContactResponse>> ImportContactsAsync(Guid tenantId, ContactImportRequest request, CancellationToken cancellationToken = default);
    Task EnsureContactExistsAsync(Guid tenantId, string customerPhone, string? customerName, CancellationToken cancellationToken = default);
    Task<List<AutomationOptionResponse>> GetAutomationOptionsAsync(Guid tenantId, CancellationToken cancellationToken = default);
    Task<AutomationOptionResponse> CreateAutomationOptionAsync(Guid tenantId, AutomationOptionUpsertRequest request, CancellationToken cancellationToken = default);
    Task<AutomationOptionResponse?> UpdateAutomationOptionAsync(Guid tenantId, Guid optionId, AutomationOptionUpsertRequest request, CancellationToken cancellationToken = default);
    Task<bool> DeleteAutomationOptionAsync(Guid tenantId, Guid optionId, CancellationToken cancellationToken = default);
    Task<ScheduledBroadcastResponse> ScheduleBroadcastAsync(Guid tenantId, Guid userId, ScheduleBroadcastRequest request, CancellationToken cancellationToken = default);
    Task<List<ScheduledBroadcastResponse>> GetBroadcastsAsync(Guid tenantId, CancellationToken cancellationToken = default);
    Task<CustomerFeedbackResponse> SaveFeedbackAsync(Guid tenantId, Guid conversationId, SubmitCustomerFeedbackRequest request, CancellationToken cancellationToken = default);
    Task<List<CustomerFeedbackResponse>> GetFeedbackAsync(Guid tenantId, int limit = 100, CancellationToken cancellationToken = default);
    Task<QueueHealthResponse> GetQueueHealthAsync(Guid tenantId, CancellationToken cancellationToken = default);
}

public interface ITenantWhatsAppService
{
    Task<WhatsAppConnectionResponse?> GetConnectionAsync(Guid tenantId, CancellationToken cancellationToken = default);
    Task<List<WhatsAppChannelResponse>> GetChannelsAsync(Guid tenantId, CancellationToken cancellationToken = default);
    Task<WhatsAppConnectionResponse> UpsertConnectionAsync(Guid tenantId, UpsertWhatsAppConnectionRequest request, CancellationToken cancellationToken = default);
    Task<WhatsAppChannelResponse> CreateChannelAsync(Guid tenantId, UpsertWhatsAppChannelRequest request, CancellationToken cancellationToken = default);
    Task<WhatsAppChannelResponse?> UpdateChannelAsync(Guid tenantId, Guid channelId, UpsertWhatsAppChannelRequest request, CancellationToken cancellationToken = default);
    Task<bool> DeleteChannelAsync(Guid tenantId, Guid channelId, CancellationToken cancellationToken = default);
    Task<WhatsAppTestResponse> TestConnectionAsync(Guid tenantId, CancellationToken cancellationToken = default);
    Task<WhatsAppTestResponse> TestChannelAsync(Guid tenantId, Guid channelId, CancellationToken cancellationToken = default);
    Task<Guid?> ResolveTenantIdByPhoneNumberIdAsync(string phoneNumberId, CancellationToken cancellationToken = default);
    Task<WhatsAppChannelResponse?> GetChannelByPhoneNumberIdAsync(Guid tenantId, string phoneNumberId, CancellationToken cancellationToken = default);
    Task<Guid?> ResolveTenantIdByVerifyTokenAsync(string verifyToken, CancellationToken cancellationToken = default);
    Task<WhatsAppSendResult> SendMessageAsync(Guid tenantId, Guid? conversationId, string toPhone, string message, CancellationToken cancellationToken = default, Guid? channelId = null);
    Task<List<WhatsAppMessageLogResponse>> GetLogsAsync(Guid tenantId, int limit = 100, CancellationToken cancellationToken = default);
    Task<int> GetAllowedChannelsAsync(Guid tenantId, CancellationToken cancellationToken = default);
    Task<MetaWhatsAppSetupResponse> GetMetaSetupAsync(Guid tenantId, string? publicBaseUrl, CancellationToken cancellationToken = default);
    Task<MetaWhatsAppBootstrapResponse> BootstrapMetaChannelAsync(Guid tenantId, MetaWhatsAppBootstrapRequest request, CancellationToken cancellationToken = default);
}

public interface ICampaignAutomationService
{
    Task<List<CampaignRuleResponse>> GetRulesAsync(Guid tenantId, CancellationToken cancellationToken = default);
    Task<CampaignRuleResponse> CreateRuleAsync(Guid tenantId, CampaignRuleUpsertRequest request, CancellationToken cancellationToken = default);
    Task<CampaignRuleResponse?> UpdateRuleAsync(Guid tenantId, Guid ruleId, CampaignRuleUpsertRequest request, CancellationToken cancellationToken = default);
    Task<bool> DeleteRuleAsync(Guid tenantId, Guid ruleId, CancellationToken cancellationToken = default);
    Task EnqueueForConversationAsync(Guid tenantId, Conversation conversation, CancellationToken cancellationToken = default);
    Task<List<ScheduledCampaignJob>> GetDueJobsAsync(int limit = 50, CancellationToken cancellationToken = default);
    Task MarkSentAsync(Guid jobId, CancellationToken cancellationToken = default);
    Task MarkFailedAsync(Guid jobId, string error, CancellationToken cancellationToken = default);
}

public interface ISettingsService
{
    Task<BusinessSettings> GetSettingsAsync(Guid tenantId, CancellationToken cancellationToken = default);
    Task<BusinessSettings> UpdateSettingsAsync(Guid tenantId, UpdateSettingsRequest request, CancellationToken cancellationToken = default);
    Task<List<TrainingEntry>> AddTrainingEntryAsync(Guid tenantId, AddTrainingRequest request, CancellationToken cancellationToken = default);
}

public interface IManagementService
{
    Task<List<ManagedCompanyResponse>> GetCompaniesAsync(string? search = null, int page = 1, int pageSize = 20, CancellationToken cancellationToken = default);
    Task<ManagedCompanyResponse?> GetCompanyByIdAsync(Guid companyId, CancellationToken cancellationToken = default);
    Task<ManagedCompanyResponse> CreateCompanyAsync(CompanyUpsertRequest request, CancellationToken cancellationToken = default);
    Task<ManagedCompanyResponse?> UpdateCompanyAsync(Guid companyId, CompanyUpsertRequest request, CancellationToken cancellationToken = default);
    Task<bool> DeleteCompanyAsync(Guid companyId, CancellationToken cancellationToken = default);
    Task<List<ManagedUserResponse>> GetUsersAsync(Guid currentTenantId, string? currentRole, Guid? requestedTenantId, string? search, string? role, int page, int pageSize, CancellationToken cancellationToken = default);
    Task<ManagedUserResponse?> GetUserByIdAsync(Guid currentTenantId, string? currentRole, Guid userId, CancellationToken cancellationToken = default);
    Task<ManagedUserResponse> CreateUserAsync(Guid currentTenantId, string? currentRole, UserCreateRequest request, CancellationToken cancellationToken = default);
    Task<ManagedUserResponse?> UpdateUserAsync(Guid currentTenantId, string? currentRole, Guid userId, UserUpdateRequest request, CancellationToken cancellationToken = default);
    Task<bool> DeleteUserAsync(Guid currentTenantId, Guid currentUserId, string? currentRole, Guid userId, CancellationToken cancellationToken = default);
}

public interface IAdminService
{
    Task<List<TenantResponse>> GetTenantsAsync(CancellationToken cancellationToken = default);
}




