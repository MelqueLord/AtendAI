import type { Dispatch, MutableRefObject, SetStateAction } from "react";
import {
  assignConversation as assignConversationRequest,
  deleteQuickReply as deleteQuickReplyRequest,
  saveConversationNote as saveConversationNoteRequest,
  saveQuickReply as saveQuickReplyRequest,
  sendHumanReply as sendHumanReplyRequest,
  startOutboundConversation as startOutboundConversationRequest,
  updateConversationStatus as updateConversationStatusRequest
} from "@features/atendimentos/services/attendanceService";
import { extractApiErrorData, resolveApiErrorMessage } from "@shared/utils/http";
import type { AuthResponse, Conversation, ConversationNote, ManagedUser, QuickReplyTemplate } from "@shared/types";

type DraftContact = {
  id: string;
  name: string;
  phone: string;
  state: string;
  status: string;
  tags: string;
  ownerUserId: string;
};

type OutboundDraft = {
  customerName: string;
  customerPhone: string;
  channelId: string;
  message: string;
};

type QuickReplyDraft = {
  id: string;
  title: string;
  body: string;
};

type UseAttendanceWorkspaceActionsParams = {
  auth: AuthResponse | null;
  managedUsers: ManagedUser[];
  selectedConversation: Conversation | null;
  selectedIdRef: MutableRefObject<string>;
  setSelectedId: Dispatch<SetStateAction<string>>;
  reply: string;
  setReply: Dispatch<SetStateAction<string>>;
  noteDraft: string;
  setNoteDraft: Dispatch<SetStateAction<string>>;
  quickReplyDraft: QuickReplyDraft;
  setQuickReplyDraft: Dispatch<SetStateAction<QuickReplyDraft>>;
  outboundDraft: OutboundDraft;
  setOutboundDraft: Dispatch<SetStateAction<OutboundDraft>>;
  setConversationNotes: Dispatch<SetStateAction<ConversationNote[]>>;
  setQuickReplies: Dispatch<SetStateAction<QuickReplyTemplate[]>>;
  conversationNotesCacheRef: MutableRefObject<Map<string, ConversationNote[]>>;
  applyOptimisticConversationUpdate: (conversationId: string, updater: (conversation: Conversation) => Conversation) => Conversation | null;
  mergeConversationIntoAttendanceState: (updatedConversation: Conversation) => void;
  loadConversationDetail: (conversationId: string, token?: string, options?: { background?: boolean }) => Promise<Conversation | null>;
  loadConversationNotes: (conversationId: string, token?: string, options?: { background?: boolean }) => Promise<void>;
  loadConversations: (token?: string, options?: { background?: boolean }) => Promise<void>;
  setAttendanceAssignmentPendingId: Dispatch<SetStateAction<string | null>>;
  setAttendanceStatusPendingId: Dispatch<SetStateAction<string | null>>;
  setAttendanceNoteSaving: Dispatch<SetStateAction<boolean>>;
  setAttendanceQuickReplySaving: Dispatch<SetStateAction<boolean>>;
  setAttendanceReplySending: Dispatch<SetStateAction<boolean>>;
  setSendingOutbound: Dispatch<SetStateAction<boolean>>;
  setAttendanceContactSaving: Dispatch<SetStateAction<boolean>>;
  setNotice: Dispatch<SetStateAction<string>>;
  setError: Dispatch<SetStateAction<string>>;
  saveConversationContactPanelData: (contactDraft: DraftContact, selectedConversation: Conversation | null, token?: string) => Promise<unknown>;
};

export function useAttendanceWorkspaceActions({
  auth,
  managedUsers,
  selectedConversation,
  selectedIdRef,
  setSelectedId,
  reply,
  setReply,
  noteDraft,
  setNoteDraft,
  quickReplyDraft,
  setQuickReplyDraft,
  outboundDraft,
  setOutboundDraft,
  setConversationNotes,
  setQuickReplies,
  conversationNotesCacheRef,
  applyOptimisticConversationUpdate,
  mergeConversationIntoAttendanceState,
  loadConversationDetail,
  loadConversationNotes,
  loadConversations,
  setAttendanceAssignmentPendingId,
  setAttendanceStatusPendingId,
  setAttendanceNoteSaving,
  setAttendanceQuickReplySaving,
  setAttendanceReplySending,
  setSendingOutbound,
  setAttendanceContactSaving,
  setNotice,
  setError,
  saveConversationContactPanelData
}: UseAttendanceWorkspaceActionsParams) {
  async function saveConversationContactPanel(contactDraft: DraftContact) {
    if (!auth || !selectedConversation) {
      return;
    }

    if (!contactDraft.name.trim() || !contactDraft.phone.trim()) {
      setError("Preencha nome e telefone do contato.");
      return;
    }

    const isEditing = Boolean(contactDraft.id);
    setAttendanceContactSaving(true);

    try {
      await saveConversationContactPanelData(contactDraft, selectedConversation, auth.token);
      setNotice(isEditing ? "Contato da conversa atualizado." : "Contato criado a partir da conversa.");
    } catch (error) {
      setError(resolveApiErrorMessage(error, "Erro ao salvar contato da conversa."));
    } finally {
      setAttendanceContactSaving(false);
    }
  }

  async function assignSelectedConversation(assignedUserId: string) {
    if (!auth || !selectedConversation) {
      return;
    }

    const conversationId = selectedConversation.id;
    const nextAssignedUserId = assignedUserId || null;
    const nextAssignedUserName = nextAssignedUserId
      ? managedUsers.find((user) => user.id === nextAssignedUserId)?.name ?? null
      : null;
    const previousConversation = applyOptimisticConversationUpdate(conversationId, (conversation) => ({
      ...conversation,
      assignedUserId: nextAssignedUserId,
      assignedUserName: nextAssignedUserName,
      updatedAt: new Date().toISOString()
    }));
    setAttendanceAssignmentPendingId(conversationId);

    try {
      const updatedConversation = await assignConversationRequest(auth.token, conversationId, nextAssignedUserId);
      if (updatedConversation) {
        mergeConversationIntoAttendanceState(updatedConversation);
      }
      setNotice(assignedUserId ? "Conversa atribuida com sucesso." : "Conversa desatribuida.");
    } catch (error) {
      if (previousConversation) {
        mergeConversationIntoAttendanceState(previousConversation);
      }
      setError(resolveApiErrorMessage(error, "Erro ao atribuir conversa."));
    } finally {
      setAttendanceAssignmentPendingId(null);
    }
  }

  async function updateSelectedConversationStatus(nextStatus: "BotHandling" | "WaitingHuman" | "HumanHandling" | "Closed", conversationId = selectedConversation?.id) {
    if (!auth || !conversationId) {
      return;
    }

    const timestamp = new Date().toISOString();
    const previousConversation = applyOptimisticConversationUpdate(conversationId, (conversation) => ({
      ...conversation,
      status: nextStatus,
      updatedAt: timestamp,
      closedAt: nextStatus === "Closed" ? timestamp : null
    }));
    setAttendanceStatusPendingId(conversationId);

    try {
      selectedIdRef.current = conversationId;
      setSelectedId(conversationId);
      const updatedConversation = await updateConversationStatusRequest(auth.token, conversationId, nextStatus);
      if (updatedConversation) {
        mergeConversationIntoAttendanceState(updatedConversation);
      }

      const statusNotice: Record<typeof nextStatus, string> = {
        BotHandling: "Conversa devolvida para a IA.",
        HumanHandling: "Conversa transferida para atendimento humano.",
        WaitingHuman: "Conversa marcada como aguardando humano.",
        Closed: "Conversa encerrada."
      };
      setNotice(statusNotice[nextStatus]);
    } catch (error) {
      if (previousConversation) {
        mergeConversationIntoAttendanceState(previousConversation);
      }
      setError(resolveApiErrorMessage(error, "Erro ao atualizar status da conversa."));
    } finally {
      setAttendanceStatusPendingId(null);
    }
  }

  async function addConversationNote() {
    if (!auth || !selectedConversation || !noteDraft.trim()) {
      return;
    }

    setAttendanceNoteSaving(true);
    try {
      const savedNote = await saveConversationNoteRequest(auth.token, selectedConversation.id, noteDraft);
      setNoteDraft("");
      if (savedNote) {
        setConversationNotes((previous) => {
          const next = [savedNote, ...previous];
          conversationNotesCacheRef.current.set(selectedConversation.id, next);
          return next;
        });
      }
      setNotice("Nota interna registrada.");
    } catch (error) {
      setError(resolveApiErrorMessage(error, "Erro ao salvar nota interna."));
    } finally {
      setAttendanceNoteSaving(false);
    }
  }

  async function saveQuickReply() {
    if (!auth || !quickReplyDraft.title.trim() || !quickReplyDraft.body.trim()) {
      setError("Preencha titulo e mensagem da resposta rapida.");
      return;
    }

    const isEditing = Boolean(quickReplyDraft.id);
    setAttendanceQuickReplySaving(true);
    try {
      const savedTemplate = await saveQuickReplyRequest(auth.token, {
        id: quickReplyDraft.id || undefined,
        title: quickReplyDraft.title,
        body: quickReplyDraft.body
      });
      setQuickReplyDraft({ id: "", title: "", body: "" });
      if (savedTemplate) {
        setQuickReplies((previous) => {
          const existing = previous.some((template) => template.id === savedTemplate.id);
          const next = existing
            ? previous.map((template) => template.id === savedTemplate.id ? savedTemplate : template)
            : [savedTemplate, ...previous];
          return [...next].sort((left, right) => new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime());
        });
      }
      setNotice(isEditing ? "Resposta rapida atualizada." : "Resposta rapida criada.");
    } catch (error) {
      setError(resolveApiErrorMessage(error, "Erro ao salvar resposta rapida."));
    } finally {
      setAttendanceQuickReplySaving(false);
    }
  }

  function editQuickReply(template: QuickReplyTemplate) {
    setQuickReplyDraft({ id: template.id, title: template.title, body: template.body });
  }

  async function deleteQuickReply(templateId: string) {
    if (!auth) {
      return;
    }

    setAttendanceQuickReplySaving(true);
    try {
      await deleteQuickReplyRequest(auth.token, templateId);
      if (quickReplyDraft.id === templateId) {
        setQuickReplyDraft({ id: "", title: "", body: "" });
      }
      setQuickReplies((previous) => previous.filter((template) => template.id !== templateId));
      setNotice("Resposta rapida removida.");
    } catch (error) {
      setError(resolveApiErrorMessage(error, "Erro ao excluir resposta rapida."));
    } finally {
      setAttendanceQuickReplySaving(false);
    }
  }

  function applyQuickReply(body: string) {
    setReply(body);
  }

  async function sendHumanReply() {
    if (!auth || !selectedConversation || !reply.trim()) {
      return;
    }

    const messageText = reply.trim();
    const optimisticMessage = {
      id: `pending-${Date.now()}`,
      sender: "HumanAgent",
      text: messageText,
      createdAt: new Date().toISOString()
    };
    const previousConversation = applyOptimisticConversationUpdate(selectedConversation.id, (conversation) => ({
      ...conversation,
      status: "HumanHandling",
      updatedAt: optimisticMessage.createdAt,
      lastHumanMessageAt: optimisticMessage.createdAt,
      messages: [...conversation.messages, optimisticMessage]
    }));
    setAttendanceReplySending(true);
    setReply("");

    try {
      const payload = await sendHumanReplyRequest(auth.token, selectedConversation.id, messageText);
      setNotice(payload?.message || "Resposta enviada ao cliente.");
      void loadConversationDetail(selectedConversation.id, auth.token, { background: true });
    } catch (error) {
      if (previousConversation) {
        mergeConversationIntoAttendanceState(previousConversation);
      }
      setReply(messageText);
      setError(resolveApiErrorMessage(error, "Erro de conexao ao enviar resposta."));
    } finally {
      setAttendanceReplySending(false);
    }
  }

  async function startOutboundConversation() {
    if (!auth) {
      return false;
    }

    if (!outboundDraft.customerPhone.trim() || !outboundDraft.message.trim()) {
      setError("Preencha telefone e mensagem para iniciar a conversa.");
      return false;
    }

    setSendingOutbound(true);
    setError("");

    try {
      const payload = await startOutboundConversationRequest(auth.token, {
        customerPhone: outboundDraft.customerPhone.trim(),
        customerName: outboundDraft.customerName.trim() || null,
        message: outboundDraft.message.trim(),
        channelId: outboundDraft.channelId || null
      });
      setOutboundDraft({ customerName: "", customerPhone: "", channelId: "", message: "" });
      if (payload?.conversationId) {
        setSelectedId(payload.conversationId);
        await Promise.all([
          loadConversations(auth.token, { background: true }),
          loadConversationDetail(payload.conversationId, auth.token, { background: true }),
          loadConversationNotes(payload.conversationId, auth.token, { background: true })
        ]);
      } else {
        await loadConversations(auth.token, { background: true });
      }
      setNotice(payload?.message || "Conversa outbound iniciada com sucesso.");
      return true;
    } catch (error) {
      const payload = extractApiErrorData<{ message?: string; error?: string | null; conversationId?: string }>(error);
      if (payload?.conversationId) {
        await Promise.all([
          loadConversations(auth.token, { background: true }),
          loadConversationDetail(payload.conversationId, auth.token, { background: true })
        ]);
        setSelectedId(payload.conversationId);
      }

      if (payload?.conversationId) {
        setError(payload?.message || payload?.error || "Nao foi possivel iniciar conversa outbound.");
      } else {
        setError(resolveApiErrorMessage(error, "Erro de conexao ao iniciar conversa outbound."));
      }
      return false;
    } finally {
      setSendingOutbound(false);
    }
  }

  return {
    saveConversationContactPanel,
    assignSelectedConversation,
    updateSelectedConversationStatus,
    addConversationNote,
    saveQuickReply,
    editQuickReply,
    deleteQuickReply,
    applyQuickReply,
    sendHumanReply,
    startOutboundConversation
  };
}
