import {
  deleteAutomationOption as deleteAutomationOptionRequest,
  deleteContact as deleteContactRequest,
  importContacts as importContactsRequest,
  saveAutomationOption as saveAutomationOptionRequest,
  saveBroadcast as saveBroadcastRequest,
  saveContact as saveContactRequest,
  saveConversationFeedback as saveConversationFeedbackRequest
} from "@features/clientes/services/clientesService";
import { resolveApiErrorMessage } from "@shared/utils/http";
import { splitTags } from "@shared/utils/formatting";
import type { AppPage, AuthResponse, AutomationOption, Contact, Conversation, WhatsAppChannel } from "@shared/types";
import { normalizePhone } from "@shared/utils/phone";

type ContactDraft = {
  name: string;
  phone: string;
  state: string;
  status: string;
  tags: string;
  ownerUserId: string;
};

type BroadcastDraft = {
  name: string;
  messageTemplate: string;
  scheduledAt: string;
  tagFilter: string;
};

type AutomationDraft = {
  name: string;
  triggerKeywords: string;
  responseTemplate: string;
  escalateToHuman: boolean;
  sortOrder: number;
  isActive: boolean;
};

type FeedbackDraft = {
  rating: number;
  comment: string;
};

type UseCrmWorkspaceActionsParams = {
  auth: AuthResponse | null;
  canManage: boolean;
  conversations: Conversation[];
  whatsAppChannels: WhatsAppChannel[];
  setSearch: (value: string) => void;
  setQueueFilter: (value: "ALL" | "WAITING_HUMAN" | "BOT" | "HUMAN") => void;
  setReply: (value: string) => void;
  setSelectedId: (value: string) => void;
  setOutboundDraft: (value: { customerName: string; customerPhone: string; channelId: string; message: string }) => void;
  setCurrentPage: (page: AppPage) => void;
  setNotice: (message: string) => void;
  setError: (message: string) => void;
  contactDraft: ContactDraft;
  setContactDraft: (value: ContactDraft) => void;
  editingContactId: string;
  setEditingContactId: (value: string) => void;
  contactImportRaw: string;
  setContactImportRaw: (value: string) => void;
  selectedBroadcastContacts: string[];
  setSelectedBroadcastContacts: (value: string[] | ((current: string[]) => string[])) => void;
  broadcastDraft: BroadcastDraft;
  setBroadcastDraft: (value: BroadcastDraft) => void;
  feedbackDraft: FeedbackDraft;
  setFeedbackDraft: (value: FeedbackDraft) => void;
  selectedConversation: Conversation | null;
  automationDraft: AutomationDraft;
  setAutomationDraft: (value: AutomationDraft) => void;
  editingAutomationId: string;
  setEditingAutomationId: (value: string) => void;
  loadCrm: (token?: string, role?: string) => Promise<void>;
};

const emptyContactDraft = { name: "", phone: "", state: "", status: "", tags: "", ownerUserId: "" };
const emptyBroadcastDraft = { name: "", messageTemplate: "", scheduledAt: "", tagFilter: "" };
const emptyAutomationDraft = { name: "", triggerKeywords: "", responseTemplate: "", escalateToHuman: false, sortOrder: 1, isActive: true };

export function useCrmWorkspaceActions({
  auth,
  canManage,
  conversations,
  whatsAppChannels,
  setSearch,
  setQueueFilter,
  setReply,
  setSelectedId,
  setOutboundDraft,
  setCurrentPage,
  setNotice,
  setError,
  contactDraft,
  setContactDraft,
  editingContactId,
  setEditingContactId,
  contactImportRaw,
  setContactImportRaw,
  selectedBroadcastContacts,
  setSelectedBroadcastContacts,
  broadcastDraft,
  setBroadcastDraft,
  feedbackDraft,
  setFeedbackDraft,
  selectedConversation,
  automationDraft,
  setAutomationDraft,
  editingAutomationId,
  setEditingAutomationId,
  loadCrm
}: UseCrmWorkspaceActionsParams) {
  function openInternalConversation(contact?: Contact) {
    setSearch("");
    setQueueFilter("ALL");
    setReply("");

    if (!contact) {
      setCurrentPage("ATTENDANCE");
      setNotice("Central de atendimento interna aberta.");
      return;
    }

    const matchedConversation = conversations.find(
      (conversation) => normalizePhone(conversation.customerPhone) === normalizePhone(contact.phone)
    );

    if (matchedConversation) {
      setSelectedId(matchedConversation.id);
      setCurrentPage("ATTENDANCE");
      setNotice(`Abrindo atendimento interno de ${contact.name}.`);
      return;
    }

    const defaultChannelId =
      whatsAppChannels.find((channel) => channel.isActive && channel.isPrimary)?.id ??
      whatsAppChannels.find((channel) => channel.isActive)?.id ??
      "";

    setSelectedId("");
    setOutboundDraft({
      customerName: contact.name,
      customerPhone: contact.phone,
      channelId: defaultChannelId,
      message: ""
    });
    setCurrentPage("ATTENDANCE");
    setNotice(`Contato ${contact.name} ainda nao tem conversa. Preenchemos o envio inicial dentro da plataforma.`);
  }

  function openMetaWhatsAppChannel() {
    openInternalConversation();
    setNotice("Canal WhatsApp via API da Meta aberto dentro da plataforma.");
  }

  async function saveContact() {
    if (!auth) {
      return;
    }

    if (!contactDraft.name.trim() || !contactDraft.phone.trim()) {
      setError("Preencha nome e telefone do contato.");
      return;
    }

    const isEditing = Boolean(editingContactId);

    try {
      await saveContactRequest(auth.token, {
        id: editingContactId || undefined,
        name: contactDraft.name,
        phone: contactDraft.phone,
        state: contactDraft.state || null,
        status: contactDraft.status || null,
        tags: splitTags(contactDraft.tags),
        ownerUserId: contactDraft.ownerUserId || null
      });
      setContactDraft(emptyContactDraft);
      setEditingContactId("");
      await loadCrm(auth.token, auth.role);
      setNotice(isEditing ? "Contato atualizado." : "Contato criado.");
    } catch (error) {
      setError(resolveApiErrorMessage(error, "Erro ao salvar contato."));
    }
  }

  function editContact(contact: Contact) {
    setEditingContactId(contact.id);
    setContactDraft({
      name: contact.name,
      phone: contact.phone,
      state: contact.state ?? "",
      status: contact.status ?? "",
      tags: contact.tags.join(", "),
      ownerUserId: ""
    });
    setCurrentPage("CRM");
  }

  function cancelContactEdit() {
    setEditingContactId("");
    setContactDraft(emptyContactDraft);
  }

  async function deleteContact(contactId: string) {
    if (!auth) {
      return;
    }

    try {
      await deleteContactRequest(auth.token, contactId);
      await loadCrm(auth.token, auth.role);
      setNotice("Contato excluido.");
    } catch (error) {
      setError(resolveApiErrorMessage(error, "Erro ao excluir contato."));
    }
  }

  async function importContacts() {
    if (!auth || !contactImportRaw.trim()) {
      return;
    }

    const contactsPayload = contactImportRaw
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => {
        const [name, phone, state, status, tags] = line.split(";");
        return {
          name: name?.trim() ?? "",
          phone: phone?.trim() ?? "",
          state: state?.trim() || null,
          status: status?.trim() || null,
          tags: splitTags(tags ?? ""),
          ownerUserId: null
        };
      })
      .filter((item) => item.name && item.phone);

    try {
      await importContactsRequest(auth.token, contactsPayload);
      setContactImportRaw("");
      await loadCrm(auth.token, auth.role);
      setNotice("Contatos importados.");
    } catch (error) {
      setError(resolveApiErrorMessage(error, "Erro ao importar contatos."));
    }
  }

  function toggleBroadcastContact(contactId: string) {
    setSelectedBroadcastContacts((current) => current.includes(contactId) ? current.filter((id) => id !== contactId) : [...current, contactId]);
  }

  async function saveBroadcast() {
    if (!auth || !canManage) {
      return;
    }

    if (!broadcastDraft.name.trim() || !broadcastDraft.messageTemplate.trim() || !broadcastDraft.scheduledAt) {
      setError("Preencha nome, mensagem e data do disparo.");
      return;
    }

    try {
      await saveBroadcastRequest(auth.token, {
        name: broadcastDraft.name,
        messageTemplate: broadcastDraft.messageTemplate,
        scheduledAt: new Date(broadcastDraft.scheduledAt).toISOString(),
        tagFilter: broadcastDraft.tagFilter || null,
        contactIds: selectedBroadcastContacts
      });
      setBroadcastDraft(emptyBroadcastDraft);
      setSelectedBroadcastContacts([]);
      await loadCrm(auth.token, auth.role);
      setNotice("Campanha agendada com sucesso.");
    } catch (error) {
      setError(resolveApiErrorMessage(error, "Erro ao agendar campanha."));
    }
  }

  async function saveConversationFeedback() {
    if (!auth || !selectedConversation) {
      return;
    }

    try {
      await saveConversationFeedbackRequest(auth.token, selectedConversation.id, {
        rating: feedbackDraft.rating,
        comment: feedbackDraft.comment || null
      });
      setFeedbackDraft({ rating: 5, comment: "" });
      await loadCrm(auth.token, auth.role);
      setNotice("Avaliacao registrada.");
    } catch (error) {
      setError(resolveApiErrorMessage(error, "Erro ao salvar avaliacao."));
    }
  }

  async function saveAutomationOption() {
    if (!auth || !canManage) {
      return;
    }

    if (!automationDraft.name.trim() || !automationDraft.triggerKeywords.trim() || !automationDraft.responseTemplate.trim()) {
      setError("Preencha nome, gatilhos e resposta do fluxo.");
      return;
    }

    const isEditing = Boolean(editingAutomationId);

    try {
      await saveAutomationOptionRequest(auth.token, {
        id: editingAutomationId || undefined,
        name: automationDraft.name,
        triggerKeywords: automationDraft.triggerKeywords,
        responseTemplate: automationDraft.responseTemplate,
        escalateToHuman: automationDraft.escalateToHuman,
        sortOrder: automationDraft.sortOrder,
        isActive: automationDraft.isActive
      });
      setEditingAutomationId("");
      setAutomationDraft(emptyAutomationDraft);
      await loadCrm(auth.token, auth.role);
      setNotice(isEditing ? "Fluxo atualizado." : "Fluxo criado.");
    } catch (error) {
      setError(resolveApiErrorMessage(error, "Erro ao salvar fluxo automatico."));
    }
  }

  function editAutomationOption(option: AutomationOption) {
    setEditingAutomationId(option.id);
    setAutomationDraft({
      name: option.name,
      triggerKeywords: option.triggerKeywords,
      responseTemplate: option.responseTemplate,
      escalateToHuman: option.escalateToHuman,
      sortOrder: option.sortOrder,
      isActive: option.isActive
    });
    setCurrentPage("CRM");
  }

  function cancelAutomationEdit() {
    setEditingAutomationId("");
    setAutomationDraft(emptyAutomationDraft);
  }

  async function deleteAutomationOption(optionId: string) {
    if (!auth || !canManage) {
      return;
    }

    try {
      await deleteAutomationOptionRequest(auth.token, optionId);
      await loadCrm(auth.token, auth.role);
      setNotice("Fluxo removido.");
    } catch (error) {
      setError(resolveApiErrorMessage(error, "Erro ao excluir fluxo automatico."));
    }
  }

  return {
    openInternalConversation,
    openMetaWhatsAppChannel,
    saveContact,
    editContact,
    cancelContactEdit,
    deleteContact,
    importContacts,
    toggleBroadcastContact,
    saveBroadcast,
    saveConversationFeedback,
    saveAutomationOption,
    editAutomationOption,
    cancelAutomationEdit,
    deleteAutomationOption
  };
}
