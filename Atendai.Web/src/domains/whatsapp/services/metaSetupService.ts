import type { MetaWhatsAppBootstrapResult, MetaWhatsAppSetup } from "../../../app/types";

export type MetaBootstrapDraft = {
  displayName: string;
  phoneNumberId: string;
  accessToken: string;
  isPrimary: boolean;
};

export type MetaTestResult = {
  success: boolean;
  status: string;
  error?: string | null;
};

export async function fetchMetaSetup(apiBase: string, token: string) {
  const response = await fetch(`${apiBase}/engagement/whatsapp/meta/setup`, {
    headers: { Authorization: `Bearer ${token}` }
  });

  if (!response.ok) {
    throw new Error(await extractError(response, "Nao foi possivel carregar a assistencia de conexao do WhatsApp."));
  }

  return (await response.json()) as MetaWhatsAppSetup;
}

export async function bootstrapMetaChannel(apiBase: string, token: string, draft: MetaBootstrapDraft) {
  const response = await fetch(`${apiBase}/engagement/whatsapp/meta/bootstrap`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      displayName: draft.displayName,
      phoneNumberId: draft.phoneNumberId,
      accessToken: draft.accessToken,
      verifyToken: null,
      wabaId: null,
      isActive: true,
      isPrimary: draft.isPrimary,
      publicBaseUrl: null
    })
  });

  if (!response.ok) {
    throw new Error(await extractError(response, "Nao foi possivel preparar a conexao com a Meta."));
  }

  return (await response.json()) as MetaWhatsAppBootstrapResult;
}

export async function testMetaConnection(apiBase: string, token: string, channelId?: string) {
  const endpoint = channelId
    ? `${apiBase}/engagement/whatsapp/channels/${channelId}/test`
    : `${apiBase}/engagement/whatsapp/test`;

  const response = await fetch(endpoint, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` }
  });

  if (!response.ok) {
    throw new Error(await extractError(response, "Nao foi possivel testar a conexao com a Meta."));
  }

  return (await response.json()) as MetaTestResult;
}

export async function updateMetaChannel(
  apiBase: string,
  token: string,
  channel: {
    id: string;
    displayName: string;
    wabaId: string | null;
    phoneNumberId: string;
    verifyToken: string;
    isActive: boolean;
    isPrimary: boolean;
  },
  changes: { displayName?: string; isActive?: boolean; isPrimary?: boolean }
) {
  const response = await fetch(`${apiBase}/engagement/whatsapp/channels/${channel.id}`, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      displayName: changes.displayName ?? channel.displayName,
      wabaId: channel.wabaId,
      phoneNumberId: channel.phoneNumberId,
      verifyToken: channel.verifyToken,
      accessToken: null,
      isActive: changes.isActive ?? channel.isActive,
      isPrimary: changes.isPrimary ?? channel.isPrimary
    })
  });

  if (!response.ok) {
    throw new Error(await extractError(response, "Nao foi possivel atualizar o canal."));
  }
}

export async function deleteMetaChannel(apiBase: string, token: string, channelId: string) {
  const response = await fetch(`${apiBase}/engagement/whatsapp/channels/${channelId}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` }
  });

  if (!response.ok) {
    throw new Error(await extractError(response, "Nao foi possivel remover o canal."));
  }
}

export async function copyText(value: string) {
  try {
    await navigator.clipboard.writeText(value);
    return true;
  } catch {
    return false;
  }
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




