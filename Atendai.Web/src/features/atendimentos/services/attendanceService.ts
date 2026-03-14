import { api } from "@infrastructure/http/api";
import type { Conversation, ConversationNote, QuickReplyTemplate } from "@shared/types";

export function fetchConversations(token: string, signal?: AbortSignal) {
  return api.get<Conversation[]>("/conversations", { token, signal });
}

export function fetchConversationById(token: string, conversationId: string, signal?: AbortSignal) {
  return api.get<Conversation>(`/conversations/${conversationId}`, { token, signal });
}

export function fetchConversationNotes(token: string, conversationId: string, signal?: AbortSignal) {
  return api.get<ConversationNote[]>(`/conversations/${conversationId}/notes`, { token, signal });
}

export function saveConversationNote(token: string, conversationId: string, note: string) {
  return api.post<ConversationNote>(`/conversations/${conversationId}/notes`, { note }, { token });
}

export function fetchQuickReplies(token: string) {
  return api.get<QuickReplyTemplate[]>("/conversations/quick-replies", { token });
}

export function saveQuickReply(token: string, payload: { id?: string; title: string; body: string }) {
  return payload.id
    ? api.put<QuickReplyTemplate>(`/conversations/quick-replies/${payload.id}`, { title: payload.title, body: payload.body }, { token })
    : api.post<QuickReplyTemplate>("/conversations/quick-replies", { title: payload.title, body: payload.body }, { token });
}

export function deleteQuickReply(token: string, templateId: string) {
  return api.delete<null>(`/conversations/quick-replies/${templateId}`, { token });
}

export function assignConversation(token: string, conversationId: string, assignedUserId: string | null) {
  return api.patch<Conversation>(`/conversations/${conversationId}/assignment`, { assignedUserId }, { token });
}

export function updateConversationStatus(token: string, conversationId: string, status: string) {
  return api.patch<Conversation>(`/conversations/${conversationId}/status`, { status }, { token });
}

export function sendHumanReply(token: string, conversationId: string, message: string) {
  return api.post<{ message?: string }>(`/conversations/${conversationId}/human-reply`, { message }, { token });
}

export function startOutboundConversation(
  token: string,
  payload: {
    customerPhone: string;
    customerName: string | null;
    message: string;
    channelId: string | null;
  }
) {
  return api.post<{ message?: string; error?: string | null; status?: string; conversationId?: string }>("/conversations/outbound", payload, { token });
}
