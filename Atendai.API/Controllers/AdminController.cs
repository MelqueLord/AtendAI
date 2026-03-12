using Atendai.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Atendai.API.Controllers;

[ApiController]
[Route("api/admin")]
[Authorize(Roles = "SuperAdmin")]
public sealed class AdminController(IAdminService adminService) : ControllerBase
{
    [HttpGet("tenants")]
    public async Task<IActionResult> GetTenants(CancellationToken cancellationToken)
    {
        var tenants = await adminService.GetTenantsAsync(cancellationToken);
        return Ok(tenants);
    }
}
