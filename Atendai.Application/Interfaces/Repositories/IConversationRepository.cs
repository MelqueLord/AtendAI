using Atendai.Domain.Entities;

namespace Atendai.Application.Interfaces.Repositories;

public interface IConversationRepository
{
    Task<Conversation> GetOrCreateConversationAsync(
        Guid tenantId,
        string customerPhone,
        string? customerName,
        Guid? channelId = null,
        string? qrSessionKey = null,
        string? qrSessionName = null,
        string? qrSessionPhone = null,
        CancellationToken cancellationToken = default);
    Task UpdateConversationCustomerNameAsync(Guid tenantId, Guid conversationId, string customerName, CancellationToken cancellationToken = default);
    Task AddConversationMessageAsync(Guid tenantId, Guid conversationId, string sender, string text, CancellationToken cancellationToken = default);
    Task UpdateConversationStatusAsync(Guid tenantId, Guid conversationId, ConversationStatus status, CancellationToken cancellationToken = default);
    Task<List<Conversation>> GetConversationSummariesAsync(Guid tenantId, CancellationToken cancellationToken = default);
    Task<List<Conversation>> GetConversationsWithMessagesAsync(Guid tenantId, CancellationToken cancellationToken = default);
    Task<Conversation?> GetConversationByIdAsync(Guid tenantId, Guid conversationId, CancellationToken cancellationToken = default);
    Task<string?> GetConversationTransportAsync(Guid tenantId, Guid conversationId, CancellationToken cancellationToken = default);
    Task<int> ClearQrConversationHistoryAsync(Guid tenantId, string? qrSessionKey = null, CancellationToken cancellationToken = default);
}
