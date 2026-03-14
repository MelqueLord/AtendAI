import { startTransition, useDeferredValue, useEffect, useMemo, useRef, useState } from "react";
import { type AuthView } from "@app/store";
import { env } from "@infrastructure/config/env";
import { createAttendanceHubConnection, type AttendanceRefreshPayload } from "@infrastructure/realtime/attendanceHub";
import {
  clearStoredAuth as clearPersistedAuth,
  persistAuth as persistStoredAuth,
  persistAuthView as persistStoredAuthView,
  persistPage as persistStoredPage,
  readStoredAuth as readPersistedAuth,
  readStoredAuthView as readPersistedAuthView,
  readStoredPage as readPersistedPage
} from "@infrastructure/storage/authStorage";
import { createTrainingEntry, fetchBotSettings, updateBotSettings } from "@features/ai/services/aiService";
import {
  assignConversation as assignConversationRequest,
  deleteQuickReply as deleteQuickReplyRequest,
  fetchConversationById,
  fetchConversationNotes as fetchConversationNotesRequest,
  fetchConversations as fetchConversationQueue,
  fetchQuickReplies as fetchQuickReplyTemplates,
  saveConversationNote as saveConversationNoteRequest,
  saveQuickReply as saveQuickReplyRequest,
  sendHumanReply as sendHumanReplyRequest,
  startOutboundConversation as startOutboundConversationRequest,
  updateConversationStatus as updateConversationStatusRequest
} from "@features/atendimentos/services/attendanceService";
import { AiWorkspace } from "@features/ai/pages/AiWorkspace";
import {
  deleteAutomationOption as deleteAutomationOptionRequest,
  deleteContact as deleteContactRequest,
  fetchContacts as fetchCrmContacts,
  fetchCrmSnapshot,
  importContacts as importContactsRequest,
  saveAutomationOption as saveAutomationOptionRequest,
  saveBroadcast as saveBroadcastRequest,
  saveContact as saveContactRequest,
  saveConversationFeedback as saveConversationFeedbackRequest
} from "@features/clientes/services/clientesService";
import { InboxWorkspace } from "@features/atendimentos/pages/InboxWorkspace";
import { CrmWorkspace } from "@features/clientes/pages/CrmWorkspace";
import {
  fetchAnalyticsOverview,
  fetchBillingSubscription,
  fetchCommercialSnapshot,
  subscribeToPlan
} from "@features/dashboard/services/dashboardService";
import { CommercialWorkspace } from "@features/dashboard/pages/CommercialWorkspace";
import {
  deleteManagedCompany as deleteManagedCompanyRequest,
  fetchManagedCompanies,
  saveManagedCompany
} from "@features/empresas/services/companyManagementService";
import { CompaniesWorkspace } from "@features/empresas/pages/CompaniesWorkspace";
import { PricingLanding } from "@features/public/pages/PricingLanding";
import {
  fetchTenants,
  loginRequest,
  logoutRequest,
  refreshSession,
  switchTenantRequest
} from "@features/auth/services/authService";
import {
  deleteManagedUser as deleteManagedUserRequest,
  fetchManagedUsers as fetchManagedUsersRequest,
  saveManagedUser
} from "@features/usuarios/services/userManagementService";
import { UsersWorkspace } from "@features/usuarios/pages/UsersWorkspace";
import {
  deleteCampaign as deleteCampaignRequest,
  deleteChannel as deleteChannelRequest,
  fetchWhatsAppSnapshot,
  saveCampaign as saveCampaignRequest,
  saveChannel as saveChannelRequest,
  saveWhatsAppConfig as saveWhatsAppConfigRequest,
  testChannel as testChannelRequest,
  testWhatsAppConfig as testWhatsAppConfigRequest
} from "@features/whatsapp/services/whatsappManagementService";
import { WhatsAppWorkspace } from "@features/whatsapp/pages/WhatsAppWorkspace";
import { validateLoginInput } from "@features/auth/validations/loginSchema";
import { pageMeta, contactStatusOptions, stateOptions, campaignDelayOptions, automationPriorityOptions } from "@shared/constants/workspace";
import { resolveCustomerDisplayName } from "@shared/utils/customer";
import { formatCurrency, formatDate, formatSeconds, splitTags } from "@shared/utils/formatting";
import { extractApiErrorData, isAbortError, resolveApiErrorMessage } from "@shared/utils/http";
import { normalizePhone } from "@shared/utils/phone";
import type {
  AppPage,
  AnalyticsOverview,
  AuthResponse,
  AutomationOption,
  BillingPlan,
  BillingSubscription,
  BotSettings,
  CampaignRule,
  Contact,
  Conversation,
  ConversationNote,
  CustomerFeedback,
  ManagedCompany,
  ManagedUser,
  QueueFilter,
  QueueHealth,
  QuickReplyTemplate,
  ScheduledBroadcast,
  TenantOption,
  TrainingEntry,
  ValueMetrics,
  WhatsAppChannel,
  WhatsAppChannelsPayload,
  WhatsAppConnection,
  WhatsAppLog
} from "@shared/types";

const apiBase = env.apiBaseUrl;
const SESSION_REFRESH_SKEW_MS = 60_000;

export function AppRouter() {
  const [auth, setAuth] = useState<AuthResponse | null>(null);
  const [sessionReady, setSessionReady] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [loading, setLoading] = useState(false);
  const [authView, setAuthView] = useState<AuthView>(() => readStoredAuthView());

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
  const [outboundDraft, setOutboundDraft] = useState({ customerName: "", customerPhone: "", channelId: "", message: "" });
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
  const [attendanceRealtimeState, setAttendanceRealtimeState] = useState<"connecting" | "connected" | "reconnecting" | "fallback" | "disconnected">("disconnected");
  const [attendanceRealtimeLastPublishedAt, setAttendanceRealtimeLastPublishedAt] = useState<string | null>(null);
  const [attendanceRealtimeLastReceivedAt, setAttendanceRealtimeLastReceivedAt] = useState<string | null>(null);

  const [settings, setSettings] = useState<BotSettings | null>(null);
  const [settingsDraft, setSettingsDraft] = useState({
    businessName: "",
    welcomeMessage: "",
    humanFallbackMessage: ""
  });

  const [trainingKeyword, setTrainingKeyword] = useState("");
  const [trainingAnswer, setTrainingAnswer] = useState("");

  const [tenants, setTenants] = useState<TenantOption[]>([]);
  const [switchingTenant, setSwitchingTenant] = useState(false);

  const [managedCompanies, setManagedCompanies] = useState<ManagedCompany[]>([]);
  const [managedUsers, setManagedUsers] = useState<ManagedUser[]>([]);

  const [companyDraft, setCompanyDraft] = useState({ name: "", segment: "" });
  const [editingCompanyId, setEditingCompanyId] = useState("");

  const [userDraft, setUserDraft] = useState({
    tenantId: "",
    name: "",
    email: "",
    role: "Agent",
    password: ""
  });
  const [editingUserId, setEditingUserId] = useState("");

  const [analytics, setAnalytics] = useState<AnalyticsOverview | null>(null);
  const [billingPlans, setBillingPlans] = useState<BillingPlan[]>([]);
  const [billingSubscription, setBillingSubscription] = useState<BillingSubscription | null>(null);
  const [valueMetrics, setValueMetrics] = useState<ValueMetrics | null>(null);
  const [whatsAppConfig, setWhatsAppConfig] = useState<WhatsAppConnection | null>(null);
  const [whatsAppDraft, setWhatsAppDraft] = useState({
    wabaId: "",
    phoneNumberId: "",
    verifyToken: "",
    accessToken: "",
    isActive: true
  });
  const [campaigns, setCampaigns] = useState<CampaignRule[]>([]);
  const [campaignDraft, setCampaignDraft] = useState({
    id: "",
    name: "",
    delayHours: 24,
    template: "",
    isActive: true
  });
  const [whatsAppLogs, setWhatsAppLogs] = useState<WhatsAppLog[]>([]);
  const [whatsAppChannels, setWhatsAppChannels] = useState<WhatsAppChannel[]>([]);
  const [whatsAppChannelLimit, setWhatsAppChannelLimit] = useState(0);
  const [editingChannelId, setEditingChannelId] = useState("");
  const [channelDraft, setChannelDraft] = useState({
    displayName: "",
    wabaId: "",
    phoneNumberId: "",
    verifyToken: "",
    accessToken: "",
    isActive: true,
    isPrimary: false
  });
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [editingContactId, setEditingContactId] = useState("");
  const [contactDraft, setContactDraft] = useState({
    name: "",
    phone: "",
    state: "",
    status: "",
    tags: "",
    ownerUserId: ""
  });
  const [contactImportRaw, setContactImportRaw] = useState("");
  const [selectedBroadcastContacts, setSelectedBroadcastContacts] = useState<string[]>([]);
  const [scheduledBroadcasts, setScheduledBroadcasts] = useState<ScheduledBroadcast[]>([]);
  const [broadcastDraft, setBroadcastDraft] = useState({
    name: "",
    messageTemplate: "",
    scheduledAt: "",
    tagFilter: ""
  });
  const [queueHealth, setQueueHealth] = useState<QueueHealth | null>(null);
  const [feedbackList, setFeedbackList] = useState<CustomerFeedback[]>([]);
  const [feedbackDraft, setFeedbackDraft] = useState({ rating: 5, comment: "" });
  const [conversationNotes, setConversationNotes] = useState<ConversationNote[]>([]);
  const [noteDraft, setNoteDraft] = useState("");
  const [quickReplies, setQuickReplies] = useState<QuickReplyTemplate[]>([]);
  const [quickReplyDraft, setQuickReplyDraft] = useState({ id: "", title: "", body: "" });
  const [conversationContactDraft, setConversationContactDraft] = useState({
    id: "",
    name: "",
    phone: "",
    state: "",
    status: "",
    tags: "",
    ownerUserId: ""
  });
  const [automationOptions, setAutomationOptions] = useState<AutomationOption[]>([]);
  const [editingAutomationId, setEditingAutomationId] = useState("");
  const [automationDraft, setAutomationDraft] = useState({
    name: "",
    triggerKeywords: "",
    responseTemplate: "",
    escalateToHuman: false,
    sortOrder: 1,
    isActive: true
  });
  const [userSearch, setUserSearch] = useState("");
  const [userRoleFilter, setUserRoleFilter] = useState("");
  const [userTenantFilter, setUserTenantFilter] = useState("");
  const [companySearch, setCompanySearch] = useState("");
  const [companySegmentFilter, setCompanySegmentFilter] = useState("");
  const [contactSearch, setContactSearch] = useState("");
  const [contactStateFilter, setContactStateFilter] = useState("");
  const [contactStatusFilter, setContactStatusFilter] = useState("");
  const [contactTagFilter, setContactTagFilter] = useState("");

  const [currentPage, setCurrentPage] = useState<AppPage>(() => readStoredPage());
  const deferredSearch = useDeferredValue(search);

  const canManage = auth?.role === "Admin" || auth?.role === "SuperAdmin";
  const canManageCompanies = auth?.role === "SuperAdmin";
  const workspaceName = settings?.businessName?.trim() || auth?.tenantName || "Workspace";
  const workspacePlanName = billingSubscription?.planName?.trim() || "Sem plano contratado";
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
    () => conversationsWithResolvedNames.find((c) => c.id === selectedId) ?? null,
    [conversationsWithResolvedNames, selectedId]
  );

  const selectedConversation = useMemo(
    () => {
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
    },
    [contactNameByPhone, selectedConversationDetail, selectedConversationSummary, selectedId]
  );

  const selectedContact = useMemo(() => {
    if (!selectedConversation) {
      return null;
    }

    return contacts.find((contact) => normalizePhone(contact.phone) === normalizePhone(selectedConversation.customerPhone)) ?? null;
  }, [contacts, selectedConversation]);

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

    void loadConversationNotes(selectedConversation.id, auth?.token, { background: Boolean(cachedNotes) });
  }, [auth?.token, managedUsers, selectedContact, selectedConversation]);

  const queue = useMemo(() => {
    const query = deferredSearch.trim().toLowerCase();

    return conversationsWithResolvedNames.filter((conversation) => {
      const status = normalizeStatus(conversation.status);
      const filterMatch =
        queueFilter === "ALL" ||
        (queueFilter === "WAITING_HUMAN" && status === "WaitingHuman") ||
        (queueFilter === "BOT" && status === "BotHandling") ||
        (queueFilter === "HUMAN" && status === "HumanHandling");

      if (!filterMatch) return false;
      if (!query) return true;

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
    setAttendanceRealtimeLastPublishedAt(null);
    setAttendanceRealtimeLastReceivedAt(null);
  }

  const availableTags = useMemo(() => {
    return [...new Set(contacts.flatMap((contact) => contact.tags))].sort((left, right) => left.localeCompare(right));
  }, [contacts]);
  const availableSegments = useMemo(() => {
    return [...new Set(managedCompanies.map((company) => company.segment).filter(Boolean))].sort((left, right) => left.localeCompare(right));
  }, [managedCompanies]);
  const filteredUsers = useMemo(() => {
    const query = userSearch.trim().toLowerCase();

    return managedUsers.filter((managedUser) => {
      const matchesQuery =
        !query ||
        managedUser.name.toLowerCase().includes(query) ||
        managedUser.email.toLowerCase().includes(query) ||
        managedUser.tenantName.toLowerCase().includes(query);
      const matchesRole = !userRoleFilter || managedUser.role === userRoleFilter;
      const matchesTenant = !userTenantFilter || managedUser.tenantId === userTenantFilter;

      return matchesQuery && matchesRole && matchesTenant;
    });
  }, [managedUsers, userRoleFilter, userSearch, userTenantFilter]);
  const filteredCompanies = useMemo(() => {
    const query = companySearch.trim().toLowerCase();

    return managedCompanies.filter((company) => {
      const matchesQuery =
        !query ||
        company.name.toLowerCase().includes(query) ||
        company.segment.toLowerCase().includes(query);
      const matchesSegment = !companySegmentFilter || company.segment === companySegmentFilter;

      return matchesQuery && matchesSegment;
    });
  }, [companySearch, companySegmentFilter, managedCompanies]);
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

  const trendMax = useMemo(() => {
    const values = analytics?.last7Days.map((p) => p.total) ?? [];
    return Math.max(1, ...values);
  }, [analytics]);

  useEffect(() => {
    if (!notice) return;
    const timer = setTimeout(() => setNotice(""), 3500);
    return () => clearTimeout(timer);
  }, [notice]);

  useEffect(() => {
    if (!error) return;
    const timer = setTimeout(() => setError(""), 8000);
    return () => clearTimeout(timer);
  }, [error]);

  useEffect(() => {
    let cancelled = false;

    async function restoreSession() {
      const storedAuth = readStoredAuth();
      if (!storedAuth) {
        if (!cancelled) {
          setSessionReady(true);
        }
        return;
      }

      if (!isSessionExpired(storedAuth.expiresAtUtc)) {
        if (!cancelled) {
          setAuth(storedAuth);
          setSessionReady(true);
        }
        return;
      }

      if (!storedAuth.refreshToken) {
        clearStoredAuth();
        if (!cancelled) {
          setAuth(null);
          setAuthView("LOGIN");
          setSessionReady(true);
        }
        return;
      }

      try {
        const data = await refreshSession(storedAuth.refreshToken);
        if (!cancelled) {
          setAuth(data);
        }
      } catch {
        clearStoredAuth();
        if (!cancelled) {
          setAuth(null);
          setAuthView("LOGIN");
          setError("Nao foi possivel restaurar sua sessao automaticamente.");
        }
      } finally {
        if (!cancelled) {
          setSessionReady(true);
        }
      }
    }

    void restoreSession();
    return () => {
      cancelled = true;
    };
  }, []);
  useEffect(() => {
    if (!sessionReady) return;
    persistAuth(auth);
  }, [auth]);

  useEffect(() => {
    if (!sessionReady) return;
    persistAuthView(authView);
  }, [authView, sessionReady]);

  useEffect(() => {
    if (!sessionReady || !auth) return;
    persistPage(currentPage);
  }, [auth, currentPage, sessionReady]);

  useEffect(() => {
    if (!auth) return;

    setUserDraft((prev) => ({ ...prev, tenantId: auth.tenantId || prev.tenantId }));
    setCurrentPage((current) => isPageAllowedForRole(current, auth.role) ? current : defaultPageForRole(auth.role));
  }, [auth]);

  useEffect(() => {
    if (!auth?.token) {
      return;
    }

    void loadPageData(currentPage, auth.token, auth.role, auth.tenantId);
  }, [auth?.tenantId, auth?.role, auth?.token, currentPage]);

  useEffect(() => {
    selectedIdRef.current = selectedId;
  }, [selectedId]);

  useEffect(() => {
    if (!auth?.token || !selectedId) {
      setSelectedConversationDetail(null);
      setAttendanceConversationLoading(false);
      return;
    }

    const cachedConversation = conversationDetailCacheRef.current.get(selectedId);
    if (cachedConversation) {
      setSelectedConversationDetail(cachedConversation);
    }

    void loadConversationDetail(selectedId, auth.token, { background: Boolean(cachedConversation) });
  }, [auth?.token, selectedId]);

  useEffect(() => {
    if (!auth?.token || currentPage !== "ATTENDANCE") {
      setAttendanceRealtimeState("disconnected");
      return;
    }

    let cancelled = false;
    let fallbackActivated = false;
    const connection = createAttendanceHubConnection(apiBase, auth.token);
    const refreshFromRealtime = async (payload?: AttendanceRefreshPayload) => {
      if (cancelled) {
        return;
      }

      if (payload?.publishedAtUtc) {
        setAttendanceRealtimeLastPublishedAt(payload.publishedAtUtc);
      }
      setAttendanceRealtimeLastReceivedAt(new Date().toISOString());

      if (payload?.conversationId) {
        const refreshedConversation = await loadConversationDetail(payload.conversationId, auth.token, { background: true });
        if (!refreshedConversation) {
          await loadConversations(auth.token, { background: true });
        }

        if (payload.conversationId === selectedIdRef.current) {
          await loadConversationNotes(payload.conversationId, auth.token, { background: true });
        }

        return;
      }

      await loadConversations(auth.token, { background: true });
      if (selectedIdRef.current) {
        await Promise.all([
          loadConversationDetail(selectedIdRef.current, auth.token, { background: true }),
          loadConversationNotes(selectedIdRef.current, auth.token, { background: true })
        ]);
      }
    };

    connection.on("attendance:refresh", (payload?: AttendanceRefreshPayload) => {
      void refreshFromRealtime(payload);
    });

    connection.onreconnecting(() => {
      if (!cancelled) {
        setAttendanceRealtimeState("reconnecting");
      }
    });

    connection.onreconnected(() => {
      if (!cancelled) {
        fallbackActivated = false;
        setAttendanceRealtimeState("connected");
      }
    });

    connection.onclose(() => {
      if (!cancelled) {
        setAttendanceRealtimeState("fallback");
      }
    });

    setAttendanceRealtimeState("connecting");
    void connection.start().then(() => {
      if (!cancelled) {
        fallbackActivated = false;
        setAttendanceRealtimeState("connected");
      }
    }).catch(() => {
      if (!cancelled) {
        fallbackActivated = true;
        setAttendanceRealtimeState("fallback");
      }
    });

    const interval = window.setInterval(() => {
      if (!cancelled && connection.state !== "Connected") {
        fallbackActivated = true;
        setAttendanceRealtimeState("fallback");
      }
      void refreshFromRealtime();
    }, 30000);

    return () => {
      cancelled = true;
      window.clearInterval(interval);
      connection.off("attendance:refresh");
      void connection.stop();
    };
  }, [auth?.token, currentPage]);

  async function login() {
    setLoading(true);
    setError("");

    const validationMessage = validateLoginInput(email, password);
    if (validationMessage) {
      setError(validationMessage);
      setLoading(false);
      return;
    }

    try {
      const data = await loginRequest(email, password);
      const targetPage = defaultPageForRole(data.role);
      resetAttendanceUiState();
      setAuth(data);
      setCurrentPage(targetPage);
      setAuthView("LOGIN");
      if (data.role === "SuperAdmin") {
        await loadTenants(data.token);
      }

      await Promise.all([
        loadBillingSubscriptionSnapshot(data.token, data.role),
        loadPageData(targetPage, data.token, data.role, data.tenantId, true)
      ]);

      setNotice("Sessao autenticada com sucesso.");
    } catch (error) {
      setError(resolveApiErrorMessage(error, "Nao foi possivel conectar na API."));
    } finally {
      setLoading(false);
    }
  }

  async function refreshAll(token = auth?.token, role = auth?.role, tenantId = auth?.tenantId) {
    if (!token) return;

    await Promise.all([
      loadConversations(token),
      loadSettings(token, role),
      loadAnalytics(token),
      loadManagedUsers(token, role, tenantId),
      loadCommercial(token, role),
      loadEngagement(token, role),
      loadCrm(token, role),
      loadQuickReplies(token)
    ]);

    if (role === "SuperAdmin") {
      await Promise.all([loadTenants(token), loadManagedCompanies(token)]);
    }
  }

  async function loadBillingSubscriptionSnapshot(token = auth?.token, role = auth?.role) {
    if (!token) {
      return;
    }

    try {
      setBillingSubscription(await fetchBillingSubscription(token));
    } catch {
      // keep the last known subscription in the UI if this lightweight fetch fails
    }
  }

  async function loadPageData(page: AppPage, token = auth?.token, role = auth?.role, tenantId = auth?.tenantId, force = false) {
    if (!token || !role) return;

    const tasks: Array<Promise<void>> = [];

    if (force || !billingSubscription) {
      tasks.push(loadBillingSubscriptionSnapshot(token, role));
    }

    if (force || !settings) {
      tasks.push(loadSettings(token, role));
    }

    if (force || !analytics) {
      tasks.push(loadAnalytics(token));
    }

    if (role === "SuperAdmin" && (force || tenants.length === 0)) {
      tasks.push(loadTenants(token));
    }

    switch (page) {
      case "ATTENDANCE":
        tasks.push(loadConversations(token), loadQuickReplies(token), loadAttendanceContactsIndex(token));
        if (role !== "Agent") {
          tasks.push(loadManagedUsers(token, role, tenantId));
        }
        break;
      case "AI":
        tasks.push(loadSettings(token, role));
        break;
      case "USERS":
        tasks.push(loadManagedUsers(token, role, tenantId));
        if (role === "SuperAdmin") {
          tasks.push(loadTenants(token));
        }
        break;
      case "COMMERCIAL":
        tasks.push(loadCommercial(token, role));
        if (role === "SuperAdmin") {
          tasks.push(loadTenants(token));
        }
        break;
      case "WHATSAPP":
        tasks.push(loadEngagement(token, role));
        break;
      case "CRM":
        tasks.push(loadCrm(token, role));
        if (role !== "Agent") {
          tasks.push(loadManagedUsers(token, role, tenantId));
        }
        break;
      case "COMPANIES":
        tasks.push(loadManagedCompanies(token));
        if (role === "SuperAdmin") {
          tasks.push(loadTenants(token));
        }
        break;
      default:
        break;
    }

    if (tasks.length > 0) {
      await Promise.all(tasks);
    }
  }

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

  async function loadConversations(token = auth?.token, options?: { background?: boolean }) {
    if (!token) return;

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
        return cachedConversation
          ? { ...conversation, messages: cachedConversation.messages }
          : conversation;
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

  async function loadAttendanceContactsIndex(token = auth?.token) {
    if (!token) return;

    try {
      setContacts(await fetchCrmContacts(token));
    } catch {
      // Attendance still works with persisted conversation names if this lightweight contact index fails.
    }
  }

  async function loadConversationDetail(
    conversationId: string,
    token = auth?.token,
    options?: { background?: boolean }
  ): Promise<Conversation | null> {
    if (!token || !conversationId) return null;

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

  async function refreshInboxOnly(token = auth?.token) {
    if (!token) return;

    const activeConversationId = selectedIdRef.current;
    await loadConversations(token, { background: true });
    if (activeConversationId) {
      await Promise.all([
        loadConversationDetail(activeConversationId, token, { background: true }),
        loadConversationNotes(activeConversationId, token, { background: true })
      ]);
    }
  }

  async function loadConversationNotes(
    conversationId: string,
    token = auth?.token,
    options?: { background?: boolean }
  ) {
    if (!token || !conversationId) return;

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

  function applyOptimisticConversationUpdate(
    conversationId: string,
    updater: (conversation: Conversation) => Conversation
  ) {
    const previousConversation = getConversationSnapshot(conversationId);
    if (!previousConversation) {
      return null;
    }

    const nextConversation = updater(previousConversation);
    mergeConversationIntoAttendanceState(nextConversation);
    return previousConversation;
  }

  async function loadQuickReplies(token = auth?.token) {
    if (!token) return;

    try {
      setQuickReplies(await fetchQuickReplyTemplates(token));
    } catch {
      setQuickReplies([]);
    }
  }
  async function loadSettings(token = auth?.token, role = auth?.role) {
    if (!token || (role !== "Admin" && role !== "SuperAdmin")) return;

    try {
      const data = await fetchBotSettings(token);
      setSettings(data);
      setSettingsDraft({
        businessName: data.businessName,
        welcomeMessage: data.welcomeMessage,
        humanFallbackMessage: data.humanFallbackMessage
      });
    } catch (error) {
      setError(resolveApiErrorMessage(error, "Erro ao carregar configuracoes."));
    }
  }

  async function loadAnalytics(token = auth?.token) {
    if (!token) return;

    try {
      setAnalytics(await fetchAnalyticsOverview(token));
    } catch (error) {
      setError(resolveApiErrorMessage(error, "Erro ao carregar metricas."));
    }
  }

  async function loadTenants(token = auth?.token) {
    if (!token) return;

    try {
      setTenants(await fetchTenants(token));
    } catch (error) {
      setError(resolveApiErrorMessage(error, "Erro ao carregar tenants."));
    }
  }

  async function loadManagedCompanies(token = auth?.token) {
    if (!token) return;

    try {
      setManagedCompanies(await fetchManagedCompanies(token));
    } catch (error) {
      setError(resolveApiErrorMessage(error, "Erro ao carregar empresas."));
    }
  }

  async function loadManagedUsers(token = auth?.token, role = auth?.role, tenantId = auth?.tenantId) {
    if (!token || !role || role === "Agent") {
      setManagedUsers([]);
      return;
    }

    try {
      setManagedUsers(await fetchManagedUsersRequest(token, role, tenantId));
    } catch (error) {
      setError(resolveApiErrorMessage(error, "Erro ao carregar usuarios."));
    }
  }

  async function loadCommercial(token = auth?.token, role = auth?.role) {
    if (!token || (role !== "Admin" && role !== "SuperAdmin")) return;

    try {
      const snapshot = await fetchCommercialSnapshot(token);
      setBillingPlans(snapshot.plans);
      setBillingSubscription(snapshot.subscription);
      setValueMetrics(snapshot.valueMetrics);
    } catch (error) {
      setError(resolveApiErrorMessage(error, "Erro ao carregar dados comerciais."));
    }
  }


  async function loadEngagement(token = auth?.token, role = auth?.role) {
    if (!token || (role !== "Admin" && role !== "SuperAdmin")) return;

    try {
      const snapshot = await fetchWhatsAppSnapshot(token);
      const config = snapshot.config;
      setWhatsAppConfig(config);
      if (config) {
        setWhatsAppDraft((prev) => ({
          ...prev,
          wabaId: config.wabaId ?? "",
          phoneNumberId: config.phoneNumberId ?? "",
          verifyToken: config.verifyToken ?? "",
          accessToken: "",
          isActive: config.isActive
        }));
      }

      const channelsPayload = snapshot.channelsPayload;
      setWhatsAppChannels(channelsPayload?.channels ?? []);
      setWhatsAppChannelLimit(channelsPayload?.allowed ?? 0);

      setCampaigns(snapshot.campaigns ?? []);
      setWhatsAppLogs(snapshot.logs ?? []);
    } catch (error) {
      setError(resolveApiErrorMessage(error, "Erro ao carregar configuracoes de WhatsApp e campanhas."));
    }
  }

  async function loadCrm(token = auth?.token, role = auth?.role) {
    if (!token || !role) return;

    try {
      const snapshot = await fetchCrmSnapshot(token, role === "Admin" || role === "SuperAdmin");
      setContacts(snapshot.contacts ?? []);
      setQueueHealth(snapshot.queueHealth ?? null);
      setFeedbackList(snapshot.feedback ?? []);
      setScheduledBroadcasts(snapshot.broadcasts ?? []);
      setAutomationOptions(snapshot.automationOptions ?? []);
    } catch (error) {
      setError(resolveApiErrorMessage(error, "Erro ao carregar dados de CRM."));
    }
  }

  async function subscribePlan(planCode: string) {
    if (!auth || !canManage) return;

    try {
      setBillingSubscription(await subscribeToPlan(auth.token, planCode));
      await Promise.all([
        loadCommercial(auth.token, auth.role),
        loadEngagement(auth.token, auth.role)
      ]);
      setNotice("Plano atualizado com sucesso e limites de WhatsApp atualizados.");
    } catch (error) {
      setError(resolveApiErrorMessage(error, "Erro ao atualizar plano."));
    }
  }
  async function saveWhatsAppConfig() {
    if (!auth || !canManage) return;
    if (!whatsAppDraft.phoneNumberId.trim() || !whatsAppDraft.verifyToken.trim()) {
      setError("Phone Number ID e Verify Token sao obrigatorios.");
      return;
    }

    try {
      setWhatsAppConfig(await saveWhatsAppConfigRequest(auth.token, {
        wabaId: whatsAppDraft.wabaId || null,
        phoneNumberId: whatsAppDraft.phoneNumberId,
        verifyToken: whatsAppDraft.verifyToken,
        accessToken: whatsAppDraft.accessToken || null,
        isActive: whatsAppDraft.isActive
      }));
      setWhatsAppDraft((prev) => ({ ...prev, accessToken: "" }));
      await loadEngagement(auth.token, auth.role);
      setNotice("Configuracao do WhatsApp salva.");
    } catch (error) {
      setError(resolveApiErrorMessage(error, "Erro ao salvar configuracao do WhatsApp."));
    }
  }

  async function testWhatsAppConfig() {
    if (!auth || !canManage) return;

    try {
      const data = await testWhatsAppConfigRequest(auth.token);
      setNotice(data.success ? "WhatsApp conectado com sucesso." : `Teste falhou: ${data.error ?? data.status}`);
      await loadEngagement(auth.token, auth.role);
    } catch (error) {
      setError(resolveApiErrorMessage(error, "Erro ao testar conexao com WhatsApp."));
    }
  }

  async function saveCampaign() {
    if (!auth || !canManage) return;

    if (!campaignDraft.name.trim() || !campaignDraft.template.trim() || campaignDraft.delayHours < 1) {
      setError("Preencha nome, template e delay >= 1 hora.");
      return;
    }

    const isEditing = Boolean(campaignDraft.id);

    try {
      await saveCampaignRequest(auth.token, {
        id: campaignDraft.id || undefined,
        name: campaignDraft.name,
        delayHours: campaignDraft.delayHours,
        template: campaignDraft.template,
        isActive: campaignDraft.isActive
      });
      setCampaignDraft({ id: "", name: "", delayHours: 24, template: "", isActive: true });
      await loadEngagement(auth.token, auth.role);
      setNotice(isEditing ? "Campanha atualizada." : "Campanha criada.");
    } catch (error) {
      setError(resolveApiErrorMessage(error, "Erro ao salvar campanha."));
    }
  }

  function editCampaign(campaign: CampaignRule) {
    setCampaignDraft({
      id: campaign.id,
      name: campaign.name,
      delayHours: campaign.delayHours,
      template: campaign.template,
      isActive: campaign.isActive
    });
  }

  async function deleteCampaign(ruleId: string) {
    if (!auth || !canManage) return;

    try {
      await deleteCampaignRequest(auth.token, ruleId);
      await loadEngagement(auth.token, auth.role);
      setNotice("Campanha excluida.");
    } catch (error) {
      setError(resolveApiErrorMessage(error, "Erro ao excluir campanha."));
    }
  }
  async function saveChannel() {
    if (!auth || !canManage) return;
    if (!channelDraft.displayName.trim() || !channelDraft.phoneNumberId.trim() || !channelDraft.verifyToken.trim()) {
      setError("Preencha nome do canal, Phone Number ID e Verify Token.");
      return;
    }

    const isEditing = Boolean(editingChannelId);

    try {
      await saveChannelRequest(auth.token, {
        id: editingChannelId || undefined,
        displayName: channelDraft.displayName,
        wabaId: channelDraft.wabaId || null,
        phoneNumberId: channelDraft.phoneNumberId,
        verifyToken: channelDraft.verifyToken,
        accessToken: channelDraft.accessToken || null,
        isActive: channelDraft.isActive,
        isPrimary: channelDraft.isPrimary
      });
      setChannelDraft({ displayName: "", wabaId: "", phoneNumberId: "", verifyToken: "", accessToken: "", isActive: true, isPrimary: false });
      setEditingChannelId("");
      await loadEngagement(auth.token, auth.role);
      setNotice(isEditing ? "Canal atualizado." : "Canal adicionado.");
    } catch (error) {
      setError(resolveApiErrorMessage(error, "Erro ao salvar canal WhatsApp."));
    }
  }

  function editChannel(channel: WhatsAppChannel) {
    setEditingChannelId(channel.id);
    setChannelDraft({
      displayName: channel.displayName,
      wabaId: channel.wabaId ?? "",
      phoneNumberId: channel.phoneNumberId,
      verifyToken: channel.verifyToken,
      accessToken: "",
      isActive: channel.isActive,
      isPrimary: channel.isPrimary
    });
    setCurrentPage("WHATSAPP");
  }

  function cancelChannelEdit() {
    setEditingChannelId("");
    setChannelDraft({ displayName: "", wabaId: "", phoneNumberId: "", verifyToken: "", accessToken: "", isActive: true, isPrimary: false });
  }

  async function deleteChannel(channelId: string) {
    if (!auth || !canManage) return;

    try {
      await deleteChannelRequest(auth.token, channelId);
      await loadEngagement(auth.token, auth.role);
      setNotice("Canal removido.");
    } catch (error) {
      setError(resolveApiErrorMessage(error, "Erro ao excluir canal WhatsApp."));
    }
  }

  async function testChannel(channelId: string) {
    if (!auth || !canManage) return;

    try {
      const data = await testChannelRequest(auth.token, channelId);
      setNotice(data.success ? "Canal testado com sucesso." : `Teste falhou: ${data.error ?? data.status}`);
      await loadEngagement(auth.token, auth.role);
    } catch (error) {
      setError(resolveApiErrorMessage(error, "Erro ao testar canal WhatsApp."));
    }
  }

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
    if (!auth) return;
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
      setContactDraft({ name: "", phone: "", state: "", status: "", tags: "", ownerUserId: "" });
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
    setContactDraft({ name: "", phone: "", state: "", status: "", tags: "", ownerUserId: "" });
  }

  async function deleteContact(contactId: string) {
    if (!auth) return;

    try {
      await deleteContactRequest(auth.token, contactId);
      await loadCrm(auth.token, auth.role);
      setNotice("Contato excluido.");
    } catch (error) {
      setError(resolveApiErrorMessage(error, "Erro ao excluir contato."));
    }
  }

  async function importContacts() {
    if (!auth || !contactImportRaw.trim()) return;

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
    setSelectedBroadcastContacts((prev) => prev.includes(contactId) ? prev.filter((id) => id !== contactId) : [...prev, contactId]);
  }

  async function saveBroadcast() {
    if (!auth || !canManage) return;
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
      setBroadcastDraft({ name: "", messageTemplate: "", scheduledAt: "", tagFilter: "" });
      setSelectedBroadcastContacts([]);
      await loadCrm(auth.token, auth.role);
      setNotice("Campanha agendada com sucesso.");
    } catch (error) {
      setError(resolveApiErrorMessage(error, "Erro ao agendar campanha."));
    }
  }

  async function saveConversationFeedback() {
    if (!auth || !selectedConversation) return;

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
    if (!auth || !canManage) return;
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
      setAutomationDraft({ name: "", triggerKeywords: "", responseTemplate: "", escalateToHuman: false, sortOrder: 1, isActive: true });
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
    setAutomationDraft({ name: "", triggerKeywords: "", responseTemplate: "", escalateToHuman: false, sortOrder: 1, isActive: true });
  }

  async function deleteAutomationOption(optionId: string) {
    if (!auth || !canManage) return;

    try {
      await deleteAutomationOptionRequest(auth.token, optionId);
      await loadCrm(auth.token, auth.role);
      setNotice("Fluxo removido.");
    } catch (error) {
      setError(resolveApiErrorMessage(error, "Erro ao excluir fluxo automatico."));
    }
  }
  async function saveConversationContactPanel() {
    if (!auth || !selectedConversation) return;
    if (!conversationContactDraft.name.trim() || !conversationContactDraft.phone.trim()) {
      setError("Preencha nome e telefone do contato.");
      return;
    }

    const isEditing = Boolean(conversationContactDraft.id);
    setAttendanceContactSaving(true);

    try {
      const savedContact = await saveContactRequest(auth.token, {
        id: conversationContactDraft.id || undefined,
        name: conversationContactDraft.name,
        phone: conversationContactDraft.phone,
        state: conversationContactDraft.state || null,
        status: conversationContactDraft.status || null,
        tags: splitTags(conversationContactDraft.tags),
        ownerUserId: conversationContactDraft.ownerUserId || null
      });
      if (savedContact) {
        mergeContactIntoState(savedContact);
      }

      setNotice(isEditing ? "Contato da conversa atualizado." : "Contato criado a partir da conversa.");
    } catch (error) {
      setError(resolveApiErrorMessage(error, "Erro ao salvar contato da conversa."));
    } finally {
      setAttendanceContactSaving(false);
    }
  }

  async function assignSelectedConversation(assignedUserId: string) {
    if (!auth || !selectedConversation) return;
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

  async function updateSelectedConversationStatus(
    nextStatus: "BotHandling" | "WaitingHuman" | "HumanHandling" | "Closed",
    conversationId = selectedConversation?.id
  ) {
    if (!auth || !conversationId) return;
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

      switch (nextStatus) {
        case "BotHandling":
          setNotice("Conversa devolvida para a IA.");
          break;
        case "HumanHandling":
          setNotice("Conversa transferida para atendimento humano.");
          break;
        case "WaitingHuman":
          setNotice("Conversa marcada como aguardando humano.");
          break;
        case "Closed":
          setNotice("Conversa encerrada.");
          break;
      }
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
    if (!auth || !selectedConversation || !noteDraft.trim()) return;
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
    if (!auth) return;
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
  async function switchTenant(tenantId: string) {
    if (!auth || auth.role !== "SuperAdmin" || tenantId === auth.tenantId) return;

    setSwitchingTenant(true);
    try {
      const data = await switchTenantRequest(auth.token, tenantId);
      setAuth(data);
      await Promise.all([
        loadTenants(data.token),
        loadBillingSubscriptionSnapshot(data.token, data.role),
        loadPageData(currentPage, data.token, data.role, data.tenantId, true)
      ]);

      setNotice(`Contexto alterado para ${data.tenantName}.`);
    } catch (error) {
      setError(resolveApiErrorMessage(error, "Erro ao alternar tenant."));
    } finally {
      setSwitchingTenant(false);
    }
  }

  async function sendHumanReply() {
    if (!auth || !selectedConversation || !reply.trim()) return;
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
    if (!auth) return false;
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
      const payload = extractApiErrorData<{ message?: string; error?: string | null; status?: string; conversationId?: string }>(error);
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
  async function saveSettings() {
    if (!auth || !canManage) return;

    try {
      await updateBotSettings(auth.token, settingsDraft);
      await loadSettings();
      setNotice("Configuracoes atualizadas.");
    } catch (error) {
      setError(resolveApiErrorMessage(error, "Erro ao salvar configuracoes."));
    }
  }

  async function addTrainingEntry() {
    if (!auth || !canManage || !trainingKeyword.trim() || !trainingAnswer.trim()) return;

    try {
      await createTrainingEntry(auth.token, trainingKeyword, trainingAnswer);
      setTrainingKeyword("");
      setTrainingAnswer("");
      await loadSettings();
      setNotice("Regra de treinamento adicionada.");
    } catch (error) {
      setError(resolveApiErrorMessage(error, "Erro ao adicionar treinamento."));
    }
  }

  async function saveCompany() {
    if (!auth || !canManageCompanies) return;
    if (!companyDraft.name.trim() || !companyDraft.segment.trim()) {
      setError("Informe nome e segmento.");
      return;
    }

    const isEditing = Boolean(editingCompanyId);

    try {
      await saveManagedCompany(auth.token, {
        id: editingCompanyId || undefined,
        name: companyDraft.name,
        segment: companyDraft.segment
      });

      setCompanyDraft({ name: "", segment: "" });
      setEditingCompanyId("");
      await Promise.all([loadManagedCompanies(), loadTenants()]);
      setNotice(isEditing ? "Empresa atualizada." : "Empresa criada.");
    } catch (error) {
      setError(resolveApiErrorMessage(error, "Erro ao salvar empresa."));
    }
  }

  async function deleteCompany(companyId: string) {
    if (!auth || !canManageCompanies) return;

    try {
      await deleteManagedCompanyRequest(auth.token, companyId);
      await Promise.all([loadManagedCompanies(), loadTenants()]);
      setNotice("Empresa excluida.");
    } catch (error) {
      setError(resolveApiErrorMessage(error, "Erro ao excluir empresa."));
    }
  }

  function editCompany(company: ManagedCompany) {
    setEditingCompanyId(company.id);
    setCompanyDraft({ name: company.name, segment: company.segment });
    setCurrentPage("COMPANIES");
  }

  function cancelCompanyEdit() {
    setEditingCompanyId("");
    setCompanyDraft({ name: "", segment: "" });
  }

  async function saveUser() {
    if (!auth || !canManage) return;

    const isEditing = Boolean(editingUserId);
    const tenantId = canManageCompanies ? userDraft.tenantId : auth.tenantId;

    if (!userDraft.name.trim() || !userDraft.email.trim()) {
      setError("Preencha nome e email.");
      return;
    }

    if (!isEditing && !userDraft.password.trim()) {
      setError("Senha obrigatoria para criar usuario.");
      return;
    }

    try {
      await saveManagedUser(auth.token, isEditing
        ? {
            id: editingUserId,
            name: userDraft.name,
            email: userDraft.email,
            role: userDraft.role,
            password: userDraft.password || null
          }
        : {
            tenantId,
            name: userDraft.name,
            email: userDraft.email,
            role: userDraft.role,
            password: userDraft.password
          });

      setEditingUserId("");
      setUserDraft({ tenantId: auth.tenantId, name: "", email: "", role: "Agent", password: "" });
      await loadManagedUsers();
      setNotice(isEditing ? "Usuario atualizado." : "Usuario criado.");
    } catch (error) {
      setError(resolveApiErrorMessage(error, "Erro ao salvar usuario."));
    }
  }

  async function deleteUser(userId: string) {
    if (!auth || !canManage) return;

    try {
      await deleteManagedUserRequest(auth.token, userId);
      await loadManagedUsers();
      setNotice("Usuario excluido.");
    } catch (error) {
      setError(resolveApiErrorMessage(error, "Erro ao excluir usuario."));
    }
  }

  function editUser(user: ManagedUser) {
    setEditingUserId(user.id);
    setUserDraft({ tenantId: user.tenantId, name: user.name, email: user.email, role: user.role, password: "" });
    setCurrentPage("USERS");
  }

  function cancelUserEdit() {
    setEditingUserId("");
    setUserDraft({ tenantId: auth?.tenantId ?? "", name: "", email: "", role: "Agent", password: "" });
  }

  async function logout() {
    if (auth?.refreshToken) {
      try {
        await logoutRequest(auth.refreshToken);
      } catch {
        // ignore network errors on logout
      }
    }

    clearStoredAuth();
    setAuth(null);
    setAuthView("LOGIN");
    setError("");
    setNotice("");
    resetAttendanceUiState();
    setSettings(null);
    setTenants([]);
    setManagedCompanies([]);
    setManagedUsers([]);
    setAnalytics(null);
    setCurrentPage("ATTENDANCE");
  }

  if (!sessionReady) {
    return (
      <main className="authRoot">
        <section className="authFrame">
          <article className="authHero">
            <span className="brandPill">RESTAURANDO SESSAO</span>
            <h1>Atend.AI</h1>
            <p>Verificando sua sessao.</p>
          </article>
          <article className="authCard">
            <h2>Carregando</h2>
            <p>Aguarde alguns segundos.</p>
          </article>
        </section>
      </main>
    );
  }

  if (!auth) {
    if (authView === "PRICING") {
      return <PricingLanding onLoginClick={() => setAuthView("LOGIN")} />;
    }

    return (
      <main className="authRoot">
        <section className="authFrame">
          <article className="authHero">
            <span className="brandPill">ATENDIMENTO INTELIGENTE</span>
            <h1>Atend.AI</h1>
            <p>Central profissional para orquestrar atendimento automatizado no WhatsApp com handoff humano.</p>
            <button type="button" className="ghostButton" onClick={() => setAuthView("PRICING")}>Ver planos</button>
          </article>

          <article className="authCard">
            <h2>Entrar na Plataforma</h2>
            <label>
              Email corporativo
              <input value={email} onChange={(event) => setEmail(event.target.value)} />
            </label>
            <label>
              Senha
              <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} />
            </label>
            <button className="primaryButton" onClick={login} disabled={loading}>
              {loading ? "Autenticando..." : "Entrar no Dashboard"}
            </button>
            {error && <div className="errorBanner">{error}</div>}
          </article>
        </section>
      </main>
    );
  }

  return (
    <main className="appRoot min-h-screen bg-[linear-gradient(180deg,#f8fafc_0%,#eef4ff_42%,#f8fafc_100%)]">
      <div className="mx-auto flex w-full max-w-[1760px] flex-col gap-6 px-4 py-4 sm:px-6 lg:px-8">
        <section className="grid items-start gap-6 xl:grid-cols-[280px_minmax(0,1fr)] 2xl:grid-cols-[296px_minmax(0,1fr)]">
          <aside className="sticky top-4 flex flex-col gap-5 rounded-[32px] border border-slate-200/90 bg-white/95 p-5 shadow-[0_30px_80px_-58px_rgba(15,23,42,0.45)] backdrop-blur">
            <div className="overflow-hidden rounded-[26px] border border-slate-200/90 bg-[linear-gradient(135deg,rgba(15,23,42,0.98),rgba(30,41,59,0.96))] p-5 text-white shadow-sm shadow-slate-900/20">
              <div className="space-y-3">
                <span className="inline-flex rounded-full bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-200">
                  Atend.AI
                </span>
                <div className="space-y-1.5">
                  <p className="text-lg font-semibold tracking-tight text-white">{workspaceName}</p>
                  <p className="text-sm leading-6 text-slate-300">{workspacePlanName}</p>
                </div>
              </div>
            </div>

            <div className="rounded-[24px] border border-slate-200/80 bg-slate-50/90 p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-950 text-sm font-semibold uppercase text-white shadow-sm shadow-slate-300/50">
                  {auth.name.slice(0, 1)}
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-slate-950">{auth.name}</p>
                  <p className="truncate text-xs text-slate-500">{auth.role} � {auth.tenantName}</p>
                </div>
              </div>
            </div>

            <div className="sidebarGroup">
              <span className="sidebarGroupLabel">Operacao</span>
              <SidebarNavButton active={currentPage === "ATTENDANCE"} label="Atendimento" onClick={() => setCurrentPage("ATTENDANCE")} />
              {canManage && <SidebarNavButton active={currentPage === "AI"} label="Configuracao da IA" onClick={() => setCurrentPage("AI")} />}
            </div>
            {canManage && (
              <>
                <div className="sidebarGroup">
                  <span className="sidebarGroupLabel">Relacionamento</span>
                  <SidebarNavButton active={currentPage === "CRM"} label="CRM" onClick={() => setCurrentPage("CRM")} />
                  <SidebarNavButton active={currentPage === "WHATSAPP"} label="WhatsApp" onClick={() => setCurrentPage("WHATSAPP")} />
                  <SidebarNavButton active={currentPage === "COMMERCIAL"} label="Comercial" onClick={() => setCurrentPage("COMMERCIAL")} />
                </div>
                <div className="sidebarGroup">
                  <span className="sidebarGroupLabel">Administracao</span>
                  <SidebarNavButton active={currentPage === "USERS"} label="Usuarios" onClick={() => setCurrentPage("USERS")} />
                  {canManageCompanies && <SidebarNavButton active={currentPage === "COMPANIES"} label="Empresas" onClick={() => setCurrentPage("COMPANIES")} />}
                </div>
              </>
            )}
          </aside>

          <section className="min-w-0 space-y-6">
            <header className="relative overflow-hidden rounded-[32px] border border-slate-200/90 bg-white/95 px-5 py-5 shadow-[0_32px_90px_-60px_rgba(15,23,42,0.4)] backdrop-blur sm:px-6 lg:px-7">
              <div className="pointer-events-none absolute inset-y-0 right-0 w-72 bg-gradient-to-l from-blue-100/70 via-blue-50/35 to-transparent" aria-hidden="true" />
              <div className="relative flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
                <div className="space-y-3">
                  <span className="inline-flex w-fit rounded-full bg-blue-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-blue-700">
                    Workspace ativo
                  </span>
                  <div className="space-y-2">
                    <h1 className="text-2xl font-semibold tracking-tight text-slate-950 sm:text-[2rem]">{pageMeta[currentPage].title}</h1>
                    {pageMeta[currentPage].description && <p className="max-w-3xl text-sm leading-6 text-slate-600">{pageMeta[currentPage].description}</p>}
                  </div>
                </div>

                <div className="flex flex-col items-stretch gap-3 lg:flex-row lg:flex-wrap lg:items-center lg:justify-end">
                  {auth.role === "SuperAdmin" && (
                    <label className="flex min-h-12 min-w-[290px] flex-col justify-center rounded-2xl border border-slate-200 bg-white px-4 py-2 shadow-sm shadow-slate-200/60">
                      <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">Tenant ativo</span>
                      <select
                        className="mt-1 h-7 border-0 bg-transparent px-0 text-sm font-medium text-slate-700 outline-none focus:ring-0"
                        value={auth.tenantId}
                        onChange={(event) => switchTenant(event.target.value)}
                        disabled={switchingTenant}
                      >
                        {tenants.map((tenant) => (
                          <option key={tenant.id} value={tenant.id}>
                            {tenant.name} ({tenant.segment})
                          </option>
                        ))}
                      </select>
                    </label>
                  )}

                  <div className="flex flex-wrap items-center gap-3">
                    <button
                      type="button"
                      className="inline-flex h-11 items-center justify-center rounded-xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 shadow-sm shadow-slate-200/60 transition hover:border-slate-300 hover:bg-slate-50 focus:outline-none focus-visible:ring-4 focus-visible:ring-slate-100"
                      onClick={() => refreshAll()}
                    >
                      Atualizar tudo
                    </button>
                    <button
                      type="button"
                      className="inline-flex h-11 items-center justify-center rounded-xl border border-rose-200 bg-rose-50 px-4 text-sm font-medium text-rose-700 shadow-sm transition hover:bg-rose-100 focus:outline-none focus-visible:ring-4 focus-visible:ring-rose-100"
                      onClick={() => { void logout(); }}
                    >
                      Sair
                    </button>
                  </div>
                </div>
              </div>
            </header>

            <section className="grid grid-cols-1 gap-4 md:grid-cols-2 2xl:grid-cols-4">
              <MetricCard label="SLA <= 5 min" value={`${analytics?.slaWithinFiveMinutesRate ?? 0}%`} detail="Primeira resposta no prazo" tone="success" />
              <MetricCard label="FCR" value={`${analytics?.firstContactResolutionRate ?? 0}%`} detail="Resolvidas sem humano" tone="neutral" />
              <MetricCard label="Tempo 1a resposta" value={formatSeconds(analytics?.averageFirstResponseSeconds ?? 0)} detail="Media de atendimento" tone="alert" />
              <MetricCard label="Conversao" value={`${analytics?.schedulingConversionRate ?? 0}%`} detail="Intencao de agendamento" tone="success" />
            </section>


      {currentPage === "ATTENDANCE" && (
        <InboxWorkspace
          queue={queue}
          conversations={conversationsWithResolvedNames}
          selectedConversation={selectedConversation ?? null}
          selectedConversationId={selectedId}
          onSelectConversation={setSelectedId}
          search={search}
          setSearch={setSearch}
          queueFilter={queueFilter}
          setQueueFilter={setQueueFilter}
          reply={reply}
          setReply={setReply}
          outboundDraft={outboundDraft}
          setOutboundDraft={setOutboundDraft}
          outboundSubmitting={sendingOutbound}
          queueLoading={attendanceQueueLoading}
          queueRefreshing={attendanceQueueRefreshing}
          conversationLoading={attendanceConversationLoading}
          notesLoading={attendanceNotesLoading}
          replySubmitting={attendanceReplySending}
          noteSubmitting={attendanceNoteSaving}
          contactSaving={attendanceContactSaving}
          quickReplySaving={attendanceQuickReplySaving}
          statusPendingConversationId={attendanceStatusPendingId}
          assignmentPendingConversationId={attendanceAssignmentPendingId}
          whatsAppChannels={whatsAppChannels}
          startOutboundConversation={startOutboundConversation}
          sendHumanReply={sendHumanReply}
          refreshInbox={refreshInboxOnly}
          feedbackDraft={feedbackDraft}
          setFeedbackDraft={setFeedbackDraft}
          saveConversationFeedback={saveConversationFeedback}
          contactPanelDraft={conversationContactDraft}
          setContactPanelDraft={setConversationContactDraft}
          saveContactPanelDraft={saveConversationContactPanel}
          hasSelectedContact={Boolean(selectedContact)}
          stateOptions={stateOptions}
          contactStatusOptions={contactStatusOptions}
          managedUsers={managedUsers}
          canAssignConversations={canManage}
          assignConversation={assignSelectedConversation}
          updateConversationStatus={updateSelectedConversationStatus}
          attendanceRealtimeState={attendanceRealtimeState}
          attendanceRealtimeLastPublishedAt={attendanceRealtimeLastPublishedAt}
          attendanceRealtimeLastReceivedAt={attendanceRealtimeLastReceivedAt}
          notes={conversationNotes}
          noteDraft={noteDraft}
          setNoteDraft={setNoteDraft}
          addConversationNote={addConversationNote}
          quickReplies={quickReplies}
          quickReplyDraft={quickReplyDraft}
          setQuickReplyDraft={setQuickReplyDraft}
          saveQuickReply={saveQuickReply}
          editQuickReply={editQuickReply}
          deleteQuickReply={deleteQuickReply}
          applyQuickReply={applyQuickReply}
          formatDate={formatDate}
        />
      )}

      {currentPage === "AI" && canManage && auth && (
        <AiWorkspace
          role={auth.role}
          settingsDraft={settingsDraft}
          setSettingsDraft={setSettingsDraft}
          trainingKeyword={trainingKeyword}
          setTrainingKeyword={setTrainingKeyword}
          trainingAnswer={trainingAnswer}
          setTrainingAnswer={setTrainingAnswer}
          trainingEntries={settings?.trainingEntries ?? []}
          saveSettings={saveSettings}
          addTrainingEntry={addTrainingEntry}
        />
      )}

      {currentPage === "USERS" && canManage && (
        <UsersWorkspace
          canManageCompanies={canManageCompanies}
          tenants={tenants}
          managedUsers={managedUsers}
          filteredUsers={filteredUsers}
          userDraft={userDraft}
          setUserDraft={setUserDraft}
          editingUserId={editingUserId}
          saveUser={saveUser}
          cancelUserEdit={cancelUserEdit}
          userSearch={userSearch}
          setUserSearch={setUserSearch}
          userRoleFilter={userRoleFilter}
          setUserRoleFilter={setUserRoleFilter}
          userTenantFilter={userTenantFilter}
          setUserTenantFilter={setUserTenantFilter}
          editUser={editUser}
          deleteUser={deleteUser}
          formatDate={formatDate}
        />
      )}

      {currentPage === "COMMERCIAL" && canManage && (
        <CommercialWorkspace
          billingSubscription={billingSubscription}
          valueMetrics={valueMetrics}
          billingPlans={billingPlans}
          subscribePlan={subscribePlan}
          formatCurrency={formatCurrency}
          formatDate={formatDate}
          currentTenantId={auth.tenantId}
          currentTenantName={auth.tenantName}
          canSwitchTenant={auth.role === "SuperAdmin"}
          tenants={tenants}
          switchTenant={switchTenant}
          switchingTenant={switchingTenant}
          whatsAppChannelLimit={whatsAppChannelLimit}
          whatsAppChannelCount={whatsAppChannels.length}
        />
      )}

      {currentPage === "WHATSAPP" && canManage && auth && (
        <WhatsAppWorkspace
          authToken={auth.token}
          whatsAppConfig={whatsAppConfig}
          whatsAppChannels={whatsAppChannels}
          whatsAppChannelLimit={whatsAppChannelLimit}
          onRefreshMetaState={() => loadEngagement(auth.token, auth.role)}
          onOpenMetaChannel={openMetaWhatsAppChannel}
          onSurfaceError={setError}
          onSurfaceNotice={setNotice}
          formatDate={formatDate}
        />
      )}

      {currentPage === "CRM" && canManage && (
        <CrmWorkspace
          contacts={contacts}
          filteredContacts={filteredContacts}
          contactDraft={contactDraft}
          setContactDraft={setContactDraft}
          editingContactId={editingContactId}
          saveContact={saveContact}
          cancelContactEdit={cancelContactEdit}
          contactImportRaw={contactImportRaw}
          setContactImportRaw={setContactImportRaw}
          importContacts={importContacts}
          contactSearch={contactSearch}
          setContactSearch={setContactSearch}
          contactStateFilter={contactStateFilter}
          setContactStateFilter={setContactStateFilter}
          contactStatusFilter={contactStatusFilter}
          setContactStatusFilter={setContactStatusFilter}
          contactTagFilter={contactTagFilter}
          setContactTagFilter={setContactTagFilter}
          stateOptions={stateOptions}
          contactStatusOptions={contactStatusOptions}
          availableTags={availableTags}
          selectedBroadcastContacts={selectedBroadcastContacts}
          toggleBroadcastContact={toggleBroadcastContact}
          editContact={editContact}
          deleteContact={deleteContact}
          scheduledBroadcasts={scheduledBroadcasts}
          broadcastDraft={broadcastDraft}
          setBroadcastDraft={setBroadcastDraft}
          saveBroadcast={saveBroadcast}
          queueHealth={queueHealth}
          feedbackList={feedbackList}
          automationOptions={automationOptions}
          automationDraft={automationDraft}
          setAutomationDraft={setAutomationDraft}
          automationPriorityOptions={automationPriorityOptions}
          editingAutomationId={editingAutomationId}
          saveAutomationOption={saveAutomationOption}
          cancelAutomationEdit={cancelAutomationEdit}
          editAutomationOption={editAutomationOption}
          deleteAutomationOption={deleteAutomationOption}
          openInternalConversation={openInternalConversation}
          formatDate={formatDate}
        />
      )}

      {canManageCompanies && currentPage === "COMPANIES" && (
        <CompaniesWorkspace
          managedCompanies={managedCompanies}
          filteredCompanies={filteredCompanies}
          companyDraft={companyDraft}
          setCompanyDraft={setCompanyDraft}
          editingCompanyId={editingCompanyId}
          saveCompany={saveCompany}
          cancelCompanyEdit={cancelCompanyEdit}
          companySearch={companySearch}
          setCompanySearch={setCompanySearch}
          companySegmentFilter={companySegmentFilter}
          setCompanySegmentFilter={setCompanySegmentFilter}
          availableSegments={availableSegments}
          editCompany={editCompany}
          deleteCompany={deleteCompany}
          formatDate={formatDate}
        />
      )}
        </section>
      </section>
      </div>
      {notice && <div className="noticeBanner">{notice}</div>}
      {error && <div className="errorBanner floating">{error}</div>}
    </main>
  );
}

type MetricCardProps = {
  label: string;
  value: string;
  detail: string;
  tone: "neutral" | "success" | "alert";
};

function MetricCard({ label, value, detail, tone }: MetricCardProps) {
  const toneMap = {
    neutral: "border-slate-200 bg-white text-slate-700 shadow-slate-200/70",
    success: "border-emerald-200 bg-emerald-50/75 text-emerald-800 shadow-emerald-100",
    alert: "border-amber-200 bg-amber-50/75 text-amber-800 shadow-amber-100"
  } satisfies Record<MetricCardProps["tone"], string>;

  return (
    <article className={`relative overflow-hidden rounded-[24px] border p-5 shadow-sm ${toneMap[tone]}`}>
      <span className="absolute inset-x-0 top-0 h-px bg-white/70" aria-hidden="true" />
      <div className="relative flex min-h-[132px] flex-col gap-3">
        <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">{label}</span>
        <strong className="text-[2rem] font-semibold leading-none tracking-tight text-slate-950">{value}</strong>
        <small className="mt-auto text-sm leading-5 text-slate-500">{detail}</small>
      </div>
    </article>
  );
}
type FilterChipProps = {
  active: boolean;
  label: string;
  onClick: () => void;
};

function FilterChip({ active, label, onClick }: FilterChipProps) {
  return <button type="button" className={active ? "chip active" : "chip"} onClick={onClick}>{label}</button>;
}

type SidebarNavButtonProps = {
  active: boolean;
  label: string;
  onClick: () => void;
};

function SidebarNavButton({ active, label, onClick }: SidebarNavButtonProps) {
  return (
    <button
      type="button"
      className={`group flex min-h-[52px] w-full items-center gap-3 rounded-2xl border px-4 py-3.5 text-left text-sm font-semibold transition focus:outline-none focus-visible:ring-4 ${
        active
          ? "border-blue-600 bg-blue-600 text-white shadow-sm shadow-blue-200 focus-visible:ring-blue-100"
          : "border-slate-200 bg-slate-50/80 text-slate-700 hover:border-slate-300 hover:bg-white focus-visible:ring-slate-100"
      }`}
      onClick={onClick}
    >
      <span className={`inline-flex h-8 w-8 items-center justify-center rounded-xl text-xs font-bold uppercase transition ${
        active ? "bg-white/15 text-white" : "bg-white text-slate-500 ring-1 ring-slate-200 group-hover:bg-slate-100"
      }`}>
        {label.slice(0, 1)}
      </span>
      <span className="min-w-0 truncate">{label}</span>
    </button>
  );
}
type StatusBadgeProps = { status: "BotHandling" | "WaitingHuman" | "HumanHandling" | "Closed"; };

function StatusBadge({ status }: StatusBadgeProps) {
  const map = {
    BotHandling: "Em IA",
    WaitingHuman: "Aguardando humano",
    HumanHandling: "Em humano",
    Closed: "Fechada"
  };

  return <span className={`statusBadge ${status}`}>{map[status]}</span>;
}

function normalizeStatus(status: string | number): "BotHandling" | "WaitingHuman" | "HumanHandling" | "Closed" {
  if (typeof status === "number") {
    if (status === 0) return "BotHandling";
    if (status === 1) return "WaitingHuman";
    if (status === 2) return "HumanHandling";
    return "Closed";
  }

  if (status === "WaitingHuman" || status === "HumanHandling" || status === "Closed") {
    return status;
  }

  return "BotHandling";
}

function labelSender(sender: string) {
  if (sender === "Customer") return "Cliente";
  if (sender === "AI") return "IA";
  if (sender === "HumanAgent") return "Humano";
  return "Sistema";
}













































































function persistAuth(auth: AuthResponse | null) {
  persistStoredAuth(auth);
}

function readStoredAuth(): AuthResponse | null {
  return readPersistedAuth();
}

function clearStoredAuth() {
  clearPersistedAuth();
}

function persistPage(page: AppPage) {
  persistStoredPage(page);
}

function readStoredPage(): AppPage {
  const raw = readPersistedPage();
  return isAppPage(raw) ? raw : "ATTENDANCE";
}

function persistAuthView(view: AuthView) {
  persistStoredAuthView(view);
}

function readStoredAuthView(): AuthView {
  const raw = readPersistedAuthView();
  return raw === "LOGIN" ? "LOGIN" : "PRICING";
}

function isSessionExpired(expiresAtUtc: string) {
  const expiresAt = Date.parse(expiresAtUtc);
  if (Number.isNaN(expiresAt)) return true;
  return expiresAt <= Date.now() + SESSION_REFRESH_SKEW_MS;
}

function defaultPageForRole(role?: string): AppPage {
  return role === "SuperAdmin" ? "COMPANIES" : "ATTENDANCE";
}

function isPageAllowedForRole(page: AppPage, role?: string) {
  if (page === "ATTENDANCE") return true;
  if (page === "COMPANIES") return role === "SuperAdmin";
  return role === "Admin" || role === "SuperAdmin";
}

function isAppPage(value: string | null): value is AppPage {
  return value === "ATTENDANCE" || value === "AI" || value === "CRM" || value === "WHATSAPP" || value === "COMMERCIAL" || value === "USERS" || value === "COMPANIES";
}
