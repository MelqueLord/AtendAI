using backend.Application.Interfaces;
using backend.Contracts;
using backend.Models;

namespace backend.Services;

public sealed class SettingsService(IDataStore store) : ISettingsService
{
    public Task<BusinessSettings> GetSettingsAsync(Guid tenantId, CancellationToken cancellationToken = default)
    {
        return store.GetSettingsAsync(tenantId, cancellationToken);
    }

    public async Task<BusinessSettings> UpdateSettingsAsync(Guid tenantId, UpdateSettingsRequest request, CancellationToken cancellationToken = default)
    {
        await store.UpdateSettingsAsync(tenantId, request, cancellationToken);
        return await store.GetSettingsAsync(tenantId, cancellationToken);
    }

    public async Task<List<TrainingEntry>> AddTrainingEntryAsync(Guid tenantId, AddTrainingRequest request, CancellationToken cancellationToken = default)
    {
        await store.AddTrainingEntryAsync(tenantId, request, cancellationToken);
        return await store.GetTrainingEntriesAsync(tenantId, cancellationToken);
    }
}
