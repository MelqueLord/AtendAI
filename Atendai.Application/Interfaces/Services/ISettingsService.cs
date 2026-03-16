using Atendai.Application.DTOs;

namespace Atendai.Application.Interfaces;

public interface ISettingsService
{
    Task<BusinessSettingsResponse> GetSettingsAsync(Guid tenantId, CancellationToken cancellationToken = default);
    Task<BusinessSettingsResponse> UpdateSettingsAsync(Guid tenantId, UpdateSettingsRequest request, CancellationToken cancellationToken = default);
    Task<List<TrainingEntryResponse>> AddTrainingEntryAsync(Guid tenantId, AddTrainingRequest request, CancellationToken cancellationToken = default);
}
