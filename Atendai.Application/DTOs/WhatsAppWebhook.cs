using System.Text.Json.Serialization;

namespace Atendai.Application.DTOs;

public sealed class WhatsAppWebhookPayload
{
    [JsonPropertyName("entry")]
    public List<WhatsAppEntry> Entry { get; set; } = [];
}

public sealed class WhatsAppEntry
{
    [JsonPropertyName("changes")]
    public List<WhatsAppChange> Changes { get; set; } = [];
}

public sealed class WhatsAppChange
{
    [JsonPropertyName("value")]
    public WhatsAppValue? Value { get; set; }
}

public sealed class WhatsAppValue
{
    [JsonPropertyName("messages")]
    public List<WhatsAppMessage>? Messages { get; set; }

    [JsonPropertyName("statuses")]
    public List<WhatsAppDeliveryStatus>? Statuses { get; set; }

    [JsonPropertyName("contacts")]
    public List<WhatsAppContact>? Contacts { get; set; }

    [JsonPropertyName("metadata")]
    public WhatsAppMetadata? Metadata { get; set; }
}

public sealed class WhatsAppMetadata
{
    [JsonPropertyName("phone_number_id")]
    public string PhoneNumberId { get; set; } = string.Empty;
}

public sealed class WhatsAppMessage
{
    [JsonPropertyName("from")]
    public string From { get; set; } = string.Empty;

    [JsonPropertyName("type")]
    public string Type { get; set; } = string.Empty;

    [JsonPropertyName("text")]
    public WhatsAppText? Text { get; set; }
}

public sealed class WhatsAppDeliveryStatus
{
    [JsonPropertyName("id")]
    public string Id { get; set; } = string.Empty;

    [JsonPropertyName("status")]
    public string Status { get; set; } = string.Empty;

    [JsonPropertyName("recipient_id")]
    public string? RecipientId { get; set; }

    [JsonPropertyName("timestamp")]
    public string? Timestamp { get; set; }

    [JsonPropertyName("errors")]
    public List<WhatsAppDeliveryError>? Errors { get; set; }
}

public sealed class WhatsAppDeliveryError
{
    [JsonPropertyName("code")]
    public int? Code { get; set; }

    [JsonPropertyName("title")]
    public string? Title { get; set; }

    [JsonPropertyName("message")]
    public string? Message { get; set; }

    [JsonPropertyName("error_data")]
    public WhatsAppDeliveryErrorData? ErrorData { get; set; }
}

public sealed class WhatsAppDeliveryErrorData
{
    [JsonPropertyName("details")]
    public string? Details { get; set; }
}

public sealed class WhatsAppText
{
    [JsonPropertyName("body")]
    public string Body { get; set; } = string.Empty;
}

public sealed class WhatsAppContact
{
    [JsonPropertyName("profile")]
    public WhatsAppProfile? Profile { get; set; }
}

public sealed class WhatsAppProfile
{
    [JsonPropertyName("name")]
    public string Name { get; set; } = string.Empty;
}
