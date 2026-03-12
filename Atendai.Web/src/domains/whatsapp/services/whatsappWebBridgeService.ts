import type {
  StartWhatsAppWebSessionPayload,
  WhatsAppWebSessionAction,
  WhatsAppWebSessionState
} from "../../../app/types";

export async function fetchWhatsAppWebSessionState(apiBase: string, token: string) {
  const response = await fetch(`${apiBase}/engagement/whatsapp/web/session`, {
    headers: { Authorization: `Bearer ${token}` }
  });

  if (!response.ok) {
    throw new Error(await extractError(response, "Nao foi possivel carregar o estado da sessao QR."));
  }

  return (await response.json()) as WhatsAppWebSessionState;
}

export async function startWhatsAppWebSession(apiBase: string, token: string, payload: StartWhatsAppWebSessionPayload) {
  return postAction(`${apiBase}/engagement/whatsapp/web/session/start`, token, payload);
}

export async function restartWhatsAppWebSession(apiBase: string, token: string) {
  return postAction(`${apiBase}/engagement/whatsapp/web/session/restart`, token, {});
}

export async function disconnectWhatsAppWebSession(apiBase: string, token: string) {
  return postAction(`${apiBase}/engagement/whatsapp/web/session/disconnect`, token, {});
}

export async function syncWhatsAppWebSessionHistory(apiBase: string, token: string) {
  return postAction(`${apiBase}/engagement/whatsapp/web/session/sync-history`, token, {});
}

async function postAction(url: string, token: string, payload: object) {
  const response = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    throw new Error(await extractError(response, "Nao foi possivel executar a acao da sessao QR."));
  }

  return (await response.json()) as WhatsAppWebSessionAction;
}

async function extractError(response: Response, fallback: string) {
  try {
    const text = await response.text();
    if (!text) {
      return fallback;
    }

    const data = JSON.parse(text) as { message?: string; detail?: string; title?: string };
    return data.message || data.detail || data.title || fallback;
  } catch {
    return fallback;
  }
}
