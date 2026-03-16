using Atendai.Application.DTOs;

namespace Atendai.Application.Interfaces;

public interface IAnalyticsService
{
    Task<AnalyticsOverviewResponse> GetOverviewAsync(Guid tenantId, CancellationToken cancellationToken = default);
}
