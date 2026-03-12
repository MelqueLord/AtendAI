using Atendai.Application.Interfaces;
using Atendai.Application.DTOs;
using Atendai.Application.Interfaces.Repositories;
using Atendai.Domain.Entities;

namespace Atendai.Application.Services;

public sealed class ConversationService(
    IConversationRepository conversationRepository,
    IWhatsAppRepository whatsAppRepository,
    IUserRepository userRepository,
    IContactRepository contactRepository,
    IInboxRepository inboxRepository,
    IAiResponderService aiResponder,
    INotificationDispatcher notification,
    ICampaignAutomationService campaignAutomationService,
    ITenantWhatsAppService tenantWhatsAppService,
    ICrmService crmService,
    IAttendanceRealtimeNotifier realtimeNotifier) : IConversationService
{
    public async Task<List<ConversationResponse>> GetConversationsAsync(Guid tenantId, CancellationToken cancellationToken = default)
    {
        var conversations = await conversationRepository.GetConversationSummariesAsync(tenantId, cancellationToken);
        return conversations.Select(MapConversation).ToList();
    }

    public async Task<ConversationResponse?> GetConversationByIdAsync(Guid tenantId, Guid conversationId, CancellationToken cancellationToken = default)
    {
        var conversation = await conversationRepository.GetConversationByIdAsync(tenantId, conversationId, cancellationToken);
        return conversation is null ? null : MapConversation(conversation);
    }

    public async Task<OutgoingMessageResponse> HandleIncomingAsync(Guid tenantId, IncomingMessageRequest request, Guid? channelId = null, string transport = "meta", CancellationToken cancellationToken = default)
    {
        var customerName = await ResolveCustomerNameAsync(tenantId, request.CustomerPhone, request.CustomerName, cancellationToken);
        await crmService.EnsureContactExistsAsync(tenantId, request.CustomerPhone, customerName, cancellationToken);

        var conversation = await conversationRepository.GetOrCreateConversationAsync(tenantId, request.CustomerPhone, customerName, channelId, cancellationToken);
        if (CustomerIdentityResolver.ShouldReplaceStoredName(conversation.CustomerName, customerName, request.CustomerPhone))
        {
            await conversationRepository.UpdateConversationCustomerNameAsync(tenantId, conversation.Id, customerName, cancellationToken);
            conversation.CustomerName = customerName;
        }

        await conversationRepository.AddConversationMessageAsync(tenantId, conversation.Id, "Customer", request.Message, cancellationToken);
        await whatsAppRepository.AddWhatsAppMessageLogAsync(
            tenantId,
            conversation.Id,
            request.CustomerPhone,
            "inbound",
            string.Equals(transport, "qr", StringComparison.OrdinalIgnoreCase) ? "received_qr" : "received",
            null,
            request.Message,
            cancellationToken);

        if (conversation.Status is ConversationStatus.WaitingHuman or ConversationStatus.HumanHandling)
        {
            notification.NotifyHuman(conversation.CustomerPhone, conversation.CustomerName);
            await campaignAutomationService.EnqueueForConversationAsync(tenantId, conversation, cancellationToken);
            await realtimeNotifier.NotifyInboxChangedAsync(tenantId, conversation.Id, cancellationToken);
            return new OutgoingMessageResponse(string.Empty, true, conversation.Id);
        }

        var (reply, escalate) = await aiResponder.BuildReplyAsync(tenantId, conversation, request.Message, cancellationToken);

        await conversationRepository.AddConversationMessageAsync(tenantId, conversation.Id, escalate ? "System" : "AI", reply, cancellationToken);

        var newStatus = escalate ? ConversationStatus.WaitingHuman : ConversationStatus.BotHandling;
        await conversationRepository.UpdateConversationStatusAsync(tenantId, conversation.Id, newStatus, cancellationToken);

        if (escalate)
        {
            notification.NotifyHuman(conversation.CustomerPhone, conversation.CustomerName);
        }

        await campaignAutomationService.EnqueueForConversationAsync(tenantId, conversation, cancellationToken);
        await realtimeNotifier.NotifyInboxChangedAsync(tenantId, conversation.Id, cancellationToken);
        return new OutgoingMessageResponse(reply, escalate, conversation.Id);
    }

    public async Task<SyncWhatsAppWebHistoryResponse> ImportWhatsAppWebHistoryAsync(Guid tenantId, SyncWhatsAppWebHistoryRequest request, CancellationToken cancellationToken = default)
    {
        var imported = 0;
        var skipped = 0;
        var chats = request.Chats ?? [];

        foreach (var chat in chats)
        {
            var customerPhone = chat.CustomerPhone.Trim();
            if (string.IsNullOrWhiteSpace(customerPhone))
            {
                skipped++;
                continue;
            }

            var customerName = await ResolveCustomerNameAsync(tenantId, customerPhone, chat.CustomerName, cancellationToken);
            var lastMessage = chat.LastMessage?.Trim();

            await crmService.EnsureContactExistsAsync(tenantId, customerPhone, customerName, cancellationToken);

            var conversation = await conversationRepository.GetOrCreateConversationAsync(tenantId, customerPhone, customerName, null, cancellationToken);
            if (CustomerIdentityResolver.ShouldReplaceStoredName(conversation.CustomerName, customerName, customerPhone))
            {
                await conversationRepository.UpdateConversationCustomerNameAsync(tenantId, conversation.Id, customerName, cancellationToken);
                conversation.CustomerName = customerName;
            }
            var currentConversation = await conversationRepository.GetConversationByIdAsync(tenantId, conversation.Id, cancellationToken);
            var currentLastMessage = currentConversation?.Messages.LastOrDefault()?.Text?.Trim();
            var alreadyImported = !string.IsNullOrWhiteSpace(lastMessage)
                && string.Equals(currentLastMessage, lastMessage, StringComparison.Ordinal);

            if (alreadyImported)
            {
                skipped++;
                continue;
            }

            await whatsAppRepository.AddWhatsAppMessageLogAsync(
                tenantId,
                conversation.Id,
                customerPhone,
                "sync",
                "synced_qr_history",
                null,
                lastMessage,
                cancellationToken);

            if (!string.IsNullOrWhiteSpace(lastMessage))
            {
                var sender = chat.LastMessageFromMe ? "HumanAgent" : "Customer";
                var restoredStatus = chat.LastMessageFromMe ? ConversationStatus.HumanHandling : ConversationStatus.BotHandling;
                await conversationRepository.AddConversationMessageAsync(tenantId, conversation.Id, sender, lastMessage, cancellationToken);
                await conversationRepository.UpdateConversationStatusAsync(
                    tenantId,
                    conversation.Id,
                    restoredStatus,
                    cancellationToken);
            }

            imported++;
        }

        if (imported > 0)
        {
            await realtimeNotifier.NotifyInboxChangedAsync(tenantId, null, cancellationToken);
        }

        return new SyncWhatsAppWebHistoryResponse(imported, skipped, chats.Count);
    }

    public async Task<OutboundConversationResponse> StartOutboundConversationAsync(Guid tenantId, OutboundConversationRequest request, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(request.CustomerPhone) || string.IsNullOrWhiteSpace(request.Message))
        {
            throw new ArgumentException("Telefone e mensagem sao obrigatorios.");
        }

        var customerPhone = request.CustomerPhone.Trim();
        var customerName = await ResolveCustomerNameAsync(tenantId, customerPhone, request.CustomerName, cancellationToken);
        var message = request.Message.Trim();

        await crmService.EnsureContactExistsAsync(tenantId, customerPhone, customerName, cancellationToken);

        var conversation = await conversationRepository.GetOrCreateConversationAsync(tenantId, customerPhone, customerName, request.ChannelId, cancellationToken);
        if (CustomerIdentityResolver.ShouldReplaceStoredName(conversation.CustomerName, customerName, customerPhone))
        {
            await conversationRepository.UpdateConversationCustomerNameAsync(tenantId, conversation.Id, customerName, cancellationToken);
            conversation.CustomerName = customerName;
        }
        var channelId = request.ChannelId ?? conversation.ChannelId;
        var send = await tenantWhatsAppService.SendMessageAsync(tenantId, conversation.Id, customerPhone, message, cancellationToken, channelId);

        if (!send.Success)
        {
            await conversationRepository.UpdateConversationStatusAsync(tenantId, conversation.Id, ConversationStatus.WaitingHuman, cancellationToken);
            await conversationRepository.AddConversationMessageAsync(tenantId, conversation.Id, "System", $"Tentativa de outbound nao enviada: {send.Error ?? send.Status}", cancellationToken);
            notification.NotifyHuman(customerPhone, customerName);
            await realtimeNotifier.NotifyInboxChangedAsync(tenantId, conversation.Id, cancellationToken);
            return new OutboundConversationResponse(false, send.Status, send.Error, "A Meta nao aceitou iniciar a conversa outbound.", conversation.Id);
        }

        await conversationRepository.AddConversationMessageAsync(tenantId, conversation.Id, "HumanAgent", message, cancellationToken);
        await conversationRepository.UpdateConversationStatusAsync(tenantId, conversation.Id, ConversationStatus.HumanHandling, cancellationToken);
        await realtimeNotifier.NotifyInboxChangedAsync(tenantId, conversation.Id, cancellationToken);
        return new OutboundConversationResponse(true, send.Status, null, "Conversa outbound iniciada com sucesso.", conversation.Id);
    }
    public async Task<HumanReplyDispatchResponse?> SendHumanReplyAsync(Guid tenantId, Guid conversationId, string message, CancellationToken cancellationToken = default)
    {
        var conversation = await conversationRepository.GetConversationByIdAsync(tenantId, conversationId, cancellationToken);
        if (conversation is null)
        {
            return null;
        }

        var send = await tenantWhatsAppService.SendMessageAsync(tenantId, conversationId, conversation.CustomerPhone, message, cancellationToken, conversation.ChannelId);
        if (!send.Success)
        {
            await conversationRepository.UpdateConversationStatusAsync(tenantId, conversationId, ConversationStatus.WaitingHuman, cancellationToken);
            notification.NotifyHuman(conversation.CustomerPhone, conversation.CustomerName);
            await realtimeNotifier.NotifyInboxChangedAsync(tenantId, conversationId, cancellationToken);
            return new HumanReplyDispatchResponse(false, send.Status, send.Error, "A mensagem nao foi entregue ao WhatsApp.");
        }

        await conversationRepository.AddConversationMessageAsync(tenantId, conversationId, "HumanAgent", message, cancellationToken);
        await conversationRepository.UpdateConversationStatusAsync(tenantId, conversationId, ConversationStatus.HumanHandling, cancellationToken);
        await realtimeNotifier.NotifyInboxChangedAsync(tenantId, conversationId, cancellationToken);
        return new HumanReplyDispatchResponse(true, send.Status, null, "Resposta humana enviada.");
    }

    public async Task<ConversationResponse?> UpdateAssignmentAsync(Guid tenantId, Guid conversationId, Guid? assignedUserId, CancellationToken cancellationToken = default)
    {
        if (assignedUserId.HasValue)
        {
            var targetUser = await userRepository.GetManagedUserByIdAsync(assignedUserId.Value, cancellationToken);
            if (targetUser is null || targetUser.TenantId != tenantId)
            {
                throw new InvalidOperationException("Usuario de atribuicao invalido para este tenant.");
            }
        }

        await inboxRepository.UpdateConversationAssignmentAsync(tenantId, conversationId, assignedUserId, cancellationToken);
        await realtimeNotifier.NotifyInboxChangedAsync(tenantId, conversationId, cancellationToken);
        var updatedConversation = await conversationRepository.GetConversationByIdAsync(tenantId, conversationId, cancellationToken);
        return updatedConversation is null ? null : MapConversation(updatedConversation);
    }

    public async Task<ConversationResponse?> UpdateStatusAsync(Guid tenantId, Guid conversationId, string status, CancellationToken cancellationToken = default)
    {
        if (!TryParseStatus(status, out var parsed))
        {
            throw new ArgumentException("Status invalido.", nameof(status));
        }

        await inboxRepository.UpdateConversationStatusAsync(tenantId, conversationId, parsed.ToString(), cancellationToken);
        await realtimeNotifier.NotifyInboxChangedAsync(tenantId, conversationId, cancellationToken);
        var updatedConversation = await conversationRepository.GetConversationByIdAsync(tenantId, conversationId, cancellationToken);
        return updatedConversation is null ? null : MapConversation(updatedConversation);
    }

    public async Task<List<ConversationNoteResponse>> GetNotesAsync(Guid tenantId, Guid conversationId, CancellationToken cancellationToken = default)
    {
        var notes = await inboxRepository.GetConversationNotesAsync(tenantId, conversationId, cancellationToken);
        return notes.Select(MapNote).ToList();
    }

    public async Task<ConversationNoteResponse> AddNoteAsync(Guid tenantId, Guid conversationId, Guid userId, string userName, string note, CancellationToken cancellationToken = default)
    {
        var created = await inboxRepository.AddConversationNoteAsync(tenantId, conversationId, userId, userName, note, cancellationToken);
        return MapNote(created);
    }

    public async Task<List<QuickReplyTemplateResponse>> GetQuickRepliesAsync(Guid tenantId, CancellationToken cancellationToken = default)
    {
        var templates = await inboxRepository.GetQuickReplyTemplatesAsync(tenantId, cancellationToken);
        return templates.Select(MapQuickReply).ToList();
    }

    public async Task<QuickReplyTemplateResponse> CreateQuickReplyAsync(Guid tenantId, QuickReplyTemplateUpsertRequest request, CancellationToken cancellationToken = default)
    {
        var created = await inboxRepository.CreateQuickReplyTemplateAsync(tenantId, request.Title, request.Body, cancellationToken);
        return MapQuickReply(created);
    }

    public async Task<QuickReplyTemplateResponse?> UpdateQuickReplyAsync(Guid tenantId, Guid templateId, QuickReplyTemplateUpsertRequest request, CancellationToken cancellationToken = default)
    {
        var updated = await inboxRepository.UpdateQuickReplyTemplateAsync(tenantId, templateId, request.Title, request.Body, cancellationToken);
        return updated is null ? null : MapQuickReply(updated);
    }

    public Task<bool> DeleteQuickReplyAsync(Guid tenantId, Guid templateId, CancellationToken cancellationToken = default)
    {
        return inboxRepository.DeleteQuickReplyTemplateAsync(tenantId, templateId, cancellationToken);
    }

    private static bool TryParseStatus(string statusText, out ConversationStatus status)
    {
        return Enum.TryParse(statusText, true, out status)
            && status is ConversationStatus.BotHandling or ConversationStatus.WaitingHuman or ConversationStatus.HumanHandling or ConversationStatus.Closed;
    }

    private async Task<string> ResolveCustomerNameAsync(Guid tenantId, string customerPhone, string? incomingName, CancellationToken cancellationToken)
    {
        var existingContact = await contactRepository.FindContactByPhoneAsync(tenantId, customerPhone, cancellationToken);
        return CustomerIdentityResolver.ResolveDisplayName(customerPhone, existingContact?.Name, incomingName);
    }

    private static ConversationResponse MapConversation(Conversation conversation)
    {
        return new ConversationResponse(
            conversation.Id,
            conversation.CustomerPhone,
            conversation.CustomerName,
            conversation.Status.ToString(),
            conversation.Transport,
            conversation.ChannelId,
            conversation.ChannelName,
            conversation.AssignedUserId,
            conversation.AssignedUserName,
            conversation.LastCustomerMessageAt,
            conversation.LastHumanMessageAt,
            conversation.ClosedAt,
            conversation.CreatedAt,
            conversation.UpdatedAt,
            conversation.Messages.Select(MapMessage).ToList());
    }

    private static ConversationMessageResponse MapMessage(ConversationMessage message)
    {
        return new ConversationMessageResponse(
            message.Id,
            message.Sender,
            message.Text,
            message.CreatedAt);
    }

    private static ConversationNoteResponse MapNote(ConversationNote note)
    {
        return new ConversationNoteResponse(note.Id, note.ConversationId, note.UserId, note.UserName, note.Note, note.CreatedAt);
    }

    private static QuickReplyTemplateResponse MapQuickReply(QuickReplyTemplate template)
    {
        return new QuickReplyTemplateResponse(template.Id, template.TenantId, template.Title, template.Body, template.CreatedAt, template.UpdatedAt);
    }
}
