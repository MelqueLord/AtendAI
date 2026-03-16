using Atendai.Application.DTOs;

namespace Atendai.Application.Interfaces;

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
