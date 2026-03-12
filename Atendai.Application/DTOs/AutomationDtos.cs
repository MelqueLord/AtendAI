namespace Atendai.Application.DTOs;

public sealed record AutomationOptionResponse(
    Guid Id,
    Guid TenantId,
    string Name,
    string TriggerKeywords,
    string ResponseTemplate,
    bool EscalateToHuman,
    int SortOrder,
    bool IsActive,
    DateTimeOffset CreatedAt,
    DateTimeOffset UpdatedAt);

public sealed record AutomationOptionUpsertRequest(
    string Name,
    string TriggerKeywords,
    string ResponseTemplate,
    bool EscalateToHuman,
    int SortOrder,
    bool IsActive);
