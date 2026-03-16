import type { Dispatch, SetStateAction } from "react";
import type { AttendanceRealtimeState } from "@app/store";
import type {
  Conversation,
  ConversationNote,
  ManagedUser,
  QueueFilter,
  QuickReplyTemplate,
  WhatsAppChannel
} from "@shared/types";

export type ContactPanelDraft = {
  id: string;
  name: string;
  phone: string;
  state: string;
  status: string;
  tags: string;
  ownerUserId: string;
};

export type FeedbackDraft = {
  rating: number;
  comment: string;
};

export type QuickReplyDraft = {
  id: string;
  title: string;
  body: string;
};

export type OutboundDraft = {
  customerName: string;
  customerPhone: string;
  channelId: string;
  message: string;
};

export type InboxWorkspaceProps = {
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
