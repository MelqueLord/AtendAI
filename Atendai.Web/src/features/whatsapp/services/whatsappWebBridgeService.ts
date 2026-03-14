import { api } from "@infrastructure/http/api";
import type {
  StartWhatsAppWebSessionPayload,
  WhatsAppWebSessionAction,
  WhatsAppWebSessionState
} from "@shared/types";

export function fetchWhatsAppWebSessionState(token: string) {
  return api.get<WhatsAppWebSessionState>("/engagement/whatsapp/web/session", { token });
}

export function startWhatsAppWebSession(token: string, payload: StartWhatsAppWebSessionPayload) {
  return postAction("/engagement/whatsapp/web/session/start", token, payload);
}

export function restartWhatsAppWebSession(token: string) {
  return postAction("/engagement/whatsapp/web/session/restart", token, {});
}

export function disconnectWhatsAppWebSession(token: string) {
  return postAction("/engagement/whatsapp/web/session/disconnect", token, {});
}

export function syncWhatsAppWebSessionHistory(token: string) {
  return postAction("/engagement/whatsapp/web/session/sync-history", token, {});
}

function postAction(path: string, token: string, payload: object) {
  return api.post<WhatsAppWebSessionAction>(path, payload, { token });
}
