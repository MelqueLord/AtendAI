using Atendai.Application.DTOs;
using Atendai.API.Extensions;
using Atendai.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Atendai.API.Controllers;

[ApiController]
[Route("api/engagement")]
[Authorize(Roles = "Admin,SuperAdmin")]
public sealed class EngagementController(
    ITenantWhatsAppService tenantWhatsAppService,
    ICampaignAutomationService campaignAutomationService,
    IWhatsAppWebSessionService whatsAppWebSessionService) : ControllerBase
{
    [HttpGet("whatsapp/meta/setup")]
    public async Task<IActionResult> GetMetaSetup([FromQuery] string? publicBaseUrl, CancellationToken cancellationToken)
    {
        var tenantId = User.GetTenantId();
        if (tenantId is null)
        {
            return Unauthorized(new { message = "Tenant nao identificado." });
        }

        var setup = await tenantWhatsAppService.GetMetaSetupAsync(tenantId.Value, publicBaseUrl, cancellationToken);
        return Ok(setup);
    }

    [HttpGet("whatsapp/meta/embedded-signup/config")]
    public async Task<IActionResult> GetEmbeddedSignupConfig(CancellationToken cancellationToken)
    {
        var config = await tenantWhatsAppService.GetEmbeddedSignupConfigAsync(cancellationToken);
        return Ok(config);
    }

    [HttpPost("whatsapp/meta/embedded-signup/complete")]
    public async Task<IActionResult> CompleteEmbeddedSignup([FromBody] CompleteMetaEmbeddedSignupRequest request, CancellationToken cancellationToken)
    {
        var tenantId = User.GetTenantId();
        if (tenantId is null)
        {
            return Unauthorized(new { message = "Tenant nao identificado." });
        }

        var result = await tenantWhatsAppService.CompleteEmbeddedSignupAsync(tenantId.Value, request, cancellationToken);
        return Ok(result);
    }

    [HttpPost("whatsapp/meta/bootstrap")]
    public async Task<IActionResult> BootstrapMeta([FromBody] MetaWhatsAppBootstrapRequest request, CancellationToken cancellationToken)
    {
        var tenantId = User.GetTenantId();
        if (tenantId is null)
        {
            return Unauthorized(new { message = "Tenant nao identificado." });
        }

        var result = await tenantWhatsAppService.BootstrapMetaChannelAsync(tenantId.Value, request, cancellationToken);
        return Ok(result);
    }

    [HttpGet("whatsapp")]
    public async Task<IActionResult> GetWhatsApp(CancellationToken cancellationToken)
    {
        var tenantId = User.GetTenantId();
        if (tenantId is null)
        {
            return Unauthorized(new { message = "Tenant nao identificado." });
        }

        var config = await tenantWhatsAppService.GetConnectionAsync(tenantId.Value, cancellationToken);
        return Ok(config);
    }

    [HttpGet("whatsapp/channels")]
    public async Task<IActionResult> GetWhatsAppChannels(CancellationToken cancellationToken)
    {
        var tenantId = User.GetTenantId();
        if (tenantId is null)
        {
            return Unauthorized(new { message = "Tenant nao identificado." });
        }

        var channels = await tenantWhatsAppService.GetChannelsAsync(tenantId.Value, cancellationToken);
        return Ok(new
        {
            allowed = await tenantWhatsAppService.GetAllowedChannelsAsync(tenantId.Value, cancellationToken),
            used = channels.Count,
            channels
        });
    }

    [HttpPut("whatsapp")]
    public async Task<IActionResult> UpsertWhatsApp([FromBody] UpsertWhatsAppConnectionRequest request, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(request.PhoneNumberId) || string.IsNullOrWhiteSpace(request.VerifyToken))
        {
            return BadRequest(new { message = "PhoneNumberId e VerifyToken sao obrigatorios." });
        }

        var tenantId = User.GetTenantId();
        if (tenantId is null)
        {
            return Unauthorized(new { message = "Tenant nao identificado." });
        }

        var updated = await tenantWhatsAppService.UpsertConnectionAsync(tenantId.Value, request, cancellationToken);
        return Ok(updated);
    }

    [HttpPost("whatsapp/channels")]
    public async Task<IActionResult> CreateWhatsAppChannel([FromBody] UpsertWhatsAppChannelRequest request, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(request.DisplayName) || string.IsNullOrWhiteSpace(request.PhoneNumberId) || string.IsNullOrWhiteSpace(request.VerifyToken))
        {
            return BadRequest(new { message = "DisplayName, PhoneNumberId e VerifyToken sao obrigatorios." });
        }

        var tenantId = User.GetTenantId();
        if (tenantId is null)
        {
            return Unauthorized(new { message = "Tenant nao identificado." });
        }

        var created = await tenantWhatsAppService.CreateChannelAsync(tenantId.Value, request, cancellationToken);
        return Ok(created);
    }

    [HttpPut("whatsapp/channels/{channelId:guid}")]
    public async Task<IActionResult> UpdateWhatsAppChannel(Guid channelId, [FromBody] UpsertWhatsAppChannelRequest request, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(request.DisplayName) || string.IsNullOrWhiteSpace(request.PhoneNumberId) || string.IsNullOrWhiteSpace(request.VerifyToken))
        {
            return BadRequest(new { message = "DisplayName, PhoneNumberId e VerifyToken sao obrigatorios." });
        }

        var tenantId = User.GetTenantId();
        if (tenantId is null)
        {
            return Unauthorized(new { message = "Tenant nao identificado." });
        }

        var updated = await tenantWhatsAppService.UpdateChannelAsync(tenantId.Value, channelId, request, cancellationToken);
        return updated is null ? NotFound(new { message = "Canal nao encontrado." }) : Ok(updated);
    }

    [HttpDelete("whatsapp/channels/{channelId:guid}")]
    public async Task<IActionResult> DeleteWhatsAppChannel(Guid channelId, CancellationToken cancellationToken)
    {
        var tenantId = User.GetTenantId();
        if (tenantId is null)
        {
            return Unauthorized(new { message = "Tenant nao identificado." });
        }

        await tenantWhatsAppService.DeleteChannelAsync(tenantId.Value, channelId, cancellationToken);
        return NoContent();
    }

    [HttpPost("whatsapp/channels/{channelId:guid}/test")]
    public async Task<IActionResult> TestWhatsAppChannel(Guid channelId, CancellationToken cancellationToken)
    {
        var tenantId = User.GetTenantId();
        if (tenantId is null)
        {
            return Unauthorized(new { message = "Tenant nao identificado." });
        }

        var result = await tenantWhatsAppService.TestChannelAsync(tenantId.Value, channelId, cancellationToken);
        return Ok(result);
    }

    [HttpPost("whatsapp/test")]
    public async Task<IActionResult> TestWhatsApp(CancellationToken cancellationToken)
    {
        var tenantId = User.GetTenantId();
        if (tenantId is null)
        {
            return Unauthorized(new { message = "Tenant nao identificado." });
        }

        var result = await tenantWhatsAppService.TestConnectionAsync(tenantId.Value, cancellationToken);
        return Ok(result);
    }

    [HttpGet("whatsapp/web/session")]
    public async Task<IActionResult> GetWhatsAppWebSession(CancellationToken cancellationToken)
    {
        var tenantId = User.GetTenantId();
        if (tenantId is null)
        {
            return Unauthorized(new { message = "Tenant nao identificado." });
        }

        var state = await whatsAppWebSessionService.GetStateAsync(tenantId.Value, cancellationToken);
        return Ok(state);
    }

    [HttpPost("whatsapp/web/session/start")]
    public async Task<IActionResult> StartWhatsAppWebSession([FromBody] StartWhatsAppWebSessionRequest request, CancellationToken cancellationToken)
    {
        var tenantId = User.GetTenantId();
        if (tenantId is null)
        {
            return Unauthorized(new { message = "Tenant nao identificado." });
        }

        var result = await whatsAppWebSessionService.StartAsync(tenantId.Value, request, cancellationToken);
        return Ok(result);
    }

    [HttpPost("whatsapp/web/session/restart")]
    public async Task<IActionResult> RestartWhatsAppWebSession(CancellationToken cancellationToken)
    {
        var tenantId = User.GetTenantId();
        if (tenantId is null)
        {
            return Unauthorized(new { message = "Tenant nao identificado." });
        }

        var result = await whatsAppWebSessionService.RestartAsync(tenantId.Value, cancellationToken);
        return Ok(result);
    }

    [HttpPost("whatsapp/web/session/disconnect")]
    public async Task<IActionResult> DisconnectWhatsAppWebSession(CancellationToken cancellationToken)
    {
        var tenantId = User.GetTenantId();
        if (tenantId is null)
        {
            return Unauthorized(new { message = "Tenant nao identificado." });
        }

        var result = await whatsAppWebSessionService.DisconnectAsync(tenantId.Value, cancellationToken);
        return Ok(result);
    }

    [HttpPost("whatsapp/web/session/sync-history")]
    public async Task<IActionResult> SyncWhatsAppWebSessionHistory(CancellationToken cancellationToken)
    {
        var tenantId = User.GetTenantId();
        if (tenantId is null)
        {
            return Unauthorized(new { message = "Tenant nao identificado." });
        }

        var result = await whatsAppWebSessionService.SyncHistoryAsync(tenantId.Value, cancellationToken);
        return Ok(result);
    }

    [HttpPost("whatsapp/web/session/send")]
    public async Task<IActionResult> SendWhatsAppWebSessionMessage([FromBody] SendWhatsAppWebSessionMessageRequest request, CancellationToken cancellationToken)
    {
        var tenantId = User.GetTenantId();
        if (tenantId is null)
        {
            return Unauthorized(new { message = "Tenant nao identificado." });
        }

        var result = await whatsAppWebSessionService.SendMessageAsync(tenantId.Value, request, cancellationToken);
        return Ok(result);
    }

    [HttpGet("campaigns")]
    public async Task<IActionResult> GetCampaigns(CancellationToken cancellationToken)
    {
        var tenantId = User.GetTenantId();
        if (tenantId is null)
        {
            return Unauthorized(new { message = "Tenant nao identificado." });
        }

        var rules = await campaignAutomationService.GetRulesAsync(tenantId.Value, cancellationToken);
        return Ok(rules);
    }

    [HttpPost("campaigns")]
    public async Task<IActionResult> CreateCampaign([FromBody] CampaignRuleUpsertRequest request, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(request.Name) || string.IsNullOrWhiteSpace(request.Template) || request.DelayHours < 1)
        {
            return BadRequest(new { message = "Name, Template e DelayHours >= 1 sao obrigatorios." });
        }

        var tenantId = User.GetTenantId();
        if (tenantId is null)
        {
            return Unauthorized(new { message = "Tenant nao identificado." });
        }

        var created = await campaignAutomationService.CreateRuleAsync(tenantId.Value, request, cancellationToken);
        return Ok(created);
    }

    [HttpPut("campaigns/{ruleId:guid}")]
    public async Task<IActionResult> UpdateCampaign(Guid ruleId, [FromBody] CampaignRuleUpsertRequest request, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(request.Name) || string.IsNullOrWhiteSpace(request.Template) || request.DelayHours < 1)
        {
            return BadRequest(new { message = "Name, Template e DelayHours >= 1 sao obrigatorios." });
        }

        var tenantId = User.GetTenantId();
        if (tenantId is null)
        {
            return Unauthorized(new { message = "Tenant nao identificado." });
        }

        var updated = await campaignAutomationService.UpdateRuleAsync(tenantId.Value, ruleId, request, cancellationToken);
        if (updated is null)
        {
            return NotFound(new { message = "Campanha nao encontrada." });
        }

        return Ok(updated);
    }

    [HttpDelete("campaigns/{ruleId:guid}")]
    public async Task<IActionResult> DeleteCampaign(Guid ruleId, CancellationToken cancellationToken)
    {
        var tenantId = User.GetTenantId();
        if (tenantId is null)
        {
            return Unauthorized(new { message = "Tenant nao identificado." });
        }

        await campaignAutomationService.DeleteRuleAsync(tenantId.Value, ruleId, cancellationToken);
        return Ok(new { deleted = true });
    }

    [HttpGet("logs")]
    public async Task<IActionResult> GetLogs([FromQuery] int limit = 100, CancellationToken cancellationToken = default)
    {
        var tenantId = User.GetTenantId();
        if (tenantId is null)
        {
            return Unauthorized(new { message = "Tenant nao identificado." });
        }

        var logs = await tenantWhatsAppService.GetLogsAsync(tenantId.Value, Math.Clamp(limit, 1, 300), cancellationToken);
        return Ok(logs);
    }
}
