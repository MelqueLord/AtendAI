using backend.Contracts;
using backend.Extensions;
using backend.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace backend.Controllers;

[ApiController]
[Route("api/billing")]
[Authorize(Roles = "Admin,SuperAdmin")]
public sealed class BillingController(IBillingService billingService) : ControllerBase
{
    [HttpGet("public/plans")]
    [AllowAnonymous]
    public async Task<IActionResult> GetPublicPlans(CancellationToken cancellationToken)
    {
        var plans = await billingService.GetPlansAsync(cancellationToken);
        return Ok(plans);
    }

    [HttpGet("plans")]
    public async Task<IActionResult> GetPlans(CancellationToken cancellationToken)
    {
        var plans = await billingService.GetPlansAsync(cancellationToken);
        return Ok(plans);
    }

    [HttpGet("subscription")]
    public async Task<IActionResult> GetSubscription(CancellationToken cancellationToken)
    {
        var tenantId = User.GetTenantId();
        if (tenantId is null)
        {
            return Unauthorized(new { message = "Tenant nao identificado." });
        }

        var subscription = await billingService.GetSubscriptionAsync(tenantId.Value, cancellationToken);
        return Ok(subscription);
    }

    [HttpPost("subscribe")]
    public async Task<IActionResult> Subscribe([FromBody] SubscriptionCheckoutRequest request, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(request.PlanCode))
        {
            return BadRequest(new { message = "PlanCode obrigatorio." });
        }

        var tenantId = User.GetTenantId();
        if (tenantId is null)
        {
            return Unauthorized(new { message = "Tenant nao identificado." });
        }

        var subscription = await billingService.SubscribeAsync(tenantId.Value, request.PlanCode, cancellationToken);
        return Ok(subscription);
    }

    [HttpGet("value-metrics")]
    public async Task<IActionResult> GetValueMetrics(CancellationToken cancellationToken)
    {
        var tenantId = User.GetTenantId();
        if (tenantId is null)
        {
            return Unauthorized(new { message = "Tenant nao identificado." });
        }

        var metrics = await billingService.GetValueMetricsAsync(tenantId.Value, cancellationToken);
        return Ok(metrics);
    }
}
