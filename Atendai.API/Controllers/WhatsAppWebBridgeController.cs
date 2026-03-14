using Atendai.Application.Interfaces;
using Atendai.Application.DTOs;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Atendai.API.Controllers;

[ApiController]
[Route("api/whatsapp-web/bridge")]
[AllowAnonymous]
public sealed class WhatsAppWebBridgeController(
    IConversationService conversationService,
    ITenantWhatsAppService tenantWhatsAppService,
    IConfiguration configuration,
    ILogger<WhatsAppWebBridgeController> logger) : ControllerBase
{
    [HttpPost("{tenantId:guid}/incoming")]
    public async Task<IActionResult> ReceiveIncoming(Guid tenantId, [FromBody] IncomingMessageRequest request, CancellationToken cancellationToken)
    {
        if (!IsBridgeAuthorized())
        {
            return Unauthorized(new { message = "Bridge QR nao autorizada." });
        }

        if (string.IsNullOrWhiteSpace(request.CustomerPhone) || string.IsNullOrWhiteSpace(request.Message))
        {
            return BadRequest(new { message = "CustomerPhone e Message sao obrigatorios." });
        }

        var reply = await conversationService.HandleIncomingAsync(tenantId, request, null, "qr", cancellationToken);
        if (string.IsNullOrWhiteSpace(reply.Reply))
        {
            return Ok(new
            {
                processed = true,
                conversationId = reply.ConversationId,
                escalatedToHuman = reply.EscalatedToHuman,
                outboundStatus = "suppressed_human_mode",
                outboundError = (string?)null
            });
        }

        var sent = await tenantWhatsAppService.SendMessageAsync(
            tenantId,
            reply.ConversationId,
            request.CustomerPhone,
            reply.Reply,
            cancellationToken,
            preferredTransport: "qr");

        if (!sent.Success)
        {
            logger.LogWarning("Bridge QR recebeu mensagem mas a resposta nao foi enviada para a conversa {ConversationId}", reply.ConversationId);
            await conversationService.HandleAutomaticReplyDeliveryFailureAsync(
                tenantId,
                reply.ConversationId,
                sent.Status,
                sent.Error,
                cancellationToken);
        }

        return Ok(new
        {
            processed = true,
            conversationId = reply.ConversationId,
            escalatedToHuman = reply.EscalatedToHuman,
            outboundStatus = sent.Status,
            outboundError = sent.Error
        });
    }

    [HttpPost("{tenantId:guid}/history-sync")]
    public async Task<IActionResult> SyncHistory(Guid tenantId, [FromBody] SyncWhatsAppWebHistoryRequest request, CancellationToken cancellationToken)
    {
        if (!IsBridgeAuthorized())
        {
            return Unauthorized(new { message = "Bridge QR nao autorizada." });
        }

        var result = await conversationService.ImportWhatsAppWebHistoryAsync(tenantId, request, cancellationToken);
        return Ok(result);
    }

    private bool IsBridgeAuthorized()
    {
        var configuredKey = configuration["WhatsAppWebBridge:ApiKey"];
        if (string.IsNullOrWhiteSpace(configuredKey))
        {
            return true;
        }

        return Request.Headers.TryGetValue("X-Atendai-Bridge-Key", out var headerValue)
            && string.Equals(headerValue.ToString(), configuredKey, StringComparison.Ordinal);
    }
}
