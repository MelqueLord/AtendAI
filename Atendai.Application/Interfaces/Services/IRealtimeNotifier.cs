namespace Atendai.Application.Interfaces;

public interface IAttendanceRealtimeNotifier
{
    Task NotifyInboxChangedAsync(Guid tenantId, Guid? conversationId = null, CancellationToken cancellationToken = default);
}
