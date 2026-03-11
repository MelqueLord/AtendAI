using backend.Application.Interfaces;
using backend.Contracts;
using backend.Models;

namespace backend.Services;

public sealed class CrmService(IDataStore store) : ICrmService
{
    public Task<List<ContactResponse>> GetContactsAsync(Guid tenantId, string? search = null, string? state = null, string? status = null, string? tag = null, int page = 1, int pageSize = 50, CancellationToken cancellationToken = default)
    {
        return store.GetContactsAsync(tenantId, search, state, status, tag, page, pageSize, cancellationToken);
    }

    public Task<ContactResponse> CreateContactAsync(Guid tenantId, ContactUpsertRequest request, CancellationToken cancellationToken = default)
    {
        return store.CreateContactAsync(tenantId, request, cancellationToken);
    }

    public Task<ContactResponse?> UpdateContactAsync(Guid tenantId, Guid contactId, ContactUpsertRequest request, CancellationToken cancellationToken = default)
    {
        return store.UpdateContactAsync(tenantId, contactId, request, cancellationToken);
    }

    public Task<bool> DeleteContactAsync(Guid tenantId, Guid contactId, CancellationToken cancellationToken = default)
    {
        return store.DeleteContactAsync(tenantId, contactId, cancellationToken);
    }

    public async Task<List<ContactResponse>> ImportContactsAsync(Guid tenantId, ContactImportRequest request, CancellationToken cancellationToken = default)
    {
        var imported = new List<ContactResponse>();

        foreach (var line in request.Contacts)
        {
            if (string.IsNullOrWhiteSpace(line.Name) || string.IsNullOrWhiteSpace(line.Phone))
            {
                continue;
            }

            var existing = await store.FindContactByPhoneAsync(tenantId, line.Phone, cancellationToken);
            var payload = new ContactUpsertRequest(
                line.Name,
                line.Phone,
                line.State,
                string.IsNullOrWhiteSpace(line.Status) ? "Importado" : line.Status,
                line.Tags,
                line.OwnerUserId);

            if (existing is null)
            {
                imported.Add(await store.CreateContactAsync(tenantId, payload, cancellationToken));
            }
            else
            {
                var updated = await store.UpdateContactAsync(tenantId, existing.Id, payload, cancellationToken);
                if (updated is not null)
                {
                    imported.Add(updated);
                }
            }
        }

        return imported;
    }

    public async Task EnsureContactExistsAsync(Guid tenantId, string customerPhone, string? customerName, CancellationToken cancellationToken = default)
    {
        var existing = await store.FindContactByPhoneAsync(tenantId, customerPhone, cancellationToken);
        if (existing is not null)
        {
            return;
        }

        var name = string.IsNullOrWhiteSpace(customerName) ? "Cliente" : customerName.Trim();
        await store.CreateContactAsync(tenantId, new ContactUpsertRequest(name, customerPhone, null, "Novo lead", ["WhatsApp"], null), cancellationToken);
    }

    public Task<List<AutomationOptionResponse>> GetAutomationOptionsAsync(Guid tenantId, CancellationToken cancellationToken = default)
    {
        return store.GetAutomationOptionsAsync(tenantId, cancellationToken);
    }

    public Task<AutomationOptionResponse> CreateAutomationOptionAsync(Guid tenantId, AutomationOptionUpsertRequest request, CancellationToken cancellationToken = default)
    {
        return store.CreateAutomationOptionAsync(tenantId, request, cancellationToken);
    }

    public Task<AutomationOptionResponse?> UpdateAutomationOptionAsync(Guid tenantId, Guid optionId, AutomationOptionUpsertRequest request, CancellationToken cancellationToken = default)
    {
        return store.UpdateAutomationOptionAsync(tenantId, optionId, request, cancellationToken);
    }

    public Task<bool> DeleteAutomationOptionAsync(Guid tenantId, Guid optionId, CancellationToken cancellationToken = default)
    {
        return store.DeleteAutomationOptionAsync(tenantId, optionId, cancellationToken);
    }

    public Task<ScheduledBroadcastResponse> ScheduleBroadcastAsync(Guid tenantId, Guid userId, ScheduleBroadcastRequest request, CancellationToken cancellationToken = default)
    {
        return store.CreateScheduledBroadcastAsync(tenantId, userId, request, cancellationToken);
    }

    public Task<List<ScheduledBroadcastResponse>> GetBroadcastsAsync(Guid tenantId, CancellationToken cancellationToken = default)
    {
        return store.GetScheduledBroadcastsAsync(tenantId, cancellationToken);
    }

    public Task<CustomerFeedbackResponse> SaveFeedbackAsync(Guid tenantId, Guid conversationId, SubmitCustomerFeedbackRequest request, CancellationToken cancellationToken = default)
    {
        return store.UpsertCustomerFeedbackAsync(tenantId, conversationId, request.Rating, request.Comment, cancellationToken);
    }

    public Task<List<CustomerFeedbackResponse>> GetFeedbackAsync(Guid tenantId, int limit = 100, CancellationToken cancellationToken = default)
    {
        return store.GetCustomerFeedbackAsync(tenantId, limit, cancellationToken);
    }

    public async Task<QueueHealthResponse> GetQueueHealthAsync(Guid tenantId, CancellationToken cancellationToken = default)
    {
        var conversations = await store.GetConversationsWithMessagesAsync(tenantId, cancellationToken);
        var feedback = await store.GetCustomerFeedbackAsync(tenantId, 200, cancellationToken);
        var now = DateTimeOffset.UtcNow;

        var unattended = conversations
            .Where(conversation => conversation.Status != ConversationStatus.Closed && !conversation.Messages.Any(message => string.Equals(message.Sender, "HumanAgent", StringComparison.OrdinalIgnoreCase)))
            .OrderByDescending(conversation => conversation.UpdatedAt)
            .Select(conversation => new QueueAttentionItemResponse(
                conversation.Id,
                conversation.CustomerName,
                conversation.CustomerPhone,
                conversation.Status.ToString(),
                conversation.CreatedAt,
                conversation.UpdatedAt,
                Math.Round((now - conversation.CreatedAt).TotalMinutes, 1),
                null))
            .ToList();

        var responseTimes = conversations
            .Select(conversation =>
            {
                var firstHuman = conversation.Messages
                    .Where(message => string.Equals(message.Sender, "HumanAgent", StringComparison.OrdinalIgnoreCase))
                    .OrderBy(message => message.CreatedAt)
                    .FirstOrDefault();

                if (firstHuman is null)
                {
                    return (double?)null;
                }

                return Math.Round((firstHuman.CreatedAt - conversation.CreatedAt).TotalMinutes, 1);
            })
            .Where(value => value.HasValue)
            .Select(value => value!.Value)
            .ToList();

        var averageFirstHumanReply = responseTimes.Count == 0 ? 0 : Math.Round(responseTimes.Average(), 1);
        var averageCustomerRating = feedback.Count == 0 ? 0 : Math.Round(feedback.Average(item => item.Rating), 1);

        return new QueueHealthResponse(
            unattended.Count,
            averageFirstHumanReply,
            averageCustomerRating,
            feedback.Count,
            unattended);
    }
}
