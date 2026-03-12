using Atendai.API.Extensions;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;

namespace Atendai.API.Hubs;

[Authorize]
public sealed class AttendanceHub : Hub
{
    public static string TenantGroup(Guid tenantId) => $"tenant:{tenantId}";

    public override async Task OnConnectedAsync()
    {
        var tenantId = Context.User?.GetTenantId();
        if (tenantId is null)
        {
            Context.Abort();
            return;
        }

        await Groups.AddToGroupAsync(Context.ConnectionId, TenantGroup(tenantId.Value));
        await base.OnConnectedAsync();
    }
}
