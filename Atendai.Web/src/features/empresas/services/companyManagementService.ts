import { api } from "@infrastructure/http/api";
import type { ManagedCompany } from "@shared/types";

export function fetchManagedCompanies(token: string) {
  return api.get<ManagedCompany[]>("/management/companies", { token });
}

export function saveManagedCompany(
  token: string,
  payload: {
    id?: string;
    name: string;
    segment: string;
  }
) {
  return payload.id
    ? api.put<null>(`/management/companies/${payload.id}`, { name: payload.name, segment: payload.segment }, { token })
    : api.post<null>("/management/companies", { name: payload.name, segment: payload.segment }, { token });
}

export function deleteManagedCompany(token: string, companyId: string) {
  return api.delete<null>(`/management/companies/${companyId}`, { token });
}
