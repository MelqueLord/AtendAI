using Atendai.Domain.Entities;

namespace Atendai.Application.Interfaces.Repositories;

public interface IContactRepository
{
    Task<List<Contact>> GetContactsAsync(Guid tenantId, string? search = null, string? state = null, string? status = null, string? tag = null, int page = 1, int pageSize = 50, CancellationToken cancellationToken = default);
    Task<Contact?> FindContactByPhoneAsync(Guid tenantId, string phone, CancellationToken cancellationToken = default);
    Task<Contact> CreateContactAsync(Guid tenantId, string name, string phone, string? state, string? status, string[] tags, Guid? ownerUserId, CancellationToken cancellationToken = default);
    Task<Contact?> UpdateContactAsync(Guid tenantId, Guid contactId, string name, string phone, string? state, string? status, string[] tags, Guid? ownerUserId, CancellationToken cancellationToken = default);
    Task<bool> DeleteContactAsync(Guid tenantId, Guid contactId, CancellationToken cancellationToken = default);
}
