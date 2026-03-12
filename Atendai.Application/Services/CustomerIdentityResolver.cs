namespace Atendai.Application.Services;

internal static class CustomerIdentityResolver
{
    private static readonly string[] InvalidMarkers =
    [
        "@s.whatsapp.net",
        "@c.us",
        "@lid",
        "status@broadcast"
    ];

    public static string ResolveDisplayName(string customerPhone, params string?[] candidates)
    {
        foreach (var candidate in candidates)
        {
            if (IsUsableDisplayName(candidate, customerPhone))
            {
                return candidate!.Trim();
            }
        }

        return FormatPhoneLabel(customerPhone);
    }

    public static bool ShouldReplaceStoredName(string? currentName, string resolvedName, string customerPhone)
    {
        if (!IsUsableDisplayName(resolvedName, customerPhone))
        {
            return false;
        }

        if (!IsUsableDisplayName(currentName, customerPhone))
        {
            return true;
        }

        return !string.Equals(currentName?.Trim(), resolvedName.Trim(), StringComparison.Ordinal);
    }

    private static bool IsUsableDisplayName(string? candidate, string customerPhone)
    {
        if (string.IsNullOrWhiteSpace(candidate))
        {
            return false;
        }

        var trimmed = candidate.Trim();
        if (trimmed.Length < 2)
        {
            return false;
        }

        if (string.Equals(trimmed, "Cliente", StringComparison.OrdinalIgnoreCase))
        {
            return false;
        }

        if (InvalidMarkers.Any(marker => trimmed.Contains(marker, StringComparison.OrdinalIgnoreCase)))
        {
            return false;
        }

        if (trimmed.Contains(':') && trimmed.Contains('@'))
        {
            return false;
        }

        var normalizedCandidate = NormalizeDigits(trimmed);
        var normalizedPhone = NormalizeDigits(customerPhone);
        if (!string.IsNullOrWhiteSpace(normalizedCandidate) &&
            normalizedCandidate.Length >= 8 &&
            string.Equals(normalizedCandidate, normalizedPhone, StringComparison.Ordinal))
        {
            return false;
        }

        return !IsDigitsOnly(trimmed);
    }

    private static string FormatPhoneLabel(string customerPhone)
    {
        var digits = NormalizeDigits(customerPhone);
        if (string.IsNullOrWhiteSpace(digits))
        {
            return "Cliente";
        }

        if (digits.Length == 13 && digits.StartsWith("55", StringComparison.Ordinal))
        {
            return $"+{digits[..2]} ({digits[2..4]}) {digits[4..9]}-{digits[9..]}";
        }

        if (digits.Length == 12 && digits.StartsWith("55", StringComparison.Ordinal))
        {
            return $"+{digits[..2]} ({digits[2..4]}) {digits[4..8]}-{digits[8..]}";
        }

        if (digits.Length == 11)
        {
            return $"({digits[..2]}) {digits[2..7]}-{digits[7..]}";
        }

        if (digits.Length == 10)
        {
            return $"({digits[..2]}) {digits[2..6]}-{digits[6..]}";
        }

        return digits.StartsWith("55", StringComparison.Ordinal) ? $"+{digits}" : digits;
    }

    private static string NormalizeDigits(string value)
    {
        return new string(value.Where(char.IsDigit).ToArray());
    }

    private static bool IsDigitsOnly(string value)
    {
        var hasDigit = false;
        foreach (var character in value)
        {
            if (char.IsDigit(character))
            {
                hasDigit = true;
                continue;
            }

            if (char.IsWhiteSpace(character) || character is '+' or '-' or '(' or ')' or '.')
            {
                continue;
            }

            return false;
        }

        return hasDigit;
    }
}
