import { createContext } from "react";
import type { AuthSessionState } from "@app/session/useAuthSessionState";

export const AuthContext = createContext<AuthSessionState | null>(null);
