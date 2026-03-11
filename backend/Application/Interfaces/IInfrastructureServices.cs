using backend.Contracts;
using backend.Services;

namespace backend.Application.Interfaces;

public interface IChatCompletionService
{
    Task<string?> GenerateReplyAsync(string businessName, string customerName, string incomingMessage, IReadOnlyCollection<string> trainingRules, CancellationToken cancellationToken = default);
}

public interface IWhatsAppGateway
{
    Task<WhatsAppSendResult> SendTextMessageWithCredentialsAsync(string phoneNumberId, string accessToken, string to, string message, string? apiVersion = null, CancellationToken cancellationToken = default);
    Task<WhatsAppTestResponse> TestCredentialsAsync(string phoneNumberId, string accessToken, string? apiVersion = null, CancellationToken cancellationToken = default);
}

public interface ISecretProtector
{
    string Protect(string value);
    string? UnprotectOrNull(string? value);
}

public interface INotificationDispatcher
{
    void NotifyHuman(string customerPhone, string customerName);
}
