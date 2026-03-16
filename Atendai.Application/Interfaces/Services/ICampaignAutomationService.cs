using Atendai.Application.DTOs;
using Atendai.Domain.Entities;

namespace Atendai.Application.Interfaces;

public interface ICampaignAutomationService
{
    Task<List<CampaignRuleResponse>> GetRulesAsync(Guid tenantId, CancellationToken cancellationToken = default);
    Task<CampaignRuleResponse> CreateRuleAsync(Guid tenantId, CampaignRuleUpsertRequest request, CancellationToken cancellationToken = default);
    Task<CampaignRuleResponse?> UpdateRuleAsync(Guid tenantId, Guid ruleId, CampaignRuleUpsertRequest request, CancellationToken cancellationToken = default);
    Task<bool> DeleteRuleAsync(Guid tenantId, Guid ruleId, CancellationToken cancellationToken = default);
    Task EnqueueForConversationAsync(Guid tenantId, Conversation conversation, CancellationToken cancellationToken = default);
    Task<List<ScheduledCampaignJob>> GetDueJobsAsync(int limit = 50, CancellationToken cancellationToken = default);
    Task MarkSentAsync(Guid jobId, CancellationToken cancellationToken = default);
    Task MarkFailedAsync(Guid jobId, string error, CancellationToken cancellationToken = default);
}
