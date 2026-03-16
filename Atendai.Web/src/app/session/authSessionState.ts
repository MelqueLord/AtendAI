import type { AuthView } from "@app/store";
import {
  clearStoredAuth,
  persistAuth,
  persistAuthView,
  persistPage,
  readStoredAuth,
  readStoredAuthView,
  readStoredPage
} from "@infrastructure/storage/authStorage";
import type { AppPage, AuthResponse } from "@shared/types";

export const SESSION_REFRESH_SKEW_MS = 60_000;

export function savePersistedAuth(auth: AuthResponse | null) {
  persistAuth(auth);
}

export function loadPersistedAuth() {
  return readStoredAuth();
}

export function clearPersistedAuthState() {
  clearStoredAuth();
}

export function savePersistedPage(page: AppPage) {
  persistPage(page);
}

export function loadPersistedPage(): AppPage {
  const raw = readStoredPage();
  return isAppPage(raw) ? raw : "ATTENDANCE";
}

export function savePersistedAuthView(view: AuthView) {
  persistAuthView(view);
}

export function loadPersistedAuthView(): AuthView {
  const raw = readStoredAuthView();
  return raw === "LOGIN" ? "LOGIN" : "PRICING";
}

export function isSessionExpired(expiresAtUtc: string) {
  const expiresAt = Date.parse(expiresAtUtc);
  if (Number.isNaN(expiresAt)) return true;
  return expiresAt <= Date.now() + SESSION_REFRESH_SKEW_MS;
}

export function defaultPageForRole(role?: string): AppPage {
  return role === "SuperAdmin" ? "COMPANIES" : "ATTENDANCE";
}

export function isPageAllowedForRole(page: AppPage, role?: string) {
  if (page === "ATTENDANCE") return true;
  if (page === "COMPANIES") return role === "SuperAdmin";
  return role === "Admin" || role === "SuperAdmin";
}

function isAppPage(value: string | null): value is AppPage {
  return value === "ATTENDANCE"
    || value === "AI"
    || value === "CRM"
    || value === "WHATSAPP"
    || value === "COMMERCIAL"
    || value === "USERS"
    || value === "COMPANIES";
}
