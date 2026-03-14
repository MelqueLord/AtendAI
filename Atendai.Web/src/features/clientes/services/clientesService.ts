import { api } from "@infrastructure/http/api";
import type { AutomationOption, Contact, CustomerFeedback, QueueHealth, ScheduledBroadcast } from "@shared/types";

export function fetchContacts(token: string) {
  return api.get<Contact[]>("/crm/contacts?pageSize=200", { token });
}

export function saveContact(
  token: string,
  payload: {
    id?: string;
    name: string;
    phone: string;
    state: string | null;
    status: string | null;
    tags: string[];
    ownerUserId: string | null;
  }
) {
  return payload.id
    ? api.put<Contact>(`/crm/contacts/${payload.id}`, payload, { token })
    : api.post<Contact>("/crm/contacts", payload, { token });
}

export function deleteContact(token: string, contactId: string) {
  return api.delete<null>(`/crm/contacts/${contactId}`, { token });
}

export function importContacts(
  token: string,
  contacts: Array<{
    name: string;
    phone: string;
    state: string | null;
    status: string | null;
    tags: string[];
    ownerUserId: string | null;
  }>
) {
  return api.post<null>("/crm/contacts/import", { contacts }, { token });
}

export async function fetchCrmSnapshot(token: string, includeAdminData: boolean) {
  const baseRequests = [
    fetchContacts(token),
    api.get<QueueHealth>("/crm/queue-health", { token }),
    api.get<CustomerFeedback[]>("/crm/feedback?limit=50", { token })
  ] as const;

  if (!includeAdminData) {
    const [contacts, queueHealth, feedback] = await Promise.all(baseRequests);
    return {
      contacts,
      queueHealth,
      feedback,
      broadcasts: [] as ScheduledBroadcast[],
      automationOptions: [] as AutomationOption[]
    };
  }

  const [contacts, queueHealth, feedback, broadcasts, automationOptions] = await Promise.all([
    ...baseRequests,
    api.get<ScheduledBroadcast[]>("/crm/broadcasts", { token }),
    api.get<AutomationOption[]>("/crm/automation-options", { token })
  ]);

  return { contacts, queueHealth, feedback, broadcasts, automationOptions };
}

export function saveBroadcast(
  token: string,
  payload: {
    name: string;
    messageTemplate: string;
    scheduledAt: string;
    tagFilter: string | null;
    contactIds: string[];
  }
) {
  return api.post<null>("/crm/broadcasts", payload, { token });
}

export function saveConversationFeedback(
  token: string,
  conversationId: string,
  payload: { rating: number; comment: string | null }
) {
  return api.post<null>(`/crm/conversations/${conversationId}/feedback`, payload, { token });
}

export function saveAutomationOption(
  token: string,
  payload: {
    id?: string;
    name: string;
    triggerKeywords: string;
    responseTemplate: string;
    escalateToHuman: boolean;
    sortOrder: number;
    isActive: boolean;
  }
) {
  return payload.id
    ? api.put<null>(`/crm/automation-options/${payload.id}`, {
        name: payload.name,
        triggerKeywords: payload.triggerKeywords,
        responseTemplate: payload.responseTemplate,
        escalateToHuman: payload.escalateToHuman,
        sortOrder: payload.sortOrder,
        isActive: payload.isActive
      }, { token })
    : api.post<null>("/crm/automation-options", {
        name: payload.name,
        triggerKeywords: payload.triggerKeywords,
        responseTemplate: payload.responseTemplate,
        escalateToHuman: payload.escalateToHuman,
        sortOrder: payload.sortOrder,
        isActive: payload.isActive
      }, { token });
}

export function deleteAutomationOption(token: string, optionId: string) {
  return api.delete<null>(`/crm/automation-options/${optionId}`, { token });
}
