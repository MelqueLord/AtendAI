using backend.Application.Interfaces;
using backend.Contracts;
using backend.Extensions;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace backend.Controllers;

[ApiController]
[Route("api/conversations")]
[Authorize]
public sealed class ConversationsController(IConversationService conversationService) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetAll(CancellationToken cancellationToken)
    {
        var tenantId = User.GetTenantId();
        if (tenantId is null)
        {
            return Unauthorized(new { message = "Tenant nao identificado." });
        }

        var conversations = await conversationService.GetConversationsAsync(tenantId.Value, cancellationToken);
        return Ok(conversations);
    }

    [HttpPatch("{conversationId:guid}/assignment")]
    [Authorize(Roles = "Admin,Agent,SuperAdmin")]
    public async Task<IActionResult> UpdateAssignment(Guid conversationId, [FromBody] UpdateConversationAssignmentRequest request, CancellationToken cancellationToken)
    {
        var tenantId = User.GetTenantId();
        if (tenantId is null)
        {
            return Unauthorized(new { message = "Tenant nao identificado." });
        }

        try
        {
            var updated = await conversationService.UpdateAssignmentAsync(tenantId.Value, conversationId, request.AssignedUserId, cancellationToken);
            return updated is null ? NotFound(new { message = "Conversa nao encontrada." }) : Ok(updated);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpPatch("{conversationId:guid}/status")]
    [Authorize(Roles = "Admin,Agent,SuperAdmin")]
    public async Task<IActionResult> UpdateStatus(Guid conversationId, [FromBody] UpdateConversationStatusRequest request, CancellationToken cancellationToken)
    {
        var tenantId = User.GetTenantId();
        if (tenantId is null)
        {
            return Unauthorized(new { message = "Tenant nao identificado." });
        }

        try
        {
            var updated = await conversationService.UpdateStatusAsync(tenantId.Value, conversationId, request.Status, cancellationToken);
            return updated is null ? NotFound(new { message = "Conversa nao encontrada." }) : Ok(updated);
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpGet("{conversationId:guid}/notes")]
    [Authorize(Roles = "Admin,Agent,SuperAdmin")]
    public async Task<IActionResult> GetNotes(Guid conversationId, CancellationToken cancellationToken)
    {
        var tenantId = User.GetTenantId();
        if (tenantId is null)
        {
            return Unauthorized(new { message = "Tenant nao identificado." });
        }

        var notes = await conversationService.GetNotesAsync(tenantId.Value, conversationId, cancellationToken);
        return Ok(notes);
    }

    [HttpPost("{conversationId:guid}/notes")]
    [Authorize(Roles = "Admin,Agent,SuperAdmin")]
    public async Task<IActionResult> AddNote(Guid conversationId, [FromBody] AddConversationNoteRequest request, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(request.Note))
        {
            return BadRequest(new { message = "Nota obrigatoria." });
        }

        var tenantId = User.GetTenantId();
        var userId = User.GetUserId();
        var userName = User.Identity?.Name;
        if (tenantId is null || userId is null || string.IsNullOrWhiteSpace(userName))
        {
            return Unauthorized(new { message = "Contexto de usuario invalido." });
        }

        var note = await conversationService.AddNoteAsync(tenantId.Value, conversationId, userId.Value, userName, request.Note, cancellationToken);
        return Ok(note);
    }

    [HttpGet("quick-replies")]
    [Authorize(Roles = "Admin,Agent,SuperAdmin")]
    public async Task<IActionResult> GetQuickReplies(CancellationToken cancellationToken)
    {
        var tenantId = User.GetTenantId();
        if (tenantId is null)
        {
            return Unauthorized(new { message = "Tenant nao identificado." });
        }

        var templates = await conversationService.GetQuickRepliesAsync(tenantId.Value, cancellationToken);
        return Ok(templates);
    }

    [HttpPost("quick-replies")]
    [Authorize(Roles = "Admin,Agent,SuperAdmin")]
    public async Task<IActionResult> CreateQuickReply([FromBody] QuickReplyTemplateUpsertRequest request, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(request.Title) || string.IsNullOrWhiteSpace(request.Body))
        {
            return BadRequest(new { message = "Titulo e mensagem sao obrigatorios." });
        }

        var tenantId = User.GetTenantId();
        if (tenantId is null)
        {
            return Unauthorized(new { message = "Tenant nao identificado." });
        }

        var created = await conversationService.CreateQuickReplyAsync(tenantId.Value, request, cancellationToken);
        return Ok(created);
    }

    [HttpPut("quick-replies/{templateId:guid}")]
    [Authorize(Roles = "Admin,Agent,SuperAdmin")]
    public async Task<IActionResult> UpdateQuickReply(Guid templateId, [FromBody] QuickReplyTemplateUpsertRequest request, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(request.Title) || string.IsNullOrWhiteSpace(request.Body))
        {
            return BadRequest(new { message = "Titulo e mensagem sao obrigatorios." });
        }

        var tenantId = User.GetTenantId();
        if (tenantId is null)
        {
            return Unauthorized(new { message = "Tenant nao identificado." });
        }

        var updated = await conversationService.UpdateQuickReplyAsync(tenantId.Value, templateId, request, cancellationToken);
        return updated is null ? NotFound(new { message = "Resposta rapida nao encontrada." }) : Ok(updated);
    }

    [HttpDelete("quick-replies/{templateId:guid}")]
    [Authorize(Roles = "Admin,Agent,SuperAdmin")]
    public async Task<IActionResult> DeleteQuickReply(Guid templateId, CancellationToken cancellationToken)
    {
        var tenantId = User.GetTenantId();
        if (tenantId is null)
        {
            return Unauthorized(new { message = "Tenant nao identificado." });
        }

        await conversationService.DeleteQuickReplyAsync(tenantId.Value, templateId, cancellationToken);
        return NoContent();
    }

    [HttpPost("outbound")]
    [Authorize(Roles = "Admin,Agent,SuperAdmin")]
    public async Task<IActionResult> StartOutbound([FromBody] OutboundConversationRequest request, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(request.CustomerPhone) || string.IsNullOrWhiteSpace(request.Message))
        {
            return BadRequest(new { message = "Telefone e mensagem sao obrigatorios." });
        }

        var tenantId = User.GetTenantId();
        if (tenantId is null)
        {
            return Unauthorized(new { message = "Tenant nao identificado." });
        }

        try
        {
            var result = await conversationService.StartOutboundConversationAsync(tenantId.Value, request, cancellationToken);
            if (!result.Delivered)
            {
                return Conflict(new { message = result.Error ?? result.Message, status = result.Status, conversationId = result.ConversationId });
            }

            return Ok(result);
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }
    [HttpPost("{conversationId:guid}/human-reply")]
    [Authorize(Roles = "Admin,Agent,SuperAdmin")]
    public async Task<IActionResult> HumanReply(Guid conversationId, [FromBody] HumanReplyRequest request, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(request.Message))
        {
            return BadRequest(new { message = "Mensagem obrigatoria." });
        }

        var tenantId = User.GetTenantId();
        if (tenantId is null)
        {
            return Unauthorized(new { message = "Tenant nao identificado." });
        }

        var result = await conversationService.SendHumanReplyAsync(tenantId.Value, conversationId, request.Message, cancellationToken);
        if (result is null)
        {
            return NotFound(new { message = "Conversa nao encontrada." });
        }

        if (!result.Delivered)
        {
            return Conflict(new { message = result.Error ?? result.Message, status = result.Status });
        }

        return Ok(result);
    }
}


