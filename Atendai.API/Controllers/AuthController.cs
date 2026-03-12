using Atendai.Application.DTOs;
using Atendai.API.Extensions;
using Atendai.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Atendai.API.Controllers;

[ApiController]
[Route("api/auth")]
public sealed class AuthController(IAuthService authService) : ControllerBase
{
    [HttpPost("login")]
    public async Task<ActionResult<AuthResponse>> Login([FromBody] LoginRequest request, CancellationToken cancellationToken)
    {
        var response = await authService.LoginAsync(request, cancellationToken);
        if (response is null)
        {
            return Unauthorized(new { message = "Credenciais invalidas ou conta temporariamente bloqueada." });
        }

        return Ok(response);
    }

    [HttpPost("refresh")]
    public async Task<ActionResult<AuthResponse>> Refresh([FromBody] RefreshTokenRequest request, CancellationToken cancellationToken)
    {
        var response = await authService.RefreshAsync(request, cancellationToken);
        if (response is null)
        {
            return Unauthorized(new { message = "Refresh token invalido ou expirado." });
        }

        return Ok(response);
    }

    [HttpPost("logout")]
    public async Task<IActionResult> Logout([FromBody] LogoutRequest request, CancellationToken cancellationToken)
    {
        await authService.LogoutAsync(request, cancellationToken);
        return Ok(new { message = "Sessao encerrada." });
    }

    [HttpPost("switch-tenant")]
    [Authorize(Roles = "SuperAdmin")]
    public async Task<ActionResult<AuthResponse>> SwitchTenant([FromBody] SwitchTenantRequest request, CancellationToken cancellationToken)
    {
        var userId = User.GetUserId();
        if (userId is null)
        {
            return Unauthorized(new { message = "Usuario invalido no token." });
        }

        var response = await authService.SwitchTenantAsync(userId.Value, request.TenantId, cancellationToken);
        if (response is null)
        {
            return BadRequest(new { message = "Nao foi possivel alternar tenant." });
        }

        return Ok(response);
    }
}
