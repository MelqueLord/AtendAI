namespace Atendai.Application.DTOs;

public sealed record MetaWhatsAppBootstrapRequest(
    string DisplayName,
    string? WabaId,
    string PhoneNumberId,
    string? VerifyToken,
    string AccessToken,
    bool IsActive,
    bool IsPrimary,
    string? PublicBaseUrl);

public sealed record MetaWhatsAppSetupResponse(
    bool IsConfigured,
    string CallbackUrl,
    string VerifyToken,
    string? PhoneNumberId,
    string? WabaId,
    Guid? ChannelId,
    string? DisplayName,
    string? LastStatus,
    string? LastError,
    DateTimeOffset? LastTestedAt,
    string WebhookField,
    string WebhookPath);

public sealed record MetaWhatsAppBootstrapResponse(
    Guid ChannelId,
    string DisplayName,
    string CallbackUrl,
    string VerifyToken,
    string PhoneNumberId,
    string? WabaId,
    bool IsActive,
    bool IsPrimary,
    bool TestSucceeded,
    string TestStatus,
    string? TestError);

public sealed record MetaEmbeddedSignupConfigResponse(
    bool IsReady,
    string? AppId,
    string? ConfigurationId,
    string GraphApiVersion,
    string? Error);

public sealed record CompleteMetaEmbeddedSignupRequest(
    string Code,
    string FinishType,
    string? PhoneNumberId,
    string? WabaId,
    string? BusinessPortfolioId,
    string? AdAccountId,
    string? PageId,
    string? DatasetId,
    string? DisplayName,
    bool IsPrimary,
    string? PublicBaseUrl);

public sealed record MetaEmbeddedSignupExchangeResponse(
    bool Success,
    string Status,
    string Message,
    Guid? ChannelId,
    string? DisplayName,
    string? CallbackUrl,
    string? VerifyToken,
    string? PhoneNumberId,
    string? WabaId,
    bool TestSucceeded,
    string? TestStatus,
    string? TestError);
