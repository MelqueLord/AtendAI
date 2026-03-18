import { useEffect, useMemo, useRef, useState } from "react";
import {
  EmptyStatePanel,
  MetricTile,
  StatusPill,
  WorkspaceSection,
  heroPanelClass,
  inputClass,
  labelClass,
  primaryButtonClass,
  secondaryButtonClass,
  textareaClass,
  workspacePageClass
} from "@shared/components/WorkspaceUi";
import { normalizeConversationStatus } from "@shared/utils/conversation";
import { InboxConversationPanel } from "@features/atendimentos/components/InboxConversationPanel";
import { InboxQueueSection } from "@features/atendimentos/components/InboxQueueSection";
import { OutboundComposerModal } from "@features/atendimentos/components/OutboundComposerModal";
import type { InboxWorkspaceProps } from "@features/atendimentos/types/inboxWorkspace";
import {
  conversationAttentionSnapshot,
  formatDuration,
  queueOverscan,
  queueRowHeight,
  queueVirtualizationThreshold,
  transportLabel
} from "@features/atendimentos/utils/inboxWorkspace";

export function InboxWorkspace({
  queue,
  conversations,
  selectedConversation,
  selectedConversationId,
  onSelectConversation,
  search,
  setSearch,
  queueFilter,
  setQueueFilter,
  sourceFilter,
  setSourceFilter,
  sourceScopes,
  reply,
  setReply,
  outboundDraft,
  setOutboundDraft,
  outboundSubmitting,
  queueLoading,
  queueRefreshing,
  conversationLoading,
  notesLoading,
  replySubmitting,
  noteSubmitting,
  contactSaving,
  quickReplySaving,
  statusPendingConversationId,
  assignmentPendingConversationId,
  whatsAppChannels,
  startOutboundConversation,
  sendHumanReply,
  refreshInbox,
  feedbackDraft,
  setFeedbackDraft,
  saveConversationFeedback,
  contactPanelDraft,
  setContactPanelDraft,
  saveContactPanelDraft,
  hasSelectedContact,
  stateOptions,
  contactStatusOptions,
  managedUsers,
  canAssignConversations,
  assignConversation,
  updateConversationStatus,
  attendanceRealtimeState,
  attendanceRealtimeLastPublishedAt,
  attendanceRealtimeLastReceivedAt,
  notes,
  noteDraft,
  setNoteDraft,
  addConversationNote,
  quickReplies,
  quickReplyDraft,
  setQuickReplyDraft,
  saveQuickReply,
  editQuickReply,
  deleteQuickReply,
  applyQuickReply,
  formatDate
}: InboxWorkspaceProps) {
  const [showOutboundComposer, setShowOutboundComposer] = useState(false);
  const [contactPanelOpen, setContactPanelOpen] = useState(true);
  const [notesPanelOpen, setNotesPanelOpen] = useState(true);
  const [qualityPanelOpen, setQualityPanelOpen] = useState(false);
  const [quickRepliesPanelOpen, setQuickRepliesPanelOpen] = useState(false);
  const [timelineNow, setTimelineNow] = useState(() => Date.now());
  const [queueScrollTop, setQueueScrollTop] = useState(0);
  const [queueViewportHeight, setQueueViewportHeight] = useState(0);
  const queueViewportRef = useRef<HTMLDivElement | null>(null);

  const botCount = conversations.filter((conversation) => normalizeConversationStatus(conversation.status) === "BotHandling").length;
  const waitingCount = conversations.filter((conversation) => normalizeConversationStatus(conversation.status) === "WaitingHuman").length;
  const humanCount = conversations.filter((conversation) => normalizeConversationStatus(conversation.status) === "HumanHandling").length;
  const closedCount = conversations.filter((conversation) => normalizeConversationStatus(conversation.status) === "Closed").length;
  const metaCount = conversations.filter((conversation) => conversation.transport?.toLowerCase() === "meta").length;
  const qrCount = conversations.filter((conversation) => conversation.transport?.toLowerCase() === "qr").length;
  const activeChannels = useMemo(() => whatsAppChannels.filter((channel) => channel.isActive), [whatsAppChannels]);
  const selectedTransportBadge = selectedConversation ? transportLabel(selectedConversation.transport) : null;
  const sourceOptions = useMemo(
    () => [
      { value: "ALL", label: "Todos os canais", count: conversations.length },
      ...sourceScopes.map((scope) => ({ value: scope.value, label: scope.label, count: scope.count }))
    ],
    [conversations.length, sourceScopes]
  );
  const metaScopes = useMemo(() => sourceScopes.filter((scope) => scope.transport === "meta"), [sourceScopes]);
  const qrScopes = useMemo(() => sourceScopes.filter((scope) => scope.transport === "qr"), [sourceScopes]);
  const realtimeTone =
    attendanceRealtimeState === "connected" ? "emerald"
      : attendanceRealtimeState === "reconnecting" || attendanceRealtimeState === "connecting" ? "amber"
        : attendanceRealtimeState === "fallback" ? "blue"
          : "rose";
  const realtimeLabel =
    attendanceRealtimeState === "connected" ? "Realtime conectado"
      : attendanceRealtimeState === "reconnecting" ? "Realtime reconectando"
        : attendanceRealtimeState === "connecting" ? "Realtime conectando"
          : attendanceRealtimeState === "fallback" ? "Fallback por polling"
            : "Realtime offline";

  const queueInsights = useMemo(() => {
    const attentionItems = conversations
      .map((conversation) => conversationAttentionSnapshot(conversation, timelineNow))
      .filter((snapshot) => snapshot.needsOperatorAttention);
    const overdueCount = attentionItems.filter((snapshot) => snapshot.isOverdue).length;
    const oldestPendingMinutes = attentionItems.reduce((currentMax, snapshot) => Math.max(currentMax, snapshot.waitingMinutes), 0);
    const averagePendingMinutes = attentionItems.length > 0
      ? Math.round(attentionItems.reduce((sum, snapshot) => sum + snapshot.waitingMinutes, 0) / attentionItems.length)
      : 0;

    return {
      attentionCount: attentionItems.length,
      averagePendingLabel: attentionItems.length > 0 ? formatDuration(averagePendingMinutes) : "Livre",
      oldestPendingLabel: attentionItems.length > 0 ? formatDuration(oldestPendingMinutes) : "Livre",
      overdueCount
    };
  }, [conversations, timelineNow]);

  const prioritizedQueue = useMemo(() => {
    return queue
      .map((conversation) => ({
        conversation,
        snapshot: conversationAttentionSnapshot(conversation, timelineNow)
      }))
      .sort((left, right) => new Date(right.conversation.updatedAt).getTime() - new Date(left.conversation.updatedAt).getTime());
  }, [queue, timelineNow]);

  const shouldVirtualizeQueue = prioritizedQueue.length > queueVirtualizationThreshold;
  const effectiveViewportHeight = queueViewportHeight || 704;
  const maxVisibleQueueStart = shouldVirtualizeQueue
    ? Math.max(0, prioritizedQueue.length - Math.ceil(effectiveViewportHeight / queueRowHeight))
    : 0;
  const visibleQueueStart = shouldVirtualizeQueue
    ? Math.min(maxVisibleQueueStart, Math.max(0, Math.floor(queueScrollTop / queueRowHeight) - queueOverscan))
    : 0;
  const visibleQueueEnd = shouldVirtualizeQueue
    ? Math.min(
      prioritizedQueue.length,
      Math.ceil((queueScrollTop + effectiveViewportHeight) / queueRowHeight) + queueOverscan
    )
    : prioritizedQueue.length;
  const visibleQueueItems = prioritizedQueue.slice(visibleQueueStart, visibleQueueEnd);
  const virtualQueueHeight = prioritizedQueue.length * queueRowHeight;

  async function handleStartOutbound() {
    const started = await startOutboundConversation();
    if (started) {
      setShowOutboundComposer(false);
    }
  }

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setTimelineNow(Date.now());
    }, 30000);

    return () => window.clearInterval(intervalId);
  }, []);

  useEffect(() => {
    const viewport = queueViewportRef.current;
    if (!viewport) {
      return;
    }

    const syncViewportHeight = () => {
      setQueueViewportHeight(viewport.clientHeight);
    };

    syncViewportHeight();

    if (typeof ResizeObserver === "undefined") {
      window.addEventListener("resize", syncViewportHeight);
      return () => window.removeEventListener("resize", syncViewportHeight);
    }

    const observer = new ResizeObserver(() => {
      syncViewportHeight();
    });
    observer.observe(viewport);

    return () => observer.disconnect();
  }, [prioritizedQueue.length]);

  useEffect(() => {
    const viewport = queueViewportRef.current;
    if (!viewport || !selectedConversationId || !shouldVirtualizeQueue) {
      return;
    }

    const selectedIndex = prioritizedQueue.findIndex((item) => item.conversation.id === selectedConversationId);
    if (selectedIndex === -1) {
      return;
    }

    const itemTop = selectedIndex * queueRowHeight;
    const itemBottom = itemTop + queueRowHeight;
    const viewportTop = viewport.scrollTop;
    const viewportBottom = viewportTop + viewport.clientHeight;

    if (itemTop < viewportTop) {
      viewport.scrollTop = Math.max(0, itemTop - 16);
      return;
    }

    if (itemBottom > viewportBottom) {
      viewport.scrollTop = Math.max(0, itemBottom - viewport.clientHeight + 16);
    }
  }, [prioritizedQueue, selectedConversationId, shouldVirtualizeQueue]);

  function renderPanelToggle(title: string, description: string, open: boolean, onToggle: () => void) {
    return (
      <button
        type="button"
        className="flex w-full items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-3 text-left transition hover:border-slate-300 hover:bg-slate-100/80"
        onClick={onToggle}
      >
        <div>
          <p className="text-sm font-semibold text-slate-950">{title}</p>
          <p className="text-xs leading-5 text-slate-500">{description}</p>
        </div>
        <span className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">{open ? "Fechar" : "Abrir"}</span>
      </button>
    );
  }

  return (
    <section className={workspacePageClass}>
      <section className={heroPanelClass}>
        <div className="grid gap-5 xl:grid-cols-12">
          <div className="space-y-3 xl:col-span-7">
            <span className="inline-flex rounded-full bg-blue-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-blue-700">Atendimento</span>
            <div className="space-y-2">
              <h2 className="text-2xl font-semibold tracking-tight text-slate-950 sm:text-[2rem]">Atendimento</h2>
              <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                <StatusPill tone={realtimeTone}>{realtimeLabel}</StatusPill>
                {attendanceRealtimeLastPublishedAt && <span>Servidor: {formatDate(attendanceRealtimeLastPublishedAt)}</span>}
                {attendanceRealtimeLastReceivedAt && <span>Navegador: {formatDate(attendanceRealtimeLastReceivedAt)}</span>}
              </div>
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 xl:col-span-5">
            <MetricTile label="IA atendendo" value={String(botCount)} detail="Conversas em automacao ativa" tone="emerald" />
            <MetricTile label="Fila humana" value={String(waitingCount)} detail="Clientes aguardando operador" tone="amber" />
            <MetricTile label="WhatsApp Meta" value={String(metaCount)} detail={`${activeChannels.length} numero(s) oficial(is) ativo(s)`} tone="blue" />
            <MetricTile label="WhatsApp QR" value={String(qrCount)} detail="Sessoes experimentais com historico no inbox" tone="amber" />
            <MetricTile label="Humano ativo" value={String(humanCount)} detail="Conversas assumidas por operador" tone="blue" />
            <MetricTile label="Encerradas" value={String(closedCount)} detail="Historico finalizado" tone="slate" />
          </div>
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        <WorkspaceSection eyebrow="Canais oficiais" title="WhatsApp Meta">
          <div className="space-y-3">
            <p className="text-sm leading-6 text-slate-600">
              Numeros conectados pela Cloud API da Meta. Cada numero oficial pode aparecer no atendimento com sua propria fila de conversas.
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
              {metaScopes.length > 0 ? metaScopes.map((scope) => (
                <div key={scope.value} className="rounded-2xl border border-blue-200 bg-blue-50/70 px-4 py-3">
                  <p className="text-sm font-semibold text-blue-950">{scope.label}</p>
                  <p className="mt-1 text-xs leading-5 text-blue-800">{scope.count} conversa(s) vinculada(s) a este numero/canal.</p>
                </div>
              )) : (
                <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50/80 px-4 py-4 text-sm text-slate-500 sm:col-span-2">
                  Nenhum numero oficial da Meta com conversas nesta fila.
                </div>
              )}
            </div>
          </div>
        </WorkspaceSection>

        <WorkspaceSection eyebrow="Sessoes experimentais" title="WhatsApp QR">
          <div className="space-y-3">
            <p className="text-sm leading-6 text-slate-600">
              Numeros conectados por QR no WhatsApp Web. Cada sessao QR pode ter um historico proprio e aparece separada no atendimento.
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
              {qrScopes.length > 0 ? qrScopes.map((scope) => (
                <div key={scope.value} className="rounded-2xl border border-amber-200 bg-amber-50/70 px-4 py-3">
                  <p className="text-sm font-semibold text-amber-950">{scope.label}</p>
                  <p className="mt-1 text-xs leading-5 text-amber-800">{scope.count} conversa(s) vinculada(s) a esta sessao.</p>
                </div>
              )) : (
                <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50/80 px-4 py-4 text-sm text-slate-500 sm:col-span-2">
                  Nenhuma sessao QR com conversas nesta fila.
                </div>
              )}
            </div>
          </div>
        </WorkspaceSection>
      </section>

      <InboxQueueSection
        queue={queue}
        prioritizedQueue={prioritizedQueue}
        queueInsights={queueInsights}
        selectedConversationId={selectedConversationId}
        onSelectConversation={onSelectConversation}
        search={search}
        setSearch={setSearch}
        queueFilter={queueFilter}
        setQueueFilter={setQueueFilter}
        sourceFilter={sourceFilter}
        setSourceFilter={setSourceFilter}
        sourceOptions={sourceOptions}
        queueLoading={queueLoading}
        queueRefreshing={queueRefreshing}
        assignmentPendingConversationId={assignmentPendingConversationId}
        statusPendingConversationId={statusPendingConversationId}
        formatDate={formatDate}
        onOpenOutboundComposer={() => setShowOutboundComposer(true)}
        onRefreshInbox={() => void refreshInbox()}
        queueViewportRef={queueViewportRef}
        onQueueScroll={setQueueScrollTop}
        nowMs={timelineNow}
        virtualQueueHeight={virtualQueueHeight}
        shouldVirtualizeQueue={shouldVirtualizeQueue}
        visibleQueueItems={visibleQueueItems}
        visibleQueueStart={visibleQueueStart}
      />

      <section className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_370px] 2xl:grid-cols-[minmax(0,1.08fr)_390px]">
        <InboxConversationPanel
          selectedConversation={selectedConversation}
          conversationLoading={conversationLoading}
          selectedTransportBadge={selectedTransportBadge}
          statusPendingConversationId={statusPendingConversationId}
          quickReplies={quickReplies}
          reply={reply}
          setReply={setReply}
          replySubmitting={replySubmitting}
          sendHumanReply={sendHumanReply}
          updateConversationStatus={updateConversationStatus}
          applyQuickReply={applyQuickReply}
          formatDate={formatDate}
        />

        <div className="flex flex-col gap-6">
          <WorkspaceSection eyebrow="Operacao" title="Gestao operacional">
            {selectedConversation ? (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-1">
                <label className={labelClass} htmlFor="conversation-assignee">
                  Responsavel humano
                  <select
                    id="conversation-assignee"
                    className={inputClass}
                    value={selectedConversation.assignedUserId ?? ""}
                    onChange={(event) => void assignConversation(event.target.value)}
                    disabled={!canAssignConversations || assignmentPendingConversationId === selectedConversation.id}
                  >
                    <option value="">Fila sem responsavel</option>
                    {managedUsers.map((user) => <option key={user.id} value={user.id}>{user.name}</option>)}
                  </select>
                </label>
                <label className={labelClass} htmlFor="conversation-status">
                  Controle avancado de status
                  <select
                    id="conversation-status"
                    className={inputClass}
                    value={normalizeConversationStatus(selectedConversation.status)}
                    onChange={(event) => void updateConversationStatus(event.target.value as "BotHandling" | "WaitingHuman" | "HumanHandling" | "Closed")}
                    disabled={statusPendingConversationId === selectedConversation.id}
                  >
                    <option value="BotHandling">IA atendendo</option>
                    <option value="WaitingHuman">Aguardando humano</option>
                    <option value="HumanHandling">Em atendimento</option>
                    <option value="Closed">Encerrada</option>
                  </select>
                </label>
                <div className="rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-3 text-sm leading-6 text-slate-600 md:col-span-2 xl:col-span-1">
                  Use o controle acima apenas quando precisar ajustar manualmente o fluxo. No dia a dia, prefira os botoes do topo da conversa: eles deixam claro quem deve agir a seguir.
                  {(assignmentPendingConversationId === selectedConversation.id || statusPendingConversationId === selectedConversation.id) && (
                    <div className="mt-2 text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Sincronizando alteracoes...</div>
                  )}
                </div>
              </div>
            ) : (
              <EmptyStatePanel>Selecione uma conversa para definir responsavel e acompanhar a situacao operacional.</EmptyStatePanel>
            )}
          </WorkspaceSection>

          <WorkspaceSection eyebrow="Contato" title={hasSelectedContact ? "Atualizar contato da conversa" : "Criar contato a partir da conversa"}>
            {selectedConversation ? (
              <div className="grid gap-4">
                {renderPanelToggle(
                  hasSelectedContact ? "Contato do CRM vinculado" : "Criar contato a partir desta conversa",
                  hasSelectedContact ? "Edite os dados comerciais sem sair do atendimento." : "Capture os dados principais do lead enquanto atende.",
                  contactPanelOpen,
                  () => setContactPanelOpen((current) => !current)
                )}
                {contactPanelOpen && (
                  <div className="grid gap-4">
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-1">
                      <label className={labelClass} htmlFor="contact-panel-name">
                        Nome
                        <input
                          id="contact-panel-name"
                          className={inputClass}
                          value={contactPanelDraft.name}
                          onChange={(event) => setContactPanelDraft((prev) => ({ ...prev, name: event.target.value }))}
                          disabled={contactSaving}
                        />
                      </label>
                      <label className={labelClass} htmlFor="contact-panel-phone">
                        WhatsApp
                        <input
                          id="contact-panel-phone"
                          className={inputClass}
                          value={contactPanelDraft.phone}
                          onChange={(event) => setContactPanelDraft((prev) => ({ ...prev, phone: event.target.value }))}
                          disabled={contactSaving}
                        />
                      </label>
                      <label className={labelClass} htmlFor="contact-panel-state">
                        UF
                        <select
                          id="contact-panel-state"
                          className={inputClass}
                          value={contactPanelDraft.state}
                          onChange={(event) => setContactPanelDraft((prev) => ({ ...prev, state: event.target.value }))}
                          disabled={contactSaving}
                        >
                          <option value="">Selecionar</option>
                          {stateOptions.map((state) => <option key={state} value={state}>{state}</option>)}
                        </select>
                      </label>
                      <label className={labelClass} htmlFor="contact-panel-status">
                        Status CRM
                        <select
                          id="contact-panel-status"
                          className={inputClass}
                          value={contactPanelDraft.status}
                          onChange={(event) => setContactPanelDraft((prev) => ({ ...prev, status: event.target.value }))}
                          disabled={contactSaving}
                        >
                          <option value="">Selecionar</option>
                          {contactStatusOptions.map((status) => <option key={status} value={status}>{status}</option>)}
                        </select>
                      </label>
                      <label className={`${labelClass} md:col-span-2 xl:col-span-1`} htmlFor="contact-panel-owner">
                        Responsavel comercial
                        <select
                          id="contact-panel-owner"
                          className={inputClass}
                          value={contactPanelDraft.ownerUserId}
                          onChange={(event) => setContactPanelDraft((prev) => ({ ...prev, ownerUserId: event.target.value }))}
                          disabled={contactSaving}
                        >
                          <option value="">Sem responsavel</option>
                          {managedUsers.map((user) => <option key={user.id} value={user.id}>{user.name}</option>)}
                        </select>
                      </label>
                      <label className={`${labelClass} md:col-span-2 xl:col-span-1`} htmlFor="contact-panel-tags">
                        Tags
                        <input
                          id="contact-panel-tags"
                          className={inputClass}
                          value={contactPanelDraft.tags}
                          onChange={(event) => setContactPanelDraft((prev) => ({ ...prev, tags: event.target.value }))}
                          disabled={contactSaving}
                        />
                      </label>
                    </div>
                    <div className="flex justify-end">
                      <button type="button" className={primaryButtonClass} onClick={() => void saveContactPanelDraft()} disabled={contactSaving}>
                        {contactSaving ? "Salvando..." : hasSelectedContact ? "Atualizar contato" : "Salvar contato"}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <EmptyStatePanel>Sem conversa selecionada. O painel lateral do contato aparece assim que voce abrir um atendimento.</EmptyStatePanel>
            )}
          </WorkspaceSection>

          <WorkspaceSection eyebrow="Notas" title="Notas internas">
            {selectedConversation ? (
              <div className="grid gap-4">
                {renderPanelToggle(
                  "Notas internas da conversa",
                  "Use notas para contexto entre operadores, handoff e proximo passo comercial.",
                  notesPanelOpen,
                  () => setNotesPanelOpen((current) => !current)
                )}
                {notesPanelOpen && (
                  <div className="grid gap-4">
                    {notesLoading && (
                      <div className="rounded-2xl border border-blue-100 bg-blue-50 px-4 py-3 text-xs font-medium text-blue-800">
                        Atualizando notas desta conversa...
                      </div>
                    )}
                    <label className={labelClass} htmlFor="conversation-note">
                      Nova nota
                      <textarea
                        id="conversation-note"
                        className={`${textareaClass} min-h-[130px]`}
                        value={noteDraft}
                        onChange={(event) => setNoteDraft(event.target.value)}
                        disabled={noteSubmitting}
                      />
                    </label>
                    <div className="flex justify-end">
                      <button type="button" className={primaryButtonClass} onClick={() => void addConversationNote()} disabled={noteSubmitting || !noteDraft.trim()}>
                        {noteSubmitting ? "Salvando..." : "Salvar nota"}
                      </button>
                    </div>
                    <div className="max-h-[260px] space-y-3 overflow-y-auto pr-1">
                      {notes.map((note) => (
                        <article key={note.id} className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
                          <div className="flex items-center justify-between gap-3">
                            <strong className="text-sm text-slate-900">{note.userName}</strong>
                            <span className="text-[11px] text-slate-400">{formatDate(note.createdAt)}</span>
                          </div>
                          <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-600">{note.note}</p>
                        </article>
                      ))}
                      {notes.length === 0 && <EmptyStatePanel>Nenhuma nota interna registrada ainda.</EmptyStatePanel>}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <EmptyStatePanel>As notas acompanham a conversa selecionada e ajudam na transferencia entre atendentes.</EmptyStatePanel>
            )}
          </WorkspaceSection>

          <WorkspaceSection eyebrow="Qualidade" title="Avaliacao do atendimento">
            {selectedConversation ? (
              <div className="grid gap-4">
                {renderPanelToggle(
                  "Qualidade e fechamento",
                  "Registre avaliacao quando a conversa terminar ou o caso passar para outro time.",
                  qualityPanelOpen,
                  () => setQualityPanelOpen((current) => !current)
                )}
                {qualityPanelOpen && (
                  <div className="grid gap-4">
                    <label className={labelClass} htmlFor="feedback-rating">
                      Nota do cliente
                      <select
                        id="feedback-rating"
                        className={inputClass}
                        value={String(feedbackDraft.rating)}
                        onChange={(event) => setFeedbackDraft((prev) => ({ ...prev, rating: Number(event.target.value) || 5 }))}
                      >
                        {[5, 4, 3, 2, 1].map((rating) => <option key={rating} value={rating}>{rating} estrela{rating > 1 ? "s" : ""}</option>)}
                      </select>
                    </label>
                    <label className={labelClass} htmlFor="feedback-comment">
                      Comentario
                      <textarea
                        id="feedback-comment"
                        className={`${textareaClass} min-h-[130px]`}
                        value={feedbackDraft.comment}
                        onChange={(event) => setFeedbackDraft((prev) => ({ ...prev, comment: event.target.value }))}
                      />
                    </label>
                    <div className="flex justify-end">
                      <button type="button" className={primaryButtonClass} onClick={() => void saveConversationFeedback()}>
                        Registrar avaliacao
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <EmptyStatePanel>Selecione uma conversa para registrar a avaliacao quando o atendimento for concluido.</EmptyStatePanel>
            )}
          </WorkspaceSection>

          <WorkspaceSection eyebrow="Produtividade" title="Respostas rapidas">
            <div className="grid gap-4">
              {renderPanelToggle(
                quickReplyDraft.id ? "Editar biblioteca de respostas" : "Biblioteca de respostas",
                "Deixe os atalhos prontos para acelerar o operador sem poluir a area principal da conversa.",
                quickRepliesPanelOpen,
                () => setQuickRepliesPanelOpen((current) => !current)
              )}
              {quickRepliesPanelOpen && (
                <div className="grid gap-4">
                  <div className="max-h-[280px] space-y-3 overflow-y-auto pr-1">
                    {quickReplies.map((template) => (
                      <article key={template.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <div className="space-y-1">
                            <strong className="text-sm text-slate-950">{template.title}</strong>
                            <p className="text-xs text-slate-400">Atualizada em {formatDate(template.updatedAt)}</p>
                          </div>
                          <div className="flex flex-wrap items-center gap-2">
                            <button type="button" className={secondaryButtonClass} onClick={() => applyQuickReply(template.body)}>
                              Usar
                            </button>
                            <button type="button" className={secondaryButtonClass} onClick={() => editQuickReply(template)}>
                              Editar
                            </button>
                            <button type="button" className={secondaryButtonClass} onClick={() => void deleteQuickReply(template.id)} disabled={quickReplySaving}>
                              Excluir
                            </button>
                          </div>
                        </div>
                        <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-slate-600">{template.body}</p>
                      </article>
                    ))}
                    {quickReplies.length === 0 && <EmptyStatePanel>Cadastre a primeira resposta rapida para dar mais velocidade ao time.</EmptyStatePanel>}
                  </div>

                  <div className="grid gap-4 rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
                    <label className={labelClass} htmlFor="quick-reply-title">
                      Titulo
                      <input
                        id="quick-reply-title"
                        className={inputClass}
                        value={quickReplyDraft.title}
                        onChange={(event) => setQuickReplyDraft((prev) => ({ ...prev, title: event.target.value }))}
                        disabled={quickReplySaving}
                      />
                    </label>
                    <label className={labelClass} htmlFor="quick-reply-body">
                      Mensagem
                      <textarea
                        id="quick-reply-body"
                        className={`${textareaClass} min-h-[180px]`}
                        value={quickReplyDraft.body}
                        onChange={(event) => setQuickReplyDraft((prev) => ({ ...prev, body: event.target.value }))}
                        disabled={quickReplySaving}
                      />
                    </label>
                    <div className="flex flex-wrap items-center justify-end gap-3">
                      {quickReplyDraft.id && (
                        <button
                          type="button"
                          className={secondaryButtonClass}
                          onClick={() => setQuickReplyDraft({ id: "", title: "", body: "" })}
                          disabled={quickReplySaving}
                        >
                          Cancelar edicao
                        </button>
                      )}
                      <button type="button" className={primaryButtonClass} onClick={() => void saveQuickReply()} disabled={quickReplySaving}>
                        {quickReplySaving ? "Salvando..." : quickReplyDraft.id ? "Salvar resposta" : "Criar resposta"}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </WorkspaceSection>
        </div>
      </section>

      <OutboundComposerModal
        open={showOutboundComposer}
        outboundDraft={outboundDraft}
        setOutboundDraft={setOutboundDraft}
        outboundSubmitting={outboundSubmitting}
        activeChannels={activeChannels}
        onClose={() => setShowOutboundComposer(false)}
        onConfirm={() => void handleStartOutbound()}
      />
    </section>
  );
}








