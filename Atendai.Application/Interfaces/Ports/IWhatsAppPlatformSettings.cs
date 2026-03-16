namespace Atendai.Application.Interfaces;

public interface IWhatsAppPlatformSettings
{
    string ApiVersion { get; }
    string MetaGraphApiVersion { get; }
    string? PublicApiBaseUrl { get; }
    string? PublicNgrokUrl { get; }
    string? EmbeddedSignupAppId { get; }
    string? EmbeddedSignupConfigurationId { get; }
}
