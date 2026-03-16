using Atendai.Application.DTOs;

namespace Atendai.Application.Interfaces;

public interface IConversationService
{
    Task<List<ConversationResponse>> GetConversationsAsync(Guid tenantId, CancellationToken cancellationToken = default);
    Task<ConversationResponse?> GetConversationByIdAsync(Guid tenantId, Guid conversationId, CancellationToken cancellationToken = default);
    Task<OutgoingMessageResponse> HandleIncomingAsync(Guid tenantId, IncomingMessageRequest request, Guid? channelId = null, string transport = "meta", CancellationToken cancellationToken = default);
    Task HandleAutomaticReplyDeliveryFailureAsync(Guid tenantId, Guid conversationId, string status, string? error, CancellationToken cancellationToken = default);
    Task<SyncWhatsAppWebHistoryResponse> ImportWhatsAppWebHistoryAsync(Guid tenantId, SyncWhatsAppWebHistoryRequest request, CancellationToken cancellationToken = default);
    Task<OutboundConversationResponse> StartOutboundConversationAsync(Guid tenantId, OutboundConversationRequest request, CancellationToken cancellationToken = default);
    Task<HumanReplyDispatchResponse?> SendHumanReplyAsync(Guid tenantId, Guid conversationId, string message, CancellationToken cancellationToken = default);
    Task<ConversationResponse?> UpdateAssignmentAsync(Guid tenantId, Guid conversationId, Guid? assignedUserId, CancellationToken cancellationToken = default);
    Task<ConversationResponse?> UpdateStatusAsync(Guid tenantId, Guid conversationId, string status, CancellationToken cancellationToken = default);
    Task<List<ConversationNoteResponse>> GetNotesAsync(Guid tenantId, Guid conversationId, CancellationToken cancellationToken = default);
    Task<ConversationNoteResponse> AddNoteAsync(Guid tenantId, Guid conversationId, Guid userId, string userName, string note, CancellationToken cancellationToken = default);
    Task<List<QuickReplyTemplateResponse>> GetQuickRepliesAsync(Guid tenantId, CancellationToken cancellationToken = default);
    Task<QuickReplyTemplateResponse> CreateQuickReplyAsync(Guid tenantId, QuickReplyTemplateUpsertRequest request, CancellationToken cancellationToken = default);
    Task<QuickReplyTemplateResponse?> UpdateQuickReplyAsync(Guid tenantId, Guid templateId, QuickReplyTemplateUpsertRequest request, CancellationToken cancellationToken = default);
    Task<bool> DeleteQuickReplyAsync(Guid tenantId, Guid templateId, CancellationToken cancellationToken = default);
}
