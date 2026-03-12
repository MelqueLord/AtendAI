using Atendai.Application.DTOs;
using Atendai.Application.Interfaces;
using Atendai.Application.Interfaces.Repositories;
using Atendai.Domain.Entities;

namespace Atendai.Application.Services;

public sealed class CampaignAutomationService(ICampaignRepository campaignRepository) : ICampaignAutomationService
{
    public async Task<List<CampaignRuleResponse>> GetRulesAsync(Guid tenantId, CancellationToken cancellationToken = default)
    {
        var rules = await campaignRepository.GetCampaignRulesAsync(tenantId, cancellationToken);
        return rules.Select(MapRule).ToList();
    }

    public async Task<CampaignRuleResponse> CreateRuleAsync(Guid tenantId, CampaignRuleUpsertRequest request, CancellationToken cancellationToken = default)
    {
        var created = await campaignRepository.CreateCampaignRuleAsync(tenantId, request.Name, request.DelayHours, request.Template, request.IsActive, cancellationToken);
        return MapRule(created);
    }

    public async Task<CampaignRuleResponse?> UpdateRuleAsync(Guid tenantId, Guid ruleId, CampaignRuleUpsertRequest request, CancellationToken cancellationToken = default)
    {
        var updated = await campaignRepository.UpdateCampaignRuleAsync(tenantId, ruleId, request.Name, request.DelayHours, request.Template, request.IsActive, cancellationToken);
        return updated is null ? null : MapRule(updated);
    }

    public Task<bool> DeleteRuleAsync(Guid tenantId, Guid ruleId, CancellationToken cancellationToken = default)
    {
        return campaignRepository.DeleteCampaignRuleAsync(tenantId, ruleId, cancellationToken);
    }

    public Task EnqueueForConversationAsync(Guid tenantId, Conversation conversation, CancellationToken cancellationToken = default)
    {
        return campaignRepository.EnqueueCampaignJobsAsync(tenantId, conversation.Id, conversation.CustomerPhone, conversation.CustomerName, DateTimeOffset.UtcNow, cancellationToken);
    }

    public Task<List<ScheduledCampaignJob>> GetDueJobsAsync(int limit = 50, CancellationToken cancellationToken = default)
    {
        return campaignRepository.GetDueCampaignJobsAsync(DateTimeOffset.UtcNow, limit, cancellationToken);
    }

    public Task MarkSentAsync(Guid jobId, CancellationToken cancellationToken = default)
    {
        return campaignRepository.MarkCampaignJobSentAsync(jobId, cancellationToken);
    }

    public Task MarkFailedAsync(Guid jobId, string error, CancellationToken cancellationToken = default)
    {
        return campaignRepository.MarkCampaignJobFailedAsync(jobId, error, cancellationToken);
    }

    public static string ApplyTemplate(string template, string customerName)
    {
        return template.Replace("{cliente}", string.IsNullOrWhiteSpace(customerName) ? "Cliente" : customerName, StringComparison.OrdinalIgnoreCase);
    }

    private static CampaignRuleResponse MapRule(CampaignRule rule)
    {
        return new CampaignRuleResponse(rule.Id, rule.TenantId, rule.Name, rule.DelayHours, rule.Template, rule.IsActive, rule.CreatedAt, rule.UpdatedAt);
    }
}
