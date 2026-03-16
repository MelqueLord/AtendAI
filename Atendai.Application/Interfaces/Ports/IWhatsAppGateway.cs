using Atendai.Application.DTOs;

namespace Atendai.Application.Interfaces;

public interface IWhatsAppGateway
{
    Task<WhatsAppSendResult> SendTextMessageWithCredentialsAsync(
        string phoneNumberId,
        string accessToken,
        string to,
        string message,
        string? apiVersion = null,
        CancellationToken cancellationToken = default);

    Task<WhatsAppTestResponse> TestCredentialsAsync(
        string phoneNumberId,
        string accessToken,
        string? apiVersion = null,
        CancellationToken cancellationToken = default);
}
