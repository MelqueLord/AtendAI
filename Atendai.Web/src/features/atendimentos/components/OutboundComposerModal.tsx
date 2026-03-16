import type { Dispatch, SetStateAction } from "react";
import { inputClass, labelClass, primaryButtonClass, secondaryButtonClass, textareaClass } from "@shared/components/WorkspaceUi";
import type { WhatsAppChannel } from "@shared/types";
import type { OutboundDraft } from "@features/atendimentos/types/inboxWorkspace";

type OutboundComposerModalProps = {
  open: boolean;
  outboundDraft: OutboundDraft;
  setOutboundDraft: Dispatch<SetStateAction<OutboundDraft>>;
  outboundSubmitting: boolean;
  activeChannels: WhatsAppChannel[];
  onClose: () => void;
  onConfirm: () => void;
};

export function OutboundComposerModal({
  open,
  outboundDraft,
  setOutboundDraft,
  outboundSubmitting,
  activeChannels,
  onClose,
  onConfirm
}: OutboundComposerModalProps) {
  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-950/40 p-4 backdrop-blur-sm">
      <div className="w-full max-w-2xl rounded-[28px] border border-slate-200 bg-white p-6 shadow-[0_30px_120px_-40px_rgba(15,23,42,0.5)]">
        <div className="flex flex-col gap-4">
          <div className="space-y-2">
            <span className="inline-flex rounded-full bg-blue-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-blue-700">Outbound</span>
            <h3 className="text-xl font-semibold tracking-tight text-slate-950">Iniciar nova conversa pelo CRM</h3>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <label className={labelClass} htmlFor="outbound-customer-name">
              Nome do cliente
              <input
                id="outbound-customer-name"
                className={inputClass}
                value={outboundDraft.customerName}
                onChange={(event) => setOutboundDraft((prev) => ({ ...prev, customerName: event.target.value }))}
              />
            </label>
            <label className={labelClass} htmlFor="outbound-customer-phone">
              WhatsApp do cliente
              <input
                id="outbound-customer-phone"
                className={inputClass}
                value={outboundDraft.customerPhone}
                onChange={(event) => setOutboundDraft((prev) => ({ ...prev, customerPhone: event.target.value }))}
                placeholder="5511999999999"
              />
            </label>
            <label className={`${labelClass} md:col-span-2`} htmlFor="outbound-channel">
              Canal de saida
              <select
                id="outbound-channel"
                className={inputClass}
                value={outboundDraft.channelId}
                onChange={(event) => setOutboundDraft((prev) => ({ ...prev, channelId: event.target.value }))}
              >
                <option value="">Usar canal principal automatico</option>
                {activeChannels.map((channel) => (
                  <option key={channel.id} value={channel.id}>
                    {channel.displayName}{channel.isPrimary ? " (principal)" : ""}
                  </option>
                ))}
              </select>
            </label>
            <label className={`${labelClass} md:col-span-2`} htmlFor="outbound-message">
              Primeira mensagem
              <textarea
                id="outbound-message"
                className={`${textareaClass} min-h-[190px]`}
                value={outboundDraft.message}
                onChange={(event) => setOutboundDraft((prev) => ({ ...prev, message: event.target.value }))}
              />
            </label>
          </div>

          <div className="rounded-2xl border border-blue-100 bg-blue-50/70 px-4 py-3 text-sm leading-6 text-blue-900">
            A Meta pode exigir janela ativa de 24h ou template aprovado.
          </div>

          <div className="flex flex-wrap items-center justify-end gap-3">
            <button type="button" className={secondaryButtonClass} onClick={onClose} disabled={outboundSubmitting}>
              Cancelar
            </button>
            <button type="button" className={primaryButtonClass} onClick={onConfirm} disabled={outboundSubmitting}>
              {outboundSubmitting ? "Iniciando..." : "Iniciar conversa"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}


