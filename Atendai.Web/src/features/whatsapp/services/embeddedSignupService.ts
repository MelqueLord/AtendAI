import { api } from "@infrastructure/http/api";
import type {
  CompleteMetaEmbeddedSignupPayload,
  MetaEmbeddedSignupConfig,
  MetaEmbeddedSignupResult
} from "@shared/types";

declare global {
  interface Window {
    FB?: {
      init: (config: { appId: string; autoLogAppEvents: boolean; xfbml: boolean; version: string }) => void;
      login: (
        callback: (response: { authResponse?: { code?: string } } | Record<string, unknown>) => void,
        options: Record<string, unknown>
      ) => void;
    };
    fbAsyncInit?: () => void;
  }
}

type EmbeddedSignupEventPayload = {
  type: "WA_EMBEDDED_SIGNUP";
  event: string;
  data?: {
    phone_number_id?: string;
    waba_id?: string;
    business_portfolio_id?: string;
    ad_account_id?: string;
    page_id?: string;
    dataset_id?: string;
    current_step?: string;
    error_message?: string;
    error_id?: string;
    session_id?: string;
    timestamp?: string;
  };
};

type EmbeddedSignupDraft = {
  displayName: string;
  isPrimary: boolean;
  publicBaseUrl?: string | null;
};

let sdkReadyPromise: Promise<void> | null = null;

export function fetchEmbeddedSignupConfig(token: string) {
  return api.get<MetaEmbeddedSignupConfig>("/engagement/whatsapp/meta/embedded-signup/config", { token });
}

export function completeEmbeddedSignup(token: string, payload: CompleteMetaEmbeddedSignupPayload) {
  return api.post<MetaEmbeddedSignupResult>("/engagement/whatsapp/meta/embedded-signup/complete", payload, { token });
}

export async function launchEmbeddedSignup(token: string, draft: EmbeddedSignupDraft) {
  const config = await fetchEmbeddedSignupConfig(token);
  if (!config.isReady || !config.appId || !config.configurationId) {
    throw new Error(config.error ?? "O Embedded Signup oficial da Meta ainda nao esta configurado.");
  }

  await ensureFacebookSdk(config.appId, config.graphApiVersion);

  const embeddedEventPromise = waitForEmbeddedSignupEvent();
  const codePromise = new Promise<string>((resolve, reject) => {
    if (!window.FB) {
      reject(new Error("O SDK da Meta nao carregou corretamente."));
      return;
    }

    window.FB.login(
      (response) => {
        const authResponse =
          typeof response === "object" && response !== null && "authResponse" in response
            ? (response as { authResponse?: { code?: string } }).authResponse
            : undefined;
        const code = authResponse?.code;
        if (!code) {
          reject(new Error("A Meta nao retornou o code de autorizacao do cadastro incorporado."));
          return;
        }

        resolve(code);
      },
      {
        config_id: config.configurationId,
        response_type: "code",
        override_default_response_type: true,
        extras: {
          setup: {}
        }
      }
    );
  });

  const [code, eventPayload] = await Promise.all([codePromise, embeddedEventPromise]);
  const eventData = eventPayload.data ?? {};

  return completeEmbeddedSignup(token, {
    code,
    finishType: eventPayload.event,
    phoneNumberId: eventData.phone_number_id ?? null,
    wabaId: eventData.waba_id ?? null,
    businessPortfolioId: eventData.business_portfolio_id ?? null,
    adAccountId: eventData.ad_account_id ?? null,
    pageId: eventData.page_id ?? null,
    datasetId: eventData.dataset_id ?? null,
    displayName: draft.displayName.trim() || null,
    isPrimary: draft.isPrimary,
    publicBaseUrl: draft.publicBaseUrl?.trim() || null
  });
}

function ensureFacebookSdk(appId: string, graphApiVersion: string) {
  if (sdkReadyPromise) {
    return sdkReadyPromise;
  }

  sdkReadyPromise = new Promise<void>((resolve, reject) => {
    const initialize = () => {
      if (!window.FB) {
        reject(new Error("O SDK do Facebook nao foi disponibilizado na janela."));
        return;
      }

      window.FB.init({
        appId,
        autoLogAppEvents: true,
        xfbml: true,
        version: graphApiVersion
      });
      resolve();
    };

    if (window.FB) {
      initialize();
      return;
    }

    window.fbAsyncInit = initialize;

    const existingScript = document.querySelector<HTMLScriptElement>('script[data-atendai-facebook-sdk="true"]');
    if (existingScript) {
      return;
    }

    const script = document.createElement("script");
    script.async = true;
    script.defer = true;
    script.crossOrigin = "anonymous";
    script.src = "https://connect.facebook.net/en_US/sdk.js";
    script.dataset.atendaiFacebookSdk = "true";
    script.onerror = () => reject(new Error("Falha ao carregar o SDK oficial da Meta."));
    document.head.appendChild(script);
  });

  return sdkReadyPromise;
}

function waitForEmbeddedSignupEvent() {
  return new Promise<EmbeddedSignupEventPayload>((resolve, reject) => {
    const timeoutId = window.setTimeout(() => {
      cleanup();
      reject(new Error("A Meta nao retornou o evento do cadastro incorporado a tempo."));
    }, 90_000);

    const handler = (event: MessageEvent<string>) => {
      if (!event.origin.endsWith("facebook.com")) {
        return;
      }

      try {
        const data = JSON.parse(event.data) as EmbeddedSignupEventPayload;
        if (data.type !== "WA_EMBEDDED_SIGNUP") {
          return;
        }

        if (data.event === "CANCEL") {
          cleanup();
          reject(new Error(data.data?.error_message ?? "O cadastro incorporado foi cancelado antes de concluir."));
          return;
        }

        cleanup();
        resolve(data);
      } catch {
        // Ignore non-JSON events from the SDK container.
      }
    };

    const cleanup = () => {
      window.clearTimeout(timeoutId);
      window.removeEventListener("message", handler);
    };

    window.addEventListener("message", handler);
  });
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
