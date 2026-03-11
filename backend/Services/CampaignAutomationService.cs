using backend.Application.Interfaces;
using backend.Contracts;
using backend.Models;

namespace backend.Services;

public sealed class CampaignAutomationService(IDataStore store) : ICampaignAutomationService
{
    public Task<List<CampaignRuleResponse>> GetRulesAsync(Guid tenantId, CancellationToken cancellationToken = default)
    {
        return store.GetCampaignRulesAsync(tenantId, cancellationToken);
    }

    public Task<CampaignRuleResponse> CreateRuleAsync(Guid tenantId, CampaignRuleUpsertRequest request, CancellationToken cancellationToken = default)
    {
        return store.CreateCampaignRuleAsync(tenantId, request, cancellationToken);
    }

    public Task<CampaignRuleResponse?> UpdateRuleAsync(Guid tenantId, Guid ruleId, CampaignRuleUpsertRequest request, CancellationToken cancellationToken = default)
    {
        return store.UpdateCampaignRuleAsync(tenantId, ruleId, request, cancellationToken);
    }

    public Task<bool> DeleteRuleAsync(Guid tenantId, Guid ruleId, CancellationToken cancellationToken = default)
    {
        return store.DeleteCampaignRuleAsync(tenantId, ruleId, cancellationToken);
    }

    public Task EnqueueForConversationAsync(Guid tenantId, Conversation conversation, CancellationToken cancellationToken = default)
    {
        return store.EnqueueCampaignJobsAsync(tenantId, conversation.Id, conversation.CustomerPhone, conversation.CustomerName, DateTimeOffset.UtcNow, cancellationToken);
    }

    public Task<List<ScheduledCampaignJob>> GetDueJobsAsync(int limit = 50, CancellationToken cancellationToken = default)
    {
        return store.GetDueCampaignJobsAsync(DateTimeOffset.UtcNow, limit, cancellationToken);
    }

    public Task MarkSentAsync(Guid jobId, CancellationToken cancellationToken = default)
    {
        return store.MarkCampaignJobSentAsync(jobId, cancellationToken);
    }

    public Task MarkFailedAsync(Guid jobId, string error, CancellationToken cancellationToken = default)
    {
        return store.MarkCampaignJobFailedAsync(jobId, error, cancellationToken);
    }

    public static string ApplyTemplate(string template, string customerName)
    {
        return template.Replace("{cliente}", string.IsNullOrWhiteSpace(customerName) ? "Cliente" : customerName, StringComparison.OrdinalIgnoreCase);
    }
}
