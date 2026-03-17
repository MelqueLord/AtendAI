import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type {
  MetaEmbeddedSignupConfig,
  MetaWhatsAppBootstrapResult,
  MetaWhatsAppSetup,
  WhatsAppWebSessionState
} from "@shared/types";
import {
  MetricTile,
  heroPanelClass,
  workspacePageClass
} from "@shared/components/WorkspaceUi";
import { resolveApiErrorMessage } from "@shared/utils/http";
import {
  WHATSAPP_WEB_URL,
  openNewTab,
  openPopupWindow,
  resolveMetaIntegrationAvailability,
  type MetaChannelStatus,
  type MetaConnectionStatus
} from "../services/whatsappLaunchService";
import { bootstrapMetaChannel, copyText, deleteMetaChannel, fetchMetaSetup, testMetaConnection, updateMetaChannel, type MetaBootstrapDraft } from "../services/metaSetupService";
import { fetchEmbeddedSignupConfig, launchEmbeddedSignup } from "../services/embeddedSignupService";
import { disconnectWhatsAppWebSession, fetchWhatsAppWebSessionState, restartWhatsAppWebSession, startWhatsAppWebSession, syncWhatsAppWebSessionHistory } from "../services/whatsappWebBridgeService";
import { ConfiguredChannelsSection } from "../components/ConfiguredChannelsSection";
import { MetaChannelSetupSection } from "../components/MetaChannelSetupSection";
import { WhatsAppAccessOptionsPanel } from "../components/WhatsAppAccessOptionsPanel";
import { WebLaunchState } from "../components/WhatsAppWorkspacePrimitives";
import { WhatsAppWebViewerModal } from "../components/WhatsAppWebViewerModal";

type WhatsAppWorkspaceProps = {
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

export function WhatsAppWorkspace({
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
  const externalWindowRef = useRef<Window | null>(null);
  const frameLoadedRef = useRef(false);

  const loadSetupState = useCallback(async () => {
    setSetupLoading(true);

    try {
      const data = await fetchMetaSetup(authToken);
      setSetup(data);
      setSetupDraft((current) => ({
        displayName: current.displayName || data.displayName || "",
        phoneNumberId: current.phoneNumberId || data.phoneNumberId || "",
        accessToken: "",
        isPrimary: current.isPrimary
      }));
      setShowSetupForm(!data.channelId);
    } catch (error) {
      const message = resolveApiErrorMessage(error, "Nao foi possivel carregar a conexao com a Meta.");
      setSetupFeedback(message);
      onSurfaceError(message);
    } finally {
      setSetupLoading(false);
    }
  }, [authToken, onSurfaceError]);

  const loadEmbeddedSignupState = useCallback(async () => {
    setEmbeddedSignupLoading(true);

    try {
      const data = await fetchEmbeddedSignupConfig(authToken);
      setEmbeddedSignupConfig(data);
    } catch (error) {
      const message = resolveApiErrorMessage(error, "Nao foi possivel carregar o Embedded Signup oficial.");
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
  }, [authToken]);

  const loadQrSessionState = useCallback(async () => {
    setQrLoading(true);

    try {
      const data = await fetchWhatsAppWebSessionState(authToken);
      setQrSession(data);
      setQrMessage("");
    } catch (error) {
      const message = resolveApiErrorMessage(error, "Nao foi possivel carregar a sessao QR.");
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
  }, [authToken]);

  useEffect(() => {
    void loadSetupState();
  }, [loadSetupState]);

  useEffect(() => {
    void loadEmbeddedSignupState();
  }, [loadEmbeddedSignupState]);

  useEffect(() => {
    void loadQrSessionState();
  }, [loadQrSessionState]);

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
  }, [loadQrSessionState, qrSession]);

  function clearWebViewerState() {
    frameLoadedRef.current = false;
  }

  useEffect(() => {
    return () => {
      clearWebViewerState();
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
      const result: MetaWhatsAppBootstrapResult = await bootstrapMetaChannel(authToken, {
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
      const message = resolveApiErrorMessage(error, "Nao foi possivel preparar a conexao com a Meta.");
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
      const result = await launchEmbeddedSignup(authToken, {
        displayName: setupDraft.displayName.trim() || setup?.displayName || "WhatsApp oficial",
        isPrimary: setupDraft.isPrimary,
        publicBaseUrl: null
      });

      await refreshMetaArea();
      const message = result.message || "Cadastro incorporado concluido com sucesso.";
      setSetupFeedback(message);
      onSurfaceNotice(message);
    } catch (error) {
      const message = resolveApiErrorMessage(error, "Nao foi possivel iniciar o cadastro incorporado da Meta.");
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
      const result = await testMetaConnection(authToken);
      await refreshMetaArea();
      const message = result.success
        ? "Conexao validada. O canal ja pode ser operado dentro do CRM."
        : `Teste falhou: ${result.error ?? result.status}`;
      setSetupFeedback(message);
      if (result.success) {
        onSurfaceNotice(message);
      } else {
        onSurfaceError(message);
      }
    } catch (error) {
      const message = resolveApiErrorMessage(error, "Nao foi possivel testar a conexao com a Meta.");
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
        ? await restartWhatsAppWebSession(authToken)
        : await startWhatsAppWebSession(authToken, {
            displayName: qrDisplayName.trim() || null,
            forceRestart: false
          });

      if (result.session) {
        setQrSession(result.session);
      } else {
        await loadQrSessionState();
      }

      setQrMessage(result.message);
      if (result.success) {
        onSurfaceNotice(result.message);
      } else {
        onSurfaceError(result.message);
      }
    } catch (error) {
      const message = resolveApiErrorMessage(error, "Nao foi possivel iniciar a sessao QR.");
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
      const result = await disconnectWhatsAppWebSession(authToken);
      if (result.session) {
        setQrSession(result.session);
      } else {
        await loadQrSessionState();
      }

      setQrMessage(result.message);
      if (result.success) {
        onSurfaceNotice(result.message);
      } else {
        onSurfaceError(result.message);
      }
    } catch (error) {
      const message = resolveApiErrorMessage(error, "Nao foi possivel desconectar a sessao QR.");
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
      const result = await syncWhatsAppWebSessionHistory(authToken);
      if (result.session) {
        setQrSession(result.session);
      } else {
        await loadQrSessionState();
      }

      setQrMessage(result.message);
      if (result.success) {
        onSurfaceNotice(result.message);
      } else {
        onSurfaceError(result.message);
      }
    } catch (error) {
      const message = resolveApiErrorMessage(error, "Nao foi possivel sincronizar as conversas da sessao QR.");
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
      const result = await testMetaConnection(authToken, channelId);
      await refreshMetaArea();
      const message = result.success
        ? "Conexao validada. O canal ja pode ser operado dentro do CRM."
        : `Teste falhou: ${result.error ?? result.status}`;
      setSetupFeedback(message);
      if (result.success) {
        onSurfaceNotice(message);
      } else {
        onSurfaceError(message);
      }
    } catch (error) {
      const message = resolveApiErrorMessage(error, "Nao foi possivel testar a conexao com a Meta.");
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
      await updateMetaChannel(authToken, channel, { isPrimary: true });
      await refreshMetaArea();
      onSurfaceNotice(`${channel.displayName} agora e o canal principal.`);
    } catch (error) {
      onSurfaceError(resolveApiErrorMessage(error, "Nao foi possivel definir o canal principal."));
    } finally {
      setBusyChannelId("");
    }
  }

  async function handleToggleChannelState(channel: MetaChannelStatus) {
    setBusyChannelId(channel.id);
    try {
      await updateMetaChannel(authToken, channel, { isActive: !channel.isActive });
      await refreshMetaArea();
      onSurfaceNotice(channel.isActive ? `Canal ${channel.displayName} pausado.` : `Canal ${channel.displayName} reativado.`);
    } catch (error) {
      onSurfaceError(resolveApiErrorMessage(error, "Nao foi possivel atualizar o status do canal."));
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
      await deleteMetaChannel(authToken, channel.id);
      await refreshMetaArea();
      onSurfaceNotice(`Canal ${channel.displayName} removido.`);
    } catch (error) {
      onSurfaceError(resolveApiErrorMessage(error, "Nao foi possivel remover o canal."));
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
    const popupWindow = openPopupWindow(WHATSAPP_WEB_URL, externalWindowRef.current);

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
    clearWebViewerState();
    setWebMessage("");
    setWebLaunchState("embedding");
    frameLoadedRef.current = false;
    setWebViewerOpen(true);
  }

  function handleFrameLoad() {
    frameLoadedRef.current = true;
    setWebLaunchState("embedded");
    setWebMessage("WhatsApp Web aberto dentro do painel.");
  }

  function handleCloseViewer() {
    clearWebViewerState();
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
      : null;

  const metaDetail = metaReady
    ? `Canal pronto: ${setup?.displayName ?? metaAvailability.activeChannelName ?? "WhatsApp"}.`
    : hasPreparedChannel
      ? "Falta validar na Meta e testar."
      : "Cadastre um numero para continuar.";

  const viewerMessage =
    webLaunchState === "embedding"
      ? "Tentando abrir no painel."
      : webMessage || "Use o WhatsApp Web como apoio.";
  const webStatusTone =
    webLaunchState === "embedded" ? "emerald"
      : webLaunchState === "embedding" || webLaunchState === "popup" ? "blue"
        : webLaunchState === "tab" ? "amber"
          : webLaunchState === "error" ? "rose"
            : "slate";
  const webStatusLabel =
    webLaunchState === "embedded" ? "Aberto no painel"
      : webLaunchState === "embedding" ? "Abrindo painel"
        : webLaunchState === "popup" ? "Janela auxiliar"
          : webLaunchState === "tab" ? "Nova aba"
            : webLaunchState === "error" ? "Falha ao abrir"
              : "Pronto para abrir";

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

      <section className="grid items-start gap-6 2xl:grid-cols-[minmax(0,1.12fr)_minmax(380px,0.88fr)]">
        <MetaChannelSetupSection
          setupLoading={setupLoading}
          setupFeedback={setupFeedback}
          metaReady={metaReady}
          hasPreparedChannel={hasPreparedChannel}
          remainingChannels={remainingChannels}
          showSetupForm={showSetupForm}
          setupTesting={setupTesting}
          setupSaving={setupSaving}
          setup={setup}
          setupDraft={setupDraft}
          statusTone={statusTone}
          statusLabel={statusLabel}
          metaDetail={metaDetail}
          limitReached={limitReached}
          whatsAppChannelLimit={whatsAppChannelLimit}
          whatsAppChannels={whatsAppChannels}
          onToggleForm={() => setShowSetupForm((current) => !current)}
          onSetSetupDraft={(updater) => setSetupDraft(updater)}
          onBootstrapMeta={() => { void handleBootstrapMeta(); }}
          onCloseForm={() => setShowSetupForm(false)}
          onTestMetaConnection={() => { void handleTestMetaConnection(); }}
          onCopy={handleCopy}
        />

        <WhatsAppAccessOptionsPanel
          metaReady={metaReady}
          embeddedSignupLoading={embeddedSignupLoading}
          embeddedSignupReady={embeddedSignupReady}
          embeddedSignupBusy={embeddedSignupBusy}
          embeddedSignupConfig={embeddedSignupConfig}
          hasPreparedChannel={hasPreparedChannel}
          metaDetail={metaDetail}
          metaFootnote={metaFootnote}
          metaMessage={metaMessage}
          qrSession={qrSession}
          qrBusy={qrBusy}
          qrStatusLabel={qrStatusLabel}
          qrStatusTone={qrStatusTone}
          qrHelper={qrHelper}
          qrFootnote={qrFootnote}
          qrMessage={qrMessage}
          qrDisplayName={qrDisplayName}
          webStatusLabel={webStatusLabel}
          webStatusTone={webStatusTone}
          webLaunchState={webLaunchState}
          webMessage={webMessage}
          viewerMessage={viewerMessage}
          formatDate={formatDate}
          onShowManualSetup={() => setShowSetupForm(true)}
          onOpenMetaChannel={handleOpenMetaChannel}
          onLaunchEmbeddedSignup={handleLaunchEmbeddedSignup}
          onTestMetaConnection={handleTestMetaConnection}
          onSurfaceQrConfigurationError={() => onSurfaceError(qrSession?.detail ?? "Configure WhatsAppWebBridge:BaseUrl para usar a bridge QR.")}
          onSyncQrHistory={handleSyncQrHistory}
          onStartQrSession={handleStartQrSession}
          onDisconnectQrSession={handleDisconnectQrSession}
          onReloadQrSessionState={loadQrSessionState}
          onSetQrDisplayName={setQrDisplayName}
          onCopy={handleCopy}
          onOpenWhatsAppWeb={handleOpenWhatsAppWeb}
        />
      </section>

      <ConfiguredChannelsSection
        channels={whatsAppChannels}
        setupCallbackUrl={setup?.callbackUrl}
        busyChannelId={busyChannelId}
        onCopy={handleCopy}
        onTestChannel={handleTestSpecificChannel}
        onSetPrimary={handleSetPrimary}
        onToggleChannelState={handleToggleChannelState}
        onDeleteChannel={handleDeleteChannel}
        formatDate={formatDate}
      />
      <WhatsAppWebViewerModal
        isOpen={webViewerOpen}
        launchState={webLaunchState}
        viewerMessage={viewerMessage}
        onOpenPopup={handleOpenWebPopup}
        onOpenTab={handleOpenWebInNewTab}
        onRetryEmbed={handleRetryEmbed}
        onClose={handleCloseViewer}
        onFrameLoad={handleFrameLoad}
      />
    </section>
  );
}








