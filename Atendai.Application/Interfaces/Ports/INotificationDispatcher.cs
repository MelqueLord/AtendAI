namespace Atendai.Application.Interfaces;

public interface INotificationDispatcher
{
    void NotifyHuman(string customerPhone, string customerName);
}
