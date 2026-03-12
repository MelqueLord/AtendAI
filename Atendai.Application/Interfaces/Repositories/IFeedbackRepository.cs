using Atendai.Domain.Entities;

namespace Atendai.Application.Interfaces.Repositories;

public interface IFeedbackRepository
{
    Task<CustomerFeedback> UpsertCustomerFeedbackAsync(Guid tenantId, Guid conversationId, int rating, string? comment, CancellationToken cancellationToken = default);
    Task<List<CustomerFeedback>> GetCustomerFeedbackAsync(Guid tenantId, int limit = 100, CancellationToken cancellationToken = default);
}
