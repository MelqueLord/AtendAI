using Atendai.Application.DTOs;

namespace Atendai.Application.Interfaces;

public interface ITenantWhatsAppService
{
    Task<WhatsAppConnectionResponse?> GetConnectionAsync(Guid tenantId, CancellationToken cancellationToken = default);
    Task<List<WhatsAppChannelResponse>> GetChannelsAsync(Guid tenantId, CancellationToken cancellationToken = default);
    Task<WhatsAppConnectionResponse> UpsertConnectionAsync(Guid tenantId, UpsertWhatsAppConnectionRequest request, CancellationToken cancellationToken = default);
    Task<WhatsAppChannelResponse> CreateChannelAsync(Guid tenantId, UpsertWhatsAppChannelRequest request, CancellationToken cancellationToken = default);
    Task<WhatsAppChannelResponse?> UpdateChannelAsync(Guid tenantId, Guid channelId, UpsertWhatsAppChannelRequest request, CancellationToken cancellationToken = default);
    Task<bool> DeleteChannelAsync(Guid tenantId, Guid channelId, CancellationToken cancellationToken = default);
    Task<WhatsAppTestResponse> TestConnectionAsync(Guid tenantId, CancellationToken cancellationToken = default);
    Task<WhatsAppTestResponse> TestChannelAsync(Guid tenantId, Guid channelId, CancellationToken cancellationToken = default);
    Task<Guid?> ResolveTenantIdByPhoneNumberIdAsync(string phoneNumberId, CancellationToken cancellationToken = default);
    Task<WhatsAppChannelResponse?> GetChannelByPhoneNumberIdAsync(Guid tenantId, string phoneNumberId, CancellationToken cancellationToken = default);
    Task<Guid?> ResolveTenantIdByVerifyTokenAsync(string verifyToken, CancellationToken cancellationToken = default);
    Task<WhatsAppSendResult> SendMessageAsync(Guid tenantId, Guid? conversationId, string toPhone, string message, CancellationToken cancellationToken = default, Guid? channelId = null, string? preferredTransport = null);
    Task<List<WhatsAppMessageLogResponse>> GetLogsAsync(Guid tenantId, int limit = 100, CancellationToken cancellationToken = default);
    Task<int> GetAllowedChannelsAsync(Guid tenantId, CancellationToken cancellationToken = default);
    Task<MetaWhatsAppSetupResponse> GetMetaSetupAsync(Guid tenantId, string? publicBaseUrl, CancellationToken cancellationToken = default);
    Task<MetaWhatsAppBootstrapResponse> BootstrapMetaChannelAsync(Guid tenantId, MetaWhatsAppBootstrapRequest request, CancellationToken cancellationToken = default);
    Task<MetaEmbeddedSignupConfigResponse> GetEmbeddedSignupConfigAsync(CancellationToken cancellationToken = default);
    Task<MetaEmbeddedSignupExchangeResponse> CompleteEmbeddedSignupAsync(Guid tenantId, CompleteMetaEmbeddedSignupRequest request, CancellationToken cancellationToken = default);
}
