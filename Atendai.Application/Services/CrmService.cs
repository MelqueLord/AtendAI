using Atendai.Application.DTOs;
using Atendai.Application.Interfaces;
using Atendai.Application.Interfaces.Repositories;
using Atendai.Domain.Entities;

namespace Atendai.Application.Services;

public sealed class CrmService(
    IContactRepository contactRepository,
    IAutomationRepository automationRepository,
    IBroadcastRepository broadcastRepository,
    IFeedbackRepository feedbackRepository,
    IConversationRepository conversationRepository) : ICrmService
{
    public async Task<List<ContactResponse>> GetContactsAsync(Guid tenantId, string? search = null, string? state = null, string? status = null, string? tag = null, int page = 1, int pageSize = 50, CancellationToken cancellationToken = default)
    {
        var contacts = await contactRepository.GetContactsAsync(tenantId, search, state, status, tag, page, pageSize, cancellationToken);
        return contacts.Select(MapContact).ToList();
    }

    public async Task<ContactResponse> CreateContactAsync(Guid tenantId, ContactUpsertRequest request, CancellationToken cancellationToken = default)
    {
        var created = await contactRepository.CreateContactAsync(tenantId, request.Name, request.Phone, request.State, request.Status, request.Tags, request.OwnerUserId, cancellationToken);
        return MapContact(created);
    }

    public async Task<ContactResponse?> UpdateContactAsync(Guid tenantId, Guid contactId, ContactUpsertRequest request, CancellationToken cancellationToken = default)
    {
        var updated = await contactRepository.UpdateContactAsync(tenantId, contactId, request.Name, request.Phone, request.State, request.Status, request.Tags, request.OwnerUserId, cancellationToken);
        return updated is null ? null : MapContact(updated);
    }

    public Task<bool> DeleteContactAsync(Guid tenantId, Guid contactId, CancellationToken cancellationToken = default)
    {
        return contactRepository.DeleteContactAsync(tenantId, contactId, cancellationToken);
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

            var existing = await contactRepository.FindContactByPhoneAsync(tenantId, line.Phone, cancellationToken);
            if (existing is null)
            {
                var created = await contactRepository.CreateContactAsync(
                    tenantId,
                    line.Name,
                    line.Phone,
                    line.State,
                    string.IsNullOrWhiteSpace(line.Status) ? "Importado" : line.Status,
                    line.Tags,
                    line.OwnerUserId,
                    cancellationToken);
                imported.Add(MapContact(created));
            }
            else
            {
                var updated = await contactRepository.UpdateContactAsync(
                    tenantId,
                    existing.Id,
                    line.Name,
                    line.Phone,
                    line.State,
                    string.IsNullOrWhiteSpace(line.Status) ? "Importado" : line.Status,
                    line.Tags,
                    line.OwnerUserId,
                    cancellationToken);
                if (updated is not null)
                {
                    imported.Add(MapContact(updated));
                }
            }
        }

        return imported;
    }

    public async Task EnsureContactExistsAsync(Guid tenantId, string customerPhone, string? customerName, CancellationToken cancellationToken = default)
    {
        var existing = await contactRepository.FindContactByPhoneAsync(tenantId, customerPhone, cancellationToken);
        if (existing is not null)
        {
            return;
        }

        var name = CustomerIdentityResolver.ResolveDisplayName(customerPhone, customerName);
        try
        {
            await contactRepository.CreateContactAsync(tenantId, name, customerPhone, null, "Novo lead", ["WhatsApp"], null, cancellationToken);
        }
        catch (InvalidOperationException ex) when (ex.Message.Contains("duplicate key", StringComparison.OrdinalIgnoreCase))
        {
            // Another flow already created the contact, or a soft-deleted record still owns the unique key.
            var recovered = await contactRepository.FindContactByPhoneAsync(tenantId, customerPhone, cancellationToken);
            if (recovered is not null)
            {
                return;
            }

            throw;
        }
    }

    public async Task<List<AutomationOptionResponse>> GetAutomationOptionsAsync(Guid tenantId, CancellationToken cancellationToken = default)
    {
        var options = await automationRepository.GetAutomationOptionsAsync(tenantId, cancellationToken);
        return options.Select(MapAutomation).ToList();
    }

    public async Task<AutomationOptionResponse> CreateAutomationOptionAsync(Guid tenantId, AutomationOptionUpsertRequest request, CancellationToken cancellationToken = default)
    {
        var created = await automationRepository.CreateAutomationOptionAsync(tenantId, request.Name, request.TriggerKeywords, request.ResponseTemplate, request.EscalateToHuman, request.SortOrder, request.IsActive, cancellationToken);
        return MapAutomation(created);
    }

    public async Task<AutomationOptionResponse?> UpdateAutomationOptionAsync(Guid tenantId, Guid optionId, AutomationOptionUpsertRequest request, CancellationToken cancellationToken = default)
    {
        var updated = await automationRepository.UpdateAutomationOptionAsync(tenantId, optionId, request.Name, request.TriggerKeywords, request.ResponseTemplate, request.EscalateToHuman, request.SortOrder, request.IsActive, cancellationToken);
        return updated is null ? null : MapAutomation(updated);
    }

    public Task<bool> DeleteAutomationOptionAsync(Guid tenantId, Guid optionId, CancellationToken cancellationToken = default)
    {
        return automationRepository.DeleteAutomationOptionAsync(tenantId, optionId, cancellationToken);
    }

    public async Task<ScheduledBroadcastResponse> ScheduleBroadcastAsync(Guid tenantId, Guid userId, ScheduleBroadcastRequest request, CancellationToken cancellationToken = default)
    {
        var created = await broadcastRepository.CreateScheduledBroadcastAsync(tenantId, userId, request.Name, request.MessageTemplate, request.ScheduledAt, request.TagFilter, request.ContactIds, cancellationToken);
        return MapBroadcast(created);
    }

    public async Task<List<ScheduledBroadcastResponse>> GetBroadcastsAsync(Guid tenantId, CancellationToken cancellationToken = default)
    {
        var broadcasts = await broadcastRepository.GetScheduledBroadcastsAsync(tenantId, cancellationToken);
        return broadcasts.Select(MapBroadcast).ToList();
    }

    public async Task<CustomerFeedbackResponse> SaveFeedbackAsync(Guid tenantId, Guid conversationId, SubmitCustomerFeedbackRequest request, CancellationToken cancellationToken = default)
    {
        var feedback = await feedbackRepository.UpsertCustomerFeedbackAsync(tenantId, conversationId, request.Rating, request.Comment, cancellationToken);
        return MapFeedback(feedback);
    }

    public async Task<List<CustomerFeedbackResponse>> GetFeedbackAsync(Guid tenantId, int limit = 100, CancellationToken cancellationToken = default)
    {
        var feedback = await feedbackRepository.GetCustomerFeedbackAsync(tenantId, limit, cancellationToken);
        return feedback.Select(MapFeedback).ToList();
    }

    public async Task<QueueHealthResponse> GetQueueHealthAsync(Guid tenantId, CancellationToken cancellationToken = default)
    {
        var conversations = await conversationRepository.GetConversationsWithMessagesAsync(tenantId, cancellationToken);
        var feedback = await feedbackRepository.GetCustomerFeedbackAsync(tenantId, 200, cancellationToken);
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

    private static ContactResponse MapContact(Contact contact)
    {
        return new ContactResponse(contact.Id, contact.Name, contact.Phone, contact.State, contact.Status, contact.Tags, contact.OwnerName, contact.CreatedAt);
    }

    private static AutomationOptionResponse MapAutomation(AutomationOption option)
    {
        return new AutomationOptionResponse(option.Id, option.TenantId, option.Name, option.TriggerKeywords, option.ResponseTemplate, option.EscalateToHuman, option.SortOrder, option.IsActive, option.CreatedAt, option.UpdatedAt);
    }

    private static ScheduledBroadcastResponse MapBroadcast(ScheduledBroadcast broadcast)
    {
        return new ScheduledBroadcastResponse(broadcast.Id, broadcast.TenantId, broadcast.Name, broadcast.MessageTemplate, broadcast.ScheduledAt, broadcast.Status, broadcast.TagFilter, broadcast.TargetCount, broadcast.DeliveredCount, broadcast.CreatedAt);
    }

    private static CustomerFeedbackResponse MapFeedback(CustomerFeedback feedback)
    {
        return new CustomerFeedbackResponse(feedback.Id, feedback.ConversationId, feedback.CustomerName, feedback.CustomerPhone, feedback.Rating, feedback.Comment, feedback.CreatedAt);
    }
}
