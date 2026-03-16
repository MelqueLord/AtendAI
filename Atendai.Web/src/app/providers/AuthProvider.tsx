import type { PropsWithChildren } from "react";
import { AuthContext } from "@app/providers/AuthContext";
import { useAuthSessionState } from "@app/session/useAuthSessionState";

export function AuthProvider({ children }: PropsWithChildren) {
  const authSession = useAuthSessionState();

  return <AuthContext.Provider value={authSession}>{children}</AuthContext.Provider>;
}
