using backend.Application.Interfaces;
using Microsoft.AspNetCore.DataProtection;

namespace backend.Services;

public sealed class SecretProtectorService : ISecretProtector
{
    private readonly IDataProtector _protector;

    public SecretProtectorService(IDataProtectionProvider provider)
    {
        _protector = provider.CreateProtector("AtendAI.WhatsApp.AccessToken.v1");
    }

    public string Protect(string value)
    {
        return _protector.Protect(value);
    }

    public string? UnprotectOrNull(string? value)
    {
        if (string.IsNullOrWhiteSpace(value))
        {
            return null;
        }

        try
        {
            return _protector.Unprotect(value);
        }
        catch
        {
            return null;
        }
    }
}
