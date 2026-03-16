using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Atendai.Application.Interfaces;
using Microsoft.IdentityModel.Tokens;

namespace Atendai.Infrastructure.Services;

public sealed class JwtAccessTokenIssuer(IConfiguration configuration) : IAuthTokenIssuer
{
    public IssuedAccessToken Issue(AuthTokenDescriptor descriptor)
    {
        var key = configuration["Jwt:Key"] ?? "change-this-key-in-production-at-least-32-chars";
        var issuer = configuration["Jwt:Issuer"] ?? "AiAtendente";
        var audience = configuration["Jwt:Audience"] ?? "AiAtendenteClient";
        var expiresAt = DateTimeOffset.UtcNow.AddMinutes(30);

        var credentials = new SigningCredentials(
            new SymmetricSecurityKey(Encoding.UTF8.GetBytes(key)),
            SecurityAlgorithms.HmacSha256);

        var claims = new List<Claim>
        {
            new(JwtRegisteredClaimNames.Sub, descriptor.UserId.ToString()),
            new(JwtRegisteredClaimNames.Email, descriptor.Email),
            new(ClaimTypes.Name, descriptor.Name),
            new(ClaimTypes.Role, descriptor.Role),
            new("tenant_id", descriptor.TenantId.ToString())
        };

        var token = new JwtSecurityToken(
            issuer: issuer,
            audience: audience,
            claims: claims,
            expires: expiresAt.UtcDateTime,
            signingCredentials: credentials);

        return new IssuedAccessToken(new JwtSecurityTokenHandler().WriteToken(token), expiresAt);
    }
}
