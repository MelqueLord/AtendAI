using backend.Application.Interfaces;
using System.Text.Json.Serialization;
using backend.Contracts;

namespace backend.Services;

public sealed partial class SupabaseDataStore
{
    public Task UpdateConversationAssignmentAsync(Guid tenantId, Guid conversationId, Guid? assignedUserId, CancellationToken cancellationToken = default)
    {
        return PatchAsync($"conversations?id=eq.{conversationId}&tenant_id=eq.{tenantId}", new
        {
            assigned_user_id = assignedUserId,
            updated_at = DateTimeOffset.UtcNow
        }, cancellationToken);
    }

    public Task UpdateConversationStatusAsync(Guid tenantId, Guid conversationId, string status, CancellationToken cancellationToken = default)
    {
        return PatchAsync($"conversations?id=eq.{conversationId}&tenant_id=eq.{tenantId}", new
        {
            status,
            closed_at = string.Equals(status, "Closed", StringComparison.OrdinalIgnoreCase) ? DateTimeOffset.UtcNow : (DateTimeOffset?)null,
            updated_at = DateTimeOffset.UtcNow
        }, cancellationToken);
    }

    public async Task<List<ConversationNoteResponse>> GetConversationNotesAsync(Guid tenantId, Guid conversationId, CancellationToken cancellationToken = default)
    {
        var rows = await GetAsync<List<ConversationNoteRow>>(
            $"conversation_notes?tenant_id=eq.{tenantId}&conversation_id=eq.{conversationId}&select=id,conversation_id,user_id,note,created_at,users(name)&order=created_at.desc",
            cancellationToken);

        return rows.Select(row => MapConversationNote(row)).ToList();
    }

    public async Task<ConversationNoteResponse> AddConversationNoteAsync(Guid tenantId, Guid conversationId, Guid userId, string userName, string note, CancellationToken cancellationToken = default)
    {
        var created = await PostAsync<List<ConversationNoteRow>>("conversation_notes", new[]
        {
            new
            {
                tenant_id = tenantId,
                conversation_id = conversationId,
                user_id = userId,
                note = note.Trim()
            }
        }, cancellationToken);

        return MapConversationNote(created.First(), userName);
    }

    public async Task<List<QuickReplyTemplateResponse>> GetQuickReplyTemplatesAsync(Guid tenantId, CancellationToken cancellationToken = default)
    {
        var rows = await GetAsync<List<QuickReplyTemplateRow>>(
            $"quick_reply_templates?tenant_id=eq.{tenantId}&select=id,tenant_id,title,body,created_at,updated_at&order=updated_at.desc",
            cancellationToken);

        return rows.Select(MapQuickReplyTemplate).ToList();
    }

    public async Task<QuickReplyTemplateResponse> CreateQuickReplyTemplateAsync(Guid tenantId, QuickReplyTemplateUpsertRequest request, CancellationToken cancellationToken = default)
    {
        var created = await PostAsync<List<QuickReplyTemplateRow>>("quick_reply_templates", new[]
        {
            new
            {
                tenant_id = tenantId,
                title = request.Title.Trim(),
                body = request.Body.Trim()
            }
        }, cancellationToken);

        return MapQuickReplyTemplate(created.First());
    }

    public async Task<QuickReplyTemplateResponse?> UpdateQuickReplyTemplateAsync(Guid tenantId, Guid templateId, QuickReplyTemplateUpsertRequest request, CancellationToken cancellationToken = default)
    {
        await PatchAsync($"quick_reply_templates?id=eq.{templateId}&tenant_id=eq.{tenantId}", new
        {
            title = request.Title.Trim(),
            body = request.Body.Trim(),
            updated_at = DateTimeOffset.UtcNow
        }, cancellationToken);

        var rows = await GetAsync<List<QuickReplyTemplateRow>>(
            $"quick_reply_templates?id=eq.{templateId}&tenant_id=eq.{tenantId}&select=id,tenant_id,title,body,created_at,updated_at&limit=1",
            cancellationToken);

        var row = rows.FirstOrDefault();
        return row is null ? null : MapQuickReplyTemplate(row);
    }

    public async Task<bool> DeleteQuickReplyTemplateAsync(Guid tenantId, Guid templateId, CancellationToken cancellationToken = default)
    {
        await DeleteAsync($"quick_reply_templates?id=eq.{templateId}&tenant_id=eq.{tenantId}", cancellationToken);
        return true;
    }

    private static ConversationNoteResponse MapConversationNote(ConversationNoteRow row, string? fallbackUserName = null)
    {
        return new ConversationNoteResponse(
            row.Id,
            row.ConversationId,
            row.UserId,
            string.IsNullOrWhiteSpace(row.User?.Name) ? (fallbackUserName ?? "Usuario") : row.User.Name,
            row.Note,
            row.CreatedAt);
    }

    private static QuickReplyTemplateResponse MapQuickReplyTemplate(QuickReplyTemplateRow row)
    {
        return new QuickReplyTemplateResponse(row.Id, row.TenantId, row.Title, row.Body, row.CreatedAt, row.UpdatedAt);
    }

    private sealed class ConversationNoteRow
    {
        [JsonPropertyName("id")] public Guid Id { get; set; }
        [JsonPropertyName("conversation_id")] public Guid ConversationId { get; set; }
        [JsonPropertyName("user_id")] public Guid UserId { get; set; }
        [JsonPropertyName("note")] public string Note { get; set; } = string.Empty;
        [JsonPropertyName("created_at")] public DateTimeOffset CreatedAt { get; set; }
        [JsonPropertyName("users")] public UserNameRow? User { get; set; }
    }

    private sealed class QuickReplyTemplateRow
    {
        [JsonPropertyName("id")] public Guid Id { get; set; }
        [JsonPropertyName("tenant_id")] public Guid TenantId { get; set; }
        [JsonPropertyName("title")] public string Title { get; set; } = string.Empty;
        [JsonPropertyName("body")] public string Body { get; set; } = string.Empty;
        [JsonPropertyName("created_at")] public DateTimeOffset CreatedAt { get; set; }
        [JsonPropertyName("updated_at")] public DateTimeOffset UpdatedAt { get; set; }
    }

}
