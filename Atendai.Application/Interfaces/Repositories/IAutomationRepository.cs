using Atendai.Domain.Entities;

namespace Atendai.Application.Interfaces.Repositories;

public interface IAutomationRepository
{
    Task<List<AutomationOption>> GetAutomationOptionsAsync(Guid tenantId, CancellationToken cancellationToken = default);
    Task<AutomationOption> CreateAutomationOptionAsync(Guid tenantId, string name, string triggerKeywords, string responseTemplate, bool escalateToHuman, int sortOrder, bool isActive, CancellationToken cancellationToken = default);
    Task<AutomationOption?> UpdateAutomationOptionAsync(Guid tenantId, Guid optionId, string name, string triggerKeywords, string responseTemplate, bool escalateToHuman, int sortOrder, bool isActive, CancellationToken cancellationToken = default);
    Task<bool> DeleteAutomationOptionAsync(Guid tenantId, Guid optionId, CancellationToken cancellationToken = default);
}
