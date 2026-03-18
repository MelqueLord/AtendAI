using Atendai.Application.DTOs;
using Atendai.Application.Interfaces.Repositories;
using Atendai.Domain.Entities;

namespace Atendai.Infrastructure.Repositories;

public sealed class SupabaseAuthRepository(SupabaseDataStore store) : IAuthRepository
{
    public Task<User?> FindUserByEmailAsync(string email, CancellationToken cancellationToken = default) => store.FindUserByEmailAsync(email, cancellationToken);
    public Task<User?> FindUserByIdAsync(Guid userId, CancellationToken cancellationToken = default) => store.FindUserByIdAsync(userId, cancellationToken);
    public Task CreateRefreshSessionAsync(Guid userId, Guid tenantId, string refreshTokenHash, DateTimeOffset expiresAt, CancellationToken cancellationToken = default) => store.CreateRefreshSessionAsync(userId, tenantId, refreshTokenHash, expiresAt, cancellationToken);
    public Task<RefreshTokenSession?> GetRefreshSessionAsync(string refreshTokenHash, CancellationToken cancellationToken = default) => store.GetRefreshSessionAsync(refreshTokenHash, cancellationToken);
    public Task RevokeRefreshSessionAsync(string refreshTokenHash, CancellationToken cancellationToken = default) => store.RevokeRefreshSessionAsync(refreshTokenHash, cancellationToken);
}

public sealed class SupabaseTenantRepository(SupabaseDataStore store) : ITenantRepository
{
    public async Task<List<Tenant>> GetTenantsAsync(CancellationToken cancellationToken = default) =>
        (await store.GetTenantsAsync(cancellationToken)).Select(MapTenant).OfType<Tenant>().ToList();

    public async Task<Tenant?> GetTenantByIdAsync(Guid tenantId, CancellationToken cancellationToken = default) =>
        MapTenant(await store.GetTenantByIdAsync(tenantId, cancellationToken));

    private static Tenant? MapTenant(TenantResponse? tenant) =>
        tenant is null ? null : new Tenant(tenant.Id, tenant.Name, tenant.Segment);
}

public sealed class SupabaseBillingRepository(SupabaseDataStore store) : IBillingRepository
{
    public async Task<List<BillingPlan>> GetBillingPlansAsync(CancellationToken cancellationToken = default) =>
        (await store.GetBillingPlansAsync(cancellationToken)).Select(MapPlan).ToList();

    public async Task<BillingSubscription> GetTenantSubscriptionAsync(Guid tenantId, CancellationToken cancellationToken = default) =>
        MapSubscription(await store.GetTenantSubscriptionAsync(tenantId, cancellationToken));

    public async Task<BillingSubscription> UpsertTenantSubscriptionAsync(Guid tenantId, string planCode, CancellationToken cancellationToken = default) =>
        MapSubscription(await store.UpsertTenantSubscriptionAsync(tenantId, planCode, cancellationToken));

    private static BillingPlan MapPlan(BillingPlanResponse plan) =>
        new(plan.Code, plan.Name, plan.MonthlyPrice, plan.Currency, plan.IncludedMessages, plan.IncludedAgents, plan.IncludedWhatsAppNumbers, plan.IsPopular);

    private static BillingSubscription MapSubscription(BillingSubscriptionResponse subscription) =>
        new(subscription.TenantId, subscription.PlanCode, subscription.PlanName, subscription.Status, subscription.TrialEndsAt, subscription.CurrentPeriodEnd, subscription.CreatedAt, subscription.UpdatedAt);
}

public sealed class SupabaseCompanyRepository(SupabaseDataStore store) : ICompanyRepository
{
    public async Task<List<ManagedCompany>> GetCompaniesAsync(string? search = null, int page = 1, int pageSize = 20, CancellationToken cancellationToken = default) =>
        (await store.GetCompaniesAsync(search, page, pageSize, cancellationToken)).Select(MapCompany).OfType<ManagedCompany>().ToList();

    public async Task<ManagedCompany?> GetCompanyByIdAsync(Guid companyId, CancellationToken cancellationToken = default) =>
        MapCompany(await store.GetCompanyByIdAsync(companyId, cancellationToken));

    public async Task<ManagedCompany> CreateCompanyAsync(string name, string segment, CancellationToken cancellationToken = default) =>
        MapCompany(await store.CreateCompanyAsync(new CompanyUpsertRequest(name, segment), cancellationToken))!;

    public async Task<ManagedCompany?> UpdateCompanyAsync(Guid companyId, string name, string segment, CancellationToken cancellationToken = default) =>
        MapCompany(await store.UpdateCompanyAsync(companyId, new CompanyUpsertRequest(name, segment), cancellationToken));

    public Task<bool> DeleteCompanyAsync(Guid companyId, CancellationToken cancellationToken = default) => store.DeleteCompanyAsync(companyId, cancellationToken);

    private static ManagedCompany? MapCompany(ManagedCompanyResponse? company) =>
        company is null ? null : new ManagedCompany(company.Id, company.Name, company.Segment, company.CreatedAt);
}

public sealed class SupabaseUserRepository(SupabaseDataStore store) : IUserRepository
{
    public async Task<List<ManagedUser>> GetManagedUsersAsync(Guid? tenantId = null, string? search = null, string? role = null, int page = 1, int pageSize = 20, CancellationToken cancellationToken = default) =>
        (await store.GetManagedUsersAsync(tenantId, search, role, page, pageSize, cancellationToken)).Select(MapUser).OfType<ManagedUser>().ToList();

    public async Task<ManagedUser?> GetManagedUserByIdAsync(Guid userId, CancellationToken cancellationToken = default) =>
        MapUser(await store.GetManagedUserByIdAsync(userId, cancellationToken));

    public async Task<ManagedUser> CreateManagedUserAsync(Guid tenantId, string name, string email, string password, string role, CancellationToken cancellationToken = default) =>
        MapUser(await store.CreateManagedUserAsync(new UserCreateRequest(tenantId, name, email, password, role), cancellationToken))!;

    public async Task<ManagedUser?> UpdateManagedUserAsync(Guid userId, string name, string email, string role, string? password, CancellationToken cancellationToken = default) =>
        MapUser(await store.UpdateManagedUserAsync(userId, new UserUpdateRequest(name, email, role, password), cancellationToken));

    public Task<bool> DeleteManagedUserAsync(Guid userId, CancellationToken cancellationToken = default) => store.DeleteManagedUserAsync(userId, cancellationToken);

    private static ManagedUser? MapUser(ManagedUserResponse? user) =>
        user is null ? null : new ManagedUser(user.Id, user.TenantId, user.TenantName, user.Name, user.Email, user.Role, user.CreatedAt);
}

public sealed class SupabaseSettingsRepository(SupabaseDataStore store) : ISettingsRepository
{
    public Task<BusinessSettings> GetSettingsAsync(Guid tenantId, CancellationToken cancellationToken = default) => store.GetSettingsAsync(tenantId, cancellationToken);
    public Task UpdateSettingsAsync(Guid tenantId, string businessName, string welcomeMessage, string humanFallbackMessage, CancellationToken cancellationToken = default) => store.UpdateSettingsAsync(tenantId, new UpdateSettingsRequest(businessName, welcomeMessage, humanFallbackMessage), cancellationToken);
    public Task<List<TrainingEntry>> GetTrainingEntriesAsync(Guid tenantId, CancellationToken cancellationToken = default) => store.GetTrainingEntriesAsync(tenantId, cancellationToken);
    public Task AddTrainingEntryAsync(Guid tenantId, string keyword, string answerTemplate, CancellationToken cancellationToken = default) => store.AddTrainingEntryAsync(tenantId, new AddTrainingRequest(keyword, answerTemplate), cancellationToken);
}

public sealed class SupabaseAutomationRepository(SupabaseDataStore store) : IAutomationRepository
{
    public async Task<List<AutomationOption>> GetAutomationOptionsAsync(Guid tenantId, CancellationToken cancellationToken = default) =>
        (await store.GetAutomationOptionsAsync(tenantId, cancellationToken)).Select(MapAutomation).OfType<AutomationOption>().ToList();

    public async Task<AutomationOption> CreateAutomationOptionAsync(Guid tenantId, string name, string triggerKeywords, string responseTemplate, bool escalateToHuman, int sortOrder, bool isActive, CancellationToken cancellationToken = default) =>
        MapAutomation(await store.CreateAutomationOptionAsync(tenantId, new AutomationOptionUpsertRequest(name, triggerKeywords, responseTemplate, escalateToHuman, sortOrder, isActive), cancellationToken))!;

    public async Task<AutomationOption?> UpdateAutomationOptionAsync(Guid tenantId, Guid optionId, string name, string triggerKeywords, string responseTemplate, bool escalateToHuman, int sortOrder, bool isActive, CancellationToken cancellationToken = default) =>
        MapAutomation(await store.UpdateAutomationOptionAsync(tenantId, optionId, new AutomationOptionUpsertRequest(name, triggerKeywords, responseTemplate, escalateToHuman, sortOrder, isActive), cancellationToken));

    public Task<bool> DeleteAutomationOptionAsync(Guid tenantId, Guid optionId, CancellationToken cancellationToken = default) => store.DeleteAutomationOptionAsync(tenantId, optionId, cancellationToken);

    private static AutomationOption? MapAutomation(AutomationOptionResponse? option) =>
        option is null ? null : new AutomationOption(option.Id, option.TenantId, option.Name, option.TriggerKeywords, option.ResponseTemplate, option.EscalateToHuman, option.SortOrder, option.IsActive, option.CreatedAt, option.UpdatedAt);
}

public sealed class SupabaseConversationRepository(SupabaseDataStore store) : IConversationRepository
{
    public Task<Conversation> GetOrCreateConversationAsync(
        Guid tenantId,
        string customerPhone,
        string? customerName,
        Guid? channelId = null,
        string? qrSessionKey = null,
        string? qrSessionName = null,
        string? qrSessionPhone = null,
        CancellationToken cancellationToken = default) =>
        store.GetOrCreateConversationAsync(tenantId, customerPhone, customerName, channelId, qrSessionKey, qrSessionName, qrSessionPhone, cancellationToken);
    public Task UpdateConversationCustomerNameAsync(Guid tenantId, Guid conversationId, string customerName, CancellationToken cancellationToken = default) => store.UpdateConversationCustomerNameAsync(tenantId, conversationId, customerName, cancellationToken);
    public Task AddConversationMessageAsync(Guid tenantId, Guid conversationId, string sender, string text, CancellationToken cancellationToken = default) => store.AddConversationMessageAsync(tenantId, conversationId, sender, text, cancellationToken);
    public Task UpdateConversationStatusAsync(Guid tenantId, Guid conversationId, ConversationStatus status, CancellationToken cancellationToken = default) => store.UpdateConversationStatusAsync(tenantId, conversationId, status, cancellationToken);
    public Task<List<Conversation>> GetConversationSummariesAsync(Guid tenantId, CancellationToken cancellationToken = default) => store.GetConversationSummariesAsync(tenantId, cancellationToken);
    public Task<List<Conversation>> GetConversationsWithMessagesAsync(Guid tenantId, CancellationToken cancellationToken = default) => store.GetConversationsWithMessagesAsync(tenantId, cancellationToken);
    public Task<Conversation?> GetConversationByIdAsync(Guid tenantId, Guid conversationId, CancellationToken cancellationToken = default) => store.GetConversationByIdAsync(tenantId, conversationId, cancellationToken);
    public Task<string?> GetConversationTransportAsync(Guid tenantId, Guid conversationId, CancellationToken cancellationToken = default) => store.GetConversationTransportAsync(tenantId, conversationId, cancellationToken);
    public Task<int> ClearQrConversationHistoryAsync(Guid tenantId, string? qrSessionKey = null, CancellationToken cancellationToken = default) => store.ClearQrConversationHistoryAsync(tenantId, qrSessionKey, cancellationToken);
}

public sealed class SupabaseContactRepository(SupabaseDataStore store) : IContactRepository
{
    public async Task<List<Contact>> GetContactsAsync(Guid tenantId, string? search = null, string? state = null, string? status = null, string? tag = null, int page = 1, int pageSize = 50, CancellationToken cancellationToken = default) =>
        (await store.GetContactsAsync(tenantId, search, state, status, tag, page, pageSize, cancellationToken)).Select(MapContact).OfType<Contact>().ToList();

    public async Task<Contact?> FindContactByPhoneAsync(Guid tenantId, string phone, CancellationToken cancellationToken = default) =>
        MapContact(await store.FindContactByPhoneAsync(tenantId, phone, cancellationToken));

    public async Task<Contact> CreateContactAsync(Guid tenantId, string name, string phone, string? state, string? status, string[] tags, Guid? ownerUserId, CancellationToken cancellationToken = default) =>
        MapContact(await store.CreateContactAsync(tenantId, new ContactUpsertRequest(name, phone, state, status, tags, ownerUserId), cancellationToken))!;

    public async Task<Contact?> UpdateContactAsync(Guid tenantId, Guid contactId, string name, string phone, string? state, string? status, string[] tags, Guid? ownerUserId, CancellationToken cancellationToken = default) =>
        MapContact(await store.UpdateContactAsync(tenantId, contactId, new ContactUpsertRequest(name, phone, state, status, tags, ownerUserId), cancellationToken));

    public Task<bool> DeleteContactAsync(Guid tenantId, Guid contactId, CancellationToken cancellationToken = default) => store.DeleteContactAsync(tenantId, contactId, cancellationToken);

    private static Contact? MapContact(ContactResponse? contact) =>
        contact is null ? null : new Contact(contact.Id, contact.Name, contact.Phone, contact.State, contact.Status, contact.Tags, contact.OwnerName, contact.CreatedAt);
}

public sealed class SupabaseWhatsAppRepository(SupabaseDataStore store) : IWhatsAppRepository
{
    public async Task<WhatsAppConnection?> GetWhatsAppConnectionAsync(Guid tenantId, CancellationToken cancellationToken = default) =>
        MapConnection(await store.GetWhatsAppConnectionAsync(tenantId, cancellationToken));

    public async Task<List<WhatsAppChannel>> GetWhatsAppChannelsAsync(Guid tenantId, CancellationToken cancellationToken = default) =>
        (await store.GetWhatsAppChannelsAsync(tenantId, cancellationToken)).Select(MapChannel).OfType<WhatsAppChannel>().ToList();

    public async Task<WhatsAppChannel?> GetWhatsAppChannelByIdAsync(Guid tenantId, Guid channelId, CancellationToken cancellationToken = default) =>
        MapChannel(await store.GetWhatsAppChannelByIdAsync(tenantId, channelId, cancellationToken));

    public async Task<WhatsAppChannel?> GetWhatsAppChannelByPhoneNumberIdAsync(Guid tenantId, string phoneNumberId, CancellationToken cancellationToken = default) =>
        MapChannel(await store.GetWhatsAppChannelByPhoneNumberIdAsync(tenantId, phoneNumberId, cancellationToken));

    public Task<int> GetWhatsAppChannelsCountAsync(Guid tenantId, CancellationToken cancellationToken = default) => store.GetWhatsAppChannelsCountAsync(tenantId, cancellationToken);
    public Task<string?> GetWhatsAppEncryptedTokenAsync(Guid tenantId, CancellationToken cancellationToken = default, Guid? channelId = null) => store.GetWhatsAppEncryptedTokenAsync(tenantId, cancellationToken, channelId);

    public async Task<WhatsAppConnection> UpsertWhatsAppConnectionAsync(Guid tenantId, string? wabaId, string phoneNumberId, string verifyToken, string? encryptedAccessToken, bool isActive, CancellationToken cancellationToken = default) =>
        MapConnection(await store.UpsertWhatsAppConnectionAsync(tenantId, wabaId, phoneNumberId, verifyToken, encryptedAccessToken, isActive, cancellationToken))!;

    public async Task<WhatsAppChannel> CreateWhatsAppChannelAsync(Guid tenantId, string displayName, string? wabaId, string phoneNumberId, string verifyToken, string? encryptedAccessToken, bool isActive, bool isPrimary, CancellationToken cancellationToken = default) =>
        MapChannel(await store.CreateWhatsAppChannelAsync(tenantId, displayName, wabaId, phoneNumberId, verifyToken, encryptedAccessToken, isActive, isPrimary, cancellationToken))!;

    public async Task<WhatsAppChannel?> UpdateWhatsAppChannelAsync(Guid tenantId, Guid channelId, string displayName, string? wabaId, string phoneNumberId, string verifyToken, string? encryptedAccessToken, bool isActive, bool isPrimary, CancellationToken cancellationToken = default) =>
        MapChannel(await store.UpdateWhatsAppChannelAsync(tenantId, channelId, displayName, wabaId, phoneNumberId, verifyToken, encryptedAccessToken, isActive, isPrimary, cancellationToken));

    public Task<bool> DeleteWhatsAppChannelAsync(Guid tenantId, Guid channelId, CancellationToken cancellationToken = default) => store.DeleteWhatsAppChannelAsync(tenantId, channelId, cancellationToken);
    public Task<Guid?> FindTenantIdByPhoneNumberIdAsync(string phoneNumberId, CancellationToken cancellationToken = default) => store.FindTenantIdByPhoneNumberIdAsync(phoneNumberId, cancellationToken);
    public Task<Guid?> FindTenantIdByVerifyTokenAsync(string verifyToken, CancellationToken cancellationToken = default) => store.FindTenantIdByVerifyTokenAsync(verifyToken, cancellationToken);
    public Task MarkWhatsAppConnectionTestResultAsync(Guid tenantId, bool success, string status, string? error, CancellationToken cancellationToken = default, Guid? channelId = null) => store.MarkWhatsAppConnectionTestResultAsync(tenantId, success, status, error, cancellationToken, channelId);
    public Task AddWhatsAppMessageLogAsync(Guid tenantId, Guid? conversationId, string toPhone, string direction, string status, string? errorDetail, string? payload, string? providerMessageId = null, CancellationToken cancellationToken = default) => store.AddWhatsAppMessageLogAsync(tenantId, conversationId, toPhone, direction, status, errorDetail, payload, providerMessageId, cancellationToken);
    public Task<Guid?> UpdateWhatsAppMessageDeliveryStatusAsync(Guid tenantId, string providerMessageId, string status, string? errorDetail, CancellationToken cancellationToken = default) => store.UpdateWhatsAppMessageDeliveryStatusAsync(tenantId, providerMessageId, status, errorDetail, cancellationToken);

    public async Task<List<WhatsAppMessageLog>> GetWhatsAppMessageLogsAsync(Guid tenantId, int limit = 100, CancellationToken cancellationToken = default) =>
        (await store.GetWhatsAppMessageLogsAsync(tenantId, limit, cancellationToken)).Select(MapLog).ToList();

    private static WhatsAppConnection? MapConnection(WhatsAppConnectionResponse? connection) =>
        connection is null ? null : new WhatsAppConnection(connection.TenantId, connection.WabaId, connection.PhoneNumberId, connection.VerifyToken, connection.IsActive, connection.LastTestedAt, connection.LastStatus, connection.LastError, connection.UpdatedAt);

    private static WhatsAppChannel? MapChannel(WhatsAppChannelResponse? channel) =>
        channel is null ? null : new WhatsAppChannel(channel.Id, channel.TenantId, channel.DisplayName, channel.WabaId, channel.PhoneNumberId, channel.VerifyToken, channel.IsActive, channel.IsPrimary, channel.LastTestedAt, channel.LastStatus, channel.LastError, channel.UpdatedAt);

    private static WhatsAppMessageLog MapLog(WhatsAppMessageLogResponse log) =>
        new(log.Id, log.TenantId, log.ConversationId, log.ToPhone, log.Direction, log.Status, log.ErrorDetail, log.CreatedAt);
}

public sealed class SupabaseCampaignRepository(SupabaseDataStore store) : ICampaignRepository
{
    public async Task<List<CampaignRule>> GetCampaignRulesAsync(Guid tenantId, CancellationToken cancellationToken = default) =>
        (await store.GetCampaignRulesAsync(tenantId, cancellationToken)).Select(MapRule).OfType<CampaignRule>().ToList();

    public async Task<CampaignRule> CreateCampaignRuleAsync(Guid tenantId, string name, int delayHours, string template, bool isActive, CancellationToken cancellationToken = default) =>
        MapRule((await store.CreateCampaignRuleAsync(tenantId, new CampaignRuleUpsertRequest(name, delayHours, template, isActive), cancellationToken))!);

    public async Task<CampaignRule?> UpdateCampaignRuleAsync(Guid tenantId, Guid ruleId, string name, int delayHours, string template, bool isActive, CancellationToken cancellationToken = default) =>
        MapRuleOrNull(await store.UpdateCampaignRuleAsync(tenantId, ruleId, new CampaignRuleUpsertRequest(name, delayHours, template, isActive), cancellationToken));

    public Task<bool> DeleteCampaignRuleAsync(Guid tenantId, Guid ruleId, CancellationToken cancellationToken = default) => store.DeleteCampaignRuleAsync(tenantId, ruleId, cancellationToken);
    public Task EnqueueCampaignJobsAsync(Guid tenantId, Guid conversationId, string customerPhone, string customerName, DateTimeOffset baseTimeUtc, CancellationToken cancellationToken = default) => store.EnqueueCampaignJobsAsync(tenantId, conversationId, customerPhone, customerName, baseTimeUtc, cancellationToken);
    public Task<List<ScheduledCampaignJob>> GetDueCampaignJobsAsync(DateTimeOffset nowUtc, int limit, CancellationToken cancellationToken = default) => store.GetDueCampaignJobsAsync(nowUtc, limit, cancellationToken);
    public Task MarkCampaignJobSentAsync(Guid jobId, CancellationToken cancellationToken = default) => store.MarkCampaignJobSentAsync(jobId, cancellationToken);
    public Task MarkCampaignJobFailedAsync(Guid jobId, string error, CancellationToken cancellationToken = default) => store.MarkCampaignJobFailedAsync(jobId, error, cancellationToken);

    private static CampaignRule MapRule(CampaignRuleResponse rule) =>
        new(rule.Id, rule.TenantId, rule.Name, rule.DelayHours, rule.Template, rule.IsActive, rule.CreatedAt, rule.UpdatedAt);

    private static CampaignRule? MapRuleOrNull(CampaignRuleResponse? rule) =>
        rule is null ? null : MapRule(rule);
}

public sealed class SupabaseBroadcastRepository(SupabaseDataStore store) : IBroadcastRepository
{
    public async Task<ScheduledBroadcast> CreateScheduledBroadcastAsync(Guid tenantId, Guid createdByUserId, string name, string messageTemplate, DateTimeOffset scheduledAt, string? tagFilter, Guid[] contactIds, CancellationToken cancellationToken = default) =>
        MapBroadcast(await store.CreateScheduledBroadcastAsync(tenantId, createdByUserId, new ScheduleBroadcastRequest(name, messageTemplate, scheduledAt, tagFilter, contactIds), cancellationToken));

    public async Task<List<ScheduledBroadcast>> GetScheduledBroadcastsAsync(Guid tenantId, CancellationToken cancellationToken = default) =>
        (await store.GetScheduledBroadcastsAsync(tenantId, cancellationToken)).Select(MapBroadcast).ToList();

    public Task<List<ScheduledBroadcastJob>> GetDueScheduledBroadcastJobsAsync(DateTimeOffset nowUtc, int limit, CancellationToken cancellationToken = default) => store.GetDueScheduledBroadcastJobsAsync(nowUtc, limit, cancellationToken);
    public Task MarkScheduledBroadcastJobSentAsync(Guid jobId, CancellationToken cancellationToken = default) => store.MarkScheduledBroadcastJobSentAsync(jobId, cancellationToken);
    public Task MarkScheduledBroadcastJobFailedAsync(Guid jobId, string error, CancellationToken cancellationToken = default) => store.MarkScheduledBroadcastJobFailedAsync(jobId, error, cancellationToken);

    private static ScheduledBroadcast MapBroadcast(ScheduledBroadcastResponse broadcast) =>
        new(broadcast.Id, broadcast.TenantId, broadcast.Name, broadcast.MessageTemplate, broadcast.ScheduledAt, broadcast.Status, broadcast.TagFilter, broadcast.TargetCount, broadcast.DeliveredCount, broadcast.CreatedAt);
}

public sealed class SupabaseFeedbackRepository(SupabaseDataStore store) : IFeedbackRepository
{
    public async Task<CustomerFeedback> UpsertCustomerFeedbackAsync(Guid tenantId, Guid conversationId, int rating, string? comment, CancellationToken cancellationToken = default) =>
        MapFeedback(await store.UpsertCustomerFeedbackAsync(tenantId, conversationId, rating, comment, cancellationToken));

    public async Task<List<CustomerFeedback>> GetCustomerFeedbackAsync(Guid tenantId, int limit = 100, CancellationToken cancellationToken = default) =>
        (await store.GetCustomerFeedbackAsync(tenantId, limit, cancellationToken)).Select(MapFeedback).ToList();

    private static CustomerFeedback MapFeedback(CustomerFeedbackResponse feedback) =>
        new(feedback.Id, feedback.ConversationId, feedback.CustomerName, feedback.CustomerPhone, feedback.Rating, feedback.Comment, feedback.CreatedAt);
}

public sealed class SupabaseInboxRepository(SupabaseDataStore store) : IInboxRepository
{
    public Task UpdateConversationAssignmentAsync(Guid tenantId, Guid conversationId, Guid? assignedUserId, CancellationToken cancellationToken = default) => store.UpdateConversationAssignmentAsync(tenantId, conversationId, assignedUserId, cancellationToken);
    public Task UpdateConversationStatusAsync(Guid tenantId, Guid conversationId, string status, CancellationToken cancellationToken = default) => store.UpdateConversationStatusAsync(tenantId, conversationId, status, cancellationToken);

    public async Task<List<ConversationNote>> GetConversationNotesAsync(Guid tenantId, Guid conversationId, CancellationToken cancellationToken = default) =>
        (await store.GetConversationNotesAsync(tenantId, conversationId, cancellationToken)).Select(MapNote).ToList();

    public async Task<ConversationNote> AddConversationNoteAsync(Guid tenantId, Guid conversationId, Guid userId, string userName, string note, CancellationToken cancellationToken = default) =>
        MapNote(await store.AddConversationNoteAsync(tenantId, conversationId, userId, userName, note, cancellationToken));

    public async Task<List<QuickReplyTemplate>> GetQuickReplyTemplatesAsync(Guid tenantId, CancellationToken cancellationToken = default) =>
        (await store.GetQuickReplyTemplatesAsync(tenantId, cancellationToken)).Select(MapTemplate).ToList();

    public async Task<QuickReplyTemplate> CreateQuickReplyTemplateAsync(Guid tenantId, string title, string body, CancellationToken cancellationToken = default) =>
        MapTemplate(await store.CreateQuickReplyTemplateAsync(tenantId, new QuickReplyTemplateUpsertRequest(title, body), cancellationToken));

    public async Task<QuickReplyTemplate?> UpdateQuickReplyTemplateAsync(Guid tenantId, Guid templateId, string title, string body, CancellationToken cancellationToken = default)
    {
        var updated = await store.UpdateQuickReplyTemplateAsync(tenantId, templateId, new QuickReplyTemplateUpsertRequest(title, body), cancellationToken);
        return updated is null ? null : MapTemplate(updated);
    }

    public Task<bool> DeleteQuickReplyTemplateAsync(Guid tenantId, Guid templateId, CancellationToken cancellationToken = default) => store.DeleteQuickReplyTemplateAsync(tenantId, templateId, cancellationToken);

    private static ConversationNote MapNote(ConversationNoteResponse note) =>
        new(note.Id, note.ConversationId, note.UserId, note.UserName, note.Note, note.CreatedAt);

    private static QuickReplyTemplate MapTemplate(QuickReplyTemplateResponse template) =>
        new(template.Id, template.TenantId, template.Title, template.Body, template.CreatedAt, template.UpdatedAt);
}
