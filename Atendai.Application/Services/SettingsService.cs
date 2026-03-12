using Atendai.Application.DTOs;
using Atendai.Application.Interfaces;
using Atendai.Application.Interfaces.Repositories;
using Atendai.Domain.Entities;

namespace Atendai.Application.Services;

public sealed class SettingsService(ISettingsRepository settingsRepository) : ISettingsService
{
    public async Task<BusinessSettingsResponse> GetSettingsAsync(Guid tenantId, CancellationToken cancellationToken = default)
    {
        var settings = await settingsRepository.GetSettingsAsync(tenantId, cancellationToken);
        return MapSettings(settings);
    }

    public async Task<BusinessSettingsResponse> UpdateSettingsAsync(Guid tenantId, UpdateSettingsRequest request, CancellationToken cancellationToken = default)
    {
        await settingsRepository.UpdateSettingsAsync(tenantId, request.BusinessName, request.WelcomeMessage, request.HumanFallbackMessage, cancellationToken);
        var updated = await settingsRepository.GetSettingsAsync(tenantId, cancellationToken);
        return MapSettings(updated);
    }

    public async Task<List<TrainingEntryResponse>> AddTrainingEntryAsync(Guid tenantId, AddTrainingRequest request, CancellationToken cancellationToken = default)
    {
        await settingsRepository.AddTrainingEntryAsync(tenantId, request.Keyword, request.AnswerTemplate, cancellationToken);
        var entries = await settingsRepository.GetTrainingEntriesAsync(tenantId, cancellationToken);
        return entries.Select(MapTrainingEntry).ToList();
    }

    private static BusinessSettingsResponse MapSettings(BusinessSettings settings)
    {
        return new BusinessSettingsResponse(
            settings.BusinessName,
            settings.WelcomeMessage,
            settings.HumanFallbackMessage,
            settings.TrainingEntries.Select(MapTrainingEntry).ToList());
    }

    private static TrainingEntryResponse MapTrainingEntry(TrainingEntry entry)
    {
        return new TrainingEntryResponse(entry.Id, entry.Keyword, entry.AnswerTemplate);
    }
}
