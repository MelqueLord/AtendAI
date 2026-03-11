using backend.Application.Interfaces;
using backend.Contracts;
using backend.Models;

namespace backend.Services;

public sealed class ConversationService(
    IDataStore store,
    IAiResponderService aiResponder,
    INotificationDispatcher notification,
    ICampaignAutomationService campaignAutomationService,
    ITenantWhatsAppService tenantWhatsAppService,
    ICrmService crmService) : IConversationService
{
    public Task<List<Conversation>> GetConversationsAsync(Guid tenantId, CancellationToken cancellationToken = default)
    {
        return store.GetConversationsWithMessagesAsync(tenantId, cancellationToken);
    }

    public Task<Conversation?> GetConversationByIdAsync(Guid tenantId, Guid conversationId, CancellationToken cancellationToken = default)
    {
        return store.GetConversationByIdAsync(tenantId, conversationId, cancellationToken);
    }

    public async Task<OutgoingMessageResponse> HandleIncomingAsync(Guid tenantId, IncomingMessageRequest request, Guid? channelId = null, CancellationToken cancellationToken = default)
    {
        await crmService.EnsureContactExistsAsync(tenantId, request.CustomerPhone, request.CustomerName, cancellationToken);

        var conversation = await store.GetOrCreateConversationAsync(tenantId, request.CustomerPhone, request.CustomerName, channelId, cancellationToken);

        await store.AddConversationMessageAsync(tenantId, conversation.Id, "Customer", request.Message, cancellationToken);
        await store.AddWhatsAppMessageLogAsync(tenantId, conversation.Id, request.CustomerPhone, "inbound", "received", null, request.Message, cancellationToken);

        var (reply, escalate) = await aiResponder.BuildReplyAsync(tenantId, conversation, request.Message, cancellationToken);

        await store.AddConversationMessageAsync(tenantId, conversation.Id, escalate ? "System" : "AI", reply, cancellationToken);

        var newStatus = escalate ? ConversationStatus.WaitingHuman : ConversationStatus.BotHandling;
        await store.UpdateConversationStatusAsync(tenantId, conversation.Id, newStatus, cancellationToken);

        if (escalate)
        {
            notification.NotifyHuman(conversation.CustomerPhone, conversation.CustomerName);
        }

        await campaignAutomationService.EnqueueForConversationAsync(tenantId, conversation, cancellationToken);
        return new OutgoingMessageResponse(reply, escalate, conversation.Id);
    }

    public async Task<OutboundConversationResponse> StartOutboundConversationAsync(Guid tenantId, OutboundConversationRequest request, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(request.CustomerPhone) || string.IsNullOrWhiteSpace(request.Message))
        {
            throw new ArgumentException("Telefone e mensagem sao obrigatorios.");
        }

        var customerPhone = request.CustomerPhone.Trim();
        var customerName = string.IsNullOrWhiteSpace(request.CustomerName) ? "Cliente" : request.CustomerName.Trim();
        var message = request.Message.Trim();

        await crmService.EnsureContactExistsAsync(tenantId, customerPhone, customerName, cancellationToken);

        var conversation = await store.GetOrCreateConversationAsync(tenantId, customerPhone, customerName, request.ChannelId, cancellationToken);
        var channelId = request.ChannelId ?? conversation.ChannelId;
        var send = await tenantWhatsAppService.SendMessageAsync(tenantId, conversation.Id, customerPhone, message, cancellationToken, channelId);

        if (!send.Success)
        {
            await store.UpdateConversationStatusAsync(tenantId, conversation.Id, ConversationStatus.WaitingHuman, cancellationToken);
            await store.AddConversationMessageAsync(tenantId, conversation.Id, "System", $"Tentativa de outbound nao enviada: {send.Error ?? send.Status}", cancellationToken);
            notification.NotifyHuman(customerPhone, customerName);
            return new OutboundConversationResponse(false, send.Status, send.Error, "A Meta nao aceitou iniciar a conversa outbound.", conversation.Id);
        }

        await store.AddConversationMessageAsync(tenantId, conversation.Id, "HumanAgent", message, cancellationToken);
        await store.UpdateConversationStatusAsync(tenantId, conversation.Id, ConversationStatus.HumanHandling, cancellationToken);
        return new OutboundConversationResponse(true, send.Status, null, "Conversa outbound iniciada com sucesso.", conversation.Id);
    }
    public async Task<HumanReplyDispatchResponse?> SendHumanReplyAsync(Guid tenantId, Guid conversationId, string message, CancellationToken cancellationToken = default)
    {
        var conversation = await store.GetConversationByIdAsync(tenantId, conversationId, cancellationToken);
        if (conversation is null)
        {
            return null;
        }

        var send = await tenantWhatsAppService.SendMessageAsync(tenantId, conversationId, conversation.CustomerPhone, message, cancellationToken, conversation.ChannelId);
        if (!send.Success)
        {
            await store.UpdateConversationStatusAsync(tenantId, conversationId, ConversationStatus.WaitingHuman, cancellationToken);
            notification.NotifyHuman(conversation.CustomerPhone, conversation.CustomerName);
            return new HumanReplyDispatchResponse(false, send.Status, send.Error, "A mensagem nao foi entregue ao WhatsApp.");
        }

        await store.AddConversationMessageAsync(tenantId, conversationId, "HumanAgent", message, cancellationToken);
        await store.UpdateConversationStatusAsync(tenantId, conversationId, ConversationStatus.HumanHandling, cancellationToken);
        return new HumanReplyDispatchResponse(true, send.Status, null, "Resposta humana enviada.");
    }

    public async Task<Conversation?> UpdateAssignmentAsync(Guid tenantId, Guid conversationId, Guid? assignedUserId, CancellationToken cancellationToken = default)
    {
        if (assignedUserId.HasValue)
        {
            var targetUser = await store.GetManagedUserByIdAsync(assignedUserId.Value, cancellationToken);
            if (targetUser is null || targetUser.TenantId != tenantId)
            {
                throw new InvalidOperationException("Usuario de atribuicao invalido para este tenant.");
            }
        }

        await store.UpdateConversationAssignmentAsync(tenantId, conversationId, assignedUserId, cancellationToken);
        return await store.GetConversationByIdAsync(tenantId, conversationId, cancellationToken);
    }

    public async Task<Conversation?> UpdateStatusAsync(Guid tenantId, Guid conversationId, string status, CancellationToken cancellationToken = default)
    {
        if (!TryParseStatus(status, out var parsed))
        {
            throw new ArgumentException("Status invalido.", nameof(status));
        }

        await store.UpdateConversationStatusAsync(tenantId, conversationId, parsed.ToString(), cancellationToken);
        return await store.GetConversationByIdAsync(tenantId, conversationId, cancellationToken);
    }

    public Task<List<ConversationNoteResponse>> GetNotesAsync(Guid tenantId, Guid conversationId, CancellationToken cancellationToken = default)
    {
        return store.GetConversationNotesAsync(tenantId, conversationId, cancellationToken);
    }

    public Task<ConversationNoteResponse> AddNoteAsync(Guid tenantId, Guid conversationId, Guid userId, string userName, string note, CancellationToken cancellationToken = default)
    {
        return store.AddConversationNoteAsync(tenantId, conversationId, userId, userName, note, cancellationToken);
    }

    public Task<List<QuickReplyTemplateResponse>> GetQuickRepliesAsync(Guid tenantId, CancellationToken cancellationToken = default)
    {
        return store.GetQuickReplyTemplatesAsync(tenantId, cancellationToken);
    }

    public Task<QuickReplyTemplateResponse> CreateQuickReplyAsync(Guid tenantId, QuickReplyTemplateUpsertRequest request, CancellationToken cancellationToken = default)
    {
        return store.CreateQuickReplyTemplateAsync(tenantId, request, cancellationToken);
    }

    public Task<QuickReplyTemplateResponse?> UpdateQuickReplyAsync(Guid tenantId, Guid templateId, QuickReplyTemplateUpsertRequest request, CancellationToken cancellationToken = default)
    {
        return store.UpdateQuickReplyTemplateAsync(tenantId, templateId, request, cancellationToken);
    }

    public Task<bool> DeleteQuickReplyAsync(Guid tenantId, Guid templateId, CancellationToken cancellationToken = default)
    {
        return store.DeleteQuickReplyTemplateAsync(tenantId, templateId, cancellationToken);
    }

    private static bool TryParseStatus(string statusText, out ConversationStatus status)
    {
        return Enum.TryParse(statusText, true, out status)
            && status is ConversationStatus.BotHandling or ConversationStatus.WaitingHuman or ConversationStatus.HumanHandling or ConversationStatus.Closed;
    }
}




