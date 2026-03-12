using Atendai.Domain.Entities;

namespace Atendai.Application.Interfaces.Repositories;

public interface IUserRepository
{
    Task<List<ManagedUser>> GetManagedUsersAsync(Guid? tenantId = null, string? search = null, string? role = null, int page = 1, int pageSize = 20, CancellationToken cancellationToken = default);
    Task<ManagedUser?> GetManagedUserByIdAsync(Guid userId, CancellationToken cancellationToken = default);
    Task<ManagedUser> CreateManagedUserAsync(Guid tenantId, string name, string email, string password, string role, CancellationToken cancellationToken = default);
    Task<ManagedUser?> UpdateManagedUserAsync(Guid userId, string name, string email, string role, string? password, CancellationToken cancellationToken = default);
    Task<bool> DeleteManagedUserAsync(Guid userId, CancellationToken cancellationToken = default);
}
