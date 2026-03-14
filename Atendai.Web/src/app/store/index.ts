import type { AppPage } from "@shared/types";

export type AuthView = "PRICING" | "LOGIN";

export type AttendanceRealtimeState = "connecting" | "connected" | "reconnecting" | "fallback" | "disconnected";

export type AppNavigationState = {
  currentPage: AppPage;
  authView: AuthView;
};
