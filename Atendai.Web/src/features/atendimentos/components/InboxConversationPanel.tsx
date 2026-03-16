import { EmptyStatePanel, StatusPill, WorkspaceSection, labelClass, primaryButtonClass, secondaryButtonClass, textareaClass } from "@shared/components/WorkspaceUi";
import type { Dispatch, SetStateAction } from "react";
import { bubbleClasses, operationSummary, senderLabel, statusTone, transportTone, transitionActionSummary } from "@features/atendimentos/utils/inboxWorkspace";
import { normalizeConversationStatus } from "@shared/utils/conversation";
import type { Conversation, QuickReplyTemplate } from "@shared/types";

type InboxConversationPanelProps = {
  selectedConversation: Conversation | null;
  conversationLoading: boolean;
  selectedTransportBadge: string | null;
  statusPendingConversationId: string | null;
  quickReplies: QuickReplyTemplate[];
  reply: string;
  setReply: Dispatch<SetStateAction<string>>;
  replySubmitting: boolean;
  sendHumanReply: () => Promise<void>;
  updateConversationStatus: (nextStatus: "BotHandling" | "WaitingHuman" | "HumanHandling" | "Closed", conversationId?: string) => Promise<void>;
  applyQuickReply: (body: string) => void;
  formatDate: (value: string) => string;
};

export function InboxConversationPanel({
  selectedConversation,
  conversationLoading,
  selectedTransportBadge,
  statusPendingConversationId,
  quickReplies,
  reply,
  setReply,
  replySubmitting,
  sendHumanReply,
  updateConversationStatus,
  applyQuickReply,
  formatDate
}: InboxConversationPanelProps) {
  const modeActionButtonClass = "inline-flex min-h-[72px] items-center justify-center rounded-2xl border px-4 py-3 text-center text-sm font-medium leading-tight transition focus:outline-none focus-visible:ring-4";
  const selectedOperation = selectedConversation ? operationSummary(selectedConversation.status) : null;
  const selectedNormalizedStatus = selectedConversation ? normalizeConversationStatus(selectedConversation.status) : null;
  const selectedTransitions = selectedConversation ? transitionActionSummary(selectedConversation.status) : [];

  return (
    <WorkspaceSection
      eyebrow="Conversa"
      title={selectedConversation ? `${selectedConversation.customerName} - ${selectedConversation.customerPhone}` : "Selecione uma conversa"}
    >
      {selectedConversation ? (
        <div className="flex flex-col gap-5">
          <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex flex-col gap-4">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex rounded-full bg-slate-100 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-600">
                  Modo atual
                </span>
                <StatusPill tone={statusTone(selectedConversation.status)}>{selectedOperation?.title}</StatusPill>
                {statusPendingConversationId === selectedConversation.id && <StatusPill tone="amber">Sincronizando</StatusPill>}
                {selectedTransportBadge && <StatusPill tone={transportTone(selectedConversation.transport)}>Origem: {selectedTransportBadge}</StatusPill>}
                {selectedConversation.channelName && <StatusPill tone="slate">Canal: {selectedConversation.channelName}</StatusPill>}
                {selectedConversation.assignedUserName && <StatusPill tone="blue">Responsavel: {selectedConversation.assignedUserName}</StatusPill>}
                <span className="text-xs text-slate-500">Atualizada em {formatDate(selectedConversation.updatedAt)}</span>
              </div>
              <div className="space-y-2">
                <h3 className="text-lg font-semibold tracking-tight text-slate-950">{selectedOperation?.title}</h3>
                <p className="text-sm leading-6 text-slate-600">{selectedOperation?.description}</p>
              </div>
              <div className="space-y-3">
                <div className="space-y-1">
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">Passar para</p>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {selectedTransitions.map((transition) => (
                      <button
                        key={transition.status}
                        type="button"
                        className={
                          transition.status === "WaitingHuman"
                            ? `${modeActionButtonClass} border-amber-200 bg-amber-50 text-amber-900`
                            : transition.status === "HumanHandling"
                              ? `${modeActionButtonClass} border-sky-200 bg-sky-50 text-sky-900`
                              : `${modeActionButtonClass} border-emerald-200 bg-emerald-50 text-emerald-900`
                        }
                        onClick={() => void updateConversationStatus(transition.status)}
                        disabled={statusPendingConversationId === selectedConversation.id}
                      >
                        <span className="flex flex-col items-center gap-1">
                          <span>{transition.title}</span>
                          <span className="text-[11px] font-medium opacity-80">{transition.caption}</span>
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">Encerrar fluxo</p>
                  <button
                    type="button"
                    className={selectedNormalizedStatus === "Closed" ? `${modeActionButtonClass} border-slate-300 bg-slate-100 text-slate-500` : `${modeActionButtonClass} border-slate-300 bg-slate-900 text-white hover:bg-slate-800`}
                    onClick={() => void updateConversationStatus("Closed")}
                    disabled={selectedNormalizedStatus === "Closed" || statusPendingConversationId === selectedConversation.id}
                  >
                    Encerrar conversa
                  </button>
                </div>
              </div>
              <p className="text-xs leading-5 text-slate-500">
                Fluxo operacional: `IA` automatiza, `Fila humana` espera operador e `Humano` indica conducao manual ativa. A tela sempre mostra apenas um modo atual por vez.
              </p>
            </div>
          </div>

          <div className="grid gap-2">
            {conversationLoading && (
              <div className="rounded-2xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-800">
                Carregando o historico mais recente desta conversa...
              </div>
            )}
            {selectedConversation.messages.length >= 160 && (
              <div className="rounded-2xl border border-slate-200 bg-slate-50/90 px-4 py-3 text-xs leading-5 text-slate-600">
                Mostrando o historico recente para manter a tela mais rapida. Novas mensagens entram em tempo real.
              </div>
            )}
          </div>

          <div className="flex min-h-[360px] max-h-[calc(100vh-25rem)] flex-col gap-3 overflow-y-auto rounded-[26px] border border-slate-200 bg-slate-50/70 p-4">
            {selectedConversation.messages.length > 0 ? selectedConversation.messages.map((message) => (
              <article key={message.id} className={`max-w-[85%] rounded-2xl px-4 py-3 shadow-sm ${bubbleClasses(message.sender)}`}>
                <div className="mb-1 flex items-center justify-between gap-3">
                  <span className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">{senderLabel(message.sender)}</span>
                  <span className="text-[11px] text-slate-400">{formatDate(message.createdAt)}</span>
                </div>
                <p className="whitespace-pre-wrap text-sm leading-6">{message.text}</p>
              </article>
            )) : (
              <EmptyStatePanel>
                {conversationLoading
                  ? "Buscando o historico desta conversa..."
                  : "Ainda nao encontramos mensagens nesta conversa."}
              </EmptyStatePanel>
            )}
          </div>

          <div className="grid gap-3">
            <div className="flex flex-wrap items-center gap-2">
              {quickReplies.slice(0, 6).map((template) => (
                <button
                  key={template.id}
                  type="button"
                  className={secondaryButtonClass}
                  onClick={() => applyQuickReply(template.body)}
                  disabled={replySubmitting}
                >
                  {template.title}
                </button>
              ))}
              {quickReplies.length === 0 && <span className="text-sm text-slate-500">Sem respostas rapidas.</span>}
            </div>

            <label className={labelClass} htmlFor="reply-text">
              Resposta do operador
              <textarea
                id="reply-text"
                className={`${textareaClass} min-h-[150px]`}
                value={reply}
                onChange={(event) => setReply(event.target.value)}
                disabled={replySubmitting}
              />
            </label>

            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-3">
                <button type="button" className={secondaryButtonClass} onClick={() => setReply("")} disabled={replySubmitting}>Limpar</button>
                <button type="button" className={primaryButtonClass} onClick={() => void sendHumanReply()} disabled={replySubmitting || !reply.trim()}>
                  {replySubmitting ? "Enviando..." : "Enviar resposta"}
                </button>
              </div>
            </div>
            <p className="text-xs leading-5 text-slate-500">
              Ao responder manualmente, a conversa permanece em atendimento humano. Para a IA retomar, use `Devolver para IA`.
            </p>
          </div>
        </div>
      ) : (
        <EmptyStatePanel>A caixa de entrada continua disponivel no painel da esquerda. Assim que voce selecionar uma conversa, o historico, o composer e os atalhos operacionais aparecem aqui.</EmptyStatePanel>
      )}
    </WorkspaceSection>
  );
}




