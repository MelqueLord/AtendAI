using Atendai.Domain.Entities;

namespace Atendai.Application.Interfaces.Repositories;

public interface IBroadcastRepository
{
    Task<ScheduledBroadcast> CreateScheduledBroadcastAsync(Guid tenantId, Guid createdByUserId, string name, string messageTemplate, DateTimeOffset scheduledAt, string? tagFilter, Guid[] contactIds, CancellationToken cancellationToken = default);
    Task<List<ScheduledBroadcast>> GetScheduledBroadcastsAsync(Guid tenantId, CancellationToken cancellationToken = default);
    Task<List<ScheduledBroadcastJob>> GetDueScheduledBroadcastJobsAsync(DateTimeOffset nowUtc, int limit, CancellationToken cancellationToken = default);
    Task MarkScheduledBroadcastJobSentAsync(Guid jobId, CancellationToken cancellationToken = default);
    Task MarkScheduledBroadcastJobFailedAsync(Guid jobId, string error, CancellationToken cancellationToken = default);
}
