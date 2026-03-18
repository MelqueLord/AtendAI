import { api } from "@infrastructure/http/api";
import type {
  StartWhatsAppWebSessionPayload,
  WhatsAppWebSessionAction,
  WhatsAppWebSessionState,
  WhatsAppWebSessionsPayload
} from "@shared/types";

export function fetchWhatsAppWebSessions(token: string) {
  return api.get<WhatsAppWebSessionsPayload>("/engagement/whatsapp/web/sessions", { token });
}

export function fetchWhatsAppWebSessionState(token: string, sessionId: string) {
  return api.get<WhatsAppWebSessionState>(`/engagement/whatsapp/web/session/${sessionId}`, { token });
}

export function startWhatsAppWebSession(token: string, payload: StartWhatsAppWebSessionPayload) {
  return postAction("/engagement/whatsapp/web/session/start", token, payload);
}

export function restartWhatsAppWebSession(token: string, sessionId: string) {
  return postAction(`/engagement/whatsapp/web/session/${sessionId}/restart`, token, {});
}

export function disconnectWhatsAppWebSession(token: string, sessionId: string) {
  return postAction(`/engagement/whatsapp/web/session/${sessionId}/disconnect`, token, {});
}

export function syncWhatsAppWebSessionHistory(token: string, sessionId: string) {
  return postAction(`/engagement/whatsapp/web/session/${sessionId}/sync-history`, token, {});
}

function postAction(path: string, token: string, payload: object) {
  return api.post<WhatsAppWebSessionAction>(path, payload, { token });
}
