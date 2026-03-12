using Atendai.Application.DTOs;
using Atendai.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Atendai.API.Extensions;

namespace Atendai.API.Controllers;

[ApiController]
[Route("api/settings")]
[Authorize(Roles = "Admin,SuperAdmin")]
public sealed class SettingsController(ISettingsService settingsService) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetSettings(CancellationToken cancellationToken)
    {
        var tenantId = User.GetTenantId();
        if (tenantId is null)
        {
            return Unauthorized(new { message = "Tenant nao identificado." });
        }

        var settings = await settingsService.GetSettingsAsync(tenantId.Value, cancellationToken);
        return Ok(settings);
    }

    [HttpPut]
    public async Task<IActionResult> Update([FromBody] UpdateSettingsRequest request, CancellationToken cancellationToken)
    {
        var tenantId = User.GetTenantId();
        if (tenantId is null)
        {
            return Unauthorized(new { message = "Tenant nao identificado." });
        }

        var updated = await settingsService.UpdateSettingsAsync(tenantId.Value, request, cancellationToken);
        return Ok(updated);
    }

    [HttpPost("training")]
    public async Task<IActionResult> AddTraining([FromBody] AddTrainingRequest request, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(request.Keyword) || string.IsNullOrWhiteSpace(request.AnswerTemplate))
        {
            return BadRequest(new { message = "Keyword e AnswerTemplate sao obrigatorios." });
        }

        var tenantId = User.GetTenantId();
        if (tenantId is null)
        {
            return Unauthorized(new { message = "Tenant nao identificado." });
        }

        var entries = await settingsService.AddTrainingEntryAsync(tenantId.Value, request, cancellationToken);
        return Ok(entries);
    }
}

