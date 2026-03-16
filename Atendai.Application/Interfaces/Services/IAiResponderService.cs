using Atendai.Domain.Entities;

namespace Atendai.Application.Interfaces;

public interface IAiResponderService
{
    Task<(string Reply, bool Escalate)> BuildReplyAsync(
        Guid tenantId,
        Conversation conversation,
        string message,
        CancellationToken cancellationToken = default);
}
