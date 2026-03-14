import { normalizePhone } from "@shared/utils/phone";

export type MetaConnectionStatus = {
  isActive: boolean;
  phoneNumberId: string | null;
  lastTestedAt: string | null;
  lastStatus: string | null;
  lastError: string | null;
};

export type MetaChannelStatus = {
  id: string;
  displayName: string;
  wabaId: string | null;
  phoneNumberId: string;
  verifyToken: string;
  isActive: boolean;
  isPrimary: boolean;
  lastTestedAt: string | null;
  lastStatus: string | null;
  lastError: string | null;
  updatedAt: string;
};

export type MetaIntegrationAvailability = {
  isConfigured: boolean;
  statusLabel: string;
  detail: string;
  activeChannelName: string | null;
  lastError: string | null;
  lastStatus: string | null;
  lastCheckedAt: string | null;
};

export const WHATSAPP_WEB_URL = "https://web.whatsapp.com/";
const WHATSAPP_WEB_WINDOW_NAME = "atendai-whatsapp-web";
const WHATSAPP_WEB_POPUP_FEATURES = "popup=yes,width=1360,height=900,left=80,top=40,resizable=yes,scrollbars=yes";

export function normalizeWhatsAppPhone(value: string) {
  return normalizePhone(value);
}

export function buildWhatsAppWebUrl(phone?: string, text?: string) {
  const normalizedPhone = phone ? normalizeWhatsAppPhone(phone) : "";
  if (!normalizedPhone) {
    return WHATSAPP_WEB_URL;
  }

  const params = new URLSearchParams({ phone: normalizedPhone });
  if (text?.trim()) {
    params.set("text", text.trim());
  }

  return `https://web.whatsapp.com/send?${params.toString()}`;
}
export function resolveMetaIntegrationAvailability(
  config: MetaConnectionStatus | null,
  channels: MetaChannelStatus[]
): MetaIntegrationAvailability {
  const primaryActiveChannel = channels.find((channel) => channel.isActive && channel.isPrimary);
  const fallbackActiveChannel = channels.find((channel) => channel.isActive);
  const selectedChannel = primaryActiveChannel ?? fallbackActiveChannel ?? null;

  if (selectedChannel) {
    const testedSuccessfully = selectedChannel.lastStatus?.toLowerCase() === "connected" && !selectedChannel.lastError;

    return {
      isConfigured: testedSuccessfully,
      statusLabel: testedSuccessfully ? "Pronto para uso" : "Conexao pendente",
      detail: testedSuccessfully
        ? `Canal ativo: ${selectedChannel.displayName}`
        : `Canal ${selectedChannel.displayName} preparado. Finalize a etapa na Meta e rode o teste final.`,
      activeChannelName: selectedChannel.displayName,
      lastError: selectedChannel.lastError,
      lastStatus: selectedChannel.lastStatus,
      lastCheckedAt: selectedChannel.lastTestedAt ?? selectedChannel.updatedAt
    };
  }

  if (config?.isActive && config.phoneNumberId) {
    const testedSuccessfully = config.lastStatus?.toLowerCase() === "connected" && !config.lastError;

    return {
      isConfigured: testedSuccessfully,
      statusLabel: testedSuccessfully ? "Integracao ativa" : "Conexao pendente",
      detail: testedSuccessfully
        ? "A API da Meta esta ativa e pronta para abrir o atendimento na plataforma."
        : "A conexao da Meta foi preparada. Faca o teste final depois de concluir a etapa no painel da Meta.",
      activeChannelName: null,
      lastError: config.lastError,
      lastStatus: config.lastStatus,
      lastCheckedAt: config.lastTestedAt
    };
  }

  return {
    isConfigured: false,
    statusLabel: "Nao configurado",
    detail: "A integracao da Meta ainda nao foi configurada para esta empresa.",
    activeChannelName: null,
    lastError: config?.lastError ?? null,
    lastStatus: config?.lastStatus ?? null,
    lastCheckedAt: config?.lastTestedAt ?? null
  };
}

export function openNewTab(url: string, targetWindow?: Window | null) {
  try {
    if (targetWindow && !targetWindow.closed) {
      targetWindow.location.replace(url);
      targetWindow.focus();
      return targetWindow;
    }

    const nextWindow = window.open(url, "_blank", "noopener,noreferrer");
    nextWindow?.focus();
    return nextWindow;
  } catch {
    return null;
  }
}

export function openPreparedWindow() {
  try {
    const preparedWindow = window.open("", WHATSAPP_WEB_WINDOW_NAME, WHATSAPP_WEB_POPUP_FEATURES);
    if (!preparedWindow) {
      return null;
    }

    preparedWindow.document.open();
    preparedWindow.document.write(`<!DOCTYPE html>
<html lang="pt-BR">
  <head>
    <meta charset="utf-8" />
    <title>Abrindo WhatsApp Web</title>
    <style>
      body {
        margin: 0;
        min-height: 100vh;
        display: grid;
        place-items: center;
        background: #f8fafc;
        color: #0f172a;
        font-family: "Segoe UI", sans-serif;
      }
      main {
        max-width: 420px;
        padding: 32px;
        border-radius: 24px;
        background: #ffffff;
        border: 1px solid #e2e8f0;
        box-shadow: 0 18px 45px rgba(15, 23, 42, 0.12);
      }
      h1 {
        margin: 0 0 12px;
        font-size: 20px;
      }
      p {
        margin: 0;
        line-height: 1.6;
        color: #475569;
      }
    </style>
  </head>
  <body>
    <main>
      <h1>Preparando o WhatsApp Web</h1>
      <p>Estamos tentando abrir o canal sem tirar voce do CRM. Se o navegador bloquear a exibicao interna, esta janela sera usada como fallback.</p>
    </main>
  </body>
</html>`);
    preparedWindow.document.close();
    preparedWindow.focus();
    return preparedWindow;
  } catch {
    return null;
  }
}

export function openPopupWindow(url: string, targetWindow?: Window | null) {
  try {
    const popupWindow =
      targetWindow && !targetWindow.closed
        ? targetWindow
        : window.open("", WHATSAPP_WEB_WINDOW_NAME, WHATSAPP_WEB_POPUP_FEATURES);

    if (!popupWindow) {
      return null;
    }

    popupWindow.location.href = url;
    popupWindow.focus();
    return popupWindow;
  } catch {
    return null;
  }
}
