using Atendai.Application.DTOs;
using Atendai.Application.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace Atendai.API.Controllers;

[ApiController]
[Route("api/whatsapp")]
public sealed class WhatsAppController(
    IConversationService conversationService,
    ITenantWhatsAppService tenantWhatsAppService,
    IConfiguration configuration,
    ILogger<WhatsAppController> logger) : ControllerBase
{
    [HttpGet("webhook")]
    public Task<IActionResult> VerifyWebhook(
        [FromQuery(Name = "hub.mode")] string mode,
        [FromQuery(Name = "hub.verify_token")] string verifyToken,
        [FromQuery(Name = "hub.challenge")] string challenge,
        CancellationToken cancellationToken)
    {
        return VerifyWebhookInternal(null, mode, verifyToken, challenge, cancellationToken);
    }

    [HttpGet("webhook/{tenantId:guid}")]
    public Task<IActionResult> VerifyWebhookByTenant(
        Guid tenantId,
        [FromQuery(Name = "hub.mode")] string mode,
        [FromQuery(Name = "hub.verify_token")] string verifyToken,
        [FromQuery(Name = "hub.challenge")] string challenge,
        CancellationToken cancellationToken)
    {
        return VerifyWebhookInternal(tenantId, mode, verifyToken, challenge, cancellationToken);
    }

    [HttpPost("webhook")]
    public Task<IActionResult> ReceiveWebhook([FromBody] WhatsAppWebhookPayload payload, CancellationToken cancellationToken)
    {
        return ReceiveWebhookInternal(null, payload, cancellationToken);
    }

    [HttpPost("webhook/{tenantId:guid}")]
    public Task<IActionResult> ReceiveWebhookByTenant(Guid tenantId, [FromBody] WhatsAppWebhookPayload payload, CancellationToken cancellationToken)
    {
        return ReceiveWebhookInternal(tenantId, payload, cancellationToken);
    }

    [HttpPost("simulate")]
    public async Task<ActionResult<OutgoingMessageResponse>> SimulateMessage([FromBody] IncomingMessageRequest request, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(request.CustomerPhone) || string.IsNullOrWhiteSpace(request.Message))
        {
            return BadRequest(new { message = "CustomerPhone e Message sao obrigatorios." });
        }

        var tenantId = ResolveTenantId();
        if (tenantId is null)
        {
            return BadRequest(new { message = "Defina MultiTenant:DefaultTenantId ou cabecalho X-Tenant-Id." });
        }

        var result = await conversationService.HandleIncomingAsync(tenantId.Value, request, null, "meta", cancellationToken);

        var sendOnSimulate = configuration.GetValue<bool>("WhatsApp:SendOnSimulate");
        if (sendOnSimulate && !string.IsNullOrWhiteSpace(result.Reply))
        {
            var sent = await tenantWhatsAppService.SendMessageAsync(
                tenantId.Value,
                result.ConversationId,
                request.CustomerPhone,
                result.Reply,
                cancellationToken,
                preferredTransport: "meta");
            if (!sent.Success)
            {
                logger.LogWarning("Simulate executou, mas envio para WhatsApp nao foi concluido.");
                return Conflict(new
                {
                    message = sent.Error ?? "Falha ao enviar mensagem simulada para o WhatsApp.",
                    status = sent.Status
                });
            }
        }

        return Ok(result);
    }

    private async Task<IActionResult> VerifyWebhookInternal(Guid? tenantId, string mode, string verifyToken, string challenge, CancellationToken cancellationToken)
    {
        if (!string.Equals(mode, "subscribe", StringComparison.OrdinalIgnoreCase) || string.IsNullOrWhiteSpace(verifyToken))
        {
            return Forbid();
        }

        if (tenantId.HasValue)
        {
            var connection = await tenantWhatsAppService.GetConnectionAsync(tenantId.Value, cancellationToken);
            if (connection is not null && string.Equals(connection.VerifyToken, verifyToken, StringComparison.Ordinal))
            {
                return Ok(challenge);
            }

            return Forbid();
        }

        var resolvedTenant = await tenantWhatsAppService.ResolveTenantIdByVerifyTokenAsync(verifyToken, cancellationToken);
        return resolvedTenant.HasValue ? Ok(challenge) : Forbid();
    }

    private async Task<IActionResult> ReceiveWebhookInternal(Guid? routeTenantId, WhatsAppWebhookPayload payload, CancellationToken cancellationToken)
    {
        foreach (var entry in payload.Entry)
        {
            foreach (var change in entry.Changes)
            {
                var value = change.Value;
                if (value is null)
                {
                    continue;
                }

                var tenantId = routeTenantId;
                if (!tenantId.HasValue && !string.IsNullOrWhiteSpace(value.Metadata?.PhoneNumberId))
                {
                    tenantId = await tenantWhatsAppService.ResolveTenantIdByPhoneNumberIdAsync(value.Metadata.PhoneNumberId, cancellationToken);
                }

                tenantId ??= ResolveTenantId();
                if (!tenantId.HasValue)
                {
                    logger.LogWarning("Webhook recebido sem tenant resolvido.");
                    continue;
                }

                if (value.Statuses is not null)
                {
                    foreach (var deliveryStatus in value.Statuses)
                    {
                        var deliveryResult = await tenantWhatsAppService.HandleDeliveryStatusAsync(
                            tenantId.Value,
                            deliveryStatus,
                            cancellationToken);

                        if (deliveryResult is null)
                        {
                            continue;
                        }

                        if (deliveryResult.Failed)
                        {
                            logger.LogWarning(
                                "Meta reportou falha de entrega para providerMessageId {ProviderMessageId}. ConversationId: {ConversationId}. Detail: {Detail}",
                                deliveryResult.ProviderMessageId,
                                deliveryResult.ConversationId,
                                deliveryResult.ErrorDetail);
                        }
                    }
                }

                if (value.Messages is null)
                {
                    continue;
                }

                var customerName = value.Contacts?.FirstOrDefault()?.Profile?.Name;
                var incomingChannel = !string.IsNullOrWhiteSpace(value.Metadata?.PhoneNumberId)
                    ? await tenantWhatsAppService.GetChannelByPhoneNumberIdAsync(tenantId.Value, value.Metadata.PhoneNumberId, cancellationToken)
                    : null;

                foreach (var incoming in value.Messages)
                {
                    if (!string.Equals(incoming.Type, "text", StringComparison.OrdinalIgnoreCase))
                    {
                        continue;
                    }

                    if (string.IsNullOrWhiteSpace(incoming.Text?.Body))
                    {
                        continue;
                    }

                    var request = new IncomingMessageRequest(incoming.From, incoming.Text.Body, customerName);
                    var reply = await conversationService.HandleIncomingAsync(tenantId.Value, request, incomingChannel?.Id, "meta", cancellationToken);
                    if (string.IsNullOrWhiteSpace(reply.Reply))
                    {
                        continue;
                    }

                    var sent = await tenantWhatsAppService.SendMessageAsync(
                        tenantId.Value,
                        reply.ConversationId,
                        incoming.From,
                        reply.Reply,
                        cancellationToken,
                        incomingChannel?.Id,
                        "meta");

                    if (!sent.Success)
                    {
                        logger.LogWarning("Falha ao enviar resposta para WhatsApp. Fluxo salvo para conversa {ConversationId}", reply.ConversationId);
                        await conversationService.HandleAutomaticReplyDeliveryFailureAsync(
                            tenantId.Value,
                            reply.ConversationId,
                            sent.Status,
                            sent.Error,
                            cancellationToken);
                    }
                }
            }
        }

        return Ok(new { processed = true });
    }

    private Guid? ResolveTenantId()
    {
        if (Request.Headers.TryGetValue("X-Tenant-Id", out var headerValue) && Guid.TryParse(headerValue, out var parsedHeader))
        {
            return parsedHeader;
        }

        var fromConfig = configuration["MultiTenant:DefaultTenantId"];
        return Guid.TryParse(fromConfig, out var parsedConfig) ? parsedConfig : null;
    }
}
