using Atendai.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Atendai.API.Extensions;

namespace Atendai.API.Controllers;

[ApiController]
[Route("api/analytics")]
[Authorize]
public sealed class AnalyticsController(IAnalyticsService analyticsService) : ControllerBase
{
    [HttpGet("overview")]
    public async Task<IActionResult> GetOverview(CancellationToken cancellationToken)
    {
        var tenantId = User.GetTenantId();
        if (tenantId is null)
        {
            return Unauthorized(new { message = "Tenant nao identificado." });
        }

        var result = await analyticsService.GetOverviewAsync(tenantId.Value, cancellationToken);
        return Ok(result);
    }
}
