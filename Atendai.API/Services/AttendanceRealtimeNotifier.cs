using Atendai.Application.Interfaces;
using Atendai.API.Hubs;
using Microsoft.AspNetCore.SignalR;

namespace Atendai.API.Services;

public sealed class AttendanceRealtimeNotifier(IHubContext<AttendanceHub> hubContext) : IAttendanceRealtimeNotifier
{
    public Task NotifyInboxChangedAsync(Guid tenantId, Guid? conversationId = null, CancellationToken cancellationToken = default)
    {
        var publishedAtUtc = DateTimeOffset.UtcNow;
        return hubContext.Clients.Group(AttendanceHub.TenantGroup(tenantId)).SendAsync(
            "attendance:refresh",
            new
            {
                conversationId = conversationId?.ToString(),
                publishedAtUtc
            },
            cancellationToken);
    }
}
