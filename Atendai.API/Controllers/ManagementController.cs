using System.Security.Claims;
using Atendai.Application.Interfaces;
using Atendai.Application.DTOs;
using Atendai.API.Extensions;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Atendai.API.Controllers;

[ApiController]
[Route("api/management")]
[Authorize(Roles = "Admin,SuperAdmin")]
public sealed class ManagementController(IManagementService managementService) : ControllerBase
{
    [HttpGet("companies")]
    [Authorize(Roles = "SuperAdmin")]
    public async Task<IActionResult> GetCompanies([FromQuery] string? search, [FromQuery] int page = 1, [FromQuery] int pageSize = 20, CancellationToken cancellationToken = default)
    {
        var companies = await managementService.GetCompaniesAsync(search, page, pageSize, cancellationToken);
        return Ok(companies);
    }

    [HttpGet("companies/{companyId:guid}")]
    [Authorize(Roles = "SuperAdmin")]
    public async Task<IActionResult> GetCompanyById(Guid companyId, CancellationToken cancellationToken)
    {
        var company = await managementService.GetCompanyByIdAsync(companyId, cancellationToken);
        return company is null ? NotFound(new { message = "Empresa nao encontrada." }) : Ok(company);
    }

    [HttpPost("companies")]
    [Authorize(Roles = "SuperAdmin")]
    public async Task<IActionResult> CreateCompany([FromBody] CompanyUpsertRequest request, CancellationToken cancellationToken)
    {
        var created = await managementService.CreateCompanyAsync(request, cancellationToken);
        return CreatedAtAction(nameof(GetCompanyById), new { companyId = created.Id }, created);
    }

    [HttpPut("companies/{companyId:guid}")]
    [Authorize(Roles = "SuperAdmin")]
    public async Task<IActionResult> UpdateCompany(Guid companyId, [FromBody] CompanyUpsertRequest request, CancellationToken cancellationToken)
    {
        var updated = await managementService.UpdateCompanyAsync(companyId, request, cancellationToken);
        return updated is null ? NotFound(new { message = "Empresa nao encontrada." }) : Ok(updated);
    }

    [HttpDelete("companies/{companyId:guid}")]
    [Authorize(Roles = "SuperAdmin")]
    public async Task<IActionResult> DeleteCompany(Guid companyId, CancellationToken cancellationToken)
    {
        var deleted = await managementService.DeleteCompanyAsync(companyId, cancellationToken);
        return deleted ? NoContent() : NotFound(new { message = "Empresa nao encontrada." });
    }

    [HttpGet("users")]
    public async Task<IActionResult> GetUsers(
        [FromQuery] Guid? tenantId,
        [FromQuery] string? search,
        [FromQuery] string? role,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        CancellationToken cancellationToken = default)
    {
        var currentRole = User.FindFirst(ClaimTypes.Role)?.Value;
        var currentTenantId = User.GetTenantId();
        if (currentTenantId is null)
        {
            return Unauthorized(new { message = "Tenant nao identificado." });
        }

        var users = await managementService.GetUsersAsync(currentTenantId.Value, currentRole, tenantId, search, role, page, pageSize, cancellationToken);
        return Ok(users);
    }

    [HttpGet("users/{userId:guid}")]
    public async Task<IActionResult> GetUserById(Guid userId, CancellationToken cancellationToken)
    {
        var currentTenantId = User.GetTenantId();
        var role = User.FindFirst(ClaimTypes.Role)?.Value;
        if (currentTenantId is null)
        {
            return Unauthorized(new { message = "Tenant nao identificado." });
        }

        var user = await managementService.GetUserByIdAsync(currentTenantId.Value, role, userId, cancellationToken);
        return user is null ? NotFound(new { message = "Usuario nao encontrado." }) : Ok(user);
    }

    [HttpPost("users")]
    public async Task<IActionResult> CreateUser([FromBody] UserCreateRequest request, CancellationToken cancellationToken)
    {
        var currentTenantId = User.GetTenantId();
        var role = User.FindFirst(ClaimTypes.Role)?.Value;
        if (currentTenantId is null)
        {
            return Unauthorized(new { message = "Tenant nao identificado." });
        }

        var created = await managementService.CreateUserAsync(currentTenantId.Value, role, request, cancellationToken);
        return CreatedAtAction(nameof(GetUserById), new { userId = created.Id }, created);
    }

    [HttpPut("users/{userId:guid}")]
    public async Task<IActionResult> UpdateUser(Guid userId, [FromBody] UserUpdateRequest request, CancellationToken cancellationToken)
    {
        var currentTenantId = User.GetTenantId();
        var role = User.FindFirst(ClaimTypes.Role)?.Value;
        if (currentTenantId is null)
        {
            return Unauthorized(new { message = "Tenant nao identificado." });
        }

        var updated = await managementService.UpdateUserAsync(currentTenantId.Value, role, userId, request, cancellationToken);
        return updated is null ? NotFound(new { message = "Usuario nao encontrado." }) : Ok(updated);
    }

    [HttpDelete("users/{userId:guid}")]
    public async Task<IActionResult> DeleteUser(Guid userId, CancellationToken cancellationToken)
    {
        var currentUserId = User.GetUserId();
        var currentTenantId = User.GetTenantId();
        var role = User.FindFirst(ClaimTypes.Role)?.Value;
        if (currentTenantId is null || currentUserId is null)
        {
            return Unauthorized(new { message = "Contexto de usuario invalido." });
        }

        var deleted = await managementService.DeleteUserAsync(currentTenantId.Value, currentUserId.Value, role, userId, cancellationToken);
        return deleted ? NoContent() : NotFound(new { message = "Usuario nao encontrado." });
    }
}
