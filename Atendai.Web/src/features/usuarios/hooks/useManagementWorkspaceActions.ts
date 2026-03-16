import { deleteManagedCompany as deleteManagedCompanyRequest, saveManagedCompany } from "@features/empresas/services/companyManagementService";
import { deleteManagedUser as deleteManagedUserRequest, saveManagedUser } from "@features/usuarios/services/userManagementService";
import { resolveApiErrorMessage } from "@shared/utils/http";
import type { AppPage, AuthResponse, ManagedCompany, ManagedUser } from "@shared/types";

type UserDraft = {
  tenantId: string;
  name: string;
  email: string;
  role: string;
  password: string;
};

type CompanyDraft = {
  name: string;
  segment: string;
};

type UseManagementWorkspaceActionsParams = {
  auth: AuthResponse | null;
  canManage: boolean;
  canManageCompanies: boolean;
  userDraft: UserDraft;
  setUserDraft: (value: UserDraft) => void;
  editingUserId: string;
  setEditingUserId: (value: string) => void;
  companyDraft: CompanyDraft;
  setCompanyDraft: (value: CompanyDraft) => void;
  editingCompanyId: string;
  setEditingCompanyId: (value: string) => void;
  loadManagedCompanies: (token?: string) => Promise<void>;
  loadManagedUsers: (token?: string, role?: string, tenantId?: string, force?: boolean) => Promise<void>;
  loadTenants: (token?: string) => Promise<void>;
  setCurrentPage: (page: AppPage) => void;
  setNotice: (message: string) => void;
  setError: (message: string) => void;
};

export function useManagementWorkspaceActions({
  auth,
  canManage,
  canManageCompanies,
  userDraft,
  setUserDraft,
  editingUserId,
  setEditingUserId,
  companyDraft,
  setCompanyDraft,
  editingCompanyId,
  setEditingCompanyId,
  loadManagedCompanies,
  loadManagedUsers,
  loadTenants,
  setCurrentPage,
  setNotice,
  setError
}: UseManagementWorkspaceActionsParams) {
  async function saveCompany() {
    if (!auth || !canManageCompanies) {
      return;
    }

    if (!companyDraft.name.trim() || !companyDraft.segment.trim()) {
      setError("Informe nome e segmento.");
      return;
    }

    const isEditing = Boolean(editingCompanyId);

    try {
      await saveManagedCompany(auth.token, {
        id: editingCompanyId || undefined,
        name: companyDraft.name,
        segment: companyDraft.segment
      });

      setCompanyDraft({ name: "", segment: "" });
      setEditingCompanyId("");
      await Promise.all([loadManagedCompanies(), loadTenants()]);
      setNotice(isEditing ? "Empresa atualizada." : "Empresa criada.");
    } catch (error) {
      setError(resolveApiErrorMessage(error, "Erro ao salvar empresa."));
    }
  }

  async function deleteCompany(companyId: string) {
    if (!auth || !canManageCompanies) {
      return;
    }

    try {
      await deleteManagedCompanyRequest(auth.token, companyId);
      await Promise.all([loadManagedCompanies(), loadTenants()]);
      setNotice("Empresa excluida.");
    } catch (error) {
      setError(resolveApiErrorMessage(error, "Erro ao excluir empresa."));
    }
  }

  function editCompany(company: ManagedCompany) {
    setEditingCompanyId(company.id);
    setCompanyDraft({ name: company.name, segment: company.segment });
    setCurrentPage("COMPANIES");
  }

  function cancelCompanyEdit() {
    setEditingCompanyId("");
    setCompanyDraft({ name: "", segment: "" });
  }

  async function saveUser() {
    if (!auth || !canManage) {
      return;
    }

    const isEditing = Boolean(editingUserId);
    const tenantId = canManageCompanies ? userDraft.tenantId : auth.tenantId;

    if (!userDraft.name.trim() || !userDraft.email.trim()) {
      setError("Preencha nome e email.");
      return;
    }

    if (!isEditing && !userDraft.password.trim()) {
      setError("Senha obrigatoria para criar usuario.");
      return;
    }

    try {
      await saveManagedUser(
        auth.token,
        isEditing
          ? {
              id: editingUserId,
              name: userDraft.name,
              email: userDraft.email,
              role: userDraft.role,
              password: userDraft.password || null
            }
          : {
              tenantId,
              name: userDraft.name,
              email: userDraft.email,
              role: userDraft.role,
              password: userDraft.password
            }
      );

      setEditingUserId("");
      setUserDraft({ tenantId: auth.tenantId, name: "", email: "", role: "Agent", password: "" });
      await loadManagedUsers();
      setNotice(isEditing ? "Usuario atualizado." : "Usuario criado.");
    } catch (error) {
      setError(resolveApiErrorMessage(error, "Erro ao salvar usuario."));
    }
  }

  async function deleteUser(userId: string) {
    if (!auth || !canManage) {
      return;
    }

    try {
      await deleteManagedUserRequest(auth.token, userId);
      await loadManagedUsers();
      setNotice("Usuario excluido.");
    } catch (error) {
      setError(resolveApiErrorMessage(error, "Erro ao excluir usuario."));
    }
  }

  function editUser(user: ManagedUser) {
    setEditingUserId(user.id);
    setUserDraft({ tenantId: user.tenantId, name: user.name, email: user.email, role: user.role, password: "" });
    setCurrentPage("USERS");
  }

  function cancelUserEdit() {
    setEditingUserId("");
    setUserDraft({ tenantId: auth?.tenantId ?? "", name: "", email: "", role: "Agent", password: "" });
  }

  return {
    saveCompany,
    deleteCompany,
    editCompany,
    cancelCompanyEdit,
    saveUser,
    deleteUser,
    editUser,
    cancelUserEdit
  };
}
