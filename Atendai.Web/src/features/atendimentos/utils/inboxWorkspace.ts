import { normalizeConversationStatus } from "@shared/utils/conversation";
import type { Conversation, QueueFilter } from "@shared/types";

export const queueFilters: Array<{ value: QueueFilter; label: string }> = [
  { value: "ALL", label: "Todas" },
  { value: "WAITING_HUMAN", label: "Fila humana" },
  { value: "BOT", label: "IA" },
  { value: "HUMAN", label: "Humano" },
  { value: "META", label: "Meta" },
  { value: "QR", label: "QR" }
];

export const queueRowHeight = 228;
export const queueOverscan = 4;
export const queueVirtualizationThreshold = 10;

export function statusLabel(status: string | number) {
  switch (normalizeConversationStatus(status)) {
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

export function statusTone(status: string | number) {
  switch (normalizeConversationStatus(status)) {
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

export function normalizeTransport(transport: string | null) {
  const value = transport?.trim().toLowerCase();
  if (value === "qr") return "qr";
  if (value === "meta") return "meta";
  return null;
}

export function transportLabel(transport: string | null) {
  switch (normalizeTransport(transport)) {
    case "qr":
      return "WhatsApp QR";
    case "meta":
      return "WhatsApp Meta";
    default:
      return null;
  }
}

export function transportTone(transport: string | null) {
  switch (normalizeTransport(transport)) {
    case "qr":
      return "amber" as const;
    case "meta":
      return "emerald" as const;
    default:
      return "slate" as const;
  }
}

export function qrSessionLabel(conversation: Conversation) {
  if (normalizeTransport(conversation.transport) !== "qr") {
    return null;
  }

  if (conversation.qrSessionName?.trim()) {
    return conversation.qrSessionPhone?.trim()
      ? `${conversation.qrSessionName} - ${conversation.qrSessionPhone}`
      : conversation.qrSessionName;
  }

  if (conversation.qrSessionPhone?.trim()) {
    return conversation.qrSessionPhone;
  }

  return conversation.qrSessionKey?.trim() || null;
}

export function sourceScopeKey(conversation: Conversation) {
  const transport = normalizeTransport(conversation.transport);
  if (transport === "meta") {
    return conversation.channelId?.trim()
      ? `meta:${conversation.channelId}`
      : `meta:${conversation.channelName?.trim() || "principal"}`;
  }

  if (transport === "qr") {
    return conversation.qrSessionKey?.trim()
      ? `qr:${conversation.qrSessionKey}`
      : `qr:${conversation.qrSessionPhone?.trim() || conversation.qrSessionName?.trim() || "default"}`;
  }

  return "unknown";
}

export function sourceScopeLabel(conversation: Conversation) {
  const transport = normalizeTransport(conversation.transport);
  if (transport === "meta") {
    return conversation.channelName?.trim() || "WhatsApp Meta principal";
  }

  if (transport === "qr") {
    return qrSessionLabel(conversation) || "WhatsApp QR";
  }

  return "Origem nao identificada";
}

export function senderLabel(sender: string) {
  const value = sender.toLowerCase();
  if (value.includes("customer")) return "Cliente";
  if (value.includes("human")) return "Operador";
  if (value.includes("system")) return "Sistema";
  return "IA";
}

export function bubbleClasses(sender: string) {
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

export function lastMessagePreview(conversation: Conversation) {
  const message = conversation.messages[conversation.messages.length - 1]?.text?.trim();
  if (!message) return "Abra a conversa para ver o historico recente e continuar o atendimento.";
  return message.length > 88 ? `${message.slice(0, 85)}...` : message;
}

export function operationSummary(status: string | number) {
  switch (normalizeConversationStatus(status)) {
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

export function transitionActionSummary(status: string | number) {
  switch (normalizeConversationStatus(status)) {
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

export function queueSectionMeta(filter: QueueFilter) {
  switch (filter) {
    case "WAITING_HUMAN":
      return { title: "Fila humana", description: "Clientes aguardando um operador assumir." };
    case "BOT":
      return { title: "IA atendendo", description: "Conversas em automacao ativa." };
    case "HUMAN":
      return { title: "Em atendimento humano", description: "Conversas ja assumidas por um operador." };
    case "META":
      return { title: "WhatsApp Meta", description: "Conversas dos numeros oficiais conectados pela Cloud API." };
    case "QR":
      return { title: "WhatsApp QR", description: "Conversas vindas de sessoes operadas pelo WhatsApp Web experimental." };
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

export function formatDuration(minutes: number) {
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

export function formatElapsed(minutes: number | null) {
  if (minutes === null || minutes <= 0) return "agora";
  return `ha ${formatDuration(minutes)}`;
}

function queuePriorityRank(
  status: ReturnType<typeof normalizeConversationStatus>,
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

export function conversationAttentionSnapshot(conversation: Conversation, nowMs: number) {
  const status = normalizeConversationStatus(conversation.status);
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
