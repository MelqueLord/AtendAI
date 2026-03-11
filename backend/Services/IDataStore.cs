using backend.Contracts;
using backend.Models;

namespace backend.Application.Interfaces;

public interface IDataStore
{
    Task<User?> FindUserByEmailAsync(string email, CancellationToken cancellationToken = default);
    Task<User?> FindUserByIdAsync(Guid userId, CancellationToken cancellationToken = default);
    Task<List<TenantResponse>> GetTenantsAsync(CancellationToken cancellationToken = default);
    Task<TenantResponse?> GetTenantByIdAsync(Guid tenantId, CancellationToken cancellationToken = default);

    Task CreateRefreshSessionAsync(Guid userId, Guid tenantId, string refreshTokenHash, DateTimeOffset expiresAt, CancellationToken cancellationToken = default);
    Task<RefreshTokenSession?> GetRefreshSessionAsync(string refreshTokenHash, CancellationToken cancellationToken = default);
    Task RevokeRefreshSessionAsync(string refreshTokenHash, CancellationToken cancellationToken = default);

    Task<List<BillingPlanResponse>> GetBillingPlansAsync(CancellationToken cancellationToken = default);
    Task<BillingSubscriptionResponse> GetTenantSubscriptionAsync(Guid tenantId, CancellationToken cancellationToken = default);
    Task<BillingSubscriptionResponse> UpsertTenantSubscriptionAsync(Guid tenantId, string planCode, CancellationToken cancellationToken = default);

    Task<List<ManagedCompanyResponse>> GetCompaniesAsync(string? search = null, int page = 1, int pageSize = 20, CancellationToken cancellationToken = default);
    Task<ManagedCompanyResponse?> GetCompanyByIdAsync(Guid companyId, CancellationToken cancellationToken = default);
    Task<ManagedCompanyResponse> CreateCompanyAsync(CompanyUpsertRequest request, CancellationToken cancellationToken = default);
    Task<ManagedCompanyResponse?> UpdateCompanyAsync(Guid companyId, CompanyUpsertRequest request, CancellationToken cancellationToken = default);
    Task<bool> DeleteCompanyAsync(Guid companyId, CancellationToken cancellationToken = default);

    Task<List<ManagedUserResponse>> GetManagedUsersAsync(Guid? tenantId = null, string? search = null, string? role = null, int page = 1, int pageSize = 20, CancellationToken cancellationToken = default);
    Task<ManagedUserResponse?> GetManagedUserByIdAsync(Guid userId, CancellationToken cancellationToken = default);
    Task<ManagedUserResponse> CreateManagedUserAsync(UserCreateRequest request, CancellationToken cancellationToken = default);
    Task<ManagedUserResponse?> UpdateManagedUserAsync(Guid userId, UserUpdateRequest request, CancellationToken cancellationToken = default);
    Task<bool> DeleteManagedUserAsync(Guid userId, CancellationToken cancellationToken = default);

    Task<BusinessSettings> GetSettingsAsync(Guid tenantId, CancellationToken cancellationToken = default);
    Task UpdateSettingsAsync(Guid tenantId, UpdateSettingsRequest request, CancellationToken cancellationToken = default);
    Task<List<TrainingEntry>> GetTrainingEntriesAsync(Guid tenantId, CancellationToken cancellationToken = default);
    Task AddTrainingEntryAsync(Guid tenantId, AddTrainingRequest request, CancellationToken cancellationToken = default);
    Task<List<AutomationOptionResponse>> GetAutomationOptionsAsync(Guid tenantId, CancellationToken cancellationToken = default);
    Task<AutomationOptionResponse> CreateAutomationOptionAsync(Guid tenantId, AutomationOptionUpsertRequest request, CancellationToken cancellationToken = default);
    Task<AutomationOptionResponse?> UpdateAutomationOptionAsync(Guid tenantId, Guid optionId, AutomationOptionUpsertRequest request, CancellationToken cancellationToken = default);
    Task<bool> DeleteAutomationOptionAsync(Guid tenantId, Guid optionId, CancellationToken cancellationToken = default);

    Task<Conversation> GetOrCreateConversationAsync(Guid tenantId, string customerPhone, string? customerName, Guid? channelId = null, CancellationToken cancellationToken = default);
    Task AddConversationMessageAsync(Guid tenantId, Guid conversationId, string sender, string text, CancellationToken cancellationToken = default);
    Task UpdateConversationStatusAsync(Guid tenantId, Guid conversationId, ConversationStatus status, CancellationToken cancellationToken = default);
    Task<List<Conversation>> GetConversationsWithMessagesAsync(Guid tenantId, CancellationToken cancellationToken = default);
    Task<Conversation?> GetConversationByIdAsync(Guid tenantId, Guid conversationId, CancellationToken cancellationToken = default);

    Task<List<ContactResponse>> GetContactsAsync(Guid tenantId, string? search = null, string? state = null, string? status = null, string? tag = null, int page = 1, int pageSize = 50, CancellationToken cancellationToken = default);
    Task<ContactResponse?> FindContactByPhoneAsync(Guid tenantId, string phone, CancellationToken cancellationToken = default);
    Task<ContactResponse> CreateContactAsync(Guid tenantId, ContactUpsertRequest request, CancellationToken cancellationToken = default);
    Task<ContactResponse?> UpdateContactAsync(Guid tenantId, Guid contactId, ContactUpsertRequest request, CancellationToken cancellationToken = default);
    Task<bool> DeleteContactAsync(Guid tenantId, Guid contactId, CancellationToken cancellationToken = default);

    Task<WhatsAppConnectionResponse?> GetWhatsAppConnectionAsync(Guid tenantId, CancellationToken cancellationToken = default);
    Task<List<WhatsAppChannelResponse>> GetWhatsAppChannelsAsync(Guid tenantId, CancellationToken cancellationToken = default);
    Task<WhatsAppChannelResponse?> GetWhatsAppChannelByIdAsync(Guid tenantId, Guid channelId, CancellationToken cancellationToken = default);
    Task<WhatsAppChannelResponse?> GetWhatsAppChannelByPhoneNumberIdAsync(Guid tenantId, string phoneNumberId, CancellationToken cancellationToken = default);
    Task<int> GetWhatsAppChannelsCountAsync(Guid tenantId, CancellationToken cancellationToken = default);
    Task<string?> GetWhatsAppEncryptedTokenAsync(Guid tenantId, CancellationToken cancellationToken = default, Guid? channelId = null);
    Task<WhatsAppConnectionResponse> UpsertWhatsAppConnectionAsync(Guid tenantId, string? wabaId, string phoneNumberId, string verifyToken, string? encryptedAccessToken, bool isActive, CancellationToken cancellationToken = default);
    Task<WhatsAppChannelResponse> CreateWhatsAppChannelAsync(Guid tenantId, string displayName, string? wabaId, string phoneNumberId, string verifyToken, string? encryptedAccessToken, bool isActive, bool isPrimary, CancellationToken cancellationToken = default);
    Task<WhatsAppChannelResponse?> UpdateWhatsAppChannelAsync(Guid tenantId, Guid channelId, string displayName, string? wabaId, string phoneNumberId, string verifyToken, string? encryptedAccessToken, bool isActive, bool isPrimary, CancellationToken cancellationToken = default);
    Task<bool> DeleteWhatsAppChannelAsync(Guid tenantId, Guid channelId, CancellationToken cancellationToken = default);
    Task<Guid?> FindTenantIdByPhoneNumberIdAsync(string phoneNumberId, CancellationToken cancellationToken = default);
    Task<Guid?> FindTenantIdByVerifyTokenAsync(string verifyToken, CancellationToken cancellationToken = default);
    Task MarkWhatsAppConnectionTestResultAsync(Guid tenantId, bool success, string status, string? error, CancellationToken cancellationToken = default, Guid? channelId = null);

    Task<List<CampaignRuleResponse>> GetCampaignRulesAsync(Guid tenantId, CancellationToken cancellationToken = default);
    Task<CampaignRuleResponse> CreateCampaignRuleAsync(Guid tenantId, CampaignRuleUpsertRequest request, CancellationToken cancellationToken = default);
    Task<CampaignRuleResponse?> UpdateCampaignRuleAsync(Guid tenantId, Guid ruleId, CampaignRuleUpsertRequest request, CancellationToken cancellationToken = default);
    Task<bool> DeleteCampaignRuleAsync(Guid tenantId, Guid ruleId, CancellationToken cancellationToken = default);

    Task EnqueueCampaignJobsAsync(Guid tenantId, Guid conversationId, string customerPhone, string customerName, DateTimeOffset baseTimeUtc, CancellationToken cancellationToken = default);
    Task<List<ScheduledCampaignJob>> GetDueCampaignJobsAsync(DateTimeOffset nowUtc, int limit, CancellationToken cancellationToken = default);
    Task MarkCampaignJobSentAsync(Guid jobId, CancellationToken cancellationToken = default);
    Task MarkCampaignJobFailedAsync(Guid jobId, string error, CancellationToken cancellationToken = default);

    Task<ScheduledBroadcastResponse> CreateScheduledBroadcastAsync(Guid tenantId, Guid createdByUserId, ScheduleBroadcastRequest request, CancellationToken cancellationToken = default);
    Task<List<ScheduledBroadcastResponse>> GetScheduledBroadcastsAsync(Guid tenantId, CancellationToken cancellationToken = default);
    Task<List<ScheduledBroadcastJob>> GetDueScheduledBroadcastJobsAsync(DateTimeOffset nowUtc, int limit, CancellationToken cancellationToken = default);
    Task MarkScheduledBroadcastJobSentAsync(Guid jobId, CancellationToken cancellationToken = default);
    Task MarkScheduledBroadcastJobFailedAsync(Guid jobId, string error, CancellationToken cancellationToken = default);

    Task<CustomerFeedbackResponse> UpsertCustomerFeedbackAsync(Guid tenantId, Guid conversationId, int rating, string? comment, CancellationToken cancellationToken = default);
    Task<List<CustomerFeedbackResponse>> GetCustomerFeedbackAsync(Guid tenantId, int limit = 100, CancellationToken cancellationToken = default);

    Task AddWhatsAppMessageLogAsync(Guid tenantId, Guid? conversationId, string toPhone, string direction, string status, string? errorDetail, string? payload, CancellationToken cancellationToken = default);
    Task<List<WhatsAppMessageLogResponse>> GetWhatsAppMessageLogsAsync(Guid tenantId, int limit = 100, CancellationToken cancellationToken = default);

    Task UpdateConversationAssignmentAsync(Guid tenantId, Guid conversationId, Guid? assignedUserId, CancellationToken cancellationToken = default);
    Task UpdateConversationStatusAsync(Guid tenantId, Guid conversationId, string status, CancellationToken cancellationToken = default);
    Task<List<ConversationNoteResponse>> GetConversationNotesAsync(Guid tenantId, Guid conversationId, CancellationToken cancellationToken = default);
    Task<ConversationNoteResponse> AddConversationNoteAsync(Guid tenantId, Guid conversationId, Guid userId, string userName, string note, CancellationToken cancellationToken = default);
    Task<List<QuickReplyTemplateResponse>> GetQuickReplyTemplatesAsync(Guid tenantId, CancellationToken cancellationToken = default);
    Task<QuickReplyTemplateResponse> CreateQuickReplyTemplateAsync(Guid tenantId, QuickReplyTemplateUpsertRequest request, CancellationToken cancellationToken = default);
    Task<QuickReplyTemplateResponse?> UpdateQuickReplyTemplateAsync(Guid tenantId, Guid templateId, QuickReplyTemplateUpsertRequest request, CancellationToken cancellationToken = default);
    Task<bool> DeleteQuickReplyTemplateAsync(Guid tenantId, Guid templateId, CancellationToken cancellationToken = default);
}




