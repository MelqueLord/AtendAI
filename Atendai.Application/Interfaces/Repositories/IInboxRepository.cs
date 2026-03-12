using Atendai.Domain.Entities;

namespace Atendai.Application.Interfaces.Repositories;

public interface IInboxRepository
{
    Task UpdateConversationAssignmentAsync(Guid tenantId, Guid conversationId, Guid? assignedUserId, CancellationToken cancellationToken = default);
    Task UpdateConversationStatusAsync(Guid tenantId, Guid conversationId, string status, CancellationToken cancellationToken = default);
    Task<List<ConversationNote>> GetConversationNotesAsync(Guid tenantId, Guid conversationId, CancellationToken cancellationToken = default);
    Task<ConversationNote> AddConversationNoteAsync(Guid tenantId, Guid conversationId, Guid userId, string userName, string note, CancellationToken cancellationToken = default);
    Task<List<QuickReplyTemplate>> GetQuickReplyTemplatesAsync(Guid tenantId, CancellationToken cancellationToken = default);
    Task<QuickReplyTemplate> CreateQuickReplyTemplateAsync(Guid tenantId, string title, string body, CancellationToken cancellationToken = default);
    Task<QuickReplyTemplate?> UpdateQuickReplyTemplateAsync(Guid tenantId, Guid templateId, string title, string body, CancellationToken cancellationToken = default);
    Task<bool> DeleteQuickReplyTemplateAsync(Guid tenantId, Guid templateId, CancellationToken cancellationToken = default);
}
