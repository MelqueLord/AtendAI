import type { AuthView } from "@app/store";
import type { AppPage, AuthResponse } from "@shared/types";

const AUTH_STORAGE_KEY = "atendai.auth";
const PAGE_STORAGE_KEY = "atendai.page";
const AUTH_VIEW_STORAGE_KEY = "atendai.authView";

export function persistAuth(auth: AuthResponse | null) {
  if (typeof window === "undefined") {
    return;
  }

  if (!auth) {
    window.localStorage.removeItem(AUTH_STORAGE_KEY);
    return;
  }

  window.localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(auth));
}

export function readStoredAuth() {
  if (typeof window === "undefined") {
    return null;
  }

  const raw = window.localStorage.getItem(AUTH_STORAGE_KEY);
  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as AuthResponse;
  } catch {
    window.localStorage.removeItem(AUTH_STORAGE_KEY);
    return null;
  }
}

export function clearStoredAuth() {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.removeItem(AUTH_STORAGE_KEY);
}

export function persistPage(page: AppPage) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(PAGE_STORAGE_KEY, page);
}

export function readStoredPage() {
  if (typeof window === "undefined") {
    return null;
  }

  return window.localStorage.getItem(PAGE_STORAGE_KEY);
}

export function persistAuthView(view: AuthView) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(AUTH_VIEW_STORAGE_KEY, view);
}

export function readStoredAuthView() {
  if (typeof window === "undefined") {
    return null;
  }

  return window.localStorage.getItem(AUTH_VIEW_STORAGE_KEY) as AuthView | null;
}
