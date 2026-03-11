import { useMemo, useState, type Dispatch, type SetStateAction } from "react";
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
  subtlePanelClass,
  textareaClass,
  workspacePageClass
} from "../../../shared/ui/WorkspaceUi";

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
  updateConversationStatus: (nextStatus: "BotHandling" | "WaitingHuman" | "HumanHandling" | "Closed") => Promise<void>;
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
  { value: "WAITING_HUMAN", label: "Aguardando" },
  { value: "BOT", label: "IA" },
  { value: "HUMAN", label: "Humano" }
];

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
      return "Aguardando humano";
    case "HumanHandling":
      return "Em atendimento";
    case "Closed":
      return "Encerrada";
    default:
      return "IA atendendo";
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
  if (!message) return "Sem mensagens ainda.";
  return message.length > 88 ? `${message.slice(0, 85)}...` : message;
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

  const waitingCount = conversations.filter((conversation) => normalizeStatus(conversation.status) === "WaitingHuman").length;
  const humanCount = conversations.filter((conversation) => normalizeStatus(conversation.status) === "HumanHandling").length;
  const closedCount = conversations.filter((conversation) => normalizeStatus(conversation.status) === "Closed").length;
  const activeChannels = useMemo(() => whatsAppChannels.filter((channel) => channel.isActive), [whatsAppChannels]);

  async function handleStartOutbound() {
    const started = await startOutboundConversation();
    if (started) {
      setShowOutboundComposer(false);
    }
  }

  return (
    <section className={workspacePageClass}>
      <section className={heroPanelClass}>
        <div className="grid gap-5 xl:grid-cols-[minmax(0,1.45fr)_minmax(340px,0.95fr)]">
          <div className="space-y-3">
            <span className="inline-flex rounded-full bg-blue-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-blue-700">Atendimento</span>
            <div className="space-y-2">
              <h2 className="text-2xl font-semibold tracking-tight text-slate-950 sm:text-[2rem]">Inbox interno para operar WhatsApp dentro do CRM</h2>
              <p className="max-w-3xl text-sm leading-6 text-slate-600 sm:text-[15px]">Toda a operacao fica concentrada aqui: fila, conversa, atribuicao, respostas rapidas, notas internas e inicio de conversas outbound quando o canal Meta estiver pronto.</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <MetricTile label="Fila visivel" value={String(queue.length)} detail="Conversas filtradas na lista lateral" tone="blue" />
            <MetricTile label="Aguardando" value={String(waitingCount)} detail="Clientes pendentes de humano" tone="amber" />
            <MetricTile label="Em atendimento" value={String(humanCount)} detail="Conversas com operador ativo" tone="emerald" />
            <MetricTile label="Encerradas" value={String(closedCount)} detail="Historico finalizado" tone="slate" />
          </div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[320px_minmax(0,1fr)_360px]">
        <WorkspaceSection
          eyebrow="Fila"
          title="Conversas ativas"
          description="Busque, filtre e abra cada conversa sem sair da operacao principal."
          actions={
            <>
              <button type="button" className={secondaryButtonClass} onClick={() => setShowOutboundComposer(true)}>
                Nova conversa
              </button>
              <button type="button" className={secondaryButtonClass} onClick={() => void refreshInbox()}>
                Atualizar fila
              </button>
            </>
          }
        >
          <div className="grid gap-4">
            <div className="grid gap-3">
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
              <div className="grid grid-cols-2 gap-2">
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
            </div>

            <div className="max-h-[720px] space-y-3 overflow-y-auto pr-1">
              {queue.map((conversation) => {
                const isActive = selectedConversationId === conversation.id;
                return (
                  <button
                    key={conversation.id}
                    type="button"
                    onClick={() => onSelectConversation(conversation.id)}
                    className={`w-full rounded-2xl border p-4 text-left transition ${isActive ? "border-blue-300 bg-blue-50 shadow-sm shadow-blue-100" : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"}`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="truncate text-sm font-semibold text-slate-950">{conversation.customerName}</h3>
                          <StatusPill tone={statusTone(conversation.status)}>{statusLabel(conversation.status)}</StatusPill>
                        </div>
                        <p className="text-xs font-medium text-slate-500">{conversation.customerPhone}</p>
                      </div>
                      <span className="shrink-0 text-[11px] font-medium text-slate-400">{formatDate(conversation.updatedAt)}</span>
                    </div>
                    <p className="mt-3 line-clamp-2 text-sm leading-6 text-slate-600">{lastMessagePreview(conversation)}</p>
                    <div className="mt-3 flex flex-wrap items-center gap-2 text-[11px] font-medium text-slate-500">
                      {conversation.channelName && <StatusPill tone="slate">{conversation.channelName}</StatusPill>}
                      {conversation.assignedUserName && <StatusPill tone="blue">{conversation.assignedUserName}</StatusPill>}
                    </div>
                  </button>
                );
              })}
              {queue.length === 0 && <EmptyStatePanel>Nenhuma conversa encontrada para o filtro atual.</EmptyStatePanel>}
            </div>
          </div>
        </WorkspaceSection>

        <WorkspaceSection
          eyebrow="Conversa"
          title={selectedConversation ? `${selectedConversation.customerName} · ${selectedConversation.customerPhone}` : "Selecione uma conversa"}
          description={selectedConversation ? "Visualize o historico completo, aplique respostas rapidas e responda como operador sem sair do CRM." : "Escolha um item da fila para abrir o historico e responder."}
        >
          {selectedConversation ? (
            <div className="grid gap-5">
              <div className={`${subtlePanelClass} flex flex-wrap items-center gap-2`}>
                <StatusPill tone={statusTone(selectedConversation.status)}>{statusLabel(selectedConversation.status)}</StatusPill>
                {selectedConversation.channelName && <StatusPill tone="slate">Canal: {selectedConversation.channelName}</StatusPill>}
                {selectedConversation.assignedUserName && <StatusPill tone="blue">Responsavel: {selectedConversation.assignedUserName}</StatusPill>}
                <span className="text-xs text-slate-500">Atualizada em {formatDate(selectedConversation.updatedAt)}</span>
              </div>

              <div className="flex max-h-[560px] flex-col gap-3 overflow-y-auto rounded-[26px] border border-slate-200 bg-slate-50/70 p-4">
                {selectedConversation.messages.map((message) => (
                  <article key={message.id} className={`max-w-[85%] rounded-2xl px-4 py-3 shadow-sm ${bubbleClasses(message.sender)}`}>
                    <div className="mb-1 flex items-center justify-between gap-3">
                      <span className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">{senderLabel(message.sender)}</span>
                      <span className="text-[11px] text-slate-400">{formatDate(message.createdAt)}</span>
                    </div>
                    <p className="whitespace-pre-wrap text-sm leading-6">{message.text}</p>
                  </article>
                ))}
              </div>

              <div className="grid gap-3">
                <div className="flex flex-wrap items-center gap-2">
                  {quickReplies.slice(0, 6).map((template) => (
                    <button
                      key={template.id}
                      type="button"
                      className={secondaryButtonClass}
                      onClick={() => applyQuickReply(template.body)}
                    >
                      {template.title}
                    </button>
                  ))}
                  {quickReplies.length === 0 && <span className="text-sm text-slate-500">Cadastre respostas rapidas para agilizar a operacao.</span>}
                </div>

                <label className={labelClass} htmlFor="reply-text">
                  Resposta do operador
                  <textarea
                    id="reply-text"
                    className={`${textareaClass} min-h-[150px]`}
                    value={reply}
                    onChange={(event) => setReply(event.target.value)}
                    placeholder="Digite a resposta humana que sera enviada ao cliente."
                  />
                </label>

                <div className="flex flex-wrap items-center justify-between gap-3">
                  <p className="text-sm text-slate-500">Use respostas rapidas como base e personalize antes de enviar.</p>
                  <div className="flex flex-wrap items-center gap-3">
                    <button type="button" className={secondaryButtonClass} onClick={() => setReply("")}>Limpar</button>
                    <button type="button" className={primaryButtonClass} onClick={() => void sendHumanReply()}>
                      Enviar resposta
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <EmptyStatePanel>A fila continua disponivel na coluna da esquerda. Assim que voce selecionar uma conversa, o historico, o composer e os atalhos operacionais aparecem aqui.</EmptyStatePanel>
          )}
        </WorkspaceSection>

        <div className="flex flex-col gap-6">
          <WorkspaceSection
            eyebrow="Operacao"
            title="Responsavel e status"
            description="Ajuste a conversa sem sobrepor campos: atribuicao e status agora ficam em um grid proprio, alinhado e legivel."
          >
            {selectedConversation ? (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-1">
                <label className={labelClass} htmlFor="conversation-assignee">
                  Responsavel
                  <select
                    id="conversation-assignee"
                    className={inputClass}
                    value={selectedConversation.assignedUserId ?? ""}
                    onChange={(event) => void assignConversation(event.target.value)}
                    disabled={!canAssignConversations}
                  >
                    <option value="">Fila sem responsavel</option>
                    {managedUsers.map((user) => <option key={user.id} value={user.id}>{user.name}</option>)}
                  </select>
                </label>
                <label className={labelClass} htmlFor="conversation-status">
                  Status da conversa
                  <select
                    id="conversation-status"
                    className={inputClass}
                    value={normalizeStatus(selectedConversation.status)}
                    onChange={(event) => void updateConversationStatus(event.target.value as "BotHandling" | "WaitingHuman" | "HumanHandling" | "Closed")}
                  >
                    <option value="BotHandling">IA atendendo</option>
                    <option value="WaitingHuman">Aguardando humano</option>
                    <option value="HumanHandling">Em atendimento</option>
                    <option value="Closed">Encerrada</option>
                  </select>
                </label>
              </div>
            ) : (
              <EmptyStatePanel>Selecione uma conversa para definir responsavel e acompanhar a situacao operacional.</EmptyStatePanel>
            )}
          </WorkspaceSection>

          <WorkspaceSection
            eyebrow="Contato"
            title={hasSelectedContact ? "Atualizar contato da conversa" : "Criar contato a partir da conversa"}
            description="Transforme rapidamente uma conversa em cadastro util para CRM, campanhas e distribuicao entre atendentes."
          >
            {selectedConversation ? (
              <div className="grid gap-4">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-1">
                  <label className={labelClass} htmlFor="contact-panel-name">
                    Nome
                    <input
                      id="contact-panel-name"
                      className={inputClass}
                      value={contactPanelDraft.name}
                      onChange={(event) => setContactPanelDraft((prev) => ({ ...prev, name: event.target.value }))}
                    />
                  </label>
                  <label className={labelClass} htmlFor="contact-panel-phone">
                    WhatsApp
                    <input
                      id="contact-panel-phone"
                      className={inputClass}
                      value={contactPanelDraft.phone}
                      onChange={(event) => setContactPanelDraft((prev) => ({ ...prev, phone: event.target.value }))}
                    />
                  </label>
                  <label className={labelClass} htmlFor="contact-panel-state">
                    UF
                    <select
                      id="contact-panel-state"
                      className={inputClass}
                      value={contactPanelDraft.state}
                      onChange={(event) => setContactPanelDraft((prev) => ({ ...prev, state: event.target.value }))}
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
                      placeholder="vip, retorno, pos-venda"
                    />
                  </label>
                </div>
                <div className="flex justify-end">
                  <button type="button" className={primaryButtonClass} onClick={() => void saveContactPanelDraft()}>
                    {hasSelectedContact ? "Atualizar contato" : "Salvar contato"}
                  </button>
                </div>
              </div>
            ) : (
              <EmptyStatePanel>Sem conversa selecionada. O painel lateral do contato aparece assim que voce abrir um atendimento.</EmptyStatePanel>
            )}
          </WorkspaceSection>

          <WorkspaceSection
            eyebrow="Notas"
            title="Notas internas"
            description="Registre contexto operacional sem expor nada para o cliente."
          >
            {selectedConversation ? (
              <div className="grid gap-4">
                <label className={labelClass} htmlFor="conversation-note">
                  Nova nota
                  <textarea
                    id="conversation-note"
                    className={`${textareaClass} min-h-[130px]`}
                    value={noteDraft}
                    onChange={(event) => setNoteDraft(event.target.value)}
                    placeholder="Ex.: cliente pediu retorno apos 18h e prefere falar com o setor financeiro."
                  />
                </label>
                <div className="flex justify-end">
                  <button type="button" className={primaryButtonClass} onClick={() => void addConversationNote()}>
                    Salvar nota
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
            ) : (
              <EmptyStatePanel>As notas acompanham a conversa selecionada e ajudam na transferencia entre atendentes.</EmptyStatePanel>
            )}
          </WorkspaceSection>

          <WorkspaceSection
            eyebrow="Qualidade"
            title="Avaliacao do atendimento"
            description="Guarde a nota final do cliente para medir qualidade e fechar o ciclo da conversa."
          >
            {selectedConversation ? (
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
                    placeholder="Resumo da experiencia do cliente ou observacoes relevantes."
                  />
                </label>
                <div className="flex justify-end">
                  <button type="button" className={primaryButtonClass} onClick={() => void saveConversationFeedback()}>
                    Registrar avaliacao
                  </button>
                </div>
              </div>
            ) : (
              <EmptyStatePanel>Selecione uma conversa para registrar a avaliacao quando o atendimento for concluido.</EmptyStatePanel>
            )}
          </WorkspaceSection>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1.1fr)_360px]">
        <WorkspaceSection
          eyebrow="Produtividade"
          title="Respostas rapidas"
          description="Crie modelos reutilizaveis por tenant e aplique no composer com um clique."
        >
          <div className="grid gap-3">
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
                    <button type="button" className={secondaryButtonClass} onClick={() => void deleteQuickReply(template.id)}>
                      Excluir
                    </button>
                  </div>
                </div>
                <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-slate-600">{template.body}</p>
              </article>
            ))}
            {quickReplies.length === 0 && <EmptyStatePanel>Cadastre a primeira resposta rapida para dar mais velocidade ao time.</EmptyStatePanel>}
          </div>
        </WorkspaceSection>

        <WorkspaceSection
          eyebrow="Editor"
          title={quickReplyDraft.id ? "Editar resposta rapida" : "Nova resposta rapida"}
          description="Organize atalhos que o time usa com frequencia para manter consistencia no atendimento."
        >
          <div className="grid gap-4">
            <label className={labelClass} htmlFor="quick-reply-title">
              Titulo
              <input
                id="quick-reply-title"
                className={inputClass}
                value={quickReplyDraft.title}
                onChange={(event) => setQuickReplyDraft((prev) => ({ ...prev, title: event.target.value }))}
                placeholder="Ex.: Confirmacao de agendamento"
              />
            </label>
            <label className={labelClass} htmlFor="quick-reply-body">
              Mensagem
              <textarea
                id="quick-reply-body"
                className={`${textareaClass} min-h-[180px]`}
                value={quickReplyDraft.body}
                onChange={(event) => setQuickReplyDraft((prev) => ({ ...prev, body: event.target.value }))}
                placeholder="Mensagem base usada pelo time operacional."
              />
            </label>
            <div className="flex flex-wrap items-center justify-end gap-3">
              {quickReplyDraft.id && (
                <button
                  type="button"
                  className={secondaryButtonClass}
                  onClick={() => setQuickReplyDraft({ id: "", title: "", body: "" })}
                >
                  Cancelar edicao
                </button>
              )}
              <button type="button" className={primaryButtonClass} onClick={() => void saveQuickReply()}>
                {quickReplyDraft.id ? "Salvar resposta" : "Criar resposta"}
              </button>
            </div>
          </div>
        </WorkspaceSection>
      </section>

      {showOutboundComposer && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-950/40 p-4 backdrop-blur-sm">
          <div className="w-full max-w-2xl rounded-[28px] border border-slate-200 bg-white p-6 shadow-[0_30px_120px_-40px_rgba(15,23,42,0.5)]">
            <div className="flex flex-col gap-4">
              <div className="space-y-2">
                <span className="inline-flex rounded-full bg-blue-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-blue-700">Outbound</span>
                <h3 className="text-xl font-semibold tracking-tight text-slate-950">Iniciar nova conversa pelo CRM</h3>
                <p className="text-sm leading-6 text-slate-500">Escolha o contato, opcionalmente o canal, e envie a primeira mensagem. Se a Meta bloquear por politica de janela ou template, o CRM vai mostrar esse retorno na propria conversa.</p>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <label className={labelClass} htmlFor="outbound-customer-name">
                  Nome do cliente
                  <input
                    id="outbound-customer-name"
                    className={inputClass}
                    value={outboundDraft.customerName}
                    onChange={(event) => setOutboundDraft((prev) => ({ ...prev, customerName: event.target.value }))}
                    placeholder="Ex.: Jose Silva"
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
                    placeholder="Escreva a mensagem que o CRM vai enviar pelo canal selecionado."
                  />
                </label>
              </div>

              <div className="rounded-2xl border border-blue-100 bg-blue-50/70 px-4 py-3 text-sm leading-6 text-blue-900">
                Dica operacional: para iniciar conversa outbound em WhatsApp Cloud API, a Meta pode exigir janela ativa de 24h ou template aprovado. Se houver bloqueio, a conversa ainda fica registrada no CRM com o motivo da falha.
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
