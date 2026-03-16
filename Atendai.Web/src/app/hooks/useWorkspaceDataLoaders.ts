import type { Dispatch, SetStateAction } from "react";
import { fetchBotSettings } from "@features/ai/services/aiService";
import { fetchCrmSnapshot } from "@features/clientes/services/clientesService";
import { fetchAnalyticsOverview, fetchBillingSubscription, fetchCommercialSnapshot } from "@features/dashboard/services/dashboardService";
import { fetchManagedCompanies } from "@features/empresas/services/companyManagementService";
import { fetchTenants } from "@features/auth/services/authService";
import { fetchManagedUsers as fetchManagedUsersRequest } from "@features/usuarios/services/userManagementService";
import { fetchWhatsAppSnapshot } from "@features/whatsapp/services/whatsappManagementService";
import { resolveApiErrorMessage } from "@shared/utils/http";
import type {
  AnalyticsOverview,
  AppPage,
  AutomationOption,
  BillingPlan,
  BillingSubscription,
  BotSettings,
  CampaignRule,
  Contact,
  CustomerFeedback,
  ManagedCompany,
  ManagedUser,
  QueueHealth,
  ScheduledBroadcast,
  TenantOption,
  ValueMetrics,
  WhatsAppChannel,
  WhatsAppConnection,
  WhatsAppLog
} from "@shared/types";

type SettingsDraft = {
  businessName: string;
  welcomeMessage: string;
  humanFallbackMessage: string;
};

type WhatsAppDraft = {
  wabaId: string;
  phoneNumberId: string;
  verifyToken: string;
  accessToken: string;
  isActive: boolean;
};

type LoadersParams = {
  billingSubscription: BillingSubscription | null;
  settings: BotSettings | null;
  analytics: AnalyticsOverview | null;
  tenants: TenantOption[];
  authToken?: string;
  authRole?: string;
  authTenantId?: string;
  setBillingSubscription: Dispatch<SetStateAction<BillingSubscription | null>>;
  setSettings: Dispatch<SetStateAction<BotSettings | null>>;
  setSettingsDraft: Dispatch<SetStateAction<SettingsDraft>>;
  setAnalytics: Dispatch<SetStateAction<AnalyticsOverview | null>>;
  setTenants: Dispatch<SetStateAction<TenantOption[]>>;
  setManagedCompanies: Dispatch<SetStateAction<ManagedCompany[]>>;
  setManagedUsers: Dispatch<SetStateAction<ManagedUser[]>>;
  setBillingPlans: Dispatch<SetStateAction<BillingPlan[]>>;
  setValueMetrics: Dispatch<SetStateAction<ValueMetrics | null>>;
  setWhatsAppConfig: Dispatch<SetStateAction<WhatsAppConnection | null>>;
  setWhatsAppDraft: Dispatch<SetStateAction<WhatsAppDraft>>;
  setWhatsAppChannels: Dispatch<SetStateAction<WhatsAppChannel[]>>;
  setWhatsAppChannelLimit: Dispatch<SetStateAction<number>>;
  setCampaigns: Dispatch<SetStateAction<CampaignRule[]>>;
  setWhatsAppLogs: Dispatch<SetStateAction<WhatsAppLog[]>>;
  setContacts: Dispatch<SetStateAction<Contact[]>>;
  setQueueHealth: Dispatch<SetStateAction<QueueHealth | null>>;
  setFeedbackList: Dispatch<SetStateAction<CustomerFeedback[]>>;
  setScheduledBroadcasts: Dispatch<SetStateAction<ScheduledBroadcast[]>>;
  setAutomationOptions: Dispatch<SetStateAction<AutomationOption[]>>;
  loadConversations: (token?: string, options?: { background?: boolean }) => Promise<void>;
  loadQuickReplies: (token?: string) => Promise<void>;
  loadAttendanceContactsIndex: (token?: string) => Promise<void>;
  setError: Dispatch<SetStateAction<string>>;
};

export function useWorkspaceDataLoaders({
  billingSubscription,
  settings,
  analytics,
  tenants,
  authToken,
  authRole,
  authTenantId,
  setBillingSubscription,
  setSettings,
  setSettingsDraft,
  setAnalytics,
  setTenants,
  setManagedCompanies,
  setManagedUsers,
  setBillingPlans,
  setValueMetrics,
  setWhatsAppConfig,
  setWhatsAppDraft,
  setWhatsAppChannels,
  setWhatsAppChannelLimit,
  setCampaigns,
  setWhatsAppLogs,
  setContacts,
  setQueueHealth,
  setFeedbackList,
  setScheduledBroadcasts,
  setAutomationOptions,
  loadConversations,
  loadQuickReplies,
  loadAttendanceContactsIndex,
  setError
}: LoadersParams) {
  async function loadBillingSubscriptionSnapshot(token = authToken) {
    if (!token) {
      return;
    }

    try {
      setBillingSubscription(await fetchBillingSubscription(token));
    } catch {
      // Mantemos o ultimo snapshot quando a consulta complementar falha.
    }
  }

  async function loadSettings(token = authToken, role = authRole) {
    if (!token || (role !== "Admin" && role !== "SuperAdmin")) {
      return;
    }

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

  async function loadAnalytics(token = authToken) {
    if (!token) {
      return;
    }

    try {
      setAnalytics(await fetchAnalyticsOverview(token));
    } catch (error) {
      setError(resolveApiErrorMessage(error, "Erro ao carregar metricas."));
    }
  }

  async function loadTenants(token = authToken) {
    if (!token) {
      return;
    }

    try {
      setTenants(await fetchTenants(token));
    } catch (error) {
      setError(resolveApiErrorMessage(error, "Erro ao carregar tenants."));
    }
  }

  async function loadManagedCompanies(token = authToken) {
    if (!token) {
      return;
    }

    try {
      setManagedCompanies(await fetchManagedCompanies(token));
    } catch (error) {
      setError(resolveApiErrorMessage(error, "Erro ao carregar empresas."));
    }
  }

  async function loadManagedUsers(token = authToken, role = authRole, tenantId = authTenantId) {
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

  async function loadCommercial(token = authToken, role = authRole) {
    if (!token || (role !== "Admin" && role !== "SuperAdmin")) {
      return;
    }

    try {
      const snapshot = await fetchCommercialSnapshot(token);
      setBillingPlans(snapshot.plans);
      setBillingSubscription(snapshot.subscription);
      setValueMetrics(snapshot.valueMetrics);
    } catch (error) {
      setError(resolveApiErrorMessage(error, "Erro ao carregar dados comerciais."));
    }
  }

  async function loadEngagement(token = authToken, role = authRole) {
    if (!token || (role !== "Admin" && role !== "SuperAdmin")) {
      return;
    }

    try {
      const snapshot = await fetchWhatsAppSnapshot(token);
      const config = snapshot.config;
      setWhatsAppConfig(config);
      if (config) {
        setWhatsAppDraft((current) => ({
          ...current,
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

  async function loadCrm(token = authToken, role = authRole) {
    if (!token || !role) {
      return;
    }

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

  async function refreshAll(token = authToken, role = authRole, tenantId = authTenantId) {
    if (!token) {
      return;
    }

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

  async function loadPageData(page: AppPage, token = authToken, role = authRole, tenantId = authTenantId, force = false) {
    if (!token || !role) {
      return;
    }

    const tasks: Array<Promise<void>> = [];

    if (force || !billingSubscription) {
      tasks.push(loadBillingSubscriptionSnapshot(token));
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

  return {
    loadBillingSubscriptionSnapshot,
    loadSettings,
    loadAnalytics,
    loadTenants,
    loadManagedCompanies,
    loadManagedUsers,
    loadCommercial,
    loadEngagement,
    loadCrm,
    refreshAll,
    loadPageData
  };
}
