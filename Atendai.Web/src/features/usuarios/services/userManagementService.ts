import { api } from "@infrastructure/http/api";
import type { ManagedUser } from "@shared/types";

export function fetchManagedUsers(token: string, role: string, tenantId?: string) {
  if (role === "Agent") {
    return Promise.resolve([] as ManagedUser[]);
  }

  const query = role === "SuperAdmin" && tenantId ? `?tenantId=${tenantId}` : "";
  return api.get<ManagedUser[]>(`/management/users${query}`, { token });
}

export function saveManagedUser(
  token: string,
  payload: {
    id?: string;
    tenantId?: string;
    name: string;
    email: string;
    role: string;
    password?: string | null;
  }
) {
  if (payload.id) {
    return api.put<null>(`/management/users/${payload.id}`, {
      name: payload.name,
      email: payload.email,
      role: payload.role,
      password: payload.password || null
    }, { token });
  }

  return api.post<null>("/management/users", {
    tenantId: payload.tenantId,
    name: payload.name,
    email: payload.email,
    role: payload.role,
    password: payload.password
  }, { token });
}

export function deleteManagedUser(token: string, userId: string) {
  return api.delete<null>(`/management/users/${userId}`, { token });
}
