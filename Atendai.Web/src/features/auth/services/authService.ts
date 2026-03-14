import { api } from "@infrastructure/http/api";
import type { AuthResponse, TenantOption } from "@shared/types";

export function loginRequest(email: string, password: string) {
  return api.post<AuthResponse>("/auth/login", { email, password });
}

export function refreshSession(refreshToken: string) {
  return api.post<AuthResponse>("/auth/refresh", { refreshToken });
}

export function logoutRequest(refreshToken: string) {
  return api.post<null>("/auth/logout", { refreshToken });
}

export function switchTenantRequest(token: string, tenantId: string) {
  return api.post<AuthResponse>("/auth/switch-tenant", { tenantId }, { token });
}

export function fetchTenants(token: string) {
  return api.get<TenantOption[]>("/admin/tenants", { token });
}
