import { startTransition, type Dispatch, type MutableRefObject, type SetStateAction } from "react";
import { fetchContacts as fetchCrmContacts, saveContact as saveContactRequest } from "@features/clientes/services/clientesService";
import {
  fetchConversationById,
  fetchConversationNotes as fetchConversationNotesRequest,
  fetchConversations as fetchConversationQueue,
  fetchQuickReplies as fetchQuickReplyTemplates
} from "@features/atendimentos/services/attendanceService";
import { isAbortError, resolveApiErrorMessage } from "@shared/utils/http";
import type { Contact, Conversation, ConversationNote, QuickReplyTemplate } from "@shared/types";

type AttendanceWorkspaceDataParams = {
  authToken?: string;
  conversations: Conversation[];
  setConversations: Dispatch<SetStateAction<Conversation[]>>;
  selectedId: string;
  setSelectedId: Dispatch<SetStateAction<string>>;
  selectedIdRef: MutableRefObject<string>;
  selectedConversationDetail: Conversation | null;
  setSelectedConversationDetail: Dispatch<SetStateAction<Conversation | null>>;
  conversationDetailCacheRef: MutableRefObject<Map<string, Conversation>>;
  conversationNotesCacheRef: MutableRefObject<Map<string, ConversationNote[]>>;
  conversationsAbortRef: MutableRefObject<AbortController | null>;
  conversationDetailAbortRef: MutableRefObject<AbortController | null>;
  conversationNotesAbortRef: MutableRefObject<AbortController | null>;
  setAttendanceQueueLoading: Dispatch<SetStateAction<boolean>>;
  setAttendanceQueueRefreshing: Dispatch<SetStateAction<boolean>>;
  setAttendanceConversationLoading: Dispatch<SetStateAction<boolean>>;
  setAttendanceNotesLoading: Dispatch<SetStateAction<boolean>>;
  setContacts: Dispatch<SetStateAction<Contact[]>>;
  setConversationNotes: Dispatch<SetStateAction<ConversationNote[]>>;
  setQuickReplies: Dispatch<SetStateAction<QuickReplyTemplate[]>>;
  setError: Dispatch<SetStateAction<string>>;
};

export function useAttendanceWorkspaceData({
  authToken,
  conversations,
  setConversations,
  selectedId,
  setSelectedId,
  selectedIdRef,
  selectedConversationDetail,
  setSelectedConversationDetail,
  conversationDetailCacheRef,
  conversationNotesCacheRef,
  conversationsAbortRef,
  conversationDetailAbortRef,
  conversationNotesAbortRef,
  setAttendanceQueueLoading,
  setAttendanceQueueRefreshing,
  setAttendanceConversationLoading,
  setAttendanceNotesLoading,
  setContacts,
  setConversationNotes,
  setQuickReplies,
  setError
}: AttendanceWorkspaceDataParams) {
  function cloneConversationSnapshot(conversation: Conversation) {
    return {
      ...conversation,
      messages: conversation.messages.map((message) => ({ ...message }))
    };
  }

  function getConversationSnapshot(conversationId: string) {
    const cachedConversation = conversationDetailCacheRef.current.get(conversationId);
    if (cachedConversation) {
      return cloneConversationSnapshot(cachedConversation);
    }

    const selectedSnapshot = selectedConversationDetail?.id === conversationId ? selectedConversationDetail : null;
    if (selectedSnapshot) {
      return cloneConversationSnapshot(selectedSnapshot);
    }

    const listedConversation = conversations.find((conversation) => conversation.id === conversationId);
    return listedConversation ? cloneConversationSnapshot(listedConversation) : null;
  }

  function mergeConversationIntoAttendanceState(updatedConversation: Conversation) {
    conversationDetailCacheRef.current.set(updatedConversation.id, cloneConversationSnapshot(updatedConversation));

    startTransition(() => {
      setConversations((previous) => {
        const existing = previous.find((conversation) => conversation.id === updatedConversation.id);
        const mergedConversation = existing
          ? {
              ...existing,
              ...updatedConversation,
              messages: updatedConversation.messages.length > 0 ? updatedConversation.messages : existing.messages
            }
          : updatedConversation;

        const next = existing
          ? previous.map((conversation) => conversation.id === updatedConversation.id ? mergedConversation : conversation)
          : [mergedConversation, ...previous];

        return [...next].sort((left, right) => new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime());
      });
    });

    if (selectedIdRef.current === updatedConversation.id || selectedId === updatedConversation.id) {
      setSelectedConversationDetail(cloneConversationSnapshot(updatedConversation));
    }
  }

  function mergeContactIntoState(savedContact: Contact) {
    setContacts((previous) => {
      const existing = previous.some((contact) => contact.id === savedContact.id);
      const next = existing
        ? previous.map((contact) => contact.id === savedContact.id ? savedContact : contact)
        : [savedContact, ...previous];

      return [...next].sort((left, right) => left.name.localeCompare(right.name));
    });
  }

  async function loadConversations(token = authToken, options?: { background?: boolean }) {
    if (!token) {
      return;
    }

    const shouldRefreshInBackground = options?.background ?? conversations.length > 0;
    conversationsAbortRef.current?.abort();
    const controller = new AbortController();
    conversationsAbortRef.current = controller;

    if (shouldRefreshInBackground) {
      setAttendanceQueueRefreshing(true);
    } else {
      setAttendanceQueueLoading(true);
    }

    try {
      const data = await fetchConversationQueue(token, controller.signal);
      const hydratedConversations = data.map((conversation) => {
        const cachedConversation = conversationDetailCacheRef.current.get(conversation.id);
        return cachedConversation ? { ...conversation, messages: cachedConversation.messages } : conversation;
      });

      startTransition(() => {
        setConversations(hydratedConversations);
      });

      const activeConversationId = selectedIdRef.current;
      if (!hydratedConversations.length) {
        setSelectedId("");
        setSelectedConversationDetail(null);
      } else if (!activeConversationId || !hydratedConversations.some((item) => item.id === activeConversationId)) {
        setSelectedId(hydratedConversations[0].id);
        setSelectedConversationDetail(conversationDetailCacheRef.current.get(hydratedConversations[0].id) ?? null);
      }
    } catch (error) {
      if (!isAbortError(error)) {
        setError(resolveApiErrorMessage(error, "Erro de conexao ao buscar conversas."));
      }
    } finally {
      const isCurrentRequest = conversationsAbortRef.current === controller;
      if (isCurrentRequest) {
        conversationsAbortRef.current = null;
        setAttendanceQueueLoading(false);
        setAttendanceQueueRefreshing(false);
      }
    }
  }

  async function loadAttendanceContactsIndex(token = authToken) {
    if (!token) {
      return;
    }

    try {
      setContacts(await fetchCrmContacts(token));
    } catch {
      // Attendance still works with persisted conversation names if this lightweight contact index fails.
    }
  }

  async function loadConversationDetail(conversationId: string, token = authToken, options?: { background?: boolean }): Promise<Conversation | null> {
    if (!token || !conversationId) {
      return null;
    }

    conversationDetailAbortRef.current?.abort();
    const controller = new AbortController();
    conversationDetailAbortRef.current = controller;

    if (!options?.background) {
      setAttendanceConversationLoading(true);
    }

    try {
      const data = await fetchConversationById(token, conversationId, controller.signal);
      mergeConversationIntoAttendanceState(data);
      return data;
    } catch (error) {
      if (!isAbortError(error) && selectedIdRef.current === conversationId) {
        setSelectedConversationDetail(conversationDetailCacheRef.current.get(conversationId) ?? null);
      }

      return null;
    } finally {
      const isCurrentRequest = conversationDetailAbortRef.current === controller;
      if (isCurrentRequest) {
        conversationDetailAbortRef.current = null;
        setAttendanceConversationLoading(false);
      }
    }
  }

  async function refreshInboxOnly(token = authToken) {
    if (!token) {
      return;
    }

    const activeConversationId = selectedIdRef.current;
    await loadConversations(token, { background: true });
    if (activeConversationId) {
      await Promise.all([
        loadConversationDetail(activeConversationId, token, { background: true }),
        loadConversationNotes(activeConversationId, token, { background: true })
      ]);
    }
  }

  async function loadConversationNotes(conversationId: string, token = authToken, options?: { background?: boolean }) {
    if (!token || !conversationId) {
      return;
    }

    conversationNotesAbortRef.current?.abort();
    const controller = new AbortController();
    conversationNotesAbortRef.current = controller;

    if (!options?.background) {
      setAttendanceNotesLoading(true);
    }

    try {
      const data = await fetchConversationNotesRequest(token, conversationId, controller.signal);
      conversationNotesCacheRef.current.set(conversationId, data);
      if (selectedIdRef.current === conversationId) {
        setConversationNotes(data);
      }
    } catch (error) {
      if (!isAbortError(error) && selectedIdRef.current === conversationId) {
        setConversationNotes(conversationNotesCacheRef.current.get(conversationId) ?? []);
      }
    } finally {
      const isCurrentRequest = conversationNotesAbortRef.current === controller;
      if (isCurrentRequest) {
        conversationNotesAbortRef.current = null;
        setAttendanceNotesLoading(false);
      }
    }
  }

  function applyOptimisticConversationUpdate(conversationId: string, updater: (conversation: Conversation) => Conversation) {
    const previousConversation = getConversationSnapshot(conversationId);
    if (!previousConversation) {
      return null;
    }

    const nextConversation = updater(previousConversation);
    mergeConversationIntoAttendanceState(nextConversation);
    return previousConversation;
  }

  async function loadQuickReplies(token = authToken) {
    if (!token) {
      return;
    }

    try {
      setQuickReplies(await fetchQuickReplyTemplates(token));
    } catch {
      setQuickReplies([]);
    }
  }

  async function saveConversationContactPanel(
    contactDraft: { id: string; name: string; phone: string; state: string; status: string; tags: string; ownerUserId: string },
    selectedConversation: Conversation | null,
    token = authToken
  ) {
    if (!token || !selectedConversation) {
      return null;
    }

    const savedContact = await saveContactRequest(token, {
      id: contactDraft.id || undefined,
      name: contactDraft.name,
      phone: contactDraft.phone,
      state: contactDraft.state || null,
      status: contactDraft.status || null,
      tags: contactDraft.tags ? contactDraft.tags.split(",").map((tag) => tag.trim()).filter(Boolean) : [],
      ownerUserId: contactDraft.ownerUserId || null
    });

    if (savedContact) {
      mergeContactIntoState(savedContact);
    }

    return savedContact;
  }

  return {
    cloneConversationSnapshot,
    getConversationSnapshot,
    mergeConversationIntoAttendanceState,
    mergeContactIntoState,
    loadConversations,
    loadAttendanceContactsIndex,
    loadConversationDetail,
    refreshInboxOnly,
    loadConversationNotes,
    applyOptimisticConversationUpdate,
    loadQuickReplies,
    saveConversationContactPanel
  };
}
