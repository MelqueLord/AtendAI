using Atendai.Application.Interfaces;

namespace Atendai.Infrastructure.Services;

public sealed class WhatsAppPlatformSettings(IConfiguration configuration) : IWhatsAppPlatformSettings
{
    public string ApiVersion => configuration["WhatsApp:ApiVersion"] ?? "v22.0";
    public string MetaGraphApiVersion => configuration["MetaEmbeddedSignup:GraphApiVersion"] ?? ApiVersion;
    public string? PublicApiBaseUrl => configuration["PublicApi:BaseUrl"];
    public string? PublicNgrokUrl => configuration["PublicApi:NgrokUrl"];
    public string? EmbeddedSignupAppId => configuration["MetaEmbeddedSignup:AppId"];
    public string? EmbeddedSignupConfigurationId => configuration["MetaEmbeddedSignup:ConfigurationId"];
}
