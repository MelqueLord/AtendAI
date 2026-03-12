using Atendai.Domain.Entities;

namespace Atendai.Application.Interfaces.Repositories;

public interface ICompanyRepository
{
    Task<List<ManagedCompany>> GetCompaniesAsync(string? search = null, int page = 1, int pageSize = 20, CancellationToken cancellationToken = default);
    Task<ManagedCompany?> GetCompanyByIdAsync(Guid companyId, CancellationToken cancellationToken = default);
    Task<ManagedCompany> CreateCompanyAsync(string name, string segment, CancellationToken cancellationToken = default);
    Task<ManagedCompany?> UpdateCompanyAsync(Guid companyId, string name, string segment, CancellationToken cancellationToken = default);
    Task<bool> DeleteCompanyAsync(Guid companyId, CancellationToken cancellationToken = default);
}
