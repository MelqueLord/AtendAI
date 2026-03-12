using Atendai.Domain.Entities;

namespace Atendai.Application.Interfaces.Repositories;

public interface ISettingsRepository
{
    Task<BusinessSettings> GetSettingsAsync(Guid tenantId, CancellationToken cancellationToken = default);
    Task UpdateSettingsAsync(Guid tenantId, string businessName, string welcomeMessage, string humanFallbackMessage, CancellationToken cancellationToken = default);
    Task<List<TrainingEntry>> GetTrainingEntriesAsync(Guid tenantId, CancellationToken cancellationToken = default);
    Task AddTrainingEntryAsync(Guid tenantId, string keyword, string answerTemplate, CancellationToken cancellationToken = default);
}
