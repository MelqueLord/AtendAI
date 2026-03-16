import { useMemo, useState } from "react";
import type {
  AutomationOption,
  Contact,
  CustomerFeedback,
  QueueHealth,
  ScheduledBroadcast
} from "@shared/types";

const emptyContactDraft = { name: "", phone: "", state: "", status: "", tags: "", ownerUserId: "" };
const emptyBroadcastDraft = { name: "", messageTemplate: "", scheduledAt: "", tagFilter: "" };
const emptyAutomationDraft = {
  name: "",
  triggerKeywords: "",
  responseTemplate: "",
  escalateToHuman: false,
  sortOrder: 1,
  isActive: true
};

export function useCrmWorkspaceState() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [editingContactId, setEditingContactId] = useState("");
  const [contactDraft, setContactDraft] = useState(emptyContactDraft);
  const [contactImportRaw, setContactImportRaw] = useState("");
  const [selectedBroadcastContacts, setSelectedBroadcastContacts] = useState<string[]>([]);
  const [scheduledBroadcasts, setScheduledBroadcasts] = useState<ScheduledBroadcast[]>([]);
  const [broadcastDraft, setBroadcastDraft] = useState(emptyBroadcastDraft);
  const [queueHealth, setQueueHealth] = useState<QueueHealth | null>(null);
  const [feedbackList, setFeedbackList] = useState<CustomerFeedback[]>([]);
  const [automationOptions, setAutomationOptions] = useState<AutomationOption[]>([]);
  const [editingAutomationId, setEditingAutomationId] = useState("");
  const [automationDraft, setAutomationDraft] = useState(emptyAutomationDraft);
  const [contactSearch, setContactSearch] = useState("");
  const [contactStateFilter, setContactStateFilter] = useState("");
  const [contactStatusFilter, setContactStatusFilter] = useState("");
  const [contactTagFilter, setContactTagFilter] = useState("");

  const availableTags = useMemo(
    () => [...new Set(contacts.flatMap((contact) => contact.tags))].sort((left, right) => left.localeCompare(right)),
    [contacts]
  );

  const filteredContacts = useMemo(() => {
    const query = contactSearch.trim().toLowerCase();

    return contacts.filter((contact) => {
      const matchesQuery =
        !query ||
        contact.name.toLowerCase().includes(query) ||
        contact.phone.toLowerCase().includes(query) ||
        (contact.ownerName ?? "").toLowerCase().includes(query);
      const matchesState = !contactStateFilter || contact.state === contactStateFilter;
      const matchesStatus = !contactStatusFilter || contact.status === contactStatusFilter;
      const matchesTag = !contactTagFilter || contact.tags.includes(contactTagFilter);

      return matchesQuery && matchesState && matchesStatus && matchesTag;
    });
  }, [contactSearch, contactStateFilter, contactStatusFilter, contactTagFilter, contacts]);

  function resetCrmWorkspaceState() {
    setContacts([]);
    setEditingContactId("");
    setContactDraft(emptyContactDraft);
    setContactImportRaw("");
    setSelectedBroadcastContacts([]);
    setScheduledBroadcasts([]);
    setBroadcastDraft(emptyBroadcastDraft);
    setQueueHealth(null);
    setFeedbackList([]);
    setAutomationOptions([]);
    setEditingAutomationId("");
    setAutomationDraft(emptyAutomationDraft);
    setContactSearch("");
    setContactStateFilter("");
    setContactStatusFilter("");
    setContactTagFilter("");
  }

  return {
    contacts,
    setContacts,
    editingContactId,
    setEditingContactId,
    contactDraft,
    setContactDraft,
    contactImportRaw,
    setContactImportRaw,
    selectedBroadcastContacts,
    setSelectedBroadcastContacts,
    scheduledBroadcasts,
    setScheduledBroadcasts,
    broadcastDraft,
    setBroadcastDraft,
    queueHealth,
    setQueueHealth,
    feedbackList,
    setFeedbackList,
    automationOptions,
    setAutomationOptions,
    editingAutomationId,
    setEditingAutomationId,
    automationDraft,
    setAutomationDraft,
    contactSearch,
    setContactSearch,
    contactStateFilter,
    setContactStateFilter,
    contactStatusFilter,
    setContactStatusFilter,
    contactTagFilter,
    setContactTagFilter,
    availableTags,
    filteredContacts,
    resetCrmWorkspaceState
  };
}


