import { useEffect, useMemo, useRef, useState, type Dispatch, type SetStateAction } from "react";
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

type QueueFilter = "ALL" | "WAITING_HUMAN" | "BOT" | "HUMAN";

type ConversationMessage = {
  id: string;
  sender: string;
  text: string;
  createdAt: string;
};

type Conversation = {
  id: string;
  customerPhone: string;
  customerName: string;
  status: string | number;
  transport: string | null;
  channelId: string | null;
  channelName: string | null;
  assignedUserId: string | null;
  assignedUserName: string | null;
  lastCustomerMessageAt: string | null;
  lastHumanMessageAt: string | null;
  closedAt: string | null;
  updatedAt: string;
  messages: ConversationMessage[];
};

type WhatsAppChannel = {
  id: string;
  displayName: string;
  isActive: boolean;
  isPrimary: boolean;
  lastStatus: string | null;
  lastError: string | null;
};

type ContactPanelDraft = {
  id: string;
  name: string;
  phone: string;
  state: string;
  status: string;
  tags: string;
  ownerUserId: string;
};

type FeedbackDraft = {
  rating: number;
  comment: string;
};

type ConversationNote = {
  id: string;
  conversationId: string;
  userId: string;
  userName: string;
  note: string;
  createdAt: string;
};

type QuickReplyTemplate = {
  id: string;
  tenantId: string;
  title: string;
  body: string;
  createdAt: string;
  updatedAt: string;
};

type QuickReplyDraft = {
  id: string;
  title: string;
  body: string;
};

type ManagedUser = {
  id: string;
  tenantId: string;
  tenantName: string;
  name: string;
  email: string;
  role: string;
  createdAt: string;
};

type OutboundDraft = {
  customerName: string;
  customerPhone: string;
  channelId: string;
  message: string;
};

type AttendanceRealtimeState = "connecting" | "connected" | "reconnecting" | "fallback" | "disconnected";

type InboxWorkspaceProps = {
  queue: Conversation[];
  conversations: Conversation[];
  selectedConversation: Conversation | null;
  selectedConversationId: string;
  onSelectConversation: Dispatch<SetStateAction<string>>;
  search: string;
  setSearch: Dispatch<SetStateAction<string>>;
  queueFilter: QueueFilter;
  setQueueFilter: Dispatch<SetStateAction<QueueFilter>>;
  reply: string;
  setReply: Dispatch<SetStateAction<string>>;
  outboundDraft: OutboundDraft;
  setOutboundDraft: Dispatch<SetStateAction<OutboundDraft>>;
  outboundSubmitting: boolean;
  queueLoading: boolean;
  queueRefreshing: boolean;
  conversationLoading: boolean;
  notesLoading: boolean;
  replySubmitting: boolean;
  noteSubmitting: boolean;
  contactSaving: boolean;
  quickReplySaving: boolean;
  statusPendingConversationId: string | null;
  assignmentPendingConversationId: string | null;
  whatsAppChannels: WhatsAppChannel[];
  startOutboundConversation: () => Promise<boolean>;
  sendHumanReply: () => Promise<void>;
  refreshInbox: (token?: string) => Promise<void>;
  feedbackDraft: FeedbackDraft;
  setFeedbackDraft: Dispatch<SetStateAction<FeedbackDraft>>;
  saveConversationFeedback: () => Promise<void>;
  contactPanelDraft: ContactPanelDraft;
  setContactPanelDraft: Dispatch<SetStateAction<ContactPanelDraft>>;
  saveContactPanelDraft: () => Promise<void>;
  hasSelectedContact: boolean;
  stateOptions: string[];
  contactStatusOptions: string[];
  managedUsers: ManagedUser[];
  canAssignConversations: boolean;
  assignConversation: (assignedUserId: string) => Promise<void>;
  updateConversationStatus: (nextStatus: "BotHandling" | "WaitingHuman" | "HumanHandling" | "Closed", conversationId?: string) => Promise<void>;
  attendanceRealtimeState: AttendanceRealtimeState;
  attendanceRealtimeLastPublishedAt: string | null;
  attendanceRealtimeLastReceivedAt: string | null;
  notes: ConversationNote[];
  noteDraft: string;
  setNoteDraft: Dispatch<SetStateAction<string>>;
  addConversationNote: () => Promise<void>;
  quickReplies: QuickReplyTemplate[];
  quickReplyDraft: QuickReplyDraft;
  setQuickReplyDraft: Dispatch<SetStateAction<QuickReplyDraft>>;
  saveQuickReply: () => Promise<void>;
  editQuickReply: (template: QuickReplyTemplate) => void;
  deleteQuickReply: (templateId: string) => Promise<void>;
  applyQuickReply: (body: string) => void;
  formatDate: (value: string) => string;
};

const queueFilters: Array<{ value: QueueFilter; label: string }> = [
  { value: "ALL", label: "Todas" },
  { value: "WAITING_HUMAN", label: "Fila humana" },
  { value: "BOT", label: "IA" },
  { value: "HUMAN", label: "Humano" }
];

const queueRowHeight = 228;
const queueOverscan = 4;
const queueVirtualizationThreshold = 10;

function normalizeStatus(status: string | number) {
  const value = String(status).toLowerCase();
  if (value.includes("waiting")) return "WaitingHuman";
  if (value.includes("human")) return "HumanHandling";
  if (value.includes("closed")) return "Closed";
  return "BotHandling";
}

function statusLabel(status: string | number) {
  switch (normalizeStatus(status)) {
    case "WaitingHuman":
      return "Fila humana";
    case "HumanHandling":
      return "Humano";
    case "Closed":
      return "Encerrada";
    default:
      return "IA";
  }
}

function statusTone(status: string | number) {
  switch (normalizeStatus(status)) {
    case "WaitingHuman":
      return "amber" as const;
    case "HumanHandling":
      return "blue" as const;
    case "Closed":
      return "slate" as const;
    default:
      return "emerald" as const;
  }
}

function normalizeTransport(transport: string | null) {
  const value = transport?.trim().toLowerCase();
  if (value === "qr") return "qr";
  if (value === "meta") return "meta";
  return null;
}

function transportLabel(transport: string | null) {
  switch (normalizeTransport(transport)) {
    case "qr":
      return "WhatsApp QR";
    case "meta":
      return "WhatsApp Meta";
    default:
      return null;
  }
}

function transportTone(transport: string | null) {
  switch (normalizeTransport(transport)) {
    case "qr":
      return "amber" as const;
    case "meta":
      return "emerald" as const;
    default:
      return "slate" as const;
  }
}

function senderLabel(sender: string) {
  const value = sender.toLowerCase();
  if (value.includes("customer")) return "Cliente";
  if (value.includes("human")) return "Operador";
  if (value.includes("system")) return "Sistema";
  return "IA";
}

function bubbleClasses(sender: string) {
  const value = sender.toLowerCase();
  if (value.includes("customer")) {
    return "mr-auto border border-slate-200 bg-white text-slate-900";
  }

  if (value.includes("human")) {
    return "ml-auto border border-blue-200 bg-blue-50 text-blue-950";
  }

  if (value.includes("system")) {
    return "mx-auto border border-amber-200 bg-amber-50 text-amber-900";
  }

  return "ml-auto border border-emerald-200 bg-emerald-50 text-emerald-950";
}

function lastMessagePreview(conversation: Conversation) {
  const message = conversation.messages[conversation.messages.length - 1]?.text?.trim();
  if (!message) return "Abra a conversa para ver o historico recente e continuar o atendimento.";
  return message.length > 88 ? `${message.slice(0, 85)}...` : message;
}

function operationSummary(status: string | number) {
  switch (normalizeStatus(status)) {
    case "WaitingHuman":
      return {
        title: "Fila humana",
        description: "A IA parou de responder. Um operador precisa assumir ou devolver para IA.",
        nextAction: "Assumir atendimento humano"
      };
    case "HumanHandling":
      return {
        title: "Humano",
        description: "O operador esta conduzindo a conversa. Novas mensagens do cliente entram no CRM sem resposta automatica.",
        nextAction: "Responder ou devolver para IA"
      };
    case "Closed":
      return {
        title: "Encerrada",
        description: "Historico finalizado. Reabra manualmente devolvendo para IA ou humano se precisar retomar.",
        nextAction: "Reabrir se necessario"
      };
    default:
      return {
        title: "IA",
        description: "A automacao responde normalmente. Se um operador assumir, a IA deixa de responder nas proximas mensagens.",
        nextAction: "Monitorar ou transferir para humano"
      };
  }
}

function transitionActionSummary(status: string | number) {
  switch (normalizeStatus(status)) {
    case "WaitingHuman":
      return [
        { status: "HumanHandling" as const, title: "Assumir", caption: "Operador passa a conduzir" },
        { status: "BotHandling" as const, title: "Retomar IA", caption: "Automacao volta a responder" }
      ];
    case "HumanHandling":
      return [
        { status: "WaitingHuman" as const, title: "Fila humana", caption: "Pausa sem devolver para IA" },
        { status: "BotHandling" as const, title: "Retomar IA", caption: "Automacao assume de novo" }
      ];
    case "Closed":
      return [
        { status: "HumanHandling" as const, title: "Reabrir humano", caption: "Operador retoma o caso" },
        { status: "BotHandling" as const, title: "Reabrir IA", caption: "Automacao volta a operar" }
      ];
    default:
      return [
        { status: "WaitingHuman" as const, title: "Fila humana", caption: "Escala para espera de operador" },
        { status: "HumanHandling" as const, title: "Assumir", caption: "Operador entra na conversa" }
      ];
  }
}

function queueSectionMeta(filter: QueueFilter) {
  switch (filter) {
    case "WAITING_HUMAN":
      return { title: "Fila humana", description: "Clientes aguardando um operador assumir." };
    case "BOT":
      return { title: "IA atendendo", description: "Conversas em automacao ativa." };
    case "HUMAN":
      return { title: "Em atendimento humano", description: "Conversas ja assumidas por um operador." };
    default:
      return { title: "Visao operacional", description: "Organize a operacao entre IA, fila humana e atendimento humano." };
  }
}

function timestampToMs(value: string | null) {
  if (!value) return null;

  const timestamp = new Date(value).getTime();
  return Number.isNaN(timestamp) ? null : timestamp;
}

function elapsedMinutes(nowMs: number, value: string | null) {
  const timestamp = timestampToMs(value);
  if (timestamp === null) return null;
  return Math.max(0, Math.floor((nowMs - timestamp) / 60000));
}

function formatDuration(minutes: number) {
  if (minutes <= 0) return "agora";
  if (minutes < 60) return `${minutes} min`;

  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  if (hours < 24) {
    return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}min` : `${hours}h`;
  }

  const days = Math.floor(hours / 24);
  const remainingHours = hours % 24;
  return remainingHours > 0 ? `${days}d ${remainingHours}h` : `${days}d`;
}

function formatElapsed(minutes: number | null) {
  if (minutes === null || minutes <= 0) return "agora";
  return `ha ${formatDuration(minutes)}`;
}

function queuePriorityRank(
  status: ReturnType<typeof normalizeStatus>,
  needsOperatorAttention: boolean,
  isOverdue: boolean
) {
  if (needsOperatorAttention && isOverdue) return 0;
  if (needsOperatorAttention) return 1;
  if (status === "WaitingHuman") return 2;
  if (status === "HumanHandling") return 3;
  if (status === "BotHandling") return 4;
  return 5;
}

function conversationAttentionSnapshot(conversation: Conversation, nowMs: number) {
  const status = normalizeStatus(conversation.status);
  const customerMinutes = elapsedMinutes(nowMs, conversation.lastCustomerMessageAt);
  const humanMinutes = elapsedMinutes(nowMs, conversation.lastHumanMessageAt);
  const updatedMinutes = elapsedMinutes(nowMs, conversation.updatedAt) ?? 0;
  const customerTimestamp = timestampToMs(conversation.lastCustomerMessageAt);
  const humanTimestamp = timestampToMs(conversation.lastHumanMessageAt);
  const latestCustomerNeedsOperator =
    status !== "Closed" &&
    status !== "BotHandling" &&
    customerTimestamp !== null &&
    (humanTimestamp === null || customerTimestamp > humanTimestamp);
  const waitingMinutes = latestCustomerNeedsOperator ? customerMinutes ?? updatedMinutes : updatedMinutes;
  const isOverdue = latestCustomerNeedsOperator && waitingMinutes >= 5;
  const priority = queuePriorityRank(status, latestCustomerNeedsOperator, isOverdue);

  if (latestCustomerNeedsOperator) {
    const tone: "rose" | "amber" | "blue" = waitingMinutes >= 15 ? "rose" : waitingMinutes >= 5 ? "amber" : "blue";

    return {
      detail: status === "WaitingHuman" ? "Cliente aguardando um operador assumir." : "Cliente aguardando continuidade do atendimento humano.",
      isOverdue,
      needsOperatorAttention: true,
      priority,
      tone,
      waitingMinutes,
      label: `Cliente aguardando ${formatElapsed(waitingMinutes)}`
    };
  }

  if (status === "WaitingHuman") {
    return {
      detail: "Conversa pausada na fila humana, pronta para ser assumida.",
      isOverdue: false,
      needsOperatorAttention: false,
      priority,
      tone: "amber" as const,
      waitingMinutes,
      label: `Na fila humana ${formatElapsed(customerMinutes ?? updatedMinutes)}`
    };
  }

  if (status === "HumanHandling") {
    return {
      detail: "Atendimento manual em andamento pelo time.",
      isOverdue: false,
      needsOperatorAttention: false,
      priority,
      tone: "blue" as const,
      waitingMinutes,
      label: `Operador atuou ${formatElapsed(humanMinutes ?? updatedMinutes)}`
    };
  }

  if (status === "BotHandling") {
    return {
      detail: "Automacao ativa acompanhando a conversa.",
      isOverdue: false,
      needsOperatorAttention: false,
      priority,
      tone: "emerald" as const,
      waitingMinutes,
      label: `IA atualizou ${formatElapsed(updatedMinutes)}`
    };
  }

  return {
    detail: "Fluxo encerrado.",
    isOverdue: false,
    needsOperatorAttention: false,
    priority,
    tone: "slate" as const,
    waitingMinutes,
    label: `Encerrada ${formatElapsed(updatedMinutes)}`
  };
}

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

  const botCount = conversations.filter((conversation) => normalizeStatus(conversation.status) === "BotHandling").length;
  const waitingCount = conversations.filter((conversation) => normalizeStatus(conversation.status) === "WaitingHuman").length;
  const humanCount = conversations.filter((conversation) => normalizeStatus(conversation.status) === "HumanHandling").length;
  const closedCount = conversations.filter((conversation) => normalizeStatus(conversation.status) === "Closed").length;
  const activeChannels = useMemo(() => whatsAppChannels.filter((channel) => channel.isActive), [whatsAppChannels]);
  const selectedTransportBadge = selectedConversation ? transportLabel(selectedConversation.transport) : null;
  const selectedOperation = selectedConversation ? operationSummary(selectedConversation.status) : null;
  const selectedNormalizedStatus = selectedConversation ? normalizeStatus(selectedConversation.status) : null;
  const selectedTransitions = selectedConversation ? transitionActionSummary(selectedConversation.status) : [];
  const queueSection = queueSectionMeta(queueFilter);
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
  const modeActionButtonClass = "inline-flex min-h-[72px] items-center justify-center rounded-2xl border px-4 py-3 text-center text-sm font-medium leading-tight transition focus:outline-none focus-visible:ring-4";
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

  function renderConversationCard(conversation: Conversation) {
    const isActive = selectedConversationId === conversation.id;
    const transportBadge = transportLabel(conversation.transport);
    const summary = operationSummary(conversation.status);
    const statusKey = normalizeStatus(conversation.status);
    const isBusy = statusPendingConversationId === conversation.id || assignmentPendingConversationId === conversation.id;
    const attention = conversationAttentionSnapshot(conversation, timelineNow);
    const stripeClass =
      attention.isOverdue ? "bg-rose-500"
        : statusKey === "WaitingHuman" ? "bg-amber-500"
        : statusKey === "HumanHandling" ? "bg-sky-500"
          : statusKey === "BotHandling" ? "bg-emerald-500"
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
            <MetricTile label="Humano ativo" value={String(humanCount)} detail="Conversas assumidas por operador" tone="blue" />
            <MetricTile label="Encerradas" value={String(closedCount)} detail="Historico finalizado" tone="slate" />
          </div>
        </div>
      </section>

      <WorkspaceSection
        eyebrow="Fila"
        title="Caixa de entrada"
      >
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
              <button type="button" className={`${secondaryButtonClass} w-full`} onClick={() => setShowOutboundComposer(true)}>
                Nova conversa
              </button>
              <button type="button" className={`${secondaryButtonClass} w-full`} onClick={() => void refreshInbox()}>
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
              onScroll={(event) => setQueueScrollTop(event.currentTarget.scrollTop)}
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

      <section className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_370px] 2xl:grid-cols-[minmax(0,1.08fr)_390px]">
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
                    Fluxo operacional: `IA` automatiza, `Fila humana` espera operador e `Humano` indica condução manual ativa. A tela sempre mostra apenas um modo atual por vez.
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

        <div className="flex flex-col gap-6">
          <WorkspaceSection
            eyebrow="Operacao"
            title="Gestao operacional"
          >
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
                    value={normalizeStatus(selectedConversation.status)}
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

          <WorkspaceSection
            eyebrow="Contato"
            title={hasSelectedContact ? "Atualizar contato da conversa" : "Criar contato a partir da conversa"}
          >
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

          <WorkspaceSection
            eyebrow="Notas"
            title="Notas internas"
          >
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

          <WorkspaceSection
            eyebrow="Qualidade"
            title="Avaliacao do atendimento"
          >
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

          <WorkspaceSection
            eyebrow="Produtividade"
            title="Respostas rapidas"
          >
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

      {showOutboundComposer && (
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
                <button type="button" className={secondaryButtonClass} onClick={() => setShowOutboundComposer(false)} disabled={outboundSubmitting}>
                  Cancelar
                </button>
                <button type="button" className={primaryButtonClass} onClick={() => void handleStartOutbound()} disabled={outboundSubmitting}>
                  {outboundSubmitting ? "Iniciando..." : "Iniciar conversa"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
