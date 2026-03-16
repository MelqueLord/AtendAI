using Atendai.Application.DTOs;

namespace Atendai.Application.Interfaces;

public interface IWhatsAppWebSessionService
{
    Task<WhatsAppWebSessionStateResponse> GetStateAsync(Guid tenantId, CancellationToken cancellationToken = default);
    Task<WhatsAppWebSessionActionResponse> StartAsync(Guid tenantId, StartWhatsAppWebSessionRequest request, CancellationToken cancellationToken = default);
    Task<WhatsAppWebSessionActionResponse> RestartAsync(Guid tenantId, CancellationToken cancellationToken = default);
    Task<WhatsAppWebSessionActionResponse> DisconnectAsync(Guid tenantId, CancellationToken cancellationToken = default);
    Task<WhatsAppWebSessionActionResponse> SyncHistoryAsync(Guid tenantId, CancellationToken cancellationToken = default);
    Task<WhatsAppWebSessionActionResponse> SendMessageAsync(Guid tenantId, SendWhatsAppWebSessionMessageRequest request, CancellationToken cancellationToken = default);
}
