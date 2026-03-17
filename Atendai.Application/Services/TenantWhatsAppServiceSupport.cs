using Atendai.Application.DTOs;
using Atendai.Application.Interfaces;
using Atendai.Domain.Entities;
using System.Security.Cryptography;
using System.Text.Json;

namespace Atendai.Application.Services;

internal static class TenantWhatsAppServiceSupport
{
    public static string BuildWebhookUrl(string? publicBaseUrl, IWhatsAppPlatformSettings platformSettings)
    {
        var normalized = NormalizePublicBaseUrl(publicBaseUrl)
            ?? NormalizePublicBaseUrl(platformSettings.PublicApiBaseUrl)
            ?? NormalizePublicBaseUrl(platformSettings.PublicNgrokUrl);

        return string.IsNullOrWhiteSpace(normalized)
            ? "/api/whatsapp/webhook"
            : $"{normalized}/api/whatsapp/webhook";
    }

    public static string GenerateVerifyToken()
    {
        return Convert.ToHexString(RandomNumberGenerator.GetBytes(18)).ToLowerInvariant();
    }

    public static WhatsAppSendResult BuildNotConfiguredResult()
    {
        return new WhatsAppSendResult
        {
            Success = false,
            Status = "not_configured",
            Error = "WhatsApp nao configurado para este tenant."
        };
    }

    public static string? NormalizeTransport(string? transport)
    {
        if (string.IsNullOrWhiteSpace(transport))
        {
            return null;
        }

        return transport.Trim().ToLowerInvariant();
    }

    public static string NormalizeQrStatus(string? status)
    {
        if (string.IsNullOrWhiteSpace(status))
        {
            return "error_qr";
        }

        return status.Contains("qr", StringComparison.OrdinalIgnoreCase)
            ? status
            : $"{status}_qr";
    }

    public static string NormalizeMetaDeliveryStatus(string? status)
    {
        if (string.IsNullOrWhiteSpace(status))
        {
            return "unknown";
        }

        return status.Trim().ToLowerInvariant();
    }

    public static bool IsDeliveryFailureStatus(string status)
    {
        return string.Equals(status, "failed", StringComparison.OrdinalIgnoreCase)
            || string.Equals(status, "undeliverable", StringComparison.OrdinalIgnoreCase);
    }

    public static string? BuildDeliveryErrorDetail(List<WhatsAppDeliveryError>? errors)
    {
        if (errors is null || errors.Count == 0)
        {
            return null;
        }

        var parts = errors
            .Select(error =>
            {
                var summary = string.Join(" ", new[] { error.Title, error.Message, error.ErrorData?.Details }
                    .Where(value => !string.IsNullOrWhiteSpace(value)));

                return error.Code.HasValue && !string.IsNullOrWhiteSpace(summary)
                    ? $"{error.Code.Value}: {summary}"
                    : error.Code.HasValue
                        ? error.Code.Value.ToString()
                        : summary;
            })
            .Where(value => !string.IsNullOrWhiteSpace(value))
            .ToArray();

        return parts.Length == 0 ? null : string.Join(" | ", parts);
    }

    public static string BuildLogPayloadEnvelope(string? payload, string? providerMessageId)
    {
        if (string.IsNullOrWhiteSpace(providerMessageId))
        {
            return payload ?? string.Empty;
        }

        return JsonSerializer.Serialize(new
        {
            message = payload,
            providerMessageId
        });
    }

    public static WhatsAppConnectionResponse? MapConnection(WhatsAppConnection? connection)
    {
        return connection is null
            ? null
            : new WhatsAppConnectionResponse(
                connection.TenantId,
                connection.WabaId,
                connection.PhoneNumberId,
                connection.VerifyToken,
                connection.IsActive,
                connection.LastTestedAt,
                connection.LastStatus,
                connection.LastError,
                connection.UpdatedAt);
    }

    public static WhatsAppChannelResponse? MapChannel(WhatsAppChannel? channel)
    {
        return channel is null
            ? null
            : new WhatsAppChannelResponse(
                channel.Id,
                channel.TenantId,
                channel.DisplayName,
                channel.WabaId,
                channel.PhoneNumberId,
                channel.VerifyToken,
                channel.IsActive,
                channel.IsPrimary,
                channel.LastTestedAt,
                channel.LastStatus,
                channel.LastError,
                channel.UpdatedAt);
    }

    public static WhatsAppMessageLogResponse MapLog(WhatsAppMessageLog log)
    {
        return new WhatsAppMessageLogResponse(
            log.Id,
            log.TenantId,
            log.ConversationId,
            log.ToPhone,
            log.Direction,
            log.Status,
            log.ErrorDetail,
            log.CreatedAt);
    }

    private static string? NormalizePublicBaseUrl(string? baseUrl)
    {
        if (string.IsNullOrWhiteSpace(baseUrl))
        {
            return null;
        }

        return baseUrl.Trim().TrimEnd('/');
    }
}
