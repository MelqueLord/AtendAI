using Atendai.Application.Interfaces;

namespace Atendai.Infrastructure.Services;

public sealed class NotificationService(ILogger<NotificationService> logger) : INotificationDispatcher
{
    public void NotifyHuman(string customerPhone, string customerName)
    {
        logger.LogWarning("Handoff para humano solicitado. Cliente: {CustomerName} ({Phone})", customerName, customerPhone);
    }
}
