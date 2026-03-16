import { useEffect, useMemo, useState } from "react";
import type { ManagedCompany, ManagedUser } from "@shared/types";

const emptyCompanyDraft = { name: "", segment: "" };
const createEmptyUserDraft = (tenantId = "") => ({ tenantId, name: "", email: "", role: "Agent", password: "" });

export function useManagementWorkspaceState(authTenantId?: string) {
  const [managedCompanies, setManagedCompanies] = useState<ManagedCompany[]>([]);
  const [managedUsers, setManagedUsers] = useState<ManagedUser[]>([]);
  const [companyDraft, setCompanyDraft] = useState(emptyCompanyDraft);
  const [editingCompanyId, setEditingCompanyId] = useState("");
  const [userDraft, setUserDraft] = useState(createEmptyUserDraft(authTenantId));
  const [editingUserId, setEditingUserId] = useState("");
  const [userSearch, setUserSearch] = useState("");
  const [userRoleFilter, setUserRoleFilter] = useState("");
  const [userTenantFilter, setUserTenantFilter] = useState("");
  const [companySearch, setCompanySearch] = useState("");
  const [companySegmentFilter, setCompanySegmentFilter] = useState("");

  useEffect(() => {
    if (!authTenantId) {
      return;
    }

    setUserDraft((current) => ({ ...current, tenantId: current.tenantId || authTenantId }));
  }, [authTenantId]);

  const availableSegments = useMemo(
    () => [...new Set(managedCompanies.map((company) => company.segment).filter(Boolean))].sort((left, right) => left.localeCompare(right)),
    [managedCompanies]
  );

  const filteredUsers = useMemo(() => {
    const query = userSearch.trim().toLowerCase();

    return managedUsers.filter((managedUser) => {
      const matchesQuery =
        !query ||
        managedUser.name.toLowerCase().includes(query) ||
        managedUser.email.toLowerCase().includes(query) ||
        managedUser.tenantName.toLowerCase().includes(query);
      const matchesRole = !userRoleFilter || managedUser.role === userRoleFilter;
      const matchesTenant = !userTenantFilter || managedUser.tenantId === userTenantFilter;

      return matchesQuery && matchesRole && matchesTenant;
    });
  }, [managedUsers, userRoleFilter, userSearch, userTenantFilter]);

  const filteredCompanies = useMemo(() => {
    const query = companySearch.trim().toLowerCase();

    return managedCompanies.filter((company) => {
      const matchesQuery = !query || company.name.toLowerCase().includes(query) || company.segment.toLowerCase().includes(query);
      const matchesSegment = !companySegmentFilter || company.segment === companySegmentFilter;

      return matchesQuery && matchesSegment;
    });
  }, [companySearch, companySegmentFilter, managedCompanies]);

  function resetManagementWorkspaceState(nextTenantId?: string) {
    setManagedCompanies([]);
    setManagedUsers([]);
    setCompanyDraft(emptyCompanyDraft);
    setEditingCompanyId("");
    setUserDraft(createEmptyUserDraft(nextTenantId));
    setEditingUserId("");
    setUserSearch("");
    setUserRoleFilter("");
    setUserTenantFilter("");
    setCompanySearch("");
    setCompanySegmentFilter("");
  }

  return {
    managedCompanies,
    setManagedCompanies,
    managedUsers,
    setManagedUsers,
    companyDraft,
    setCompanyDraft,
    editingCompanyId,
    setEditingCompanyId,
    userDraft,
    setUserDraft,
    editingUserId,
    setEditingUserId,
    userSearch,
    setUserSearch,
    userRoleFilter,
    setUserRoleFilter,
    userTenantFilter,
    setUserTenantFilter,
    companySearch,
    setCompanySearch,
    companySegmentFilter,
    setCompanySegmentFilter,
    availableSegments,
    filteredUsers,
    filteredCompanies,
    resetManagementWorkspaceState
  };
}
