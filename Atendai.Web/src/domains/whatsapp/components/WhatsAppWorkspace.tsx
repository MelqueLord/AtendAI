import { useEffect, useMemo, useRef, useState } from "react";
import type {
  MetaEmbeddedSignupConfig,
  MetaWhatsAppBootstrapResult,
  MetaWhatsAppSetup,
  WhatsAppWebSessionState
} from "../../../app/types";
import {
  EmptyStatePanel,
  MetricTile,
  StatusPill,
  WorkspaceSection,
  heroPanelClass,
  cardClass,
  inputClass,
  labelClass,
  primaryButtonClass,
  secondaryButtonClass,
  textareaClass,
  subtlePanelClass,
  tableShellClass,
  workspacePageClass
} from "../../../shared/ui/WorkspaceUi";
import {
  WHATSAPP_WEB_URL,
  openNewTab,
  openPopupWindow,
  openPreparedWindow,
  resolveMetaIntegrationAvailability,
  type MetaChannelStatus,
  type MetaConnectionStatus
} from "../services/whatsappLaunchService";
import { bootstrapMetaChannel, copyText, deleteMetaChannel, fetchMetaSetup, testMetaConnection, updateMetaChannel, type MetaBootstrapDraft } from "../services/metaSetupService";
import { fetchEmbeddedSignupConfig, launchEmbeddedSignup } from "../services/embeddedSignupService";
import { disconnectWhatsAppWebSession, fetchWhatsAppWebSessionState, restartWhatsAppWebSession, startWhatsAppWebSession, syncWhatsAppWebSessionHistory } from "../services/whatsappWebBridgeService";

type WhatsAppWorkspaceProps = {
  apiBase: string;
  authToken: string;
  whatsAppConfig: MetaConnectionStatus | null;
  whatsAppChannels: MetaChannelStatus[];
  whatsAppChannelLimit: number;
  onRefreshMetaState: () => Promise<void>;
  onOpenMetaChannel: () => void;
  onSurfaceError: (message: string) => void;
  onSurfaceNotice: (message: string) => void;
  formatDate: (value: string) => string;
};

type ChannelOptionCardProps = {
  title: string;
  description: string;
  statusLabel: string;
  statusTone: "slate" | "blue" | "emerald" | "amber" | "rose";
  helper: string;
  ctaLabel: string;
  onAction: () => void;
  footnote?: string;
  message?: string;
};

type ReadonlyCopyFieldProps = {
  label: string;
  value: string;
  buttonLabel: string;
  onCopy: () => void;
};

type WebLaunchState = "idle" | "embedding" | "embedded" | "popup" | "tab" | "error";

function ChannelOptionCard({
  title,
  description,
  statusLabel,
  statusTone,
  helper,
  ctaLabel,
  onAction,
  footnote,
  message
}: ChannelOptionCardProps) {
  return (
    <article className={`${cardClass} flex h-full flex-col p-6`}>
      <div className="flex flex-1 flex-col gap-6">
        <div className="space-y-4">
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-2">
              <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-50 text-sm font-semibold text-blue-700">WA</span>
              <div className="space-y-1">
                <h3 className="text-xl font-semibold tracking-tight text-slate-950">{title}</h3>
                <p className="text-sm leading-6 text-slate-600">{description}</p>
              </div>
            </div>
            <StatusPill tone={statusTone}>{statusLabel}</StatusPill>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
            <p className="text-sm font-medium leading-6 text-slate-700">{helper}</p>
            {footnote && <p className="mt-2 text-sm leading-6 text-slate-500">{footnote}</p>}
          </div>

          {message && <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-800">{message}</div>}
        </div>

        <div className="flex justify-start pt-1">
          <button type="button" className={primaryButtonClass} onClick={onAction}>{ctaLabel}</button>
        </div>
      </div>
    </article>
  );
}

function ReadonlyCopyField({ label, value, buttonLabel, onCopy }: ReadonlyCopyFieldProps) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
        <label className="min-w-0 flex-1 space-y-2">
          <span className="text-sm font-medium text-slate-700">{label}</span>
          <input className={inputClass} readOnly value={value} />
        </label>
        <button type="button" className={`${secondaryButtonClass} shrink-0`} onClick={onCopy}>{buttonLabel}</button>
      </div>
    </div>
  );
}

function SwitchField({
  id,
  label,
  caption,
  checked,
  onChange
}: {
  id: string;
  label: string;
  caption: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label htmlFor={id} className="flex items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-3">
      <span className="space-y-1">
        <strong className="block text-sm font-semibold text-slate-900">{label}</strong>
        <small className="block text-xs leading-5 text-slate-500">{caption}</small>
      </span>
      <span className="relative inline-flex h-7 w-12 shrink-0 items-center">
        <input id={id} type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} className="peer sr-only" />
        <span className="absolute inset-0 rounded-full border border-slate-300 bg-slate-200 transition peer-checked:border-blue-600 peer-checked:bg-blue-600 peer-focus-visible:ring-4 peer-focus-visible:ring-blue-100" />
        <span className="absolute left-1 h-5 w-5 rounded-full bg-white shadow-sm transition peer-checked:translate-x-5" />
      </span>
    </label>
  );
}

function WebViewerStatePanel({
  state,
  message,
  onOpenPopup,
  onOpenTab,
  onRetryEmbed
}: {
  state: WebLaunchState;
  message: string;
  onOpenPopup: () => void;
  onOpenTab: () => void;
  onRetryEmbed: () => void;
}) {
  const toneMap: Record<WebLaunchState, string> = {
    idle: "border-slate-200 bg-white text-slate-700",
    embedding: "border-blue-200 bg-blue-50/70 text-blue-800",
    embedded: "border-emerald-200 bg-emerald-50/70 text-emerald-800",
    popup: "border-blue-200 bg-blue-50/70 text-blue-800",
    tab: "border-amber-200 bg-amber-50/70 text-amber-800",
    error: "border-rose-200 bg-rose-50/70 text-rose-800"
  };

  const titleMap: Record<WebLaunchState, string> = {
    idle: "WhatsApp Web pronto para abrir",
    embedding: "Tentando abrir dentro do painel",
    embedded: "WhatsApp Web carregado no painel",
    popup: "WhatsApp Web aberto em janela auxiliar",
    tab: "WhatsApp Web aberto em nova aba",
    error: "Nao foi possivel abrir o WhatsApp Web"
  };

  return (
    <div className={`rounded-3xl border p-6 shadow-sm ${toneMap[state]}`}>
      <div className="space-y-3">
        <div className="space-y-2">
          <span className="inline-flex rounded-full bg-white/70 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-600">Status de abertura</span>
          <h4 className="text-lg font-semibold text-slate-950">{titleMap[state]}</h4>
          <p className="text-sm leading-6 text-slate-600">{message}</p>
        </div>

        {(state === "popup" || state === "tab" || state === "error") && (
          <div className="rounded-2xl border border-slate-200 bg-white/90 p-4 text-sm leading-6 text-slate-600">
            O WhatsApp Web costuma bloquear iframe em navegadores comuns por politica do proprio produto. Quando isso acontece, a melhor experiencia possivel e abrir uma janela auxiliar ou uma nova aba sem perder o contexto do CRM.
          </div>
        )}

        <div className="flex flex-wrap items-center gap-3">
          {(state === "popup" || state === "tab" || state === "error") && (
            <button type="button" className={primaryButtonClass} onClick={onOpenPopup}>Abrir janela auxiliar</button>
          )}
          {(state === "popup" || state === "tab" || state === "error") && (
            <button type="button" className={secondaryButtonClass} onClick={onOpenTab}>Abrir em nova aba</button>
          )}
          {(state === "popup" || state === "tab") && (
            <button type="button" className={secondaryButtonClass} onClick={onRetryEmbed}>Tentar painel novamente</button>
          )}
        </div>
      </div>
    </div>
  );
}

export function WhatsAppWorkspace({
  apiBase,
  authToken,
  whatsAppConfig,
  whatsAppChannels,
  whatsAppChannelLimit,
  onRefreshMetaState,
  onOpenMetaChannel,
  onSurfaceError,
  onSurfaceNotice,
  formatDate
}: WhatsAppWorkspaceProps) {
  const metaAvailability = useMemo(
    () => resolveMetaIntegrationAvailability(whatsAppConfig, whatsAppChannels),
    [whatsAppConfig, whatsAppChannels]
  );

  const [setup, setSetup] = useState<MetaWhatsAppSetup | null>(null);
  const [embeddedSignupConfig, setEmbeddedSignupConfig] = useState<MetaEmbeddedSignupConfig | null>(null);
  const [embeddedSignupLoading, setEmbeddedSignupLoading] = useState(true);
  const [embeddedSignupBusy, setEmbeddedSignupBusy] = useState(false);
  const [setupLoading, setSetupLoading] = useState(true);
  const [setupSaving, setSetupSaving] = useState(false);
  const [setupTesting, setSetupTesting] = useState(false);
  const [showSetupForm, setShowSetupForm] = useState(false);
  const [setupDraft, setSetupDraft] = useState<MetaBootstrapDraft>({
    displayName: "",
    phoneNumberId: "",
    accessToken: "",
    isPrimary: true
  });
  const [busyChannelId, setBusyChannelId] = useState("");
  const [setupFeedback, setSetupFeedback] = useState("");
  const [metaMessage, setMetaMessage] = useState("");
  const [qrSession, setQrSession] = useState<WhatsAppWebSessionState | null>(null);
  const [qrLoading, setQrLoading] = useState(true);
  const [qrBusy, setQrBusy] = useState(false);
  const [qrMessage, setQrMessage] = useState("");
  const [qrDisplayName, setQrDisplayName] = useState("");
  const [webMessage, setWebMessage] = useState("");
  const [webViewerOpen, setWebViewerOpen] = useState(false);
  const [webLaunchState, setWebLaunchState] = useState<WebLaunchState>("idle");
  const preparedWindowRef = useRef<Window | null>(null);
  const externalWindowRef = useRef<Window | null>(null);
  const fallbackTimerRef = useRef<number | null>(null);
  const frameLoadedRef = useRef(false);

  async function loadSetupState() {
    setSetupLoading(true);

    try {
      const data = await fetchMetaSetup(apiBase, authToken);
      setSetup(data);
      setSetupDraft((current) => ({
        displayName: current.displayName || data.displayName || "",
        phoneNumberId: current.phoneNumberId || data.phoneNumberId || "",
        accessToken: "",
        isPrimary: current.isPrimary
      }));
      setShowSetupForm(!data.channelId);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Nao foi possivel carregar a conexao com a Meta.";
      setSetupFeedback(message);
      onSurfaceError(message);
    } finally {
      setSetupLoading(false);
    }
  }

  async function loadEmbeddedSignupState() {
    setEmbeddedSignupLoading(true);

    try {
      const data = await fetchEmbeddedSignupConfig(apiBase, authToken);
      setEmbeddedSignupConfig(data);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Nao foi possivel carregar o Embedded Signup oficial.";
      setEmbeddedSignupConfig({
        isReady: false,
        appId: null,
        configurationId: null,
        graphApiVersion: "v22.0",
        error: message
      });
    } finally {
      setEmbeddedSignupLoading(false);
    }
  }

  async function loadQrSessionState() {
    setQrLoading(true);

    try {
      const data = await fetchWhatsAppWebSessionState(apiBase, authToken);
      setQrSession(data);
      setQrMessage("");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Nao foi possivel carregar a sessao QR.";
      setQrSession({
        isConfigured: false,
        status: "error",
        detail: message,
        sessionId: null,
        qrCodeDataUrl: null,
        pairingCode: null,
        phoneNumber: null,
        displayName: null,
        lastUpdatedAt: null,
        canStart: false,
        canRestart: false,
        canDisconnect: false,
        cachedChatsCount: 0,
        lastHistorySyncAt: null
      });
    } finally {
      setQrLoading(false);
    }
  }

  useEffect(() => {
    void loadSetupState();
  }, [apiBase, authToken]);

  useEffect(() => {
    void loadEmbeddedSignupState();
  }, [apiBase, authToken]);

  useEffect(() => {
    void loadQrSessionState();
  }, [apiBase, authToken]);

  useEffect(() => {
    if (whatsAppChannels.length === 0) {
      setSetupDraft((current) => ({ ...current, isPrimary: true }));
    }
  }, [whatsAppChannels.length]);

  useEffect(() => {
    if (qrDisplayName.trim()) {
      return;
    }

    setQrDisplayName(setup?.displayName ?? "WhatsApp QR");
  }, [qrDisplayName, setup?.displayName]);

  useEffect(() => {
    if (!qrSession?.isConfigured) {
      return;
    }

    const status = qrSession.status.toLowerCase();
    const needsFollowUpRefresh = ["starting", "awaiting_scan", "qr_ready", "connecting"].includes(status)
      || (status === "connected" && !qrSession.lastHistorySyncAt);
    if (!needsFollowUpRefresh) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      void loadQrSessionState();
    }, 4000);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [apiBase, authToken, qrSession]);

  function clearPreparedWindow(closeWindow: boolean) {
    if (fallbackTimerRef.current) {
      window.clearTimeout(fallbackTimerRef.current);
      fallbackTimerRef.current = null;
    }

    if (closeWindow && preparedWindowRef.current && !preparedWindowRef.current.closed) {
      preparedWindowRef.current.close();
    }

    preparedWindowRef.current = null;
    frameLoadedRef.current = false;
  }

  useEffect(() => {
    return () => {
      clearPreparedWindow(true);
    };
  }, []);

  const hasPreparedChannel = Boolean(setup?.channelId || whatsAppChannels.length);
  const lastCheckedAt = setup?.lastTestedAt ?? metaAvailability.lastCheckedAt;
  const metaReady = Boolean(setup?.isConfigured || metaAvailability.isConfigured);
  const embeddedSignupReady = Boolean(embeddedSignupConfig?.isReady);
  const activeChannels = whatsAppChannels.filter((channel) => channel.isActive).length;
  const readyChannels = whatsAppChannels.filter((channel) => channel.isActive && channel.lastStatus?.toLowerCase() === "connected" && !channel.lastError).length;
  const remainingChannels = Math.max(0, whatsAppChannelLimit - whatsAppChannels.length);
  const limitReached = whatsAppChannelLimit > 0 && whatsAppChannels.length >= whatsAppChannelLimit;
  const statusLabel = metaReady ? "Conectado" : hasPreparedChannel ? "Em preparacao" : "Nao iniciado";
  const statusTone = metaReady ? "emerald" : hasPreparedChannel ? "amber" : "slate";
  const qrStatusLabel = qrLoading
    ? "Carregando"
    : !qrSession?.isConfigured
      ? "Nao configurado"
      : qrSession.status === "connected"
        ? "Conectado"
        : qrSession.status === "awaiting_scan" || qrSession.status === "qr_ready"
          ? "Aguardando leitura"
          : qrSession.status === "starting" || qrSession.status === "connecting"
            ? "Conectando"
            : qrSession.status === "disconnected"
              ? "Desconectado"
              : "Experimental";
  const qrStatusTone: "slate" | "blue" | "emerald" | "amber" | "rose" = !qrSession?.isConfigured
    ? "slate"
    : qrSession.status === "connected"
      ? "emerald"
      : qrSession.status === "awaiting_scan" || qrSession.status === "qr_ready" || qrSession.status === "starting" || qrSession.status === "connecting"
        ? "amber"
        : qrSession.status === "error" || qrSession.status === "bridge_error" || qrSession.status === "bridge_unreachable"
          ? "rose"
          : "blue";
  const qrHelper = qrLoading
    ? "Carregando estado da bridge QR."
    : qrSession?.status === "connected"
      ? qrSession.cachedChatsCount > 0
        ? `${qrSession.cachedChatsCount} conversa(s) detectada(s) na sessao QR.`
        : "Sessao conectada. Aguardando sincronizacao das conversas recentes."
      : qrSession?.detail ?? "A bridge QR ainda nao foi configurada.";
  const qrFootnote = qrSession?.phoneNumber
    ? `Numero conectado: ${qrSession.phoneNumber}${qrSession.lastHistorySyncAt ? ` · Ultima sincronizacao ${formatDate(qrSession.lastHistorySyncAt)}` : ""}`
    : qrSession?.displayName
      ? `Sessao: ${qrSession.displayName}`
      : "Use a sessao QR para trazer o historico e operar pelo inbox interno.";

  async function refreshMetaArea() {
    await Promise.all([loadSetupState(), loadEmbeddedSignupState(), onRefreshMetaState()]);
  }

  function handleOpenMetaChannel() {
    if (!metaReady) {
      const message = hasPreparedChannel
        ? "Finalize os passos da Meta e clique em testar conexao antes de operar pelo CRM."
        : "Prepare o numero da empresa primeiro para abrir o canal na plataforma.";
      setMetaMessage(message);
      onSurfaceError(message);
      return;
    }

    setMetaMessage("");
    onSurfaceNotice("Abrindo o atendimento WhatsApp dentro da plataforma.");
    onOpenMetaChannel();
  }

  async function handleBootstrapMeta() {
    if (!setupDraft.phoneNumberId.trim() || !setupDraft.accessToken.trim()) {
      const message = "Preencha o ID do numero e o token de acesso para preparar o canal.";
      setSetupFeedback(message);
      onSurfaceError(message);
      return;
    }

    const alreadyExists = whatsAppChannels.some((channel) => channel.phoneNumberId === setupDraft.phoneNumberId.trim());
    if (!alreadyExists && limitReached) {
      const message = `O plano atual permite ate ${whatsAppChannelLimit} canal(is) de WhatsApp.`;
      setSetupFeedback(message);
      onSurfaceError(message);
      return;
    }

    setSetupSaving(true);
    setSetupFeedback("");

    try {
      const result: MetaWhatsAppBootstrapResult = await bootstrapMetaChannel(apiBase, authToken, {
        displayName: setupDraft.displayName.trim() || "WhatsApp",
        phoneNumberId: setupDraft.phoneNumberId.trim(),
        accessToken: setupDraft.accessToken.trim(),
        isPrimary: setupDraft.isPrimary
      });

      await refreshMetaArea();
      setSetupDraft({
        displayName: "WhatsApp filial",
        phoneNumberId: "",
        accessToken: "",
        isPrimary: false
      });
      setShowSetupForm(false);
      const message = result.testSucceeded
        ? `Canal ${result.displayName} preparado e validado. Agora finalize a ativacao na Meta e comece a operar pelo CRM.`
        : `Canal ${result.displayName} salvo. Agora copie os dados abaixo, finalize a etapa na Meta e rode o teste final.`;
      setSetupFeedback(message);
      onSurfaceNotice(message);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Nao foi possivel preparar a conexao com a Meta.";
      setSetupFeedback(message);
      onSurfaceError(message);
    } finally {
      setSetupSaving(false);
    }
  }

  async function handleLaunchEmbeddedSignup() {
    setEmbeddedSignupBusy(true);
    setSetupFeedback("");

    try {
      const result = await launchEmbeddedSignup(apiBase, authToken, {
        displayName: setupDraft.displayName.trim() || setup?.displayName || "WhatsApp oficial",
        isPrimary: setupDraft.isPrimary,
        publicBaseUrl: null
      });

      await refreshMetaArea();
      const message = result.message || "Cadastro incorporado concluido com sucesso.";
      setSetupFeedback(message);
      onSurfaceNotice(message);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Nao foi possivel iniciar o cadastro incorporado da Meta.";
      setSetupFeedback(message);
      onSurfaceError(message);
    } finally {
      setEmbeddedSignupBusy(false);
    }
  }

  async function handleTestMetaConnection() {
    setSetupTesting(true);
    setSetupFeedback("");

    try {
      const result = await testMetaConnection(apiBase, authToken);
      await refreshMetaArea();
      const message = result.success
        ? "Conexao validada. O canal ja pode ser operado dentro do CRM."
        : `Teste falhou: ${result.error ?? result.status}`;
      setSetupFeedback(message);
      result.success ? onSurfaceNotice(message) : onSurfaceError(message);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Nao foi possivel testar a conexao com a Meta.";
      setSetupFeedback(message);
      onSurfaceError(message);
    } finally {
      setSetupTesting(false);
    }
  }

  async function handleStartQrSession(forceRestart = false) {
    setQrBusy(true);
    setQrMessage("");

    try {
      const result = forceRestart
        ? await restartWhatsAppWebSession(apiBase, authToken)
        : await startWhatsAppWebSession(apiBase, authToken, {
            displayName: qrDisplayName.trim() || null,
            forceRestart: false
          });

      if (result.session) {
        setQrSession(result.session);
      } else {
        await loadQrSessionState();
      }

      setQrMessage(result.message);
      result.success ? onSurfaceNotice(result.message) : onSurfaceError(result.message);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Nao foi possivel iniciar a sessao QR.";
      setQrMessage(message);
      onSurfaceError(message);
    } finally {
      setQrBusy(false);
    }
  }

  async function handleDisconnectQrSession() {
    setQrBusy(true);
    setQrMessage("");

    try {
      const result = await disconnectWhatsAppWebSession(apiBase, authToken);
      if (result.session) {
        setQrSession(result.session);
      } else {
        await loadQrSessionState();
      }

      setQrMessage(result.message);
      result.success ? onSurfaceNotice(result.message) : onSurfaceError(result.message);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Nao foi possivel desconectar a sessao QR.";
      setQrMessage(message);
      onSurfaceError(message);
    } finally {
      setQrBusy(false);
    }
  }

  async function handleSyncQrHistory() {
    setQrBusy(true);
    setQrMessage("");

    try {
      const result = await syncWhatsAppWebSessionHistory(apiBase, authToken);
      if (result.session) {
        setQrSession(result.session);
      } else {
        await loadQrSessionState();
      }

      setQrMessage(result.message);
      result.success ? onSurfaceNotice(result.message) : onSurfaceError(result.message);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Nao foi possivel sincronizar as conversas da sessao QR.";
      setQrMessage(message);
      onSurfaceError(message);
    } finally {
      setQrBusy(false);
    }
  }

  async function handleTestSpecificChannel(channelId: string) {
    setBusyChannelId(channelId);
    setSetupFeedback("");

    try {
      const result = await testMetaConnection(apiBase, authToken, channelId);
      await refreshMetaArea();
      const message = result.success
        ? "Conexao validada. O canal ja pode ser operado dentro do CRM."
        : `Teste falhou: ${result.error ?? result.status}`;
      setSetupFeedback(message);
      result.success ? onSurfaceNotice(message) : onSurfaceError(message);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Nao foi possivel testar a conexao com a Meta.";
      setSetupFeedback(message);
      onSurfaceError(message);
    } finally {
      setBusyChannelId("");
    }
  }

  async function handleSetPrimary(channel: MetaChannelStatus) {
    if (channel.isPrimary) {
      return;
    }

    setBusyChannelId(channel.id);
    try {
      await updateMetaChannel(apiBase, authToken, channel, { isPrimary: true });
      await refreshMetaArea();
      onSurfaceNotice(`${channel.displayName} agora e o canal principal.`);
    } catch (error) {
      onSurfaceError(error instanceof Error ? error.message : "Nao foi possivel definir o canal principal.");
    } finally {
      setBusyChannelId("");
    }
  }

  async function handleToggleChannelState(channel: MetaChannelStatus) {
    setBusyChannelId(channel.id);
    try {
      await updateMetaChannel(apiBase, authToken, channel, { isActive: !channel.isActive });
      await refreshMetaArea();
      onSurfaceNotice(channel.isActive ? `Canal ${channel.displayName} pausado.` : `Canal ${channel.displayName} reativado.`);
    } catch (error) {
      onSurfaceError(error instanceof Error ? error.message : "Nao foi possivel atualizar o status do canal.");
    } finally {
      setBusyChannelId("");
    }
  }

  async function handleDeleteChannel(channel: MetaChannelStatus) {
    if (!window.confirm(`Remover o canal ${channel.displayName}?`)) {
      return;
    }

    setBusyChannelId(channel.id);
    try {
      await deleteMetaChannel(apiBase, authToken, channel.id);
      await refreshMetaArea();
      onSurfaceNotice(`Canal ${channel.displayName} removido.`);
    } catch (error) {
      onSurfaceError(error instanceof Error ? error.message : "Nao foi possivel remover o canal.");
    } finally {
      setBusyChannelId("");
    }
  }

  async function handleCopy(value: string, label: string) {
    if (!value) {
      return;
    }

    const copied = await copyText(value);
    if (copied) {
      onSurfaceNotice(`${label} copiado.`);
      return;
    }

    onSurfaceError(`Nao foi possivel copiar ${label.toLowerCase()} automaticamente.`);
  }

  function openPopupFallback() {
    const popupWindow = openPopupWindow(WHATSAPP_WEB_URL, preparedWindowRef.current ?? externalWindowRef.current);
    preparedWindowRef.current = null;

    if (popupWindow) {
      externalWindowRef.current = popupWindow;
      setWebLaunchState("popup");
      const message = "O navegador nao permitiu a exibicao interna do WhatsApp Web. Abrimos uma janela auxiliar sem tirar voce do CRM.";
      setWebMessage(message);
      onSurfaceNotice(message);
      return true;
    }

    return false;
  }

  function openTabFallback() {
    const tabWindow = openNewTab(WHATSAPP_WEB_URL, externalWindowRef.current);

    if (tabWindow) {
      externalWindowRef.current = tabWindow;
      setWebLaunchState("tab");
      const message = "O WhatsApp Web foi aberto em nova aba para contornar o bloqueio do navegador.";
      setWebMessage(message);
      onSurfaceNotice(message);
      return true;
    }

    return false;
  }

  function surfaceLaunchError() {
    setWebLaunchState("error");
    const errorMessage = "Nao foi possivel abrir o WhatsApp Web. Verifique se o navegador permite popups ou novas abas para esta aplicacao.";
    setWebMessage(errorMessage);
    onSurfaceError(errorMessage);
  }

  function handleOpenWhatsAppWeb() {
    clearPreparedWindow(true);
    setWebMessage("");
    setWebLaunchState("embedding");
    frameLoadedRef.current = false;
    preparedWindowRef.current = openPreparedWindow();
    setWebViewerOpen(true);

    fallbackTimerRef.current = window.setTimeout(() => {
      fallbackTimerRef.current = null;

      if (frameLoadedRef.current) {
        return;
      }

      if (openPopupFallback()) {
        return;
      }

      if (openTabFallback()) {
        return;
      }

      surfaceLaunchError();
    }, 2200);
  }

  function handleFrameLoad() {
    frameLoadedRef.current = true;
    setWebLaunchState("embedded");
    setWebMessage("WhatsApp Web aberto dentro do painel.");

    if (fallbackTimerRef.current) {
      window.clearTimeout(fallbackTimerRef.current);
      fallbackTimerRef.current = null;
    }

    if (preparedWindowRef.current && !preparedWindowRef.current.closed) {
      preparedWindowRef.current.close();
    }

    preparedWindowRef.current = null;
  }

  function handleCloseViewer() {
    clearPreparedWindow(true);
    setWebViewerOpen(false);
    setWebLaunchState("idle");
  }

  function handleOpenWebInNewTab() {
    if (openTabFallback()) {
      return;
    }

    surfaceLaunchError();
  }

  function handleOpenWebPopup() {
    if (openPopupFallback()) {
      return;
    }

    if (openTabFallback()) {
      return;
    }

    surfaceLaunchError();
  }

  function handleRetryEmbed() {
    handleOpenWhatsAppWeb();
  }

  const metaFootnote = lastCheckedAt
    ? `Ultima verificacao em ${formatDate(lastCheckedAt)}.`
    : hasPreparedChannel
      ? "Assim que concluir a etapa na Meta, rode o teste final para validar o canal."
      : undefined;

  const metaDetail = metaReady
    ? `Canal pronto: ${setup?.displayName ?? metaAvailability.activeChannelName ?? "WhatsApp"}.`
    : hasPreparedChannel
      ? "Falta validar na Meta e testar."
      : "Cadastre um numero para continuar.";

  const viewerMessage =
    webLaunchState === "embedding"
      ? "Tentando abrir no painel."
      : webMessage || "Use o WhatsApp Web como apoio.";

  return (
    <section className={workspacePageClass}>
      <section className={heroPanelClass}>
        <div className="grid gap-5 xl:grid-cols-12">
          <header className="space-y-3 xl:col-span-7">
            <span className="inline-flex rounded-full bg-blue-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-blue-700">WhatsApp</span>
            <div className="space-y-2">
              <h2 className="text-2xl font-semibold tracking-tight text-slate-950 sm:text-[2rem]">WhatsApp</h2>
              
            </div>
          </header>

          <section className="grid gap-3 sm:grid-cols-2 xl:col-span-5">
            <MetricTile label="Status do canal" value={statusLabel} detail={metaDetail} tone={statusTone} />
            <MetricTile label="Canais usados" value={`${whatsAppChannels.length}/${whatsAppChannelLimit || 0}`} detail="Capacidade do plano atual." tone="blue" />
            <MetricTile label="Canais ativos" value={String(activeChannels)} detail="Numeros liberados para operacao." tone="slate" />
            <MetricTile label="Canais prontos" value={String(readyChannels)} detail="Ja validados para abrir no Atendimento." tone="emerald" />
          </section>
        </div>
      </section>

      <section className="grid items-start gap-6 xl:grid-cols-[minmax(0,1.12fr)_minmax(330px,0.8fr)]">
        <WorkspaceSection
          eyebrow="Assistente de conexao"
          title={hasPreparedChannel ? "Gerencie os canais da empresa" : "Prepare o primeiro numero"}
         actions={
            hasPreparedChannel ? (
              <div className="flex flex-wrap items-center gap-3">
                <StatusPill tone={remainingChannels > 0 ? "blue" : "amber"}>{remainingChannels} vaga(s) restante(s)</StatusPill>
                <button type="button" className={secondaryButtonClass} onClick={() => setShowSetupForm((current) => !current)}>
                  {showSetupForm ? "Fechar edicao" : "Atualizar credencial"}
                </button>
                <button type="button" className={primaryButtonClass} onClick={handleTestMetaConnection} disabled={setupTesting}>
                  {setupTesting ? "Testando..." : "Testar conexao"}
                </button>
              </div>
            ) : undefined
          }
        >
          <div className="space-y-5">
            {setupLoading ? (
              <EmptyStatePanel>Carregando canais.</EmptyStatePanel>
            ) : (
              <>
                {setupFeedback && (
                  <div className={`rounded-2xl border px-4 py-3 text-sm leading-6 ${metaReady ? "border-emerald-200 bg-emerald-50 text-emerald-800" : "border-slate-200 bg-slate-50 text-slate-700"}`}>
                    {setupFeedback}
                  </div>
                )}

                {(showSetupForm || !hasPreparedChannel) && (
                  <div className="grid gap-4 xl:grid-cols-2">
                    <label className={labelClass}>
                      Nome do canal
                      <input
                        className={inputClass}
                        value={setupDraft.displayName}
                        onChange={(event) => setSetupDraft((current) => ({ ...current, displayName: event.target.value }))}
                       
                      />
                    </label>
                    <label className={labelClass}>
                      ID do numero na Meta
                      <input
                        className={inputClass}
                        value={setupDraft.phoneNumberId}
                        onChange={(event) => setSetupDraft((current) => ({ ...current, phoneNumberId: event.target.value }))}
                       
                      />
                    </label>
                    <label className={`${labelClass} lg:col-span-2`}>
                      Token de acesso
                      <textarea
                        className={textareaClass}
                        value={setupDraft.accessToken}
                        onChange={(event) => setSetupDraft((current) => ({ ...current, accessToken: event.target.value }))}
                       
                      />
                    </label>
                    <div className="lg:col-span-2 grid gap-3 md:grid-cols-2">
                      <SwitchField
                        id="setup-primary"
                        label="Definir como principal"
                        caption="Use este numero como rota padrao da operacao."
                        checked={setupDraft.isPrimary}
                        onChange={(checked) => setSetupDraft((current) => ({ ...current, isPrimary: checked }))}
                      />
                      <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4 text-sm leading-6 text-slate-600">
                        {limitReached ? `Seu plano ja atingiu o limite de ${whatsAppChannelLimit} canal(is).` : `Voce ainda pode adicionar ${remainingChannels} canal(is) para esta empresa.`}
                      </div>
                    </div>
                    <div className="lg:col-span-2 flex flex-wrap items-center justify-between gap-3">
                     <div className="flex flex-wrap items-center gap-3">
                        <button type="button" className={primaryButtonClass} onClick={handleBootstrapMeta} disabled={setupSaving || limitReached && !whatsAppChannels.some((channel) => channel.phoneNumberId === setupDraft.phoneNumberId.trim())}>
                          {setupSaving ? "Preparando..." : hasPreparedChannel ? "Salvar e adicionar canal" : "Preparar conexao"}
                        </button>
                        {hasPreparedChannel && (
                          <button type="button" className={secondaryButtonClass} onClick={() => setShowSetupForm(false)}>
                            Cancelar
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {hasPreparedChannel && setup && (
                  <div className="space-y-4">
                    <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-5">
                      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                        <div className="space-y-2">
                          <div className="flex flex-wrap items-center gap-3">
                            <h4 className="text-lg font-semibold text-slate-950">{setup.displayName || "WhatsApp"}</h4>
                            <StatusPill tone={statusTone}>{statusLabel}</StatusPill>
                          </div>
                          <p className="text-sm leading-6 text-slate-600">{setup.phoneNumberId ? `Numero preparado: ${setup.phoneNumberId}` : "Defina o numero da empresa para continuar."}</p>
                          <p className="text-sm leading-6 text-slate-500">{metaDetail}</p>
                        </div>
                        <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600 shadow-sm">
                          {setup.lastError ? `Ultimo alerta: ${setup.lastError}` : setup.lastStatus ? `Ultimo status: ${setup.lastStatus}` : "Ainda nao houve teste final desta conexao."}
                        </div>
                      </div>
                    </div>

                    <div className="grid gap-4 xl:grid-cols-2">
                      <ReadonlyCopyField
                        label="URL de retorno"
                        value={setup.callbackUrl}
                        buttonLabel="Copiar URL"
                        onCopy={() => void handleCopy(setup.callbackUrl, "URL de retorno")}
                      />
                      <ReadonlyCopyField
                        label="Codigo de validacao"
                        value={setup.verifyToken}
                        buttonLabel="Copiar codigo"
                        onCopy={() => void handleCopy(setup.verifyToken, "Codigo de validacao")}
                      />
                    </div>

                    <div className="rounded-2xl border border-blue-200 bg-blue-50/70 p-5">
                      <div className="space-y-3">
                        <h4 className="text-base font-semibold text-slate-950">Proxima etapa</h4>
                        <ol className="space-y-3 text-sm leading-6 text-slate-700">
                          <li>1. No painel da Meta, abra o produto WhatsApp e va para a configuracao do webhook.</li>
                          <li>2. Cole a URL de retorno e o codigo de validacao que o sistema gerou para voce.</li>
                          <li>3. Marque o evento <strong>messages</strong> para permitir que as mensagens cheguem ao CRM.</li>
                          <li>4. Volte aqui e clique em <strong>Testar conexao</strong>. Quando der certo, o time atende direto em <strong>Atendimento</strong>.</li>
                        </ol>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </WorkspaceSection>

        <div className="space-y-4">
          <ChannelOptionCard
            title="Cadastro incorporado da Meta"
            description="Fluxo oficial da Meta para conectar Cloud API sem copiar token manualmente."
            statusLabel={
              metaReady
                ? "Pronto para operar"
                : embeddedSignupLoading
                  ? "Carregando"
                  : embeddedSignupReady
                    ? "Oficial disponivel"
                    : hasPreparedChannel
                      ? "Fallback manual"
                      : "Nao configurado"
            }
            statusTone={metaReady ? "emerald" : embeddedSignupReady ? "blue" : hasPreparedChannel ? "amber" : "slate"}
            helper={
              metaReady
                ? "O canal oficial esta conectado. Agora basta abrir o inbox interno do CRM."
                : embeddedSignupReady
                  ? "Use o cadastro incorporado para gerar o code oficial, trocar o token no backend e preparar o canal automaticamente."
                  : metaDetail
            }
            footnote={embeddedSignupReady ? metaFootnote ?? "Requer App ID, Configuration ID e App Secret configurados no backend." : embeddedSignupConfig?.error ?? metaFootnote}
            ctaLabel={
              metaReady
                ? "Abrir na plataforma"
                : embeddedSignupBusy
                  ? "Abrindo..."
                  : embeddedSignupReady
                    ? "Iniciar cadastro oficial"
                    : hasPreparedChannel
                      ? "Testar conexao"
                      : "Preparar manualmente"
            }
            onAction={
              metaReady
                ? handleOpenMetaChannel
                : embeddedSignupReady
                  ? () => { void handleLaunchEmbeddedSignup(); }
                  : hasPreparedChannel
                    ? () => { void handleTestMetaConnection(); }
                    : () => setShowSetupForm(true)
            }
            message={embeddedSignupReady ? metaMessage : embeddedSignupConfig?.error ?? metaMessage}
          />

          <ChannelOptionCard
            title="Sessao QR experimental"
            description="Conecta um WhatsApp Web real, sincroniza as conversas recentes e opera tudo pelo CRM."
            statusLabel={qrStatusLabel}
            statusTone={qrStatusTone}
            helper={qrHelper}
            footnote={qrFootnote}
            ctaLabel={
              qrBusy
                ? "Processando..."
                : !qrSession?.isConfigured
                  ? "Bridge nao configurada"
                  : qrSession.status === "connected"
                    ? "Sincronizar conversas"
                  : qrSession.canStart
                    ? "Gerar QR"
                    : qrSession.canRestart
                      ? "Reiniciar sessao"
                      : qrSession.canDisconnect
                        ? "Desconectar sessao"
                        : "Atualizar estado"
            }
            onAction={
              !qrSession?.isConfigured
                ? () => onSurfaceError(qrSession?.detail ?? "Configure WhatsAppWebBridge:BaseUrl para usar a bridge QR.")
                : qrSession.status === "connected"
                  ? () => { void handleSyncQrHistory(); }
                : qrSession.canStart
                  ? () => { void handleStartQrSession(false); }
                  : qrSession.canRestart
                    ? () => { void handleStartQrSession(true); }
                    : qrSession.canDisconnect
                      ? () => { void handleDisconnectQrSession(); }
                      : () => { void loadQrSessionState(); }
            }
            message={qrMessage}
          />

          {qrSession?.isConfigured && (
            <div className={`${cardClass} space-y-4 p-5`}>
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-3">
                  <h3 className="text-lg font-semibold text-slate-950">QR da sessao experimental</h3>
                  <StatusPill tone={qrStatusTone}>{qrStatusLabel}</StatusPill>
                </div>
                <p className="text-sm leading-6 text-slate-600">{qrSession.detail}</p>
                <div className="flex flex-wrap items-center gap-2 text-xs font-medium text-slate-500">
                  <StatusPill tone="blue">{qrSession.cachedChatsCount} chats detectados</StatusPill>
                  {qrSession.lastHistorySyncAt && <StatusPill tone="emerald">Ultima sincronizacao: {formatDate(qrSession.lastHistorySyncAt)}</StatusPill>}
                </div>
              </div>

              <label className={labelClass}>
                Nome da sessao
                <input
                  className={inputClass}
                  value={qrDisplayName}
                  onChange={(event) => setQrDisplayName(event.target.value)}
                  placeholder="WhatsApp QR"
                />
              </label>

              {qrSession.qrCodeDataUrl ? (
                <div className="rounded-3xl border border-slate-200 bg-slate-50/80 p-4">
                  <img
                    src={qrSession.qrCodeDataUrl}
                    alt="QR code da sessao WhatsApp"
                    className="mx-auto w-full max-w-[260px] rounded-2xl border border-slate-200 bg-white p-3"
                  />
                </div>
              ) : (
                <div className="rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-3 text-sm leading-6 text-slate-600">
                  {qrSession.status === "connected"
                    ? "A sessao experimental ja esta conectada."
                    : "Gere ou reinicie a sessao para exibir um novo QR."}
                </div>
              )}

              {qrSession.pairingCode && (
                <ReadonlyCopyField
                  label="Codigo de pareamento"
                  value={qrSession.pairingCode}
                  buttonLabel="Copiar codigo"
                  onCopy={() => void handleCopy(qrSession.pairingCode ?? "", "Codigo de pareamento")}
                />
              )}

              <div className="flex flex-wrap gap-3">
                <button type="button" className={primaryButtonClass} onClick={() => void handleStartQrSession(false)} disabled={qrBusy || !qrSession.canStart}>
                  {qrBusy && qrSession.canStart ? "Gerando..." : "Gerar QR"}
                </button>
                <button type="button" className={secondaryButtonClass} onClick={() => void handleSyncQrHistory()} disabled={qrBusy || qrSession.status !== "connected"}>
                  Sincronizar conversas
                </button>
                <button type="button" className={secondaryButtonClass} onClick={() => void handleStartQrSession(true)} disabled={qrBusy || !qrSession.canRestart}>
                  Reiniciar sessao
                </button>
                <button type="button" className={secondaryButtonClass} onClick={() => void handleDisconnectQrSession()} disabled={qrBusy || !qrSession.canDisconnect}>
                  Desconectar
                </button>
              </div>
            </div>
          )}
        </div>
      </section>

      <div className="relative z-0 pt-2">
      <WorkspaceSection
        eyebrow="Canais configurados"
        title="Numeros da empresa"
       actions={<StatusPill tone="slate">{whatsAppChannels.length} canal(is)</StatusPill>}
      >
        {whatsAppChannels.length === 0 ? (
          <EmptyStatePanel>Nenhum canal cadastrado.</EmptyStatePanel>
        ) : (
          <div className="grid gap-4 xl:grid-cols-2">
            {whatsAppChannels.map((channel) => (
              <article key={channel.id} className={`${cardClass} flex h-full flex-col p-5`}>
                <div className="space-y-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-lg font-semibold text-slate-950">{channel.displayName}</h3>
                        <StatusPill tone={channel.lastError ? "rose" : channel.lastStatus?.toLowerCase() === "connected" ? "emerald" : channel.isActive ? "amber" : "slate"}>
                          {channel.lastError ? "Com alerta" : channel.lastStatus?.toLowerCase() === "connected" ? "Conectado" : channel.isActive ? "Em preparo" : "Inativo"}
                        </StatusPill>
                        {channel.isPrimary && <StatusPill tone="blue">Principal</StatusPill>}
                      </div>
                      <p className="text-sm text-slate-500">Numero preparado: {channel.phoneNumberId}</p>
                    </div>
                    <div className="rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-3 text-right text-sm text-slate-600">
                      <p className="font-semibold text-slate-900">{channel.lastTestedAt ? formatDate(channel.lastTestedAt) : "Sem teste"}</p>
                      <p>Ultima verificacao</p>
                    </div>
                  </div>

                  <div className="grid gap-3 md:grid-cols-2">
                    <ReadonlyCopyField
                      label="URL de retorno"
                      value={setup?.callbackUrl ?? "/api/whatsapp/webhook"}
                      buttonLabel="Copiar URL"
                      onCopy={() => void handleCopy(setup?.callbackUrl ?? "/api/whatsapp/webhook", `URL do canal ${channel.displayName}`)}
                    />
                    <ReadonlyCopyField
                      label="Codigo de validacao"
                      value={channel.verifyToken}
                      buttonLabel="Copiar codigo"
                      onCopy={() => void handleCopy(channel.verifyToken, `Codigo do canal ${channel.displayName}`)}
                    />
                  </div>

                  <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4 text-sm leading-6 text-slate-600">
                    {channel.lastError ? channel.lastError : channel.lastStatus ? `Status atual: ${channel.lastStatus}` : "Depois de confirmar esse canal na Meta, rode o teste para liberar o uso dentro do CRM."}
                  </div>
                </div>

                <div className="mt-5 flex flex-wrap items-center gap-3 border-t border-slate-200 pt-4">
                  <button type="button" className={secondaryButtonClass} onClick={() => void handleTestSpecificChannel(channel.id)} disabled={busyChannelId === channel.id}>
                    {busyChannelId === channel.id ? "Testando..." : "Testar conexao"}
                  </button>
                  {!channel.isPrimary && <button type="button" className={secondaryButtonClass} onClick={() => void handleSetPrimary(channel)} disabled={busyChannelId === channel.id}>Tornar principal</button>}
                  <button type="button" className={secondaryButtonClass} onClick={() => void handleToggleChannelState(channel)} disabled={busyChannelId === channel.id}>
                    {channel.isActive ? "Pausar canal" : "Ativar canal"}
                  </button>
                  <button type="button" className="inline-flex h-11 items-center justify-center rounded-xl border border-rose-200 bg-rose-50 px-4 text-sm font-medium text-rose-700 shadow-sm transition hover:bg-rose-100 focus:outline-none focus-visible:ring-4 focus-visible:ring-rose-100" onClick={() => void handleDeleteChannel(channel)} disabled={busyChannelId === channel.id}>
                    Remover
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </WorkspaceSection>
      </div>
      {webViewerOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/45 p-4 backdrop-blur-sm sm:p-6">
          <div className="mx-auto flex h-full w-full max-w-7xl flex-col overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-2xl shadow-slate-900/15">
            <div className="flex flex-col gap-4 border-b border-slate-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
              <div className="space-y-1">
                <h3 className="text-lg font-semibold text-slate-950">WhatsApp Web</h3>
                <p className="text-sm leading-6 text-slate-500">Se o painel nao abrir, use a janela auxiliar ou a nova aba.</p>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <button type="button" className={secondaryButtonClass} onClick={handleOpenWebPopup}>Abrir janela auxiliar</button>
                <button type="button" className={secondaryButtonClass} onClick={handleOpenWebInNewTab}>Abrir em nova aba</button>
                <button type="button" className={secondaryButtonClass} onClick={handleCloseViewer}>Fechar</button>
              </div>
            </div>

            <div className="min-h-0 flex-1 bg-slate-100 p-4 sm:p-6">
              <div className="grid h-full gap-4 xl:grid-cols-[minmax(0,1.45fr)_380px]">
                <div className="min-h-0 overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-sm">
                  {(webLaunchState === "embedding" || webLaunchState === "embedded") ? (
                    <iframe
                      title="WhatsApp Web"
                      src={WHATSAPP_WEB_URL}
                      className="h-full min-h-[520px] w-full border-0 bg-white"
                      onLoad={handleFrameLoad}
                    />
                  ) : (
                    <div className="flex h-full min-h-[520px] items-center justify-center p-6">
                      <div className="max-w-lg text-center">
                        <p className="text-sm leading-7 text-slate-500">O navegador bloqueou a abertura no painel.</p>
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex min-h-0 flex-col gap-4">
                  <WebViewerStatePanel
                    state={webLaunchState}
                    message={viewerMessage}
                    onOpenPopup={handleOpenWebPopup}
                    onOpenTab={handleOpenWebInNewTab}
                    onRetryEmbed={handleRetryEmbed}
                  />

                  <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                    <div className="space-y-3">
                      <span className="inline-flex rounded-full bg-slate-100 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-600">Observacao</span>
                      <p className="text-sm leading-6 text-slate-600">Se nada abrir, habilite popups para a URL da plataforma e tente novamente.</p>
                      <ul className="space-y-3 text-sm leading-6 text-slate-600">
                        <li>1. Se o painel interno nao abrir, o motivo mais comum e o bloqueio do iframe pelo proprio WhatsApp Web.</li>
                        <li>2. A janela auxiliar costuma ser o melhor fallback para continuar no CRM e conversar no WhatsApp ao mesmo tempo.</li>
                        <li>3. Se nada abrir, habilite popups para a URL local da plataforma e tente novamente.</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
