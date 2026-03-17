import { api } from "@infrastructure/http/api";
import type { AnalyticsOverview, BillingPlan, BillingSubscription, ValueMetrics } from "@shared/types";

export function fetchAnalyticsOverview(token: string) {
  return api.get<AnalyticsOverview>("/analytics/overview", { token });
}

export function fetchBillingSubscription(token: string) {
  return api.get<BillingSubscription>("/billing/subscription", { token });
}

export async function fetchCommercialSnapshot(token: string) {
  const [plans, subscription, valueMetrics] = await Promise.allSettled([
    api.get<BillingPlan[]>("/billing/plans", { token }),
    api.get<BillingSubscription>("/billing/subscription", { token }),
    api.get<ValueMetrics>("/billing/value-metrics", { token })
  ]);

  if (plans.status !== "fulfilled") {
    throw plans.reason;
  }

  return {
    plans: plans.value,
    subscription: subscription.status === "fulfilled" ? subscription.value : null,
    valueMetrics: valueMetrics.status === "fulfilled" ? valueMetrics.value : null
  };
}

export function subscribeToPlan(token: string, planCode: string) {
  return api.post<BillingSubscription>("/billing/subscribe", { planCode }, { token });
}
