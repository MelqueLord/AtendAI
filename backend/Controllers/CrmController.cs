using backend.Contracts;
using backend.Extensions;
using backend.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace backend.Controllers;

[ApiController]
[Route("api/crm")]
[Authorize]
public sealed class CrmController(ICrmService crmService) : ControllerBase
{
    [HttpGet("contacts")]
    public async Task<IActionResult> GetContacts(
        [FromQuery] string? search,
        [FromQuery] string? state,
        [FromQuery] string? status,
        [FromQuery] string? tag,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 50,
        CancellationToken cancellationToken = default)
    {
        var tenantId = User.GetTenantId();
        if (tenantId is null)
        {
            return Unauthorized(new { message = "Tenant nao identificado." });
        }

        var contacts = await crmService.GetContactsAsync(tenantId.Value, search, state, status, tag, page, pageSize, cancellationToken);
        return Ok(contacts);
    }

    [HttpPost("contacts")]
    [Authorize(Roles = "Admin,Agent,SuperAdmin")]
    public async Task<IActionResult> CreateContact([FromBody] ContactUpsertRequest request, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(request.Name) || string.IsNullOrWhiteSpace(request.Phone))
        {
            return BadRequest(new { message = "Nome e telefone sao obrigatorios." });
        }

        var tenantId = User.GetTenantId();
        if (tenantId is null)
        {
            return Unauthorized(new { message = "Tenant nao identificado." });
        }

        var created = await crmService.CreateContactAsync(tenantId.Value, request, cancellationToken);
        return Ok(created);
    }

    [HttpPut("contacts/{contactId:guid}")]
    [Authorize(Roles = "Admin,Agent,SuperAdmin")]
    public async Task<IActionResult> UpdateContact(Guid contactId, [FromBody] ContactUpsertRequest request, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(request.Name) || string.IsNullOrWhiteSpace(request.Phone))
        {
            return BadRequest(new { message = "Nome e telefone sao obrigatorios." });
        }

        var tenantId = User.GetTenantId();
        if (tenantId is null)
        {
            return Unauthorized(new { message = "Tenant nao identificado." });
        }

        var updated = await crmService.UpdateContactAsync(tenantId.Value, contactId, request, cancellationToken);
        return updated is null ? NotFound(new { message = "Contato nao encontrado." }) : Ok(updated);
    }

    [HttpDelete("contacts/{contactId:guid}")]
    [Authorize(Roles = "Admin,Agent,SuperAdmin")]
    public async Task<IActionResult> DeleteContact(Guid contactId, CancellationToken cancellationToken)
    {
        var tenantId = User.GetTenantId();
        if (tenantId is null)
        {
            return Unauthorized(new { message = "Tenant nao identificado." });
        }

        await crmService.DeleteContactAsync(tenantId.Value, contactId, cancellationToken);
        return NoContent();
    }

    [HttpPost("contacts/import")]
    [Authorize(Roles = "Admin,Agent,SuperAdmin")]
    public async Task<IActionResult> ImportContacts([FromBody] ContactImportRequest request, CancellationToken cancellationToken)
    {
        var tenantId = User.GetTenantId();
        if (tenantId is null)
        {
            return Unauthorized(new { message = "Tenant nao identificado." });
        }

        var imported = await crmService.ImportContactsAsync(tenantId.Value, request, cancellationToken);
        return Ok(imported);
    }

    [HttpGet("automation-options")]
    [Authorize(Roles = "Admin,SuperAdmin")]
    public async Task<IActionResult> GetAutomationOptions(CancellationToken cancellationToken)
    {
        var tenantId = User.GetTenantId();
        if (tenantId is null)
        {
            return Unauthorized(new { message = "Tenant nao identificado." });
        }

        var options = await crmService.GetAutomationOptionsAsync(tenantId.Value, cancellationToken);
        return Ok(options);
    }

    [HttpPost("automation-options")]
    [Authorize(Roles = "Admin,SuperAdmin")]
    public async Task<IActionResult> CreateAutomationOption([FromBody] AutomationOptionUpsertRequest request, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(request.Name) || string.IsNullOrWhiteSpace(request.TriggerKeywords) || string.IsNullOrWhiteSpace(request.ResponseTemplate))
        {
            return BadRequest(new { message = "Nome, palavras-chave e resposta sao obrigatorios." });
        }

        var tenantId = User.GetTenantId();
        if (tenantId is null)
        {
            return Unauthorized(new { message = "Tenant nao identificado." });
        }

        var created = await crmService.CreateAutomationOptionAsync(tenantId.Value, request, cancellationToken);
        return Ok(created);
    }

    [HttpPut("automation-options/{optionId:guid}")]
    [Authorize(Roles = "Admin,SuperAdmin")]
    public async Task<IActionResult> UpdateAutomationOption(Guid optionId, [FromBody] AutomationOptionUpsertRequest request, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(request.Name) || string.IsNullOrWhiteSpace(request.TriggerKeywords) || string.IsNullOrWhiteSpace(request.ResponseTemplate))
        {
            return BadRequest(new { message = "Nome, palavras-chave e resposta sao obrigatorios." });
        }

        var tenantId = User.GetTenantId();
        if (tenantId is null)
        {
            return Unauthorized(new { message = "Tenant nao identificado." });
        }

        var updated = await crmService.UpdateAutomationOptionAsync(tenantId.Value, optionId, request, cancellationToken);
        return updated is null ? NotFound(new { message = "Fluxo nao encontrado." }) : Ok(updated);
    }

    [HttpDelete("automation-options/{optionId:guid}")]
    [Authorize(Roles = "Admin,SuperAdmin")]
    public async Task<IActionResult> DeleteAutomationOption(Guid optionId, CancellationToken cancellationToken)
    {
        var tenantId = User.GetTenantId();
        if (tenantId is null)
        {
            return Unauthorized(new { message = "Tenant nao identificado." });
        }

        await crmService.DeleteAutomationOptionAsync(tenantId.Value, optionId, cancellationToken);
        return NoContent();
    }

    [HttpGet("broadcasts")]
    [Authorize(Roles = "Admin,SuperAdmin")]
    public async Task<IActionResult> GetBroadcasts(CancellationToken cancellationToken)
    {
        var tenantId = User.GetTenantId();
        if (tenantId is null)
        {
            return Unauthorized(new { message = "Tenant nao identificado." });
        }

        var campaigns = await crmService.GetBroadcastsAsync(tenantId.Value, cancellationToken);
        return Ok(campaigns);
    }

    [HttpPost("broadcasts")]
    [Authorize(Roles = "Admin,SuperAdmin")]
    public async Task<IActionResult> ScheduleBroadcast([FromBody] ScheduleBroadcastRequest request, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(request.Name) || string.IsNullOrWhiteSpace(request.MessageTemplate))
        {
            return BadRequest(new { message = "Nome e mensagem sao obrigatorios." });
        }

        var tenantId = User.GetTenantId();
        var userId = User.GetUserId();
        if (tenantId is null || userId is null)
        {
            return Unauthorized(new { message = "Contexto de usuario invalido." });
        }

        var created = await crmService.ScheduleBroadcastAsync(tenantId.Value, userId.Value, request, cancellationToken);
        return Ok(created);
    }

    [HttpGet("queue-health")]
    public async Task<IActionResult> GetQueueHealth(CancellationToken cancellationToken)
    {
        var tenantId = User.GetTenantId();
        if (tenantId is null)
        {
            return Unauthorized(new { message = "Tenant nao identificado." });
        }

        var health = await crmService.GetQueueHealthAsync(tenantId.Value, cancellationToken);
        return Ok(health);
    }

    [HttpGet("feedback")]
    public async Task<IActionResult> GetFeedback([FromQuery] int limit = 100, CancellationToken cancellationToken = default)
    {
        var tenantId = User.GetTenantId();
        if (tenantId is null)
        {
            return Unauthorized(new { message = "Tenant nao identificado." });
        }

        var feedback = await crmService.GetFeedbackAsync(tenantId.Value, limit, cancellationToken);
        return Ok(feedback);
    }

    [HttpPost("conversations/{conversationId:guid}/feedback")]
    [Authorize(Roles = "Admin,Agent,SuperAdmin")]
    public async Task<IActionResult> SaveFeedback(Guid conversationId, [FromBody] SubmitCustomerFeedbackRequest request, CancellationToken cancellationToken)
    {
        if (request.Rating is < 1 or > 5)
        {
            return BadRequest(new { message = "Avaliacao deve estar entre 1 e 5." });
        }

        var tenantId = User.GetTenantId();
        if (tenantId is null)
        {
            return Unauthorized(new { message = "Tenant nao identificado." });
        }

        var feedback = await crmService.SaveFeedbackAsync(tenantId.Value, conversationId, request, cancellationToken);
        return Ok(feedback);
    }
}
