using Atendai.Domain.Entities;

namespace Atendai.Application.Interfaces.Repositories;

public interface ICampaignRepository
{
    Task<List<CampaignRule>> GetCampaignRulesAsync(Guid tenantId, CancellationToken cancellationToken = default);
    Task<CampaignRule> CreateCampaignRuleAsync(Guid tenantId, string name, int delayHours, string template, bool isActive, CancellationToken cancellationToken = default);
    Task<CampaignRule?> UpdateCampaignRuleAsync(Guid tenantId, Guid ruleId, string name, int delayHours, string template, bool isActive, CancellationToken cancellationToken = default);
    Task<bool> DeleteCampaignRuleAsync(Guid tenantId, Guid ruleId, CancellationToken cancellationToken = default);
    Task EnqueueCampaignJobsAsync(Guid tenantId, Guid conversationId, string customerPhone, string customerName, DateTimeOffset baseTimeUtc, CancellationToken cancellationToken = default);
    Task<List<ScheduledCampaignJob>> GetDueCampaignJobsAsync(DateTimeOffset nowUtc, int limit, CancellationToken cancellationToken = default);
    Task MarkCampaignJobSentAsync(Guid jobId, CancellationToken cancellationToken = default);
    Task MarkCampaignJobFailedAsync(Guid jobId, string error, CancellationToken cancellationToken = default);
}
