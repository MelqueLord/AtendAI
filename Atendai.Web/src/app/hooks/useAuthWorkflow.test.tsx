import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useAuthWorkflow } from "@app/hooks/useAuthWorkflow";

const authMocks = vi.hoisted(() => ({
  loginRequest: vi.fn(),
  logoutRequest: vi.fn(),
  switchTenantRequest: vi.fn(),
  validateLoginInput: vi.fn()
}));

vi.mock("@features/auth/services/authService", () => ({
  loginRequest: authMocks.loginRequest,
  logoutRequest: authMocks.logoutRequest,
  switchTenantRequest: authMocks.switchTenantRequest
}));

vi.mock("@features/auth/validations/loginSchema", () => ({
  validateLoginInput: authMocks.validateLoginInput
}));

describe("useAuthWorkflow", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("bloqueia login quando a validacao falha", async () => {
    authMocks.validateLoginInput.mockReturnValue("Email invalido");
    const setError = vi.fn();

    const { result } = renderHook(() => useAuthWorkflow({
      email: "errado",
      password: "123",
      auth: null,
      setAuth: vi.fn(),
      setAuthView: vi.fn(),
      currentPage: "ATTENDANCE",
      setCurrentPage: vi.fn(),
      setLoading: vi.fn(),
      setSwitchingTenant: vi.fn(),
      setError,
      setNotice: vi.fn(),
      loadTenants: vi.fn(),
      loadBillingSubscriptionSnapshot: vi.fn(),
      loadPageData: vi.fn(),
      resetWorkspaceState: vi.fn()
    }));

    await act(async () => {
      await result.current.login();
    });

    expect(setError).toHaveBeenCalledWith("Email invalido");
    expect(authMocks.loginRequest).not.toHaveBeenCalled();
  });

  it("autentica e carrega os dados iniciais", async () => {
    authMocks.validateLoginInput.mockReturnValue("");
    authMocks.loginRequest.mockResolvedValue({
      token: "token-1",
      refreshToken: "refresh-1",
      expiresAtUtc: "2026-03-16T10:00:00Z",
      name: "Jose",
      role: "SuperAdmin",
      tenantId: "tenant-1",
      tenantName: "Tenant 1"
    });

    const setAuth = vi.fn();
    const setCurrentPage = vi.fn();
    const setAuthView = vi.fn();
    const loadTenants = vi.fn().mockResolvedValue(undefined);
    const loadBillingSubscriptionSnapshot = vi.fn().mockResolvedValue(undefined);
    const loadPageData = vi.fn().mockResolvedValue(undefined);
    const resetWorkspaceState = vi.fn();
    const setNotice = vi.fn();

    const { result } = renderHook(() => useAuthWorkflow({
      email: "superadmin@atend.ai",
      password: "Admin@123",
      auth: null,
      setAuth,
      setAuthView,
      currentPage: "ATTENDANCE",
      setCurrentPage,
      setLoading: vi.fn(),
      setSwitchingTenant: vi.fn(),
      setError: vi.fn(),
      setNotice,
      loadTenants,
      loadBillingSubscriptionSnapshot,
      loadPageData,
      resetWorkspaceState
    }));

    await act(async () => {
      await result.current.login();
    });

    expect(authMocks.loginRequest).toHaveBeenCalledWith("superadmin@atend.ai", "Admin@123");
    expect(resetWorkspaceState).toHaveBeenCalledWith("tenant-1");
    expect(setAuth).toHaveBeenCalled();
    expect(setCurrentPage).toHaveBeenCalledWith("COMPANIES");
    expect(setAuthView).toHaveBeenCalledWith("LOGIN");
    expect(loadTenants).toHaveBeenCalledWith("token-1");
    expect(loadBillingSubscriptionSnapshot).toHaveBeenCalledWith("token-1", "SuperAdmin");
    expect(loadPageData).toHaveBeenCalledWith("COMPANIES", "token-1", "SuperAdmin", "tenant-1", true);
    expect(setNotice).toHaveBeenCalledWith("Sessao autenticada com sucesso.");
  });
});
