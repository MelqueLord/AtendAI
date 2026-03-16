import { useDeferredValue, useMemo, useRef, useState } from "react";
import type { AttendanceRealtimeState } from "@app/store";
import type {
  Contact,
  Conversation,
  ConversationNote,
  QueueFilter,
  QuickReplyTemplate
} from "@shared/types";
import { normalizeConversationStatus } from "@shared/utils/conversation";
import { resolveCustomerDisplayName } from "@shared/utils/customer";
import { normalizePhone } from "@shared/utils/phone";

const emptyOutboundDraft = { customerName: "", customerPhone: "", channelId: "", message: "" };
const emptyFeedbackDraft = { rating: 5, comment: "" };
const emptyQuickReplyDraft = { id: "", title: "", body: "" };
const emptyConversationContactDraft = { id: "", name: "", phone: "", state: "", status: "", tags: "", ownerUserId: "" };

export function useAttendanceWorkspaceState(contacts: Contact[]) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const selectedIdRef = useRef("");
  const [selectedConversationDetail, setSelectedConversationDetail] = useState<Conversation | null>(null);
  const conversationDetailCacheRef = useRef(new Map<string, Conversation>());
  const conversationNotesCacheRef = useRef(new Map<string, ConversationNote[]>());
  const conversationsAbortRef = useRef<AbortController | null>(null);
  const conversationDetailAbortRef = useRef<AbortController | null>(null);
  const conversationNotesAbortRef = useRef<AbortController | null>(null);
  const [reply, setReply] = useState("");
  const [outboundDraft, setOutboundDraft] = useState(emptyOutboundDraft);
  const [sendingOutbound, setSendingOutbound] = useState(false);
  const [attendanceQueueLoading, setAttendanceQueueLoading] = useState(false);
  const [attendanceQueueRefreshing, setAttendanceQueueRefreshing] = useState(false);
  const [attendanceConversationLoading, setAttendanceConversationLoading] = useState(false);
  const [attendanceNotesLoading, setAttendanceNotesLoading] = useState(false);
  const [attendanceStatusPendingId, setAttendanceStatusPendingId] = useState<string | null>(null);
  const [attendanceAssignmentPendingId, setAttendanceAssignmentPendingId] = useState<string | null>(null);
  const [attendanceReplySending, setAttendanceReplySending] = useState(false);
  const [attendanceNoteSaving, setAttendanceNoteSaving] = useState(false);
  const [attendanceContactSaving, setAttendanceContactSaving] = useState(false);
  const [attendanceQuickReplySaving, setAttendanceQuickReplySaving] = useState(false);
  const [search, setSearch] = useState("");
  const [queueFilter, setQueueFilter] = useState<QueueFilter>("ALL");
  const [attendanceRealtimeState, setAttendanceRealtimeState] = useState<AttendanceRealtimeState>("disconnected");
  const [attendanceRealtimeLastPublishedAt, setAttendanceRealtimeLastPublishedAt] = useState<string | null>(null);
  const [attendanceRealtimeLastReceivedAt, setAttendanceRealtimeLastReceivedAt] = useState<string | null>(null);
  const [feedbackDraft, setFeedbackDraft] = useState(emptyFeedbackDraft);
  const [conversationNotes, setConversationNotes] = useState<ConversationNote[]>([]);
  const [noteDraft, setNoteDraft] = useState("");
  const [quickReplies, setQuickReplies] = useState<QuickReplyTemplate[]>([]);
  const [quickReplyDraft, setQuickReplyDraft] = useState(emptyQuickReplyDraft);
  const [conversationContactDraft, setConversationContactDraft] = useState(emptyConversationContactDraft);
  const deferredSearch = useDeferredValue(search);

  const contactNameByPhone = useMemo(
    () => new Map(contacts.map((contact) => [normalizePhone(contact.phone), contact.name])),
    [contacts]
  );

  const conversationsWithResolvedNames = useMemo(
    () => conversations.map((conversation) => ({
      ...conversation,
      customerName: resolveCustomerDisplayName(
        conversation.customerPhone,
        contactNameByPhone.get(normalizePhone(conversation.customerPhone)) ?? null,
        conversation.customerName
      )
    })),
    [contactNameByPhone, conversations]
  );

  const selectedConversationSummary = useMemo(
    () => conversationsWithResolvedNames.find((conversation) => conversation.id === selectedId) ?? null,
    [conversationsWithResolvedNames, selectedId]
  );

  const selectedConversation = useMemo(() => {
    const baseConversation = selectedConversationDetail?.id === selectedId ? selectedConversationDetail : selectedConversationSummary;
    if (!baseConversation) {
      return null;
    }

    const resolvedName = resolveCustomerDisplayName(
      baseConversation.customerPhone,
      contactNameByPhone.get(normalizePhone(baseConversation.customerPhone)) ?? null,
      baseConversation.customerName
    );

    return resolvedName === baseConversation.customerName
      ? baseConversation
      : { ...baseConversation, customerName: resolvedName };
  }, [contactNameByPhone, selectedConversationDetail, selectedConversationSummary, selectedId]);

  const selectedContact = useMemo(() => {
    if (!selectedConversation) {
      return null;
    }

    return contacts.find((contact) => normalizePhone(contact.phone) === normalizePhone(selectedConversation.customerPhone)) ?? null;
  }, [contacts, selectedConversation]);

  const queue = useMemo(() => {
    const query = deferredSearch.trim().toLowerCase();

    return conversationsWithResolvedNames.filter((conversation) => {
      const status = normalizeConversationStatus(conversation.status);
      const filterMatch =
        queueFilter === "ALL" ||
        (queueFilter === "WAITING_HUMAN" && status === "WaitingHuman") ||
        (queueFilter === "BOT" && status === "BotHandling") ||
        (queueFilter === "HUMAN" && status === "HumanHandling");

      if (!filterMatch) {
        return false;
      }

      if (!query) {
        return true;
      }

      const lastMessage = conversation.messages[conversation.messages.length - 1]?.text ?? "";
      return (
        conversation.customerName.toLowerCase().includes(query) ||
        conversation.customerPhone.toLowerCase().includes(query) ||
        lastMessage.toLowerCase().includes(query)
      );
    });
  }, [conversationsWithResolvedNames, deferredSearch, queueFilter]);

  function resetAttendanceUiState() {
    conversationsAbortRef.current?.abort();
    conversationDetailAbortRef.current?.abort();
    conversationNotesAbortRef.current?.abort();
    conversationsAbortRef.current = null;
    conversationDetailAbortRef.current = null;
    conversationNotesAbortRef.current = null;
    conversationDetailCacheRef.current.clear();
    conversationNotesCacheRef.current.clear();
    selectedIdRef.current = "";
    setConversations([]);
    setSelectedId("");
    setSelectedConversationDetail(null);
    setConversationNotes([]);
    setNoteDraft("");
    setReply("");
    setSearch("");
    setQueueFilter("ALL");
    setAttendanceQueueLoading(false);
    setAttendanceQueueRefreshing(false);
    setAttendanceConversationLoading(false);
    setAttendanceNotesLoading(false);
    setAttendanceStatusPendingId(null);
    setAttendanceAssignmentPendingId(null);
    setAttendanceReplySending(false);
    setAttendanceNoteSaving(false);
    setAttendanceContactSaving(false);
    setAttendanceQuickReplySaving(false);
    setAttendanceRealtimeState("disconnected");
    setAttendanceRealtimeLastPublishedAt(null);
    setAttendanceRealtimeLastReceivedAt(null);
    setOutboundDraft(emptyOutboundDraft);
    setSendingOutbound(false);
    setFeedbackDraft(emptyFeedbackDraft);
    setQuickReplies([]);
    setQuickReplyDraft(emptyQuickReplyDraft);
    setConversationContactDraft(emptyConversationContactDraft);
  }

  return {
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
    reply,
    setReply,
    outboundDraft,
    setOutboundDraft,
    sendingOutbound,
    setSendingOutbound,
    attendanceQueueLoading,
    setAttendanceQueueLoading,
    attendanceQueueRefreshing,
    setAttendanceQueueRefreshing,
    attendanceConversationLoading,
    setAttendanceConversationLoading,
    attendanceNotesLoading,
    setAttendanceNotesLoading,
    attendanceStatusPendingId,
    setAttendanceStatusPendingId,
    attendanceAssignmentPendingId,
    setAttendanceAssignmentPendingId,
    attendanceReplySending,
    setAttendanceReplySending,
    attendanceNoteSaving,
    setAttendanceNoteSaving,
    attendanceContactSaving,
    setAttendanceContactSaving,
    attendanceQuickReplySaving,
    setAttendanceQuickReplySaving,
    search,
    setSearch,
    queueFilter,
    setQueueFilter,
    attendanceRealtimeState,
    setAttendanceRealtimeState,
    attendanceRealtimeLastPublishedAt,
    setAttendanceRealtimeLastPublishedAt,
    attendanceRealtimeLastReceivedAt,
    setAttendanceRealtimeLastReceivedAt,
    feedbackDraft,
    setFeedbackDraft,
    conversationNotes,
    setConversationNotes,
    noteDraft,
    setNoteDraft,
    quickReplies,
    setQuickReplies,
    quickReplyDraft,
    setQuickReplyDraft,
    conversationContactDraft,
    setConversationContactDraft,
    conversationsWithResolvedNames,
    selectedConversation,
    selectedContact,
    queue,
    resetAttendanceUiState
  };
}


