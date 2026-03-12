using Atendai.Application.Interfaces;
using System.Text.Json.Serialization;
using Atendai.Application.DTOs;
using Atendai.Domain.Entities;

namespace Atendai.Infrastructure.Repositories;

public sealed partial class SupabaseDataStore
{
    public async Task<List<AutomationOptionResponse>> GetAutomationOptionsAsync(Guid tenantId, CancellationToken cancellationToken = default)
    {
        var rows = await GetAsync<List<AutomationOptionRow>>(
            $"automation_options?tenant_id=eq.{tenantId}&select=id,tenant_id,name,trigger_keywords,response_template,escalate_to_human,sort_order,is_active,created_at,updated_at&order=sort_order.asc,created_at.asc",
            cancellationToken);

        return rows.Select(MapAutomationOption).ToList();
    }

    public async Task<AutomationOptionResponse> CreateAutomationOptionAsync(Guid tenantId, AutomationOptionUpsertRequest request, CancellationToken cancellationToken = default)
    {
        var created = await PostAsync<List<AutomationOptionRow>>("automation_options", new[]
        {
            new
            {
                tenant_id = tenantId,
                name = request.Name.Trim(),
                trigger_keywords = request.TriggerKeywords.Trim(),
                response_template = request.ResponseTemplate.Trim(),
                escalate_to_human = request.EscalateToHuman,
                sort_order = request.SortOrder,
                is_active = request.IsActive
            }
        }, cancellationToken);

        return MapAutomationOption(created.First());
    }

    public async Task<AutomationOptionResponse?> UpdateAutomationOptionAsync(Guid tenantId, Guid optionId, AutomationOptionUpsertRequest request, CancellationToken cancellationToken = default)
    {
        await PatchAsync($"automation_options?id=eq.{optionId}&tenant_id=eq.{tenantId}", new
        {
            name = request.Name.Trim(),
            trigger_keywords = request.TriggerKeywords.Trim(),
            response_template = request.ResponseTemplate.Trim(),
            escalate_to_human = request.EscalateToHuman,
            sort_order = request.SortOrder,
            is_active = request.IsActive,
            updated_at = DateTimeOffset.UtcNow
        }, cancellationToken);

        var rows = await GetAsync<List<AutomationOptionRow>>(
            $"automation_options?id=eq.{optionId}&tenant_id=eq.{tenantId}&select=id,tenant_id,name,trigger_keywords,response_template,escalate_to_human,sort_order,is_active,created_at,updated_at&limit=1",
            cancellationToken);

        var row = rows.FirstOrDefault();
        return row is null ? null : MapAutomationOption(row);
    }

    public async Task<bool> DeleteAutomationOptionAsync(Guid tenantId, Guid optionId, CancellationToken cancellationToken = default)
    {
        await DeleteAsync($"automation_options?id=eq.{optionId}&tenant_id=eq.{tenantId}", cancellationToken);
        return true;
    }

    public async Task<List<ContactResponse>> GetContactsAsync(Guid tenantId, string? search = null, string? state = null, string? status = null, string? tag = null, int page = 1, int pageSize = 50, CancellationToken cancellationToken = default)
    {
        var offset = (Math.Max(1, page) - 1) * Math.Clamp(pageSize, 1, 500);
        var rows = await GetAsync<List<ContactRow>>(
            $"contacts?tenant_id=eq.{tenantId}&deleted_at=is.null&select=id,name,phone,state,status,tags,created_at,owner_user_id,users(name)&order=created_at.desc&offset={offset}&limit={Math.Clamp(pageSize, 1, 500)}",
            cancellationToken);

        IEnumerable<ContactRow> filtered = rows;

        if (!string.IsNullOrWhiteSpace(search))
        {
            var query = search.Trim().ToLowerInvariant();
            filtered = filtered.Where(row =>
                row.Name.ToLowerInvariant().Contains(query) ||
                row.Phone.ToLowerInvariant().Contains(query));
        }

        if (!string.IsNullOrWhiteSpace(state))
        {
            filtered = filtered.Where(row => string.Equals(row.State, state.Trim(), StringComparison.OrdinalIgnoreCase));
        }

        if (!string.IsNullOrWhiteSpace(status))
        {
            filtered = filtered.Where(row => string.Equals(row.Status, status.Trim(), StringComparison.OrdinalIgnoreCase));
        }

        if (!string.IsNullOrWhiteSpace(tag))
        {
            filtered = filtered.Where(row => (row.Tags ?? []).Any(current => string.Equals(current, tag.Trim(), StringComparison.OrdinalIgnoreCase)));
        }

        return filtered.Select(MapContact).ToList();
    }

    public async Task<ContactResponse?> FindContactByPhoneAsync(Guid tenantId, string phone, CancellationToken cancellationToken = default)
    {
        var normalizedPhone = NormalizePhone(phone);
        var rows = await GetAsync<List<ContactRow>>(
            $"contacts?tenant_id=eq.{tenantId}&phone=eq.{Uri.EscapeDataString(normalizedPhone)}&deleted_at=is.null&select=id,name,phone,state,status,tags,created_at,owner_user_id,users(name)&limit=1",
            cancellationToken);

        var row = rows.FirstOrDefault();
        return row is null ? null : MapContact(row);
    }

    public async Task<ContactResponse> CreateContactAsync(Guid tenantId, ContactUpsertRequest request, CancellationToken cancellationToken = default)
    {
        var created = await PostAsync<List<ContactRow>>("contacts", new[]
        {
            new
            {
                tenant_id = tenantId,
                name = request.Name.Trim(),
                phone = NormalizePhone(request.Phone),
                state = request.State?.Trim(),
                status = string.IsNullOrWhiteSpace(request.Status) ? "Novo" : request.Status.Trim(),
                tags = NormalizeTags(request.Tags),
                owner_user_id = request.OwnerUserId
            }
        }, cancellationToken);

        return MapContact(created.First());
    }

    public async Task<ContactResponse?> UpdateContactAsync(Guid tenantId, Guid contactId, ContactUpsertRequest request, CancellationToken cancellationToken = default)
    {
        await PatchAsync($"contacts?id=eq.{contactId}&tenant_id=eq.{tenantId}&deleted_at=is.null", new
        {
            name = request.Name.Trim(),
            phone = NormalizePhone(request.Phone),
            state = request.State?.Trim(),
            status = string.IsNullOrWhiteSpace(request.Status) ? "Novo" : request.Status.Trim(),
            tags = NormalizeTags(request.Tags),
            owner_user_id = request.OwnerUserId
        }, cancellationToken);

        var rows = await GetAsync<List<ContactRow>>(
            $"contacts?id=eq.{contactId}&tenant_id=eq.{tenantId}&deleted_at=is.null&select=id,name,phone,state,status,tags,created_at,owner_user_id,users(name)&limit=1",
            cancellationToken);

        var row = rows.FirstOrDefault();
        return row is null ? null : MapContact(row);
    }

    public async Task<bool> DeleteContactAsync(Guid tenantId, Guid contactId, CancellationToken cancellationToken = default)
    {
        await PatchAsync($"contacts?id=eq.{contactId}&tenant_id=eq.{tenantId}&deleted_at=is.null", new
        {
            deleted_at = DateTimeOffset.UtcNow
        }, cancellationToken);

        return true;
    }

    public async Task<List<WhatsAppChannelResponse>> GetWhatsAppChannelsAsync(Guid tenantId, CancellationToken cancellationToken = default)
    {
        var rows = await GetAsync<List<WhatsAppChannelRow>>(
            $"whatsapp_connections?tenant_id=eq.{tenantId}&select=id,tenant_id,display_name,waba_id,phone_number_id,verify_token,is_active,is_primary,last_tested_at,last_status,last_error,updated_at&order=is_primary.desc,updated_at.desc",
            cancellationToken);

        return rows.Select(MapChannel).ToList();
    }

    public async Task<WhatsAppChannelResponse?> GetWhatsAppChannelByIdAsync(Guid tenantId, Guid channelId, CancellationToken cancellationToken = default)
    {
        var rows = await GetAsync<List<WhatsAppChannelRow>>(
            $"whatsapp_connections?id=eq.{channelId}&tenant_id=eq.{tenantId}&select=id,tenant_id,display_name,waba_id,phone_number_id,verify_token,is_active,is_primary,last_tested_at,last_status,last_error,updated_at&limit=1",
            cancellationToken);

        var row = rows.FirstOrDefault();
        return row is null ? null : MapChannel(row);
    }

    public async Task<WhatsAppChannelResponse?> GetWhatsAppChannelByPhoneNumberIdAsync(Guid tenantId, string phoneNumberId, CancellationToken cancellationToken = default)
    {
        var encoded = Uri.EscapeDataString(phoneNumberId);
        var rows = await GetAsync<List<WhatsAppChannelRow>>(
            $"whatsapp_connections?tenant_id=eq.{tenantId}&phone_number_id=eq.{encoded}&select=id,tenant_id,display_name,waba_id,phone_number_id,verify_token,is_active,is_primary,last_tested_at,last_status,last_error,updated_at&order=is_primary.desc,updated_at.desc&limit=1",
            cancellationToken);

        var row = rows.FirstOrDefault();
        return row is null ? null : MapChannel(row);
    }

    public async Task<int> GetWhatsAppChannelsCountAsync(Guid tenantId, CancellationToken cancellationToken = default)
    {
        var rows = await GetAsync<List<WhatsAppChannelCountRow>>(
            $"whatsapp_connections?tenant_id=eq.{tenantId}&select=id",
            cancellationToken);

        return rows.Count;
    }

    public async Task<WhatsAppChannelResponse> CreateWhatsAppChannelAsync(Guid tenantId, string displayName, string? wabaId, string phoneNumberId, string verifyToken, string? encryptedAccessToken, bool isActive, bool isPrimary, CancellationToken cancellationToken = default)
    {
        if (isPrimary)
        {
            await ClearPrimaryChannelAsync(tenantId, null, cancellationToken);
        }

        var created = await PostAsync<List<WhatsAppChannelRow>>("whatsapp_connections", new[]
        {
            new
            {
                id = Guid.NewGuid(),
                tenant_id = tenantId,
                display_name = string.IsNullOrWhiteSpace(displayName) ? "Canal WhatsApp" : displayName.Trim(),
                waba_id = wabaId?.Trim(),
                phone_number_id = phoneNumberId.Trim(),
                verify_token = verifyToken.Trim(),
                access_token_encrypted = encryptedAccessToken,
                is_active = isActive,
                is_primary = isPrimary,
                updated_at = DateTimeOffset.UtcNow
            }
        }, cancellationToken);

        return MapChannel(created.First());
    }

    public async Task<WhatsAppChannelResponse?> UpdateWhatsAppChannelAsync(Guid tenantId, Guid channelId, string displayName, string? wabaId, string phoneNumberId, string verifyToken, string? encryptedAccessToken, bool isActive, bool isPrimary, CancellationToken cancellationToken = default)
    {
        if (isPrimary)
        {
            await ClearPrimaryChannelAsync(tenantId, channelId, cancellationToken);
        }

        var payload = new Dictionary<string, object?>
        {
            ["display_name"] = string.IsNullOrWhiteSpace(displayName) ? "Canal WhatsApp" : displayName.Trim(),
            ["waba_id"] = wabaId?.Trim(),
            ["phone_number_id"] = phoneNumberId.Trim(),
            ["verify_token"] = verifyToken.Trim(),
            ["is_active"] = isActive,
            ["is_primary"] = isPrimary,
            ["updated_at"] = DateTimeOffset.UtcNow
        };

        if (!string.IsNullOrWhiteSpace(encryptedAccessToken))
        {
            payload["access_token_encrypted"] = encryptedAccessToken;
        }

        await PatchAsync($"whatsapp_connections?id=eq.{channelId}&tenant_id=eq.{tenantId}", payload, cancellationToken);
        return await GetWhatsAppChannelByIdAsync(tenantId, channelId, cancellationToken);
    }

    public async Task<bool> DeleteWhatsAppChannelAsync(Guid tenantId, Guid channelId, CancellationToken cancellationToken = default)
    {
        await DeleteAsync($"whatsapp_connections?id=eq.{channelId}&tenant_id=eq.{tenantId}", cancellationToken);
        var remaining = await GetWhatsAppChannelsAsync(tenantId, cancellationToken);
        if (remaining.Count > 0 && !remaining.Any(channel => channel.IsPrimary))
        {
            await PatchAsync($"whatsapp_connections?id=eq.{remaining[0].Id}&tenant_id=eq.{tenantId}", new
            {
                is_primary = true,
                updated_at = DateTimeOffset.UtcNow
            }, cancellationToken);
        }

        return true;
    }

    public async Task<ScheduledBroadcastResponse> CreateScheduledBroadcastAsync(Guid tenantId, Guid createdByUserId, ScheduleBroadcastRequest request, CancellationToken cancellationToken = default)
    {
        var contacts = await ResolveBroadcastContactsAsync(tenantId, request, cancellationToken);
        if (contacts.Count == 0)
        {
            throw new InvalidOperationException("Nenhum contato encontrado para esta campanha.");
        }

        var createdCampaign = await PostAsync<List<BroadcastCampaignRow>>("broadcast_campaigns", new[]
        {
            new
            {
                id = Guid.NewGuid(),
                tenant_id = tenantId,
                created_by_user_id = createdByUserId,
                name = request.Name.Trim(),
                message_template = request.MessageTemplate.Trim(),
                scheduled_at = request.ScheduledAt,
                status = "scheduled",
                tag_filter = string.IsNullOrWhiteSpace(request.TagFilter) ? null : request.TagFilter.Trim()
            }
        }, cancellationToken);

        var campaign = createdCampaign.First();
        var jobs = contacts.Select(contact => new
        {
            id = Guid.NewGuid(),
            tenant_id = tenantId,
            campaign_id = campaign.Id,
            contact_id = contact.Id,
            customer_phone = contact.Phone,
            customer_name = contact.Name,
            scheduled_at = request.ScheduledAt,
            status = "pending",
            attempt_count = 0,
            created_at = DateTimeOffset.UtcNow,
            updated_at = DateTimeOffset.UtcNow
        }).ToList();

        await PostAsync("broadcast_jobs", jobs, cancellationToken);

        return new ScheduledBroadcastResponse(
            campaign.Id,
            tenantId,
            campaign.Name,
            campaign.MessageTemplate,
            campaign.ScheduledAt,
            campaign.Status,
            campaign.TagFilter,
            contacts.Count,
            0,
            campaign.CreatedAt);
    }

    public async Task<List<ScheduledBroadcastResponse>> GetScheduledBroadcastsAsync(Guid tenantId, CancellationToken cancellationToken = default)
    {
        var campaigns = await GetAsync<List<BroadcastCampaignRow>>(
            $"broadcast_campaigns?tenant_id=eq.{tenantId}&select=id,tenant_id,name,message_template,scheduled_at,status,tag_filter,created_at&order=created_at.desc",
            cancellationToken);

        var jobs = await GetAsync<List<BroadcastJobListRow>>(
            $"broadcast_jobs?tenant_id=eq.{tenantId}&select=campaign_id,status",
            cancellationToken);

        return campaigns.Select(campaign =>
        {
            var currentJobs = jobs.Where(job => job.CampaignId == campaign.Id).ToList();
            return new ScheduledBroadcastResponse(
                campaign.Id,
                campaign.TenantId,
                campaign.Name,
                campaign.MessageTemplate,
                campaign.ScheduledAt,
                campaign.Status,
                campaign.TagFilter,
                currentJobs.Count,
                currentJobs.Count(job => string.Equals(job.Status, "sent", StringComparison.OrdinalIgnoreCase)),
                campaign.CreatedAt);
        }).ToList();
    }

    public async Task<List<ScheduledBroadcastJob>> GetDueScheduledBroadcastJobsAsync(DateTimeOffset nowUtc, int limit, CancellationToken cancellationToken = default)
    {
        var rows = await GetAsync<List<BroadcastJobRow>>(
            $"broadcast_jobs?status=eq.pending&scheduled_at=lte.{Uri.EscapeDataString(nowUtc.ToString("O"))}&select=id,tenant_id,campaign_id,contact_id,customer_phone,customer_name,scheduled_at,attempt_count,broadcast_campaigns(message_template)&order=scheduled_at.asc&limit={limit}",
            cancellationToken);

        return rows.Select(row => new ScheduledBroadcastJob
        {
            Id = row.Id,
            TenantId = row.TenantId,
            CampaignId = row.CampaignId,
            ContactId = row.ContactId,
            CustomerPhone = row.CustomerPhone,
            CustomerName = row.CustomerName,
            MessageTemplate = row.BroadcastCampaign?.MessageTemplate ?? string.Empty,
            ScheduledAt = row.ScheduledAt,
            AttemptCount = row.AttemptCount
        }).ToList();
    }

    public async Task MarkScheduledBroadcastJobSentAsync(Guid jobId, CancellationToken cancellationToken = default)
    {
        await PatchAsync($"broadcast_jobs?id=eq.{jobId}", new
        {
            status = "sent",
            sent_at = DateTimeOffset.UtcNow,
            updated_at = DateTimeOffset.UtcNow
        }, cancellationToken);

        await RefreshBroadcastCampaignStatusAsync(jobId, cancellationToken);
    }

    public async Task MarkScheduledBroadcastJobFailedAsync(Guid jobId, string error, CancellationToken cancellationToken = default)
    {
        await PatchAsync($"broadcast_jobs?id=eq.{jobId}", new
        {
            status = "failed",
            last_error = error,
            attempt_count = 1,
            updated_at = DateTimeOffset.UtcNow
        }, cancellationToken);

        var campaignId = await GetCampaignIdFromBroadcastJobAsync(jobId, cancellationToken);
        if (campaignId.HasValue)
        {
            await PatchAsync($"broadcast_campaigns?id=eq.{campaignId.Value}", new
            {
                status = "attention"
            }, cancellationToken);
        }
    }

    public async Task<CustomerFeedbackResponse> UpsertCustomerFeedbackAsync(Guid tenantId, Guid conversationId, int rating, string? comment, CancellationToken cancellationToken = default)
    {
        await UpsertAsync("customer_feedback?on_conflict=conversation_id", new[]
        {
            new
            {
                id = Guid.NewGuid(),
                tenant_id = tenantId,
                conversation_id = conversationId,
                rating,
                comment = string.IsNullOrWhiteSpace(comment) ? null : comment.Trim(),
                created_at = DateTimeOffset.UtcNow
            }
        }, cancellationToken);

        var rows = await GetAsync<List<CustomerFeedbackRow>>(
            $"customer_feedback?tenant_id=eq.{tenantId}&conversation_id=eq.{conversationId}&select=id,conversation_id,rating,comment,created_at,conversations(customer_name,customer_phone)&limit=1",
            cancellationToken);

        return MapFeedback(rows.First());
    }

    public async Task<List<CustomerFeedbackResponse>> GetCustomerFeedbackAsync(Guid tenantId, int limit = 100, CancellationToken cancellationToken = default)
    {
        var rows = await GetAsync<List<CustomerFeedbackRow>>(
            $"customer_feedback?tenant_id=eq.{tenantId}&select=id,conversation_id,rating,comment,created_at,conversations(customer_name,customer_phone)&order=created_at.desc&limit={Math.Clamp(limit, 1, 300)}",
            cancellationToken);

        return rows.Select(MapFeedback).ToList();
    }

    private async Task<List<ContactResponse>> ResolveBroadcastContactsAsync(Guid tenantId, ScheduleBroadcastRequest request, CancellationToken cancellationToken)
    {
        var contacts = await GetContactsAsync(tenantId, tag: request.TagFilter, page: 1, pageSize: 1000, cancellationToken: cancellationToken);
        if (request.ContactIds.Length == 0)
        {
            return contacts;
        }

        var selected = request.ContactIds.ToHashSet();
        return contacts.Where(contact => selected.Contains(contact.Id)).ToList();
    }

    private async Task RefreshBroadcastCampaignStatusAsync(Guid jobId, CancellationToken cancellationToken)
    {
        var campaignId = await GetCampaignIdFromBroadcastJobAsync(jobId, cancellationToken);
        if (!campaignId.HasValue)
        {
            return;
        }

        var jobs = await GetAsync<List<BroadcastJobListRow>>(
            $"broadcast_jobs?campaign_id=eq.{campaignId.Value}&select=campaign_id,status",
            cancellationToken);

        var nextStatus = jobs.All(job => string.Equals(job.Status, "sent", StringComparison.OrdinalIgnoreCase))
            ? "completed"
            : jobs.Any(job => string.Equals(job.Status, "sent", StringComparison.OrdinalIgnoreCase))
                ? "processing"
                : "scheduled";

        await PatchAsync($"broadcast_campaigns?id=eq.{campaignId.Value}", new
        {
            status = nextStatus
        }, cancellationToken);
    }

    private async Task<Guid?> GetCampaignIdFromBroadcastJobAsync(Guid jobId, CancellationToken cancellationToken)
    {
        var rows = await GetAsync<List<BroadcastJobCampaignRefRow>>(
            $"broadcast_jobs?id=eq.{jobId}&select=campaign_id&limit=1",
            cancellationToken);

        return rows.FirstOrDefault()?.CampaignId;
    }

    private Task ClearPrimaryChannelAsync(Guid tenantId, Guid? exceptChannelId, CancellationToken cancellationToken)
    {
        var filters = $"tenant_id=eq.{tenantId}&is_primary=eq.true";
        if (exceptChannelId.HasValue)
        {
            filters += $"&id=neq.{exceptChannelId.Value}";
        }

        return PatchAsync($"whatsapp_connections?{filters}", new
        {
            is_primary = false,
            updated_at = DateTimeOffset.UtcNow
        }, cancellationToken);
    }

    private async Task DeleteAsync(string relativeUrl, CancellationToken cancellationToken)
    {
        using var request = new HttpRequestMessage(HttpMethod.Delete, relativeUrl);
        request.Headers.TryAddWithoutValidation("Prefer", "return=minimal");

        using var response = await _http.SendAsync(request, cancellationToken);
        await EnsureSuccess(response, cancellationToken);
    }

    private static ContactResponse MapContact(ContactRow row)
    {
        return new ContactResponse(
            row.Id,
            row.Name,
            row.Phone,
            row.State,
            row.Status,
            row.Tags ?? [],
            row.Owner?.Name,
            row.CreatedAt);
    }

    private static WhatsAppChannelResponse MapChannel(WhatsAppChannelRow row)
    {
        return new WhatsAppChannelResponse(
            row.Id,
            row.TenantId,
            row.DisplayName,
            row.WabaId,
            row.PhoneNumberId,
            row.VerifyToken,
            row.IsActive,
            row.IsPrimary,
            row.LastTestedAt,
            row.LastStatus,
            row.LastError,
            row.UpdatedAt);
    }

    private static AutomationOptionResponse MapAutomationOption(AutomationOptionRow row)
    {
        return new AutomationOptionResponse(
            row.Id,
            row.TenantId,
            row.Name,
            row.TriggerKeywords,
            row.ResponseTemplate,
            row.EscalateToHuman,
            row.SortOrder,
            row.IsActive,
            row.CreatedAt,
            row.UpdatedAt);
    }

    private static CustomerFeedbackResponse MapFeedback(CustomerFeedbackRow row)
    {
        return new CustomerFeedbackResponse(
            row.Id,
            row.ConversationId,
            row.Conversation?.CustomerName ?? "Cliente",
            row.Conversation?.CustomerPhone ?? "-",
            row.Rating,
            row.Comment,
            row.CreatedAt);
    }

    private static string NormalizePhone(string phone)
    {
        return new string(phone.Where(char.IsDigit).ToArray());
    }

    private static string[] NormalizeTags(string[] tags)
    {
        return (tags ?? [])
            .Where(tag => !string.IsNullOrWhiteSpace(tag))
            .Select(tag => tag.Trim())
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .ToArray();
    }

    private sealed class UserNameRow
    {
        [JsonPropertyName("name")] public string Name { get; set; } = string.Empty;
    }

    private sealed class ContactRow
    {
        [JsonPropertyName("id")] public Guid Id { get; set; }
        [JsonPropertyName("name")] public string Name { get; set; } = string.Empty;
        [JsonPropertyName("phone")] public string Phone { get; set; } = string.Empty;
        [JsonPropertyName("state")] public string? State { get; set; }
        [JsonPropertyName("status")] public string? Status { get; set; }
        [JsonPropertyName("tags")] public string[]? Tags { get; set; }
        [JsonPropertyName("owner_user_id")] public Guid? OwnerUserId { get; set; }
        [JsonPropertyName("created_at")] public DateTimeOffset CreatedAt { get; set; }
        [JsonPropertyName("users")] public UserNameRow? Owner { get; set; }
    }

    private sealed class WhatsAppChannelRow
    {
        [JsonPropertyName("id")] public Guid Id { get; set; }
        [JsonPropertyName("tenant_id")] public Guid TenantId { get; set; }
        [JsonPropertyName("display_name")] public string DisplayName { get; set; } = string.Empty;
        [JsonPropertyName("waba_id")] public string? WabaId { get; set; }
        [JsonPropertyName("phone_number_id")] public string PhoneNumberId { get; set; } = string.Empty;
        [JsonPropertyName("verify_token")] public string VerifyToken { get; set; } = string.Empty;
        [JsonPropertyName("is_active")] public bool IsActive { get; set; }
        [JsonPropertyName("is_primary")] public bool IsPrimary { get; set; }
        [JsonPropertyName("last_tested_at")] public DateTimeOffset? LastTestedAt { get; set; }
        [JsonPropertyName("last_status")] public string? LastStatus { get; set; }
        [JsonPropertyName("last_error")] public string? LastError { get; set; }
        [JsonPropertyName("updated_at")] public DateTimeOffset UpdatedAt { get; set; }
    }

    private sealed class WhatsAppChannelCountRow
    {
        [JsonPropertyName("id")] public Guid Id { get; set; }
    }

    private sealed class AutomationOptionRow
    {
        [JsonPropertyName("id")] public Guid Id { get; set; }
        [JsonPropertyName("tenant_id")] public Guid TenantId { get; set; }
        [JsonPropertyName("name")] public string Name { get; set; } = string.Empty;
        [JsonPropertyName("trigger_keywords")] public string TriggerKeywords { get; set; } = string.Empty;
        [JsonPropertyName("response_template")] public string ResponseTemplate { get; set; } = string.Empty;
        [JsonPropertyName("escalate_to_human")] public bool EscalateToHuman { get; set; }
        [JsonPropertyName("sort_order")] public int SortOrder { get; set; }
        [JsonPropertyName("is_active")] public bool IsActive { get; set; }
        [JsonPropertyName("created_at")] public DateTimeOffset CreatedAt { get; set; }
        [JsonPropertyName("updated_at")] public DateTimeOffset UpdatedAt { get; set; }
    }

    private sealed class BroadcastCampaignRow
    {
        [JsonPropertyName("id")] public Guid Id { get; set; }
        [JsonPropertyName("tenant_id")] public Guid TenantId { get; set; }
        [JsonPropertyName("name")] public string Name { get; set; } = string.Empty;
        [JsonPropertyName("message_template")] public string MessageTemplate { get; set; } = string.Empty;
        [JsonPropertyName("scheduled_at")] public DateTimeOffset ScheduledAt { get; set; }
        [JsonPropertyName("status")] public string Status { get; set; } = string.Empty;
        [JsonPropertyName("tag_filter")] public string? TagFilter { get; set; }
        [JsonPropertyName("created_at")] public DateTimeOffset CreatedAt { get; set; }
    }

    private sealed class BroadcastCampaignRefRow
    {
        [JsonPropertyName("message_template")] public string MessageTemplate { get; set; } = string.Empty;
    }

    private sealed class BroadcastJobRow
    {
        [JsonPropertyName("id")] public Guid Id { get; set; }
        [JsonPropertyName("tenant_id")] public Guid TenantId { get; set; }
        [JsonPropertyName("campaign_id")] public Guid CampaignId { get; set; }
        [JsonPropertyName("contact_id")] public Guid? ContactId { get; set; }
        [JsonPropertyName("customer_phone")] public string CustomerPhone { get; set; } = string.Empty;
        [JsonPropertyName("customer_name")] public string CustomerName { get; set; } = string.Empty;
        [JsonPropertyName("scheduled_at")] public DateTimeOffset ScheduledAt { get; set; }
        [JsonPropertyName("attempt_count")] public int AttemptCount { get; set; }
        [JsonPropertyName("broadcast_campaigns")] public BroadcastCampaignRefRow? BroadcastCampaign { get; set; }
    }

    private sealed class BroadcastJobListRow
    {
        [JsonPropertyName("campaign_id")] public Guid CampaignId { get; set; }
        [JsonPropertyName("status")] public string Status { get; set; } = string.Empty;
    }

    private sealed class BroadcastJobCampaignRefRow
    {
        [JsonPropertyName("campaign_id")] public Guid CampaignId { get; set; }
    }

    private sealed class CustomerFeedbackConversationRow
    {
        [JsonPropertyName("customer_name")] public string CustomerName { get; set; } = "Cliente";
        [JsonPropertyName("customer_phone")] public string CustomerPhone { get; set; } = string.Empty;
    }

    private sealed class CustomerFeedbackRow
    {
        [JsonPropertyName("id")] public Guid Id { get; set; }
        [JsonPropertyName("conversation_id")] public Guid ConversationId { get; set; }
        [JsonPropertyName("rating")] public int Rating { get; set; }
        [JsonPropertyName("comment")] public string? Comment { get; set; }
        [JsonPropertyName("created_at")] public DateTimeOffset CreatedAt { get; set; }
        [JsonPropertyName("conversations")] public CustomerFeedbackConversationRow? Conversation { get; set; }
    }
}
