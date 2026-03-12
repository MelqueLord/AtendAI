using Atendai.Domain.Entities;

namespace Atendai.Application.Interfaces.Repositories;

public interface IWhatsAppRepository
{
    Task<WhatsAppConnection?> GetWhatsAppConnectionAsync(Guid tenantId, CancellationToken cancellationToken = default);
    Task<List<WhatsAppChannel>> GetWhatsAppChannelsAsync(Guid tenantId, CancellationToken cancellationToken = default);
    Task<WhatsAppChannel?> GetWhatsAppChannelByIdAsync(Guid tenantId, Guid channelId, CancellationToken cancellationToken = default);
    Task<WhatsAppChannel?> GetWhatsAppChannelByPhoneNumberIdAsync(Guid tenantId, string phoneNumberId, CancellationToken cancellationToken = default);
    Task<int> GetWhatsAppChannelsCountAsync(Guid tenantId, CancellationToken cancellationToken = default);
    Task<string?> GetWhatsAppEncryptedTokenAsync(Guid tenantId, CancellationToken cancellationToken = default, Guid? channelId = null);
    Task<WhatsAppConnection> UpsertWhatsAppConnectionAsync(Guid tenantId, string? wabaId, string phoneNumberId, string verifyToken, string? encryptedAccessToken, bool isActive, CancellationToken cancellationToken = default);
    Task<WhatsAppChannel> CreateWhatsAppChannelAsync(Guid tenantId, string displayName, string? wabaId, string phoneNumberId, string verifyToken, string? encryptedAccessToken, bool isActive, bool isPrimary, CancellationToken cancellationToken = default);
    Task<WhatsAppChannel?> UpdateWhatsAppChannelAsync(Guid tenantId, Guid channelId, string displayName, string? wabaId, string phoneNumberId, string verifyToken, string? encryptedAccessToken, bool isActive, bool isPrimary, CancellationToken cancellationToken = default);
    Task<bool> DeleteWhatsAppChannelAsync(Guid tenantId, Guid channelId, CancellationToken cancellationToken = default);
    Task<Guid?> FindTenantIdByPhoneNumberIdAsync(string phoneNumberId, CancellationToken cancellationToken = default);
    Task<Guid?> FindTenantIdByVerifyTokenAsync(string verifyToken, CancellationToken cancellationToken = default);
    Task MarkWhatsAppConnectionTestResultAsync(Guid tenantId, bool success, string status, string? error, CancellationToken cancellationToken = default, Guid? channelId = null);
    Task AddWhatsAppMessageLogAsync(Guid tenantId, Guid? conversationId, string toPhone, string direction, string status, string? errorDetail, string? payload, CancellationToken cancellationToken = default);
    Task<List<WhatsAppMessageLog>> GetWhatsAppMessageLogsAsync(Guid tenantId, int limit = 100, CancellationToken cancellationToken = default);
}
