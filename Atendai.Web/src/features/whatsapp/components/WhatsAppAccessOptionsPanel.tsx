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
  onSyncQrHistory,
  onStartQrSession,
  onDisconnectQrSession,
  onReloadQrSessionState,
  onSetQrDisplayName,
  onCopy,
  onOpenWhatsAppWeb
}: WhatsAppAccessOptionsPanelProps) {
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
            ? onSurfaceQrConfigurationError
            : qrSession.status === "connected"
              ? () => { void onSyncQrHistory(); }
              : qrSession.canStart
                ? () => { void onStartQrSession(false); }
                : qrSession.canRestart
                  ? () => { void onStartQrSession(true); }
                  : qrSession.canDisconnect
                    ? () => { void onDisconnectQrSession(); }
                    : () => { void onReloadQrSessionState(); }
        }
        message={qrMessage}
      />

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
              onChange={(event) => onSetQrDisplayName(event.target.value)}
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
              onCopy={() => void onCopy(qrSession.pairingCode ?? "", "Codigo de pareamento")}
            />
          )}

          <div className="flex flex-wrap gap-3">
            <button type="button" className={primaryButtonClass} onClick={() => void onStartQrSession(false)} disabled={qrBusy || !qrSession.canStart}>
              {qrBusy && qrSession.canStart ? "Gerando..." : "Gerar QR"}
            </button>
            <button type="button" className={secondaryButtonClass} onClick={() => void onSyncQrHistory()} disabled={qrBusy || qrSession.status !== "connected"}>
              Sincronizar conversas
            </button>
            <button type="button" className={secondaryButtonClass} onClick={() => void onStartQrSession(true)} disabled={qrBusy || !qrSession.canRestart}>
              Reiniciar sessao
            </button>
            <button type="button" className={secondaryButtonClass} onClick={() => void onDisconnectQrSession()} disabled={qrBusy || !qrSession.canDisconnect}>
              Desconectar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
