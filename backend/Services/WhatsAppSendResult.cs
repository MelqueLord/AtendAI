namespace backend.Services;

public sealed class WhatsAppSendResult
{
    public bool Success { get; set; }
    public string Status { get; set; } = "failed";
    public string? ProviderMessageId { get; set; }
    public string? Error { get; set; }
}
