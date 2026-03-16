import { secondaryButtonClass } from "@shared/components/WorkspaceUi";
import { WHATSAPP_WEB_URL } from "../services/whatsappLaunchService";
import { WebLaunchState, WebViewerStatePanel } from "./WhatsAppWorkspacePrimitives";

type WhatsAppWebViewerModalProps = {
  isOpen: boolean;
  launchState: WebLaunchState;
  viewerMessage: string;
  onOpenPopup: () => void;
  onOpenTab: () => void;
  onRetryEmbed: () => void;
  onClose: () => void;
  onFrameLoad: () => void;
};

export function WhatsAppWebViewerModal({
  isOpen,
  launchState,
  viewerMessage,
  onOpenPopup,
  onOpenTab,
  onRetryEmbed,
  onClose,
  onFrameLoad
}: WhatsAppWebViewerModalProps) {
  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/45 p-4 backdrop-blur-sm sm:p-6">
      <div className="mx-auto flex h-full w-full max-w-7xl flex-col overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-2xl shadow-slate-900/15">
        <div className="flex flex-col gap-4 border-b border-slate-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div className="space-y-1">
            <h3 className="text-lg font-semibold text-slate-950">WhatsApp Web</h3>
            <p className="text-sm leading-6 text-slate-500">Se o painel nao abrir, use a janela auxiliar ou a nova aba.</p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <button type="button" className={secondaryButtonClass} onClick={onOpenPopup}>Abrir janela auxiliar</button>
            <button type="button" className={secondaryButtonClass} onClick={onOpenTab}>Abrir em nova aba</button>
            <button type="button" className={secondaryButtonClass} onClick={onClose}>Fechar</button>
          </div>
        </div>

        <div className="min-h-0 flex-1 bg-slate-100 p-4 sm:p-6">
          <div className="grid h-full gap-4 xl:grid-cols-[minmax(0,1.45fr)_380px]">
            <div className="min-h-0 overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-sm">
              {(launchState === "embedding" || launchState === "embedded") ? (
                <iframe
                  title="WhatsApp Web"
                  src={WHATSAPP_WEB_URL}
                  className="h-full min-h-[520px] w-full border-0 bg-white"
                  onLoad={onFrameLoad}
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
                state={launchState}
                message={viewerMessage}
                onOpenPopup={onOpenPopup}
                onOpenTab={onOpenTab}
                onRetryEmbed={onRetryEmbed}
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
  );
}
