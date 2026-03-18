using Atendai.Application.DTOs;

namespace Atendai.Application.Interfaces;

public interface IWhatsAppWebSessionService
{
    Task<WhatsAppWebSessionListResponse> GetSessionsAsync(Guid tenantId, CancellationToken cancellationToken = default);
    Task<WhatsAppWebSessionStateResponse> GetStateAsync(Guid tenantId, string sessionId, CancellationToken cancellationToken = default);
    Task<WhatsAppWebSessionActionResponse> StartAsync(Guid tenantId, StartWhatsAppWebSessionRequest request, CancellationToken cancellationToken = default);
    Task<WhatsAppWebSessionActionResponse> RestartAsync(Guid tenantId, string sessionId, CancellationToken cancellationToken = default);
    Task<WhatsAppWebSessionActionResponse> DisconnectAsync(Guid tenantId, string sessionId, CancellationToken cancellationToken = default);
    Task<WhatsAppWebSessionActionResponse> SyncHistoryAsync(Guid tenantId, string sessionId, CancellationToken cancellationToken = default);
    Task<WhatsAppWebSessionActionResponse> SendMessageAsync(Guid tenantId, string sessionId, SendWhatsAppWebSessionMessageRequest request, CancellationToken cancellationToken = default);
}
