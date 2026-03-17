import { useCallback, useEffect, useState, type Dispatch, type SetStateAction } from "react";
import { refreshSession } from "@features/auth/services/authService";
import type { AuthView } from "@app/store";
import type { AppPage, AuthResponse } from "@shared/types";
import {
  clearPersistedAuthState,
  defaultPageForRole,
  isPageAllowedForRole,
  isSessionExpired,
  loadPersistedAuth,
  loadPersistedAuthView,
  loadPersistedPage,
  savePersistedAuth,
  savePersistedAuthView,
  savePersistedPage
} from "./authSessionState";

export type AuthSessionState = {
  auth: AuthResponse | null;
  setAuth: Dispatch<SetStateAction<AuthResponse | null>>;
  sessionReady: boolean;
  authView: AuthView;
  setAuthView: Dispatch<SetStateAction<AuthView>>;
  currentPage: AppPage;
  setCurrentPage: Dispatch<SetStateAction<AppPage>>;
  sessionRestoreError: string;
  clearSessionRestoreError: () => void;
};

export function useAuthSessionState(): AuthSessionState {
  const [auth, setAuth] = useState<AuthResponse | null>(null);
  const [sessionReady, setSessionReady] = useState(false);
  const [authView, setAuthView] = useState<AuthView>(() => loadPersistedAuthView());
  const [currentPage, setCurrentPage] = useState<AppPage>(() => loadPersistedPage());
  const [sessionRestoreError, setSessionRestoreError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function restoreSession() {
      const storedAuth = loadPersistedAuth();
      if (!storedAuth) {
        if (!cancelled) {
          setSessionReady(true);
        }
        return;
      }

      if (!isSessionExpired(storedAuth.expiresAtUtc)) {
        if (!cancelled) {
          setAuth(storedAuth);
          setSessionReady(true);
        }
        return;
      }

      if (!storedAuth.refreshToken) {
        clearPersistedAuthState();
        if (!cancelled) {
          setAuth(null);
          setAuthView("LOGIN");
          setSessionReady(true);
        }
        return;
      }

      try {
        const refreshedAuth = await refreshSession(storedAuth.refreshToken);
        if (!cancelled) {
          setAuth(refreshedAuth);
        }
      } catch {
        clearPersistedAuthState();
        if (!cancelled) {
          setAuth(null);
          setAuthView("LOGIN");
          setSessionRestoreError("Nao foi possivel restaurar sua sessao automaticamente.");
        }
      } finally {
        if (!cancelled) {
          setSessionReady(true);
        }
      }
    }

    void restoreSession();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!sessionReady) return;
    savePersistedAuth(auth);
  }, [auth, sessionReady]);

  useEffect(() => {
    if (!sessionReady) return;
    savePersistedAuthView(authView);
  }, [authView, sessionReady]);

  useEffect(() => {
    if (!sessionReady || !auth) return;
    savePersistedPage(currentPage);
  }, [auth, currentPage, sessionReady]);

  useEffect(() => {
    if (!auth) return;
    setCurrentPage((page) => (isPageAllowedForRole(page, auth.role) ? page : defaultPageForRole(auth.role)));
  }, [auth]);

  const clearSessionRestoreError = useCallback(() => {
    setSessionRestoreError("");
  }, []);

  return {
    auth,
    setAuth,
    sessionReady,
    authView,
    setAuthView,
    currentPage,
    setCurrentPage,
    sessionRestoreError,
    clearSessionRestoreError
  };
}
