import { useEffect, type Dispatch, type MutableRefObject, type SetStateAction } from "react";
import type { Contact, Conversation, ConversationNote, ManagedUser } from "@shared/types";

type ContactPanelDraft = {
  id: string;
  name: string;
  phone: string;
  state: string;
  status: string;
  tags: string;
  ownerUserId: string;
};

type UseAttendanceSelectionSyncParams = {
  authToken?: string;
  selectedConversation: Conversation | null;
  selectedContact: Contact | null;
  managedUsers: ManagedUser[];
  conversationNotesCacheRef: MutableRefObject<Map<string, ConversationNote[]>>;
  setConversationContactDraft: Dispatch<SetStateAction<ContactPanelDraft>>;
  setConversationNotes: Dispatch<SetStateAction<ConversationNote[]>>;
  setNoteDraft: Dispatch<SetStateAction<string>>;
  setAttendanceNotesLoading: Dispatch<SetStateAction<boolean>>;
  loadConversationNotes: (conversationId: string, token?: string, options?: { background?: boolean }) => Promise<void>;
  selectedId: string;
  selectedIdRef: MutableRefObject<string>;
  conversationDetailCacheRef: MutableRefObject<Map<string, Conversation>>;
  setSelectedConversationDetail: Dispatch<SetStateAction<Conversation | null>>;
  setAttendanceConversationLoading: Dispatch<SetStateAction<boolean>>;
  loadConversationDetail: (conversationId: string, token?: string, options?: { background?: boolean }) => Promise<Conversation | null>;
};

export function useAttendanceSelectionSync({
  authToken,
  selectedConversation,
  selectedContact,
  managedUsers,
  conversationNotesCacheRef,
  setConversationContactDraft,
  setConversationNotes,
  setNoteDraft,
  setAttendanceNotesLoading,
  loadConversationNotes,
  selectedId,
  selectedIdRef,
  conversationDetailCacheRef,
  setSelectedConversationDetail,
  setAttendanceConversationLoading,
  loadConversationDetail
}: UseAttendanceSelectionSyncParams) {
  useEffect(() => {
    if (!selectedConversation) {
      setConversationContactDraft({ id: "", name: "", phone: "", state: "", status: "", tags: "", ownerUserId: "" });
      setConversationNotes([]);
      setNoteDraft("");
      setAttendanceNotesLoading(false);
      return;
    }

    setConversationContactDraft({
      id: selectedContact?.id ?? "",
      name: selectedContact?.name ?? selectedConversation.customerName,
      phone: selectedContact?.phone ?? selectedConversation.customerPhone,
      state: selectedContact?.state ?? "",
      status: selectedContact?.status ?? "",
      tags: selectedContact ? selectedContact.tags.join(", ") : "",
      ownerUserId: selectedContact ? (managedUsers.find((user) => user.name === selectedContact.ownerName)?.id ?? "") : ""
    });

    const cachedNotes = conversationNotesCacheRef.current.get(selectedConversation.id);
    if (cachedNotes) {
      setConversationNotes(cachedNotes);
    }

    void loadConversationNotes(selectedConversation.id, authToken, { background: Boolean(cachedNotes) });
  }, [authToken, conversationNotesCacheRef, loadConversationNotes, managedUsers, selectedContact, selectedConversation, setAttendanceNotesLoading, setConversationContactDraft, setConversationNotes, setNoteDraft]);

  useEffect(() => {
    selectedIdRef.current = selectedId;
  }, [selectedId, selectedIdRef]);

  useEffect(() => {
    if (!authToken || !selectedId) {
      setSelectedConversationDetail(null);
      setAttendanceConversationLoading(false);
      return;
    }

    const cachedConversation = conversationDetailCacheRef.current.get(selectedId);
    if (cachedConversation) {
      setSelectedConversationDetail(cachedConversation);
    }

    void loadConversationDetail(selectedId, authToken, { background: Boolean(cachedConversation) });
  }, [authToken, conversationDetailCacheRef, loadConversationDetail, selectedId, setAttendanceConversationLoading, setSelectedConversationDetail]);
}
