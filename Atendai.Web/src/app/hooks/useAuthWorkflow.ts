import { defaultPageForRole } from "@app/session/authSessionState";
import { loginRequest, logoutRequest, switchTenantRequest } from "@features/auth/services/authService";
import { validateLoginInput } from "@features/auth/validations/loginSchema";
import { resolveApiErrorMessage } from "@shared/utils/http";
import type { AppPage, AuthResponse } from "@shared/types";

type AuthWorkflowParams = {
  email: string;
  password: string;
  auth: AuthResponse | null;
  setAuth: (value: AuthResponse | null) => void;
  setAuthView: (value: "LOGIN" | "PRICING") => void;
  currentPage: AppPage;
  setCurrentPage: (value: AppPage) => void;
  setLoading: (value: boolean) => void;
  setSwitchingTenant: (value: boolean) => void;
  setError: (value: string) => void;
  setNotice: (value: string) => void;
  loadTenants: (token?: string) => Promise<void>;
  loadBillingSubscriptionSnapshot: (token?: string, role?: string) => Promise<void>;
  loadPageData: (page: AppPage, token?: string, role?: string, tenantId?: string, force?: boolean) => Promise<void>;
  resetWorkspaceState: (nextTenantId?: string) => void;
};

export function useAuthWorkflow({
  email,
  password,
  auth,
  setAuth,
  setAuthView,
  currentPage,
  setCurrentPage,
  setLoading,
  setSwitchingTenant,
  setError,
  setNotice,
  loadTenants,
  loadBillingSubscriptionSnapshot,
  loadPageData,
  resetWorkspaceState
}: AuthWorkflowParams) {
  async function login() {
    setLoading(true);
    setError("");

    const validationMessage = validateLoginInput(email, password);
    if (validationMessage) {
      setError(validationMessage);
      setLoading(false);
      return;
    }

    try {
      const data = await loginRequest(email, password);
      const targetPage = defaultPageForRole(data.role);
      resetWorkspaceState(data.tenantId);
      setAuth(data);
      setCurrentPage(targetPage);
      setAuthView("LOGIN");
      if (data.role === "SuperAdmin") {
        await loadTenants(data.token);
      }

      await Promise.all([
        loadBillingSubscriptionSnapshot(data.token, data.role),
        loadPageData(targetPage, data.token, data.role, data.tenantId, true)
      ]);

      setNotice("Sessao autenticada com sucesso.");
    } catch (error) {
      setError(resolveApiErrorMessage(error, "Nao foi possivel conectar na API."));
    } finally {
      setLoading(false);
    }
  }

  async function switchTenant(tenantId: string) {
    if (!auth || auth.role !== "SuperAdmin" || tenantId === auth.tenantId) {
      return;
    }

    setSwitchingTenant(true);
    try {
      const data = await switchTenantRequest(auth.token, tenantId);
      setAuth(data);
      resetWorkspaceState(data.tenantId);
      await Promise.all([
        loadTenants(data.token),
        loadBillingSubscriptionSnapshot(data.token, data.role),
        loadPageData(currentPage, data.token, data.role, data.tenantId, true)
      ]);
      setNotice(`Contexto alterado para ${data.tenantName}.`);
    } catch (error) {
      setError(resolveApiErrorMessage(error, "Erro ao alternar tenant."));
    } finally {
      setSwitchingTenant(false);
    }
  }

  async function logout() {
    if (auth?.refreshToken) {
      try {
        await logoutRequest(auth.refreshToken);
      } catch {
        // ignore network errors on logout
      }
    }

    setAuth(null);
    setAuthView("LOGIN");
    setError("");
    setNotice("");
    resetWorkspaceState();
    setCurrentPage("ATTENDANCE");
  }

  return {
    login,
    switchTenant,
    logout
  };
}
