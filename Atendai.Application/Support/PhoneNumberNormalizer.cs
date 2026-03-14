namespace Atendai.Application.Support;

public static class PhoneNumberNormalizer
{
    public static string Normalize(string? value)
    {
        var digits = DigitsOnly(value);
        if (string.IsNullOrWhiteSpace(digits))
        {
            return string.Empty;
        }

        if (digits.StartsWith("55", StringComparison.Ordinal))
        {
            return digits;
        }

        if (digits.Length is 10 or 11)
        {
            return $"55{digits}";
        }

        return digits;
    }

    public static IReadOnlyList<string> GetLookupCandidates(string? value)
    {
        var rawDigits = DigitsOnly(value);
        var normalized = Normalize(value);
        var candidates = new HashSet<string>(StringComparer.Ordinal);

        if (!string.IsNullOrWhiteSpace(normalized))
        {
            candidates.Add(normalized);
        }

        if (!string.IsNullOrWhiteSpace(rawDigits))
        {
            candidates.Add(rawDigits);
        }

        if (normalized.StartsWith("55", StringComparison.Ordinal))
        {
            var national = normalized[2..];
            if (!string.IsNullOrWhiteSpace(national))
            {
                candidates.Add(national);
            }

            if (normalized.Length == 13 && normalized[4] == '9')
            {
                var withoutNinthDigit = string.Concat(normalized.AsSpan(0, 4), normalized.AsSpan(5));
                candidates.Add(withoutNinthDigit);
                candidates.Add(withoutNinthDigit[2..]);
            }

            if (normalized.Length == 12)
            {
                var withNinthDigit = string.Concat(normalized.AsSpan(0, 4), "9", normalized.AsSpan(4));
                candidates.Add(withNinthDigit);
                candidates.Add(withNinthDigit[2..]);
            }
        }

        return candidates
            .OrderByDescending(candidate => candidate.Length)
            .ToArray();
    }

    private static string DigitsOnly(string? value)
    {
        if (string.IsNullOrWhiteSpace(value))
        {
            return string.Empty;
        }

        return new string(value.Where(char.IsDigit).ToArray());
    }
}
