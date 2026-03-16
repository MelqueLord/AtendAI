import { renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useWorkspaceDataLoaders } from "@app/hooks/useWorkspaceDataLoaders";

const loaderMocks = vi.hoisted(() => ({
  fetchBotSettings: vi.fn(),
  fetchCrmSnapshot: vi.fn(),
  fetchAnalyticsOverview: vi.fn(),
  fetchBillingSubscription: vi.fn(),
  fetchCommercialSnapshot: vi.fn(),
  fetchManagedCompanies: vi.fn(),
  fetchTenants: vi.fn(),
  fetchManagedUsersRequest: vi.fn(),
  fetchWhatsAppSnapshot: vi.fn()
}));

vi.mock("@features/ai/services/aiService", () => ({ fetchBotSettings: loaderMocks.fetchBotSettings }));
vi.mock("@features/clientes/services/clientesService", () => ({ fetchCrmSnapshot: loaderMocks.fetchCrmSnapshot }));
vi.mock("@features/dashboard/services/dashboardService", () => ({
  fetchAnalyticsOverview: loaderMocks.fetchAnalyticsOverview,
  fetchBillingSubscription: loaderMocks.fetchBillingSubscription,
  fetchCommercialSnapshot: loaderMocks.fetchCommercialSnapshot
}));
vi.mock("@features/empresas/services/companyManagementService", () => ({ fetchManagedCompanies: loaderMocks.fetchManagedCompanies }));
vi.mock("@features/auth/services/authService", () => ({ fetchTenants: loaderMocks.fetchTenants }));
vi.mock("@features/usuarios/services/userManagementService", () => ({ fetchManagedUsers: loaderMocks.fetchManagedUsersRequest }));
vi.mock("@features/whatsapp/services/whatsappManagementService", () => ({ fetchWhatsAppSnapshot: loaderMocks.fetchWhatsAppSnapshot }));

describe("useWorkspaceDataLoaders", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("limpa usuarios quando o papel e Agent", async () => {
    const setManagedUsers = vi.fn();

    const { result } = renderHook(() => useWorkspaceDataLoaders({
      billingSubscription: null,
      settings: null,
      analytics: null,
      tenants: [],
      authToken: "token-1",
      authRole: "Agent",
      authTenantId: "tenant-1",
      setBillingSubscription: vi.fn(),
      setSettings: vi.fn(),
      setSettingsDraft: vi.fn(),
      setAnalytics: vi.fn(),
      setTenants: vi.fn(),
      setManagedCompanies: vi.fn(),
      setManagedUsers,
      setBillingPlans: vi.fn(),
      setValueMetrics: vi.fn(),
      setWhatsAppConfig: vi.fn(),
      setWhatsAppDraft: vi.fn(),
      setWhatsAppChannels: vi.fn(),
      setWhatsAppChannelLimit: vi.fn(),
      setCampaigns: vi.fn(),
      setWhatsAppLogs: vi.fn(),
      setContacts: vi.fn(),
      setQueueHealth: vi.fn(),
      setFeedbackList: vi.fn(),
      setScheduledBroadcasts: vi.fn(),
      setAutomationOptions: vi.fn(),
      loadConversations: vi.fn().mockResolvedValue(undefined),
      loadQuickReplies: vi.fn().mockResolvedValue(undefined),
      loadAttendanceContactsIndex: vi.fn().mockResolvedValue(undefined),
      setError: vi.fn()
    }));

    await result.current.loadManagedUsers();

    expect(setManagedUsers).toHaveBeenCalledWith([]);
    expect(loaderMocks.fetchManagedUsersRequest).not.toHaveBeenCalled();
  });

  it("hidrata snapshot de WhatsApp no draft e nos limites", async () => {
    loaderMocks.fetchWhatsAppSnapshot.mockResolvedValue({
      config: {
        tenantId: "tenant-1",
        wabaId: "waba-1",
        phoneNumberId: "phone-1",
        verifyToken: "verify-1",
        isActive: true,
        lastTestedAt: null,
        lastStatus: null,
        lastError: null,
        updatedAt: "2026-03-16T12:00:00Z"
      },
      channelsPayload: {
        allowed: 3,
        used: 1,
        channels: []
      },
      campaigns: [],
      logs: []
    });

    const setWhatsAppConfig = vi.fn();
    const setWhatsAppDraft = vi.fn();
    const setWhatsAppChannels = vi.fn();
    const setWhatsAppChannelLimit = vi.fn();

    const { result } = renderHook(() => useWorkspaceDataLoaders({
      billingSubscription: null,
      settings: null,
      analytics: null,
      tenants: [],
      authToken: "token-1",
      authRole: "Admin",
      authTenantId: "tenant-1",
      setBillingSubscription: vi.fn(),
      setSettings: vi.fn(),
      setSettingsDraft: vi.fn(),
      setAnalytics: vi.fn(),
      setTenants: vi.fn(),
      setManagedCompanies: vi.fn(),
      setManagedUsers: vi.fn(),
      setBillingPlans: vi.fn(),
      setValueMetrics: vi.fn(),
      setWhatsAppConfig,
      setWhatsAppDraft,
      setWhatsAppChannels,
      setWhatsAppChannelLimit,
      setCampaigns: vi.fn(),
      setWhatsAppLogs: vi.fn(),
      setContacts: vi.fn(),
      setQueueHealth: vi.fn(),
      setFeedbackList: vi.fn(),
      setScheduledBroadcasts: vi.fn(),
      setAutomationOptions: vi.fn(),
      loadConversations: vi.fn().mockResolvedValue(undefined),
      loadQuickReplies: vi.fn().mockResolvedValue(undefined),
      loadAttendanceContactsIndex: vi.fn().mockResolvedValue(undefined),
      setError: vi.fn()
    }));

    await result.current.loadEngagement();

    expect(setWhatsAppConfig).toHaveBeenCalled();
    expect(setWhatsAppDraft).toHaveBeenCalled();
    expect(setWhatsAppChannels).toHaveBeenCalledWith([]);
    expect(setWhatsAppChannelLimit).toHaveBeenCalledWith(3);
  });
});
