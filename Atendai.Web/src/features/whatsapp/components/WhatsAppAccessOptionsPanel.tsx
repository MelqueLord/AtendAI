import type {
  MetaEmbeddedSignupConfig,
  WhatsAppWebSessionState
} from "@shared/types";
import {
  StatusPill,
  cardClass,
  inputClass,
  labelClass,
  primaryButtonClass,
  secondaryButtonClass
} from "@shared/components/WorkspaceUi";
import { ChannelOptionCard, ReadonlyCopyField, WebLaunchState } from "./WhatsAppWorkspacePrimitives";

type WhatsAppAccessOptionsPanelProps = {
  metaReady: boolean;
  embeddedSignupLoading: boolean;
  embeddedSignupReady: boolean;
  embeddedSignupBusy: boolean;
  embeddedSignupConfig: MetaEmbeddedSignupConfig | null;
  hasPreparedChannel: boolean;
  metaDetail: string;
  metaFootnote: string | null;
  metaMessage: string;
  qrSessions: WhatsAppWebSessionState[];
  selectedQrSessionId: string;
  qrSession: WhatsAppWebSessionState | null;
  qrBusy: boolean;
  qrStatusLabel: string;
  qrStatusTone: "slate" | "blue" | "emerald" | "amber" | "rose";
  qrHelper: string;
  qrFootnote: string;
  qrMessage: string;
  qrDisplayName: string;
  webStatusLabel: string;
  webStatusTone: "slate" | "blue" | "emerald" | "amber" | "rose";
  webLaunchState: WebLaunchState;
  webMessage: string;
  viewerMessage: string;
  formatDate: (value: string) => string;
  onShowManualSetup: () => void;
  onOpenMetaChannel: () => void;
  onLaunchEmbeddedSignup: () => Promise<void>;
  onTestMetaConnection: () => Promise<void>;
  onSurfaceQrConfigurationError: () => void;
  onCreateQrSession: () => Promise<void>;
  onSelectQrSession: (sessionId: string) => void;
  onSyncQrHistory: () => Promise<void>;
  onStartQrSession: (forceRestart?: boolean) => Promise<void>;
  onDisconnectQrSession: () => Promise<void>;
  onReloadQrSessionState: () => Promise<void>;
  onSetQrDisplayName: (value: string) => void;
  onCopy: (value: string, label: string) => Promise<void>;
  onOpenWhatsAppWeb: () => void;
};

export function WhatsAppAccessOptionsPanel({
  metaReady,
  embeddedSignupLoading,
  embeddedSignupReady,
  embeddedSignupBusy,
  embeddedSignupConfig,
  hasPreparedChannel,
  metaDetail,
  metaFootnote,
  metaMessage,
  qrSessions,
  selectedQrSessionId,
  qrSession,
  qrBusy,
  qrStatusLabel,
  qrStatusTone,
  qrHelper,
  qrFootnote,
  qrMessage,
  qrDisplayName,
  webStatusLabel,
  webStatusTone,
  webLaunchState,
  webMessage,
  viewerMessage,
  formatDate,
  onShowManualSetup,
  onOpenMetaChannel,
  onLaunchEmbeddedSignup,
  onTestMetaConnection,
  onSurfaceQrConfigurationError,
  onCreateQrSession,
  onSelectQrSession,
  onSyncQrHistory,
  onStartQrSession,
  onDisconnectQrSession,
  onReloadQrSessionState,
  onSetQrDisplayName,
  onCopy,
  onOpenWhatsAppWeb
}: WhatsAppAccessOptionsPanelProps) {
  const qrPrimaryActionLabel = qrBusy
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
              : "Atualizar estado";

  function handlePrimaryQrAction() {
    if (!qrSession?.isConfigured) {
      onSurfaceQrConfigurationError();
      return;
    }

    if (qrSession.status === "connected") {
      void onSyncQrHistory();
      return;
    }

    if (qrSession.canStart) {
      void onStartQrSession(false);
      return;
    }

    if (qrSession.canRestart) {
      void onStartQrSession(true);
      return;
    }

    if (qrSession.canDisconnect) {
      void onDisconnectQrSession();
      return;
    }

    void onReloadQrSessionState();
  }

  return (
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
        footnote={embeddedSignupReady ? metaFootnote ?? "Requer App ID, Configuration ID e App Secret configurados no backend." : embeddedSignupConfig?.error ?? metaFootnote ?? undefined}
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
            ? onOpenMetaChannel
            : embeddedSignupReady
              ? () => { void onLaunchEmbeddedSignup(); }
              : hasPreparedChannel
                ? () => { void onTestMetaConnection(); }
                : onShowManualSetup
        }
        message={embeddedSignupReady ? metaMessage : embeddedSignupConfig?.error ?? metaMessage}
      />

      <article className={`${cardClass} overflow-hidden p-0`}>
        <div className="border-b border-slate-200 bg-[linear-gradient(135deg,rgba(239,246,255,0.9),rgba(248,250,252,0.95))] px-6 py-5">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div className="flex items-start gap-4">
              <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-blue-600 text-sm font-semibold text-white shadow-sm shadow-blue-200">QR</span>
              <div className="space-y-1">
                <h3 className="text-xl font-semibold tracking-tight text-slate-950">Sessao QR experimental</h3>
                <p className="max-w-2xl text-sm leading-6 text-slate-600">Crie uma ou mais sessoes QR para conectar numeros diferentes do WhatsApp Web, parear por QR e sincronizar conversas recentes no CRM.</p>
              </div>
            </div>
            <StatusPill tone={qrStatusTone}>{qrStatusLabel}</StatusPill>
          </div>
        </div>

        <div className="space-y-5 px-6 py-6">
          <div className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3">
            <div>
              <p className="text-sm font-semibold text-slate-950">Sessoes QR</p>
              <p className="text-xs leading-5 text-slate-500">Selecione a sessao que deseja operar ou crie um novo QR para outro numero.</p>
            </div>
            <button type="button" className={secondaryButtonClass} onClick={() => void onCreateQrSession()} disabled={qrBusy}>
              Novo QR
            </button>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {qrSessions.length > 0 ? qrSessions.map((session) => {
              const isSelected = selectedQrSessionId === (session.sessionId ?? "");
              return (
                <button
                  key={session.sessionId ?? `session-${session.displayName ?? "qr"}`}
                  type="button"
                  className={`rounded-2xl border px-4 py-3 text-left transition ${isSelected ? "border-slate-900 bg-slate-950 text-white" : "border-slate-200 bg-white text-slate-900 hover:border-slate-300"}`}
                  onClick={() => onSelectQrSession(session.sessionId ?? "")}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className={`text-sm font-semibold ${isSelected ? "text-white" : "text-slate-950"}`}>{session.displayName || "WhatsApp QR"}</p>
                      <p className={`text-xs ${isSelected ? "text-slate-300" : "text-slate-500"}`}>{session.phoneNumber || session.sessionId || "Sessao sem numero conectado"}</p>
                    </div>
                    <StatusPill tone={
                      session.status === "connected" ? "emerald"
                        : session.status === "awaiting_scan" || session.status === "qr_ready" || session.status === "starting" || session.status === "connecting" ? "amber"
                          : session.status === "error" || session.status === "bridge_error" || session.status === "bridge_unreachable" ? "rose"
                            : "slate"
                    }>
                      {session.status}
                    </StatusPill>
                  </div>
                </button>
              );
            }) : (
              <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50/80 px-4 py-5 text-sm text-slate-500 sm:col-span-2">
                Nenhuma sessao QR criada ainda. Clique em <span className="font-semibold text-slate-700">Novo QR</span> para adicionar o primeiro numero.
              </div>
            )}
          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
            <p className="text-sm font-medium leading-6 text-slate-700">{qrHelper}</p>
            <p className="mt-2 text-sm leading-6 text-slate-500">{qrFootnote}</p>
          </div>

          {qrMessage && (
            <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-800">
              {qrMessage}
            </div>
          )}

          <div className="rounded-[28px] border border-slate-200 bg-slate-50/70 p-5">
            <div className="space-y-4">
              <div className="space-y-1">
                <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">QR atual</span>
                <p className="text-sm leading-6 text-slate-600">
                  {qrSession?.qrCodeDataUrl
                    ? "Escaneie com o WhatsApp do numero que sera operado no CRM."
                    : qrSession?.status === "connected"
                      ? "A sessao ja esta conectada e pronta para sincronizacao."
                      : "Quando o QR estiver disponivel, ele sera exibido aqui."}
                </p>
              </div>

              {qrSession?.qrCodeDataUrl ? (
                <div className="rounded-[24px] border border-slate-200 bg-white p-4 shadow-sm">
                  <img
                    src={qrSession.qrCodeDataUrl}
                    alt="QR code da sessao WhatsApp"
                    className="mx-auto w-full max-w-[240px] rounded-2xl border border-slate-200 bg-white p-3"
                  />
                </div>
              ) : (
                <div className="flex min-h-[280px] items-center justify-center rounded-[24px] border border-dashed border-slate-300 bg-white/80 p-6 text-center text-sm leading-6 text-slate-500">
                  {qrSession?.status === "connected"
                    ? "Sessao conectada. Nenhum QR visivel no momento."
                    : "Gere ou reinicie a sessao para visualizar o QR neste painel."}
                </div>
              )}
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl border border-slate-200 bg-white p-4">
              <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">Sessao</span>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                {qrSession?.detail || "Sessao QR ainda nao iniciada."}
              </p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-4">
              <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">Resumo rapido</span>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <StatusPill tone="blue">{qrSession?.cachedChatsCount ?? 0} chats detectados</StatusPill>
                {qrSession?.lastHistorySyncAt && <StatusPill tone="emerald">Ultima sincronizacao: {formatDate(qrSession.lastHistorySyncAt)}</StatusPill>}
                {qrSession?.phoneNumber && <StatusPill tone="slate">{qrSession.phoneNumber}</StatusPill>}
              </div>
            </div>
          </div>

          {qrSession?.isConfigured && (
            <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-4">
              <label className={labelClass}>
                Nome da sessao
                <input
                  className={inputClass}
                  value={qrDisplayName}
                  onChange={(event) => onSetQrDisplayName(event.target.value)}
                  placeholder="WhatsApp QR"
                />
              </label>

              {qrSession.pairingCode && (
                <ReadonlyCopyField
                  label="Codigo de pareamento"
                  value={qrSession.pairingCode}
                  buttonLabel="Copiar codigo"
                  onCopy={() => void onCopy(qrSession.pairingCode ?? "", "Codigo de pareamento")}
                />
              )}
            </div>
          )}

          <div className="grid gap-3 border-t border-slate-200 pt-5 sm:grid-cols-2">
            <button
              type="button"
              className={primaryButtonClass}
              onClick={handlePrimaryQrAction}
              disabled={qrBusy}
            >
              {qrPrimaryActionLabel}
            </button>

            {qrSession?.isConfigured && (
              <>
                <button type="button" className={secondaryButtonClass} onClick={() => void onStartQrSession(false)} disabled={qrBusy || !qrSession.canStart}>
                  Gerar QR
                </button>
                <button type="button" className={secondaryButtonClass} onClick={() => void onSyncQrHistory()} disabled={qrBusy || qrSession.status !== "connected"}>
                  Sincronizar
                </button>
                <button type="button" className={secondaryButtonClass} onClick={() => void onStartQrSession(true)} disabled={qrBusy || !qrSession.canRestart}>
                  Reiniciar
                </button>
                <button type="button" className={secondaryButtonClass} onClick={() => void onDisconnectQrSession()} disabled={qrBusy || !qrSession.canDisconnect}>
                  Desconectar
                </button>
              </>
            )}
          </div>

          <p className="text-xs leading-5 text-slate-500">
            Cada sessao QR representa um numero conectado via WhatsApp Web. O atendimento separa as conversas por sessao para evitar mistura entre numeros diferentes.
          </p>
        </div>
      </article>

      <ChannelOptionCard
        title="WhatsApp Web"
        description="Abre o WhatsApp Web como apoio operacional sem tirar voce do CRM."
        statusLabel={webStatusLabel}
        statusTone={webStatusTone}
        helper={viewerMessage}
        footnote="Se o iframe do WhatsApp bloquear a abertura interna, o sistema tenta janela auxiliar ou nova aba."
        ctaLabel={
          webLaunchState === "embedded" || webLaunchState === "popup" || webLaunchState === "tab"
            ? "Abrir novamente"
            : webLaunchState === "embedding"
              ? "Abrindo..."
              : "Abrir WhatsApp Web"
        }
        onAction={onOpenWhatsAppWeb}
        message={webLaunchState === "error" ? webMessage : undefined}
      />

    </div>
  );
}
