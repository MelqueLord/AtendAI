import { useEffect, useMemo, useState } from "react";
import { pageMeta, contactStatusOptions, stateOptions, campaignDelayOptions, automationPriorityOptions } from "./app/constants";
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
} from "./app/types";
import { AiWorkspace } from "./domains/ai/components/AiWorkspace";
import { CommercialWorkspace } from "./domains/commercial/components/CommercialWorkspace";
import { InboxWorkspace } from "./domains/attendance/components/InboxWorkspace";
import { CrmWorkspace } from "./domains/crm/components/CrmWorkspace";
import { CompaniesWorkspace } from "./domains/companies/components/CompaniesWorkspace";
import { PricingLanding } from "./domains/public/components/PricingLanding";
import { UsersWorkspace } from "./domains/users/components/UsersWorkspace";
import { WhatsAppWorkspace } from "./domains/whatsapp/components/WhatsAppWorkspace";

const apiBase = import.meta.env.VITE_API_BASE_URL ?? "/api";
const AUTH_STORAGE_KEY = "atendai.auth";
const PAGE_STORAGE_KEY = "atendai.page";
const AUTH_VIEW_STORAGE_KEY = "atendai.authView";
const SESSION_REFRESH_SKEW_MS = 60_000;

export function App() {
  const [auth, setAuth] = useState<AuthResponse | null>(null);
  const [sessionReady, setSessionReady] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [loading, setLoading] = useState(false);
  const [authView, setAuthView] = useState<"PRICING" | "LOGIN">(() => readStoredAuthView());

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [reply, setReply] = useState("");
  const [outboundDraft, setOutboundDraft] = useState({ customerName: "", customerPhone: "", channelId: "", message: "" });
  const [sendingOutbound, setSendingOutbound] = useState(false);

  const [search, setSearch] = useState("");
  const [queueFilter, setQueueFilter] = useState<QueueFilter>("ALL");

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

  const canManage = auth?.role === "Admin" || auth?.role === "SuperAdmin";
  const canManageCompanies = auth?.role === "SuperAdmin";
  const workspaceName = settings?.businessName?.trim() || auth?.tenantName || "Workspace";

  const selectedConversation = useMemo(
    () => conversations.find((c) => c.id === selectedId),
    [conversations, selectedId]
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

    void loadConversationNotes(selectedConversation.id);
  }, [managedUsers, selectedContact, selectedConversation]);

  const queue = useMemo(() => {
    const query = search.trim().toLowerCase();

    return conversations.filter((conversation) => {
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
  }, [conversations, queueFilter, search]);

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
        const res = await fetch(`${apiBase}/auth/refresh`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ refreshToken: storedAuth.refreshToken })
        });

        if (!res.ok) {
          clearStoredAuth();
          if (!cancelled) {
            setAuth(null);
            setAuthView("LOGIN");
          }
          return;
        }

        const data = (await res.json()) as AuthResponse;
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
    if (!auth || currentPage !== "ATTENDANCE") {
      return;
    }

    const interval = window.setInterval(() => {
      void loadConversations(auth.token);
      if (selectedId) {
        void loadConversationNotes(selectedId, auth.token);
      }
    }, 8000);

    return () => window.clearInterval(interval);
  }, [auth, currentPage, selectedId]);

  async function login() {
    setLoading(true);
    setError("");

    try {
      const res = await fetch(`${apiBase}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
      });

      if (!res.ok) {
        setError("Login falhou. Verifique credenciais ou backend.");
        return;
      }

      const data = (await res.json()) as AuthResponse;
      setAuth(data);
      setCurrentPage(defaultPageForRole(data.role));
      setAuthView("LOGIN");

      await Promise.all([
        loadConversations(data.token),
        loadSettings(data.token, data.role),
        loadAnalytics(data.token),
        loadManagedUsers(data.token, data.role, data.tenantId),
        loadCommercial(data.token, data.role),
        loadEngagement(data.token, data.role),
        loadCrm(data.token, data.role),
        loadQuickReplies(data.token)
      ]);

      if (data.role === "SuperAdmin") {
        await Promise.all([loadTenants(data.token), loadManagedCompanies(data.token)]);
      }

      setNotice("Sessao autenticada com sucesso.");
    } catch {
      setError("Nao foi possivel conectar na API.");
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

  async function loadConversations(token = auth?.token) {
    if (!token) return;

    try {
      const res = await fetch(`${apiBase}/conversations`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!res.ok) {
        setError("Falha ao carregar fila de conversas.");
        return;
      }

      const data = (await res.json()) as Conversation[];
      setConversations(data);

      if (!data.length) {
        setSelectedId("");
      } else if (!selectedId || !data.some((item) => item.id === selectedId)) {
        setSelectedId(data[0].id);
      }
    } catch {
      setError("Erro de conexao ao buscar conversas.");
    }
  }

  async function refreshInboxOnly(token = auth?.token) {
    if (!token) return;

    await loadConversations(token);
    if (selectedId) {
      await loadConversationNotes(selectedId, token);
    }
  }

  async function loadConversationNotes(conversationId: string, token = auth?.token) {
    if (!token || !conversationId) return;

    try {
      const res = await fetch(`${apiBase}/conversations/${conversationId}/notes`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!res.ok) {
        setConversationNotes([]);
        return;
      }

      const data = (await res.json()) as ConversationNote[];
      setConversationNotes(data);
    } catch {
      setConversationNotes([]);
    }
  }

  async function loadQuickReplies(token = auth?.token) {
    if (!token) return;

    try {
      const res = await fetch(`${apiBase}/conversations/quick-replies`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!res.ok) {
        setQuickReplies([]);
        return;
      }

      const data = (await res.json()) as QuickReplyTemplate[];
      setQuickReplies(data);
    } catch {
      setQuickReplies([]);
    }
  }
  async function loadSettings(token = auth?.token, role = auth?.role) {
    if (!token || (role !== "Admin" && role !== "SuperAdmin")) return;

    try {
      const res = await fetch(`${apiBase}/settings`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!res.ok) return;

      const data = (await res.json()) as BotSettings;
      setSettings(data);
      setSettingsDraft({
        businessName: data.businessName,
        welcomeMessage: data.welcomeMessage,
        humanFallbackMessage: data.humanFallbackMessage
      });
    } catch {
      setError("Erro ao carregar configuracoes.");
    }
  }

  async function loadAnalytics(token = auth?.token) {
    if (!token) return;

    try {
      const res = await fetch(`${apiBase}/analytics/overview`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!res.ok) {
        setError("Falha ao carregar metricas.");
        return;
      }

      const data = (await res.json()) as AnalyticsOverview;
      setAnalytics(data);
    } catch {
      setError("Erro ao carregar metricas.");
    }
  }

  async function loadTenants(token = auth?.token) {
    if (!token) return;

    try {
      const res = await fetch(`${apiBase}/admin/tenants`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!res.ok) {
        setError("Falha ao carregar tenants.");
        return;
      }

      const data = (await res.json()) as TenantOption[];
      setTenants(data);
    } catch {
      setError("Erro ao carregar tenants.");
    }
  }

  async function loadManagedCompanies(token = auth?.token) {
    if (!token) return;

    try {
      const res = await fetch(`${apiBase}/management/companies`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!res.ok) {
        setError("Falha ao carregar empresas.");
        return;
      }

      const data = (await res.json()) as ManagedCompany[];
      setManagedCompanies(data);
    } catch {
      setError("Erro ao carregar empresas.");
    }
  }

  async function loadManagedUsers(token = auth?.token, role = auth?.role, tenantId = auth?.tenantId) {
    if (!token || !role || role === "Agent") {
      setManagedUsers([]);
      return;
    }

    const query = role === "SuperAdmin" && tenantId ? `?tenantId=${tenantId}` : "";

    try {
      const res = await fetch(`${apiBase}/management/users${query}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!res.ok) {
        setError("Falha ao carregar usuarios.");
        return;
      }

      const data = (await res.json()) as ManagedUser[];
      setManagedUsers(data);
    } catch {
      setError("Erro ao carregar usuarios.");
    }
  }

  async function loadCommercial(token = auth?.token, role = auth?.role) {
    if (!token || (role !== "Admin" && role !== "SuperAdmin")) return;

    try {
      const [plansRes, subRes, metricsRes] = await Promise.all([
        fetch(`${apiBase}/billing/plans`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${apiBase}/billing/subscription`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${apiBase}/billing/value-metrics`, { headers: { Authorization: `Bearer ${token}` } })
      ]);

      if (plansRes.ok) {
        setBillingPlans((await plansRes.json()) as BillingPlan[]);
      }

      if (subRes.ok) {
        setBillingSubscription((await subRes.json()) as BillingSubscription);
      }

      if (metricsRes.ok) {
        setValueMetrics((await metricsRes.json()) as ValueMetrics);
      }
    } catch {
      setError("Erro ao carregar dados comerciais.");
    }
  }


  async function loadEngagement(token = auth?.token, role = auth?.role) {
    if (!token || (role !== "Admin" && role !== "SuperAdmin")) return;

    try {
      const [configRes, channelsRes, campaignsRes, logsRes] = await Promise.all([
        fetch(`${apiBase}/engagement/whatsapp`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${apiBase}/engagement/whatsapp/channels`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${apiBase}/engagement/campaigns`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${apiBase}/engagement/logs?limit=50`, { headers: { Authorization: `Bearer ${token}` } })
      ]);

      if (!configRes.ok || !channelsRes.ok || !campaignsRes.ok || !logsRes.ok) {
        const bodies = await Promise.all([configRes, channelsRes, campaignsRes, logsRes].map(async (r) => `${r.url} -> ${r.status} ${await r.text()}`));
        setError(`Erro ao carregar configuracoes de WhatsApp/campanhas: ${bodies.join(" | ")}`);
        return;
      }

      const config = (await safeJson<WhatsAppConnection>(configRes));
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

      const channelsPayload = (await safeJson<WhatsAppChannelsPayload>(channelsRes));
      setWhatsAppChannels(channelsPayload?.channels ?? []);
      setWhatsAppChannelLimit(channelsPayload?.allowed ?? 0);

      setCampaigns((await safeJson<CampaignRule[]>(campaignsRes)) ?? []);
      setWhatsAppLogs((await safeJson<WhatsAppLog[]>(logsRes)) ?? []);
    } catch (err) {
      const message = err instanceof Error ? err.message : "desconhecido";
      setError(`Erro ao carregar configuracoes de WhatsApp e campanhas. Detalhe: ${message}`);
    }
  }

  async function loadCrm(token = auth?.token, role = auth?.role) {
    if (!token || !role) return;

    try {
      const requests = [
        fetch(`${apiBase}/crm/contacts?pageSize=200`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${apiBase}/crm/queue-health`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${apiBase}/crm/feedback?limit=50`, { headers: { Authorization: `Bearer ${token}` } })
      ];

      if (role === "Admin" || role === "SuperAdmin") {
        requests.push(
          fetch(`${apiBase}/crm/broadcasts`, { headers: { Authorization: `Bearer ${token}` } }),
          fetch(`${apiBase}/crm/automation-options`, { headers: { Authorization: `Bearer ${token}` } })
        );
      }

      const responses = await Promise.all(requests);
      const [contactsRes, queueRes, feedbackRes, broadcastsRes, automationRes] = responses;

      if (!contactsRes.ok || !queueRes.ok || !feedbackRes.ok || ((role === "Admin" || role === "SuperAdmin") && (!broadcastsRes?.ok || !automationRes?.ok))) {
        const bodies = await Promise.all(responses.map(async (r) => `${r.url} -> ${r.status} ${await r.text()}`));
        setError(`Erro ao carregar dados de CRM: ${bodies.join(" | ")}`);
        return;
      }

      setContacts((await safeJson<Contact[]>(contactsRes)) ?? []);
      setQueueHealth((await safeJson<QueueHealth>(queueRes)) ?? null);
      setFeedbackList((await safeJson<CustomerFeedback[]>(feedbackRes)) ?? []);

      if (role === "Admin" || role === "SuperAdmin") {
        setScheduledBroadcasts((await safeJson<ScheduledBroadcast[]>(broadcastsRes!)) ?? []);
        setAutomationOptions((await safeJson<AutomationOption[]>(automationRes!)) ?? []);
      } else {
        setScheduledBroadcasts([]);
        setAutomationOptions([]);
      }
    } catch {
      setError("Erro ao carregar dados de CRM.");
    }
  }

  async function subscribePlan(planCode: string) {
    if (!auth || !canManage) return;

    try {
      const res = await fetch(`${apiBase}/billing/subscribe`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${auth.token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ planCode })
      });

      if (!res.ok) {
        setError("Falha ao atualizar assinatura.");
        return;
      }

      setBillingSubscription((await res.json()) as BillingSubscription);
      await loadCommercial(auth.token, auth.role);
      setNotice("Plano atualizado com sucesso.");
    } catch {
      setError("Erro ao atualizar plano.");
    }
  }
  async function saveWhatsAppConfig() {
    if (!auth || !canManage) return;
    if (!whatsAppDraft.phoneNumberId.trim() || !whatsAppDraft.verifyToken.trim()) {
      setError("Phone Number ID e Verify Token sao obrigatorios.");
      return;
    }

    try {
      const res = await fetch(`${apiBase}/engagement/whatsapp`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${auth.token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          wabaId: whatsAppDraft.wabaId || null,
          phoneNumberId: whatsAppDraft.phoneNumberId,
          verifyToken: whatsAppDraft.verifyToken,
          accessToken: whatsAppDraft.accessToken || null,
          isActive: whatsAppDraft.isActive
        })
      });

      if (!res.ok) {
        setError("Falha ao salvar configuracao do WhatsApp.");
        return;
      }

      setWhatsAppConfig((await res.json()) as WhatsAppConnection);
      setWhatsAppDraft((prev) => ({ ...prev, accessToken: "" }));
      await loadEngagement(auth.token, auth.role);
      setNotice("Configuracao do WhatsApp salva.");
    } catch {
      setError("Erro ao salvar configuracao do WhatsApp.");
    }
  }

  async function testWhatsAppConfig() {
    if (!auth || !canManage) return;

    try {
      const res = await fetch(`${apiBase}/engagement/whatsapp/test`, {
        method: "POST",
        headers: { Authorization: `Bearer ${auth.token}` }
      });

      if (!res.ok) {
        setError("Falha ao testar conexao com WhatsApp.");
        return;
      }

      const data = (await res.json()) as { success: boolean; status: string; error?: string | null };
      setNotice(data.success ? "WhatsApp conectado com sucesso." : `Teste falhou: ${data.error ?? data.status}`);
      await loadEngagement(auth.token, auth.role);
    } catch {
      setError("Erro ao testar conexao com WhatsApp.");
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
      const url = isEditing ? `${apiBase}/engagement/campaigns/${campaignDraft.id}` : `${apiBase}/engagement/campaigns`;
      const res = await fetch(url, {
        method: isEditing ? "PUT" : "POST",
        headers: {
          Authorization: `Bearer ${auth.token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          name: campaignDraft.name,
          delayHours: campaignDraft.delayHours,
          template: campaignDraft.template,
          isActive: campaignDraft.isActive
        })
      });

      if (!res.ok) {
        setError("Falha ao salvar campanha.");
        return;
      }

      setCampaignDraft({ id: "", name: "", delayHours: 24, template: "", isActive: true });
      await loadEngagement(auth.token, auth.role);
      setNotice(isEditing ? "Campanha atualizada." : "Campanha criada.");
    } catch {
      setError("Erro ao salvar campanha.");
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
      const res = await fetch(`${apiBase}/engagement/campaigns/${ruleId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${auth.token}` }
      });

      if (!res.ok) {
        setError("Falha ao excluir campanha.");
        return;
      }

      await loadEngagement(auth.token, auth.role);
      setNotice("Campanha excluida.");
    } catch {
      setError("Erro ao excluir campanha.");
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
      const url = isEditing ? `${apiBase}/engagement/whatsapp/channels/${editingChannelId}` : `${apiBase}/engagement/whatsapp/channels`;
      const res = await fetch(url, {
        method: isEditing ? "PUT" : "POST",
        headers: {
          Authorization: `Bearer ${auth.token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          displayName: channelDraft.displayName,
          wabaId: channelDraft.wabaId || null,
          phoneNumberId: channelDraft.phoneNumberId,
          verifyToken: channelDraft.verifyToken,
          accessToken: channelDraft.accessToken || null,
          isActive: channelDraft.isActive,
          isPrimary: channelDraft.isPrimary
        })
      });

      if (!res.ok) {
        setError(await extractError(res, "Falha ao salvar canal WhatsApp."));
        return;
      }

      setChannelDraft({ displayName: "", wabaId: "", phoneNumberId: "", verifyToken: "", accessToken: "", isActive: true, isPrimary: false });
      setEditingChannelId("");
      await loadEngagement(auth.token, auth.role);
      setNotice(isEditing ? "Canal atualizado." : "Canal adicionado.");
    } catch {
      setError("Erro ao salvar canal WhatsApp.");
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
      const res = await fetch(`${apiBase}/engagement/whatsapp/channels/${channelId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${auth.token}` }
      });

      if (!res.ok) {
        setError("Falha ao excluir canal WhatsApp.");
        return;
      }

      await loadEngagement(auth.token, auth.role);
      setNotice("Canal removido.");
    } catch {
      setError("Erro ao excluir canal WhatsApp.");
    }
  }

  async function testChannel(channelId: string) {
    if (!auth || !canManage) return;

    try {
      const res = await fetch(`${apiBase}/engagement/whatsapp/channels/${channelId}/test`, {
        method: "POST",
        headers: { Authorization: `Bearer ${auth.token}` }
      });

      if (!res.ok) {
        setError("Falha ao testar canal WhatsApp.");
        return;
      }

      const data = (await res.json()) as { success: boolean; status: string; error?: string | null };
      setNotice(data.success ? "Canal testado com sucesso." : `Teste falhou: ${data.error ?? data.status}`);
      await loadEngagement(auth.token, auth.role);
    } catch {
      setError("Erro ao testar canal WhatsApp.");
    }
  }

  function openMetaWhatsAppChannel() {
    setCurrentPage("ATTENDANCE");
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
      const res = await fetch(isEditing ? `${apiBase}/crm/contacts/${editingContactId}` : `${apiBase}/crm/contacts`, {
        method: isEditing ? "PUT" : "POST",
        headers: {
          Authorization: `Bearer ${auth.token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          name: contactDraft.name,
          phone: contactDraft.phone,
          state: contactDraft.state || null,
          status: contactDraft.status || null,
          tags: splitTags(contactDraft.tags),
          ownerUserId: contactDraft.ownerUserId || null
        })
      });

      if (!res.ok) {
        setError(await extractError(res, "Falha ao salvar contato."));
        return;
      }

      setContactDraft({ name: "", phone: "", state: "", status: "", tags: "", ownerUserId: "" });
      setEditingContactId("");
      await loadCrm(auth.token, auth.role);
      setNotice(isEditing ? "Contato atualizado." : "Contato criado.");
    } catch {
      setError("Erro ao salvar contato.");
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
      const res = await fetch(`${apiBase}/crm/contacts/${contactId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${auth.token}` }
      });

      if (!res.ok) {
        setError("Falha ao excluir contato.");
        return;
      }

      await loadCrm(auth.token, auth.role);
      setNotice("Contato excluido.");
    } catch {
      setError("Erro ao excluir contato.");
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
      const res = await fetch(`${apiBase}/crm/contacts/import`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${auth.token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ contacts: contactsPayload })
      });

      if (!res.ok) {
        setError(await extractError(res, "Falha ao importar contatos."));
        return;
      }

      setContactImportRaw("");
      await loadCrm(auth.token, auth.role);
      setNotice("Contatos importados.");
    } catch {
      setError("Erro ao importar contatos.");
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
      const res = await fetch(`${apiBase}/crm/broadcasts`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${auth.token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          name: broadcastDraft.name,
          messageTemplate: broadcastDraft.messageTemplate,
          scheduledAt: new Date(broadcastDraft.scheduledAt).toISOString(),
          tagFilter: broadcastDraft.tagFilter || null,
          contactIds: selectedBroadcastContacts
        })
      });

      if (!res.ok) {
        setError(await extractError(res, "Falha ao agendar campanha."));
        return;
      }

      setBroadcastDraft({ name: "", messageTemplate: "", scheduledAt: "", tagFilter: "" });
      setSelectedBroadcastContacts([]);
      await loadCrm(auth.token, auth.role);
      setNotice("Campanha agendada com sucesso.");
    } catch {
      setError("Erro ao agendar campanha.");
    }
  }

  async function saveConversationFeedback() {
    if (!auth || !selectedConversation) return;

    try {
      const res = await fetch(`${apiBase}/crm/conversations/${selectedConversation.id}/feedback`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${auth.token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          rating: feedbackDraft.rating,
          comment: feedbackDraft.comment || null
        })
      });

      if (!res.ok) {
        setError(await extractError(res, "Falha ao salvar avaliacao."));
        return;
      }

      setFeedbackDraft({ rating: 5, comment: "" });
      await loadCrm(auth.token, auth.role);
      setNotice("Avaliacao registrada.");
    } catch {
      setError("Erro ao salvar avaliacao.");
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
      const res = await fetch(isEditing ? `${apiBase}/crm/automation-options/${editingAutomationId}` : `${apiBase}/crm/automation-options`, {
        method: isEditing ? "PUT" : "POST",
        headers: {
          Authorization: `Bearer ${auth.token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(automationDraft)
      });

      if (!res.ok) {
        setError(await extractError(res, "Falha ao salvar fluxo automatico."));
        return;
      }

      setEditingAutomationId("");
      setAutomationDraft({ name: "", triggerKeywords: "", responseTemplate: "", escalateToHuman: false, sortOrder: 1, isActive: true });
      await loadCrm(auth.token, auth.role);
      setNotice(isEditing ? "Fluxo atualizado." : "Fluxo criado.");
    } catch {
      setError("Erro ao salvar fluxo automatico.");
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
      const res = await fetch(`${apiBase}/crm/automation-options/${optionId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${auth.token}` }
      });

      if (!res.ok) {
        setError("Falha ao excluir fluxo automatico.");
        return;
      }

      await loadCrm(auth.token, auth.role);
      setNotice("Fluxo removido.");
    } catch {
      setError("Erro ao excluir fluxo automatico.");
    }
  }
  async function saveConversationContactPanel() {
    if (!auth || !selectedConversation) return;
    if (!conversationContactDraft.name.trim() || !conversationContactDraft.phone.trim()) {
      setError("Preencha nome e telefone do contato.");
      return;
    }

    const isEditing = Boolean(conversationContactDraft.id);

    try {
      const res = await fetch(isEditing ? `${apiBase}/crm/contacts/${conversationContactDraft.id}` : `${apiBase}/crm/contacts`, {
        method: isEditing ? "PUT" : "POST",
        headers: {
          Authorization: `Bearer ${auth.token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          name: conversationContactDraft.name,
          phone: conversationContactDraft.phone,
          state: conversationContactDraft.state || null,
          status: conversationContactDraft.status || null,
          tags: splitTags(conversationContactDraft.tags),
          ownerUserId: conversationContactDraft.ownerUserId || null
        })
      });

      if (!res.ok) {
        setError(await extractError(res, "Falha ao salvar contato da conversa."));
        return;
      }

      await loadCrm(auth.token, auth.role);
      setNotice(isEditing ? "Contato da conversa atualizado." : "Contato criado a partir da conversa.");
    } catch {
      setError("Erro ao salvar contato da conversa.");
    }
  }

  async function assignSelectedConversation(assignedUserId: string) {
    if (!auth || !selectedConversation) return;

    try {
      const res = await fetch(`${apiBase}/conversations/${selectedConversation.id}/assignment`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${auth.token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ assignedUserId: assignedUserId || null })
      });

      if (!res.ok) {
        setError(await extractError(res, "Falha ao atribuir conversa."));
        return;
      }

      await loadConversations(auth.token);
      setNotice(assignedUserId ? "Conversa atribuida com sucesso." : "Conversa desatribuida.");
    } catch {
      setError("Erro ao atribuir conversa.");
    }
  }

  async function updateSelectedConversationStatus(nextStatus: "BotHandling" | "WaitingHuman" | "HumanHandling" | "Closed") {
    if (!auth || !selectedConversation) return;

    try {
      const res = await fetch(`${apiBase}/conversations/${selectedConversation.id}/status`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${auth.token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ status: nextStatus })
      });

      if (!res.ok) {
        setError(await extractError(res, "Falha ao atualizar status da conversa."));
        return;
      }

      await loadConversations(auth.token);
      setNotice("Status da conversa atualizado.");
    } catch {
      setError("Erro ao atualizar status da conversa.");
    }
  }

  async function addConversationNote() {
    if (!auth || !selectedConversation || !noteDraft.trim()) return;

    try {
      const res = await fetch(`${apiBase}/conversations/${selectedConversation.id}/notes`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${auth.token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ note: noteDraft })
      });

      if (!res.ok) {
        setError(await extractError(res, "Falha ao salvar nota interna."));
        return;
      }

      setNoteDraft("");
      await loadConversationNotes(selectedConversation.id, auth.token);
      setNotice("Nota interna registrada.");
    } catch {
      setError("Erro ao salvar nota interna.");
    }
  }

  async function saveQuickReply() {
    if (!auth || !quickReplyDraft.title.trim() || !quickReplyDraft.body.trim()) {
      setError("Preencha titulo e mensagem da resposta rapida.");
      return;
    }

    const isEditing = Boolean(quickReplyDraft.id);

    try {
      const res = await fetch(isEditing ? `${apiBase}/conversations/quick-replies/${quickReplyDraft.id}` : `${apiBase}/conversations/quick-replies`, {
        method: isEditing ? "PUT" : "POST",
        headers: {
          Authorization: `Bearer ${auth.token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ title: quickReplyDraft.title, body: quickReplyDraft.body })
      });

      if (!res.ok) {
        setError(await extractError(res, "Falha ao salvar resposta rapida."));
        return;
      }

      setQuickReplyDraft({ id: "", title: "", body: "" });
      await loadQuickReplies(auth.token);
      setNotice(isEditing ? "Resposta rapida atualizada." : "Resposta rapida criada.");
    } catch {
      setError("Erro ao salvar resposta rapida.");
    }
  }

  function editQuickReply(template: QuickReplyTemplate) {
    setQuickReplyDraft({ id: template.id, title: template.title, body: template.body });
  }

  async function deleteQuickReply(templateId: string) {
    if (!auth) return;

    try {
      const res = await fetch(`${apiBase}/conversations/quick-replies/${templateId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${auth.token}` }
      });

      if (!res.ok) {
        setError(await extractError(res, "Falha ao excluir resposta rapida."));
        return;
      }

      if (quickReplyDraft.id === templateId) {
        setQuickReplyDraft({ id: "", title: "", body: "" });
      }

      await loadQuickReplies(auth.token);
      setNotice("Resposta rapida removida.");
    } catch {
      setError("Erro ao excluir resposta rapida.");
    }
  }

  function applyQuickReply(body: string) {
    setReply(body);
  }
  async function switchTenant(tenantId: string) {
    if (!auth || auth.role !== "SuperAdmin" || tenantId === auth.tenantId) return;

    setSwitchingTenant(true);
    try {
      const res = await fetch(`${apiBase}/auth/switch-tenant`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${auth.token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ tenantId })
      });

      if (!res.ok) {
        let message = "Falha ao alternar tenant.";
        try {
          const payload = (await res.json()) as { message?: string };
          if (payload?.message) {
            message = payload.message;
          }
        } catch {
          // ignore parse errors
        }

        setError(message);
        return;
      }

      const data = (await res.json()) as AuthResponse;
      setAuth(data);
      await Promise.all([
        loadConversations(data.token),
        loadSettings(data.token, data.role),
        loadAnalytics(data.token),
        loadTenants(data.token),
        loadManagedCompanies(data.token),
        loadManagedUsers(data.token, data.role, data.tenantId),
        loadCommercial(data.token, data.role),
        loadEngagement(data.token, data.role),
        loadCrm(data.token, data.role),
        loadQuickReplies(data.token)
      ]);

      setNotice(`Contexto alterado para ${data.tenantName}.`);
    } catch {
      setError("Erro ao alternar tenant.");
    } finally {
      setSwitchingTenant(false);
    }
  }

  async function sendHumanReply() {
    if (!auth || !selectedConversation || !reply.trim()) return;

    try {
      const res = await fetch(`${apiBase}/conversations/${selectedConversation.id}/human-reply`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${auth.token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ message: reply })
      });

      if (!res.ok) {
        setError(await extractError(res, "Nao foi possivel enviar resposta humana."));
        return;
      }

      const payload = await safeJson<{ message?: string }>(res);
      setReply("");
      setNotice(payload?.message || "Resposta enviada ao cliente.");
      await refreshInboxOnly(auth.token);
    } catch {
      setError("Erro de conexao ao enviar resposta.");
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
      const res = await fetch(`${apiBase}/conversations/outbound`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${auth.token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          customerPhone: outboundDraft.customerPhone.trim(),
          customerName: outboundDraft.customerName.trim() || null,
          message: outboundDraft.message.trim(),
          channelId: outboundDraft.channelId || null
        })
      });

      const payload = await safeJson<{ message?: string; error?: string | null; status?: string; conversationId?: string }>(res);
      if (!res.ok) {
        if (payload?.conversationId) {
          await refreshInboxOnly(auth.token);
          setSelectedId(payload.conversationId);
        }

        setError(payload?.message || payload?.error || "Nao foi possivel iniciar conversa outbound.");
        return false;
      }

      setOutboundDraft({ customerName: "", customerPhone: "", channelId: "", message: "" });
      await refreshInboxOnly(auth.token);
      if (payload?.conversationId) {
        setSelectedId(payload.conversationId);
      }
      setNotice(payload?.message || "Conversa outbound iniciada com sucesso.");
      return true;
    } catch {
      setError("Erro de conexao ao iniciar conversa outbound.");
      return false;
    } finally {
      setSendingOutbound(false);
    }
  }
  async function saveSettings() {
    if (!auth || !canManage) return;

    try {
      const res = await fetch(`${apiBase}/settings`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${auth.token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(settingsDraft)
      });

      if (!res.ok) {
        setError("Falha ao salvar configuracoes.");
        return;
      }

      await loadSettings();
      setNotice("Configuracoes atualizadas.");
    } catch {
      setError("Erro ao salvar configuracoes.");
    }
  }

  async function addTrainingEntry() {
    if (!auth || !canManage || !trainingKeyword.trim() || !trainingAnswer.trim()) return;

    try {
      const res = await fetch(`${apiBase}/settings/training`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${auth.token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ keyword: trainingKeyword, answerTemplate: trainingAnswer })
      });

      if (!res.ok) {
        setError("Falha ao adicionar treinamento.");
        return;
      }

      setTrainingKeyword("");
      setTrainingAnswer("");
      await loadSettings();
      setNotice("Regra de treinamento adicionada.");
    } catch {
      setError("Erro ao adicionar treinamento.");
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
      const url = isEditing
        ? `${apiBase}/management/companies/${editingCompanyId}`
        : `${apiBase}/management/companies`;

      const res = await fetch(url, {
        method: isEditing ? "PUT" : "POST",
        headers: {
          Authorization: `Bearer ${auth.token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(companyDraft)
      });

      if (!res.ok) {
        setError("Falha ao salvar empresa.");
        return;
      }

      setCompanyDraft({ name: "", segment: "" });
      setEditingCompanyId("");
      await Promise.all([loadManagedCompanies(), loadTenants()]);
      setNotice(isEditing ? "Empresa atualizada." : "Empresa criada.");
    } catch {
      setError("Erro ao salvar empresa.");
    }
  }

  async function deleteCompany(companyId: string) {
    if (!auth || !canManageCompanies) return;

    try {
      const res = await fetch(`${apiBase}/management/companies/${companyId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${auth.token}` }
      });

      if (!res.ok) {
        setError("Falha ao excluir empresa.");
        return;
      }

      await Promise.all([loadManagedCompanies(), loadTenants()]);
      setNotice("Empresa excluida.");
    } catch {
      setError("Erro ao excluir empresa.");
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
      const url = isEditing ? `${apiBase}/management/users/${editingUserId}` : `${apiBase}/management/users`;
      const payload = isEditing
        ? {
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
          };

      const res = await fetch(url, {
        method: isEditing ? "PUT" : "POST",
        headers: {
          Authorization: `Bearer ${auth.token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        setError("Falha ao salvar usuario.");
        return;
      }

      setEditingUserId("");
      setUserDraft({ tenantId: auth.tenantId, name: "", email: "", role: "Agent", password: "" });
      await loadManagedUsers();
      setNotice(isEditing ? "Usuario atualizado." : "Usuario criado.");
    } catch {
      setError("Erro ao salvar usuario.");
    }
  }

  async function deleteUser(userId: string) {
    if (!auth || !canManage) return;

    try {
      const res = await fetch(`${apiBase}/management/users/${userId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${auth.token}` }
      });

      if (!res.ok) {
        setError("Falha ao excluir usuario.");
        return;
      }

      await loadManagedUsers();
      setNotice("Usuario excluido.");
    } catch {
      setError("Erro ao excluir usuario.");
    }
  }

  function editUser(user: ManagedUser) {
    setEditingUserId(user.id);
    setUserDraft({ tenantId: user.tenantId, name: user.name, email: user.email, role: user.role, password: "" });
    setCurrentPage("ATTENDANCE");
  }

  function cancelUserEdit() {
    setEditingUserId("");
    setUserDraft({ tenantId: auth?.tenantId ?? "", name: "", email: "", role: "Agent", password: "" });
  }

  async function logout() {
    if (auth?.refreshToken) {
      try {
        await fetch(`${apiBase}/auth/logout`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ refreshToken: auth.refreshToken })
        });
      } catch {
        // ignore network errors on logout
      }
    }

    clearStoredAuth();
    setAuth(null);
    setAuthView("LOGIN");
    setError("");
    setNotice("");
    setConversations([]);
    setSelectedId("");
    setReply("");
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
                  <p className="text-sm leading-6 text-slate-300">{auth.tenantName}</p>
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
          conversations={conversations}
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
        />
      )}

      {currentPage === "WHATSAPP" && canManage && auth && (
        <WhatsAppWorkspace
          apiBase={apiBase}
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

function formatDate(dateText: string) {
  const date = new Date(dateText);
  if (Number.isNaN(date.getTime())) return "-";

  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  }).format(date);
}

function formatSeconds(seconds: number) {
  if (seconds <= 0) return "0s";
  if (seconds < 60) return `${Math.round(seconds)}s`;
  return `${(seconds / 60).toFixed(1)} min`;
}

function formatCurrency(value: number, currency: string) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: currency || "BRL"
  }).format(value);
}

function splitTags(raw: string) {
  return raw
    .split(/[|,]/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function normalizePhone(value: string) {
  return value.replace(/\D+/g, "");
}

async function extractError(res: Response, fallback: string) {
  const payload = await safeJson<{ message?: string; detail?: string }>(res);
  return payload?.message || payload?.detail || fallback;
}

async function safeJson<T>(res: Response): Promise<T | null> {
  const text = await res.text();
  if (!text) return null;
  try { return JSON.parse(text) as T; } catch { return null; }
}













































































function persistAuth(auth: AuthResponse | null) {
  if (typeof window === "undefined") return;

  if (!auth) {
    window.localStorage.removeItem(AUTH_STORAGE_KEY);
    return;
  }

  window.localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(auth));
}

function readStoredAuth(): AuthResponse | null {
  if (typeof window === "undefined") return null;

  const raw = window.localStorage.getItem(AUTH_STORAGE_KEY);
  if (!raw) return null;

  try {
    return JSON.parse(raw) as AuthResponse;
  } catch {
    window.localStorage.removeItem(AUTH_STORAGE_KEY);
    return null;
  }
}

function clearStoredAuth() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(AUTH_STORAGE_KEY);
}

function persistPage(page: AppPage) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(PAGE_STORAGE_KEY, page);
}

function readStoredPage(): AppPage {
  if (typeof window === "undefined") return "ATTENDANCE";
  const raw = window.localStorage.getItem(PAGE_STORAGE_KEY);
  return isAppPage(raw) ? raw : "ATTENDANCE";
}

function persistAuthView(view: "PRICING" | "LOGIN") {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(AUTH_VIEW_STORAGE_KEY, view);
}

function readStoredAuthView(): "PRICING" | "LOGIN" {
  if (typeof window === "undefined") return "PRICING";
  const raw = window.localStorage.getItem(AUTH_VIEW_STORAGE_KEY);
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
