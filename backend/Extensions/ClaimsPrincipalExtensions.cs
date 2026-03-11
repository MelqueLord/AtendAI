using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;

namespace backend.Extensions;

public static class ClaimsPrincipalExtensions
{
    public static Guid? GetTenantId(this ClaimsPrincipal user)
    {
        var value = user.FindFirstValue("tenant_id");
        return Guid.TryParse(value, out var parsed) ? parsed : null;
    }

    public static Guid? GetUserId(this ClaimsPrincipal user)
    {
        var candidates = new[]
        {
            user.FindFirstValue(JwtRegisteredClaimNames.Sub),
            user.FindFirstValue("sub"),
            user.FindFirstValue(ClaimTypes.NameIdentifier)
        };

        foreach (var value in candidates)
        {
            if (Guid.TryParse(value, out var parsed))
            {
                return parsed;
            }
        }

        return null;
    }
}
