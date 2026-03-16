import type { Dispatch, MutableRefObject, SetStateAction } from "react";
import { useMemo } from "react";
import {
  EmptyStatePanel,
  StatusPill,
  WorkspaceSection,
  inputClass,
  labelClass,
  primaryButtonClass,
  secondaryButtonClass
} from "@shared/components/WorkspaceUi";
import type { Conversation, QueueFilter } from "@shared/types";
import {
  conversationAttentionSnapshot,
  lastMessagePreview,
  operationSummary,
  queueFilters,
  queueRowHeight,
  queueSectionMeta,
  statusLabel,
  statusTone,
  transportLabel,
  transportTone
} from "@features/atendimentos/utils/inboxWorkspace";

type QueueSectionProps = {
  queue: Conversation[];
  prioritizedQueue: Array<{ conversation: Conversation; snapshot: ReturnType<typeof conversationAttentionSnapshot> }>;
  queueInsights: {
    attentionCount: number;
    averagePendingLabel: string;
    oldestPendingLabel: string;
    overdueCount: number;
  };
  selectedConversationId: string;
  onSelectConversation: Dispatch<SetStateAction<string>>;
  search: string;
  setSearch: Dispatch<SetStateAction<string>>;
  queueFilter: QueueFilter;
  setQueueFilter: Dispatch<SetStateAction<QueueFilter>>;
  queueLoading: boolean;
  queueRefreshing: boolean;
  assignmentPendingConversationId: string | null;
  statusPendingConversationId: string | null;
  formatDate: (value: string) => string;
  onOpenOutboundComposer: () => void;
  onRefreshInbox: () => void;
  queueViewportRef: MutableRefObject<HTMLDivElement | null>;
  onQueueScroll: (scrollTop: number) => void;
  nowMs: number;
  virtualQueueHeight: number;
  shouldVirtualizeQueue: boolean;
  visibleQueueItems: Array<{ conversation: Conversation; snapshot: ReturnType<typeof conversationAttentionSnapshot> }>;
  visibleQueueStart: number;
};

export function InboxQueueSection({
  queue,
  prioritizedQueue,
  queueInsights,
  selectedConversationId,
  onSelectConversation,
  search,
  setSearch,
  queueFilter,
  setQueueFilter,
  queueLoading,
  queueRefreshing,
  assignmentPendingConversationId,
  statusPendingConversationId,
  formatDate,
  onOpenOutboundComposer,
  onRefreshInbox,
  queueViewportRef,
  onQueueScroll,
  nowMs,
  virtualQueueHeight,
  shouldVirtualizeQueue,
  visibleQueueItems,
  visibleQueueStart
}: QueueSectionProps) {
  const queueSection = useMemo(() => queueSectionMeta(queueFilter), [queueFilter]);

  function renderConversationCard(conversation: Conversation) {
    const isActive = selectedConversationId === conversation.id;
    const transportBadge = transportLabel(conversation.transport);
    const summary = operationSummary(conversation.status);
    const statusKey = conversation.status;
    const isBusy = statusPendingConversationId === conversation.id || assignmentPendingConversationId === conversation.id;
    const attention = conversationAttentionSnapshot(conversation, nowMs);
    const stripeClass =
      attention.isOverdue ? "bg-rose-500"
        : statusLabel(statusKey) === "Fila humana" ? "bg-amber-500"
          : statusLabel(statusKey) === "Humano" ? "bg-sky-500"
            : statusLabel(statusKey) === "IA" ? "bg-emerald-500"
              : "bg-slate-400";

    return (
      <button
        type="button"
        key={conversation.id}
        onClick={() => onSelectConversation(conversation.id)}
        className={`relative flex h-full min-h-[216px] w-full flex-col overflow-hidden rounded-2xl border p-4 text-left transition ${isActive ? "border-slate-900 bg-white shadow-[0_18px_40px_-28px_rgba(15,23,42,0.55)]" : "border-white/70 bg-white/90 shadow-sm shadow-slate-200/60 hover:border-slate-300 hover:bg-white"}`}
      >
        <span className={`absolute inset-y-0 left-0 w-1.5 ${stripeClass}`} aria-hidden="true" />
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 space-y-1 pl-1">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="truncate text-sm font-semibold text-slate-950">{conversation.customerName}</h3>
              {isActive && <StatusPill tone="slate">Aberta</StatusPill>}
              {isBusy && <StatusPill tone="amber">Atualizando</StatusPill>}
            </div>
            <p className="text-xs font-medium text-slate-500">{conversation.customerPhone}</p>
          </div>
          <span className="shrink-0 text-[11px] font-medium text-slate-400">{formatDate(conversation.updatedAt)}</span>
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-2 text-[11px] font-medium text-slate-500">
          <StatusPill tone={statusTone(conversation.status)}>Modo: {statusLabel(conversation.status)}</StatusPill>
          <StatusPill tone={attention.tone}>{attention.label}</StatusPill>
          {transportBadge && <StatusPill tone={transportTone(conversation.transport)}>{transportBadge}</StatusPill>}
          {conversation.channelName && <StatusPill tone="slate">{conversation.channelName}</StatusPill>}
          {conversation.assignedUserName && <StatusPill tone="blue">{conversation.assignedUserName}</StatusPill>}
        </div>
        <p className="mt-3 text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">Proxima acao</p>
        <p className="mt-1 text-sm font-medium text-slate-700">{summary.nextAction}</p>
        <p className="mt-2 text-xs leading-5 text-slate-500">{attention.detail}</p>
        <p className="mt-3 line-clamp-2 text-sm leading-6 text-slate-600">{lastMessagePreview(conversation)}</p>
      </button>
    );
  }

  return (
    <WorkspaceSection eyebrow="Fila" title="Caixa de entrada">
      <div className="grid gap-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div className="grid flex-1 gap-3 lg:max-w-3xl">
            <label className={labelClass} htmlFor="queue-search">
              Buscar conversa
              <input
                id="queue-search"
                className={inputClass}
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Nome, telefone ou ultima mensagem"
              />
            </label>
            <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
              {queueFilters.map((filter) => (
                <button
                  key={filter.value}
                  type="button"
                  className={queueFilter === filter.value ? primaryButtonClass : secondaryButtonClass}
                  onClick={() => setQueueFilter(filter.value)}
                >
                  {filter.label}
                </button>
              ))}
            </div>
            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
              <span>{queueSection.description}</span>
              <span>Ordenada por prioridade de resposta.</span>
              {queueRefreshing && <StatusPill tone="blue">Atualizando</StatusPill>}
              {queueLoading && <StatusPill tone="amber">Carregando</StatusPill>}
            </div>
          </div>
          <div className="flex flex-col gap-2 lg:w-[220px]">
            <button type="button" className={`${secondaryButtonClass} w-full`} onClick={onOpenOutboundComposer}>
              Nova conversa
            </button>
            <button type="button" className={`${secondaryButtonClass} w-full`} onClick={onRefreshInbox}>
              {queueRefreshing ? "Atualizando..." : "Atualizar fila"}
            </button>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-2xl border border-blue-200 bg-blue-50/80 px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-blue-700">Pedem resposta</p>
            <p className="mt-1 text-2xl font-semibold text-blue-950">{queueInsights.attentionCount}</p>
          </div>
          <div className="rounded-2xl border border-rose-200 bg-rose-50/80 px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-rose-700">Atrasadas &gt; 5 min</p>
            <p className="mt-1 text-2xl font-semibold text-rose-950">{queueInsights.overdueCount}</p>
          </div>
          <div className="rounded-2xl border border-amber-200 bg-amber-50/80 px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-amber-700">Maior espera</p>
            <p className="mt-1 text-2xl font-semibold text-amber-950">{queueInsights.oldestPendingLabel}</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-600">Espera media</p>
            <p className="mt-1 text-2xl font-semibold text-slate-950">{queueInsights.averagePendingLabel}</p>
          </div>
        </div>

        <div className="rounded-[28px] border border-slate-200 bg-[linear-gradient(180deg,rgba(248,250,252,0.96),rgba(241,245,249,0.92))] p-5">
          <div className="flex items-start justify-between gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm shadow-slate-200/70">
            <div>
              <p className="text-sm font-semibold text-slate-950">{queueSection.title}</p>
              <p className="mt-1 text-xs leading-5 text-slate-500">{queueSection.description}</p>
            </div>
            <StatusPill tone="slate">{queue.length}</StatusPill>
          </div>

          <div
            ref={queueViewportRef}
            className="mt-4 h-[min(70vh,44rem)] overflow-y-auto pr-1"
            onScroll={(event) => onQueueScroll(event.currentTarget.scrollTop)}
          >
            {queueLoading && queue.length === 0 ? (
              <div className="space-y-3">
                {Array.from({ length: 4 }).map((_, index) => (
                  <div key={`queue-skeleton-${index}`} className="h-32 animate-pulse rounded-2xl border border-slate-200 bg-white/80" />
                ))}
              </div>
            ) : prioritizedQueue.length > 0 ? (
              shouldVirtualizeQueue ? (
                <div className="relative" style={{ height: `${virtualQueueHeight}px` }}>
                  {visibleQueueItems.map((item, index) => (
                    <div
                      key={item.conversation.id}
                      className="absolute left-0 right-0"
                      style={{
                        height: `${queueRowHeight - 12}px`,
                        top: `${(visibleQueueStart + index) * queueRowHeight}px`
                      }}
                    >
                      {renderConversationCard(item.conversation)}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-3">
                  {prioritizedQueue.map((item) => renderConversationCard(item.conversation))}
                </div>
              )
            ) : (
              <EmptyStatePanel>Nenhuma conversa encontrada para o filtro atual.</EmptyStatePanel>
            )}
          </div>
        </div>
      </div>
    </WorkspaceSection>
  );
}



