using Atendai.Application.DTOs;

namespace Atendai.Application.Support;

public static class BillingCatalog
{
    public static IReadOnlyList<BillingPlanResponse> DefaultPlans { get; } =
    [
        new("TRIAL", "Trial 14 dias", 0m, "BRL", 200, 2, 1, false),
        new("STARTER", "Starter", 99m, "BRL", 1500, 4, 1, false),
        new("GROWTH", "Growth", 399m, "BRL", 6000, 10, 3, true),
        new("SCALE", "Scale", 999m, "BRL", 20000, 30, 10, false)
    ];

    public static BillingPlanResponse? FindByCode(string? code)
    {
        if (string.IsNullOrWhiteSpace(code))
        {
            return null;
        }

        return DefaultPlans.FirstOrDefault(plan => string.Equals(plan.Code, code, StringComparison.OrdinalIgnoreCase));
    }
}
