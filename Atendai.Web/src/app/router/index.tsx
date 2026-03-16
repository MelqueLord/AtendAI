import { useState } from "react";
import { PublicEntryScreen, SessionRestoreScreen } from "@app/auth/AuthScreens";
import { useAuthWorkflow } from "@app/hooks/useAuthWorkflow";
import { useWorkspaceFeedback } from "@app/hooks/useWorkspaceFeedback";
import { useWorkspacePageDataSync } from "@app/hooks/useWorkspacePageDataSync";
import { useWorkspaceDataLoaders } from "@app/hooks/useWorkspaceDataLoaders";
import { useAuthContext } from "@app/providers/useAuthContext";
import { AppWorkspaceContent } from "@app/router/AppWorkspaceContent";
import { AppShell } from "@app/shell/AppShell";
import { useAiWorkspaceActions } from "@features/ai/hooks/useAiWorkspaceActions";
import { useAiWorkspaceState } from "@features/ai/hooks/useAiWorkspaceState";
import { useAttendanceRealtimeSync } from "@features/atendimentos/hooks/useAttendanceRealtimeSync";
import { useAttendanceSelectionSync } from "@features/atendimentos/hooks/useAttendanceSelectionSync";
import { useAttendanceWorkspaceActions } from "@features/atendimentos/hooks/useAttendanceWorkspaceActions";
import { useAttendanceWorkspaceData } from "@features/atendimentos/hooks/useAttendanceWorkspaceData";
import { useAttendanceWorkspaceState } from "@features/atendimentos/hooks/useAttendanceWorkspaceState";
import { useCrmWorkspaceActions } from "@features/clientes/hooks/useCrmWorkspaceActions";
import { useCrmWorkspaceState } from "@features/clientes/hooks/useCrmWorkspaceState";
import { useManagementWorkspaceActions } from "@features/usuarios/hooks/useManagementWorkspaceActions";
import { useManagementWorkspaceState } from "@features/usuarios/hooks/useManagementWorkspaceState";
import { useWhatsAppWorkspaceActions } from "@features/whatsapp/hooks/useWhatsAppWorkspaceActions";
import { useWhatsAppWorkspaceState } from "@features/whatsapp/hooks/useWhatsAppWorkspaceState";
import { env } from "@infrastructure/config/env";
import { automationPriorityOptions, contactStatusOptions, stateOptions } from "@shared/constants/workspace";
import type {
  AnalyticsOverview,
  BillingPlan,
  BillingSubscription,
  TenantOption,
  ValueMetrics
} from "@shared/types";
import { formatCurrency, formatDate } from "@shared/utils/formatting";
const apiBase = env.apiBaseUrl;

export function AppRouter() {
  const {
    auth,
    setAuth,
    sessionReady,
    authView,
    setAuthView,
    currentPage,
    setCurrentPage,
    sessionRestoreError,
    clearSessionRestoreError
  } = useAuthContext();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [loading, setLoading] = useState(false);
  const [tenants, setTenants] = useState<TenantOption[]>([]);
  const [switchingTenant, setSwitchingTenant] = useState(false);
  const [analytics, setAnalytics] = useState<AnalyticsOverview | null>(null);
  const [billingPlans, setBillingPlans] = useState<BillingPlan[]>([]);
  const [billingSubscription, setBillingSubscription] = useState<BillingSubscription | null>(null);
  const [valueMetrics, setValueMetrics] = useState<ValueMetrics | null>(null);

  const crmWorkspace = useCrmWorkspaceState();
  const {
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
  } = crmWorkspace;

  const attendanceWorkspace = useAttendanceWorkspaceState(contacts);
  const {
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
  } = attendanceWorkspace;

  const aiWorkspace = useAiWorkspaceState();
  const {
    settings,
    setSettings,
    settingsDraft,
    setSettingsDraft,
    trainingKeyword,
    setTrainingKeyword,
    trainingAnswer,
    setTrainingAnswer,
    resetAiWorkspaceState
  } = aiWorkspace;

  const managementWorkspace = useManagementWorkspaceState(auth?.tenantId);
  const {
    managedCompanies,
    setManagedCompanies,
    managedUsers,
    setManagedUsers,
    companyDraft,
    setCompanyDraft,
    editingCompanyId,
    setEditingCompanyId,
    userDraft,
    setUserDraft,
    editingUserId,
    setEditingUserId,
    userSearch,
    setUserSearch,
    userRoleFilter,
    setUserRoleFilter,
    userTenantFilter,
    setUserTenantFilter,
    companySearch,
    setCompanySearch,
    companySegmentFilter,
    setCompanySegmentFilter,
    availableSegments,
    filteredUsers,
    filteredCompanies,
    resetManagementWorkspaceState
  } = managementWorkspace;

  const whatsAppWorkspace = useWhatsAppWorkspaceState();
  const {
    whatsAppConfig,
    setWhatsAppConfig,
    whatsAppDraft,
    setWhatsAppDraft,
    campaigns: _campaigns,
    setCampaigns,
    campaignDraft,
    setCampaignDraft,
    whatsAppLogs: _whatsAppLogs,
    setWhatsAppLogs,
    whatsAppChannels,
    setWhatsAppChannels,
    whatsAppChannelLimit,
    setWhatsAppChannelLimit,
    editingChannelId,
    setEditingChannelId,
    channelDraft,
    setChannelDraft,
    resetWhatsAppWorkspaceState
  } = whatsAppWorkspace;

  const canManage = auth?.role === "Admin" || auth?.role === "SuperAdmin";
  const canManageCompanies = auth?.role === "SuperAdmin";
  const workspaceName = settings?.businessName?.trim() || auth?.tenantName || "Workspace";
  const workspacePlanName = billingSubscription?.planName?.trim() || "Sem plano contratado";

  function resetWorkspaceState(nextTenantId?: string) {
    resetAttendanceUiState();
    resetAiWorkspaceState();
    resetCrmWorkspaceState();
    resetManagementWorkspaceState(nextTenantId);
    resetWhatsAppWorkspaceState();
    setAnalytics(null);
    setBillingPlans([]);
    setBillingSubscription(null);
    setValueMetrics(null);
    setTenants([]);
  }

  const {
    mergeConversationIntoAttendanceState,
    loadConversations,
    loadAttendanceContactsIndex,
    loadConversationDetail,
    refreshInboxOnly,
    loadConversationNotes,
    applyOptimisticConversationUpdate,
    loadQuickReplies,
    saveConversationContactPanel: saveConversationContactPanelData
  } = useAttendanceWorkspaceData({
    authToken: auth?.token,
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
    setAttendanceQueueLoading,
    setAttendanceQueueRefreshing,
    setAttendanceConversationLoading,
    setAttendanceNotesLoading,
    setContacts,
    setConversationNotes,
    setQuickReplies,
    setError
  });

  const {
    loadBillingSubscriptionSnapshot,
    loadSettings,
    loadTenants,
    loadManagedCompanies,
    loadManagedUsers,
    loadCommercial,
    loadEngagement,
    loadCrm,
    refreshAll,
    loadPageData
  } = useWorkspaceDataLoaders({
    billingSubscription,
    settings,
    analytics,
    tenants,
    authToken: auth?.token,
    authRole: auth?.role,
    authTenantId: auth?.tenantId,
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
  });

  const { login, switchTenant, logout } = useAuthWorkflow({
    email,
    password,
    auth,
    setAuth,
    setAuthView,
    currentPage,
    setCurrentPage,
    setLoading,
    setSwitchingTenant,
    setError,
    setNotice,
    loadTenants,
    loadBillingSubscriptionSnapshot,
    loadPageData,
    resetWorkspaceState
  });

  const { saveSettings, addTrainingEntry } = useAiWorkspaceActions({
    auth,
    canManage,
    settingsDraft,
    trainingKeyword,
    trainingAnswer,
    setTrainingKeyword,
    setTrainingAnswer,
    loadSettings,
    setNotice,
    setError
  });

  const {
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
  } = useCrmWorkspaceActions({
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
  });

  const {
    saveCompany,
    deleteCompany,
    editCompany,
    cancelCompanyEdit,
    saveUser,
    deleteUser,
    editUser,
    cancelUserEdit
  } = useManagementWorkspaceActions({
    auth,
    canManage,
    canManageCompanies,
    userDraft,
    setUserDraft,
    editingUserId,
    setEditingUserId,
    companyDraft,
    setCompanyDraft,
    editingCompanyId,
    setEditingCompanyId,
    loadManagedCompanies,
    loadManagedUsers,
    loadTenants,
    setCurrentPage,
    setNotice,
    setError
  });

  const {
    subscribePlan
  } = useWhatsAppWorkspaceActions({
    auth,
    canManage,
    whatsAppDraft,
    setWhatsAppDraft,
    campaignDraft,
    setCampaignDraft,
    editingChannelId,
    setEditingChannelId,
    channelDraft,
    setChannelDraft,
    loadCommercial,
    loadEngagement,
    setWhatsAppConfig,
    setBillingSubscription,
    setCurrentPage,
    setNotice,
    setError
  });

  const {
    saveConversationContactPanel,
    assignSelectedConversation,
    updateSelectedConversationStatus,
    addConversationNote,
    saveQuickReply,
    editQuickReply,
    deleteQuickReply,
    applyQuickReply,
    sendHumanReply,
    startOutboundConversation
  } = useAttendanceWorkspaceActions({
    auth,
    managedUsers,
    selectedConversation,
    selectedIdRef,
    setSelectedId,
    reply,
    setReply,
    noteDraft,
    setNoteDraft,
    quickReplyDraft,
    setQuickReplyDraft,
    outboundDraft,
    setOutboundDraft,
    setConversationNotes,
    setQuickReplies,
    conversationNotesCacheRef,
    applyOptimisticConversationUpdate,
    mergeConversationIntoAttendanceState,
    loadConversationDetail,
    loadConversationNotes,
    loadConversations,
    setAttendanceAssignmentPendingId,
    setAttendanceStatusPendingId,
    setAttendanceNoteSaving,
    setAttendanceQuickReplySaving,
    setAttendanceReplySending,
    setSendingOutbound,
    setAttendanceContactSaving,
    setNotice,
    setError,
    saveConversationContactPanelData
  });


  useAttendanceSelectionSync({
    authToken: auth?.token,
    selectedConversation,
    selectedContact,
    managedUsers,
    conversationNotesCacheRef,
    setConversationContactDraft,
    setConversationNotes,
    setNoteDraft,
    setAttendanceNotesLoading,
    loadConversationNotes,
    selectedId,
    selectedIdRef,
    conversationDetailCacheRef,
    setSelectedConversationDetail,
    setAttendanceConversationLoading,
    loadConversationDetail
  });

  useWorkspaceFeedback({
    notice,
    setNotice,
    error,
    setError,
    sessionRestoreError,
    clearSessionRestoreError
  });

  useWorkspacePageDataSync({
    authToken: auth?.token,
    authRole: auth?.role,
    authTenantId: auth?.tenantId,
    currentPage,
    loadPageData
  });

  useAttendanceRealtimeSync({
    apiBase,
    authToken: auth?.token,
    currentPage,
    selectedIdRef,
    loadConversationDetail,
    loadConversations,
    loadConversationNotes,
    setAttendanceRealtimeState,
    setAttendanceRealtimeLastPublishedAt,
    setAttendanceRealtimeLastReceivedAt
  });

  if (!sessionReady) {
    return <SessionRestoreScreen />;
  }

  if (!auth) {
    return (
      <PublicEntryScreen
        authView={authView}
        email={email}
        password={password}
        loading={loading}
        error={error}
        onEmailChange={setEmail}
        onPasswordChange={setPassword}
        onLogin={() => { void login(); }}
        onShowPricing={() => setAuthView("PRICING")}
        onShowLogin={() => setAuthView("LOGIN")}
      />
    );
  }

  return (
    <AppShell
      auth={auth}
      currentPage={currentPage}
      onNavigate={setCurrentPage}
      canManage={canManage}
      canManageCompanies={canManageCompanies}
      workspaceName={workspaceName}
      workspacePlanName={workspacePlanName}
      analytics={analytics}
      tenants={tenants}
      switchingTenant={switchingTenant}
      onSwitchTenant={(tenantId) => { void switchTenant(tenantId); }}
      onRefreshAll={() => { void refreshAll(); }}
      onLogout={() => { void logout(); }}
      notice={notice}
      error={error}
    >
      <AppWorkspaceContent
        currentPage={currentPage}
        canManage={canManage}
        canManageCompanies={canManageCompanies}
        attendanceProps={{
          queue,
          conversations: conversationsWithResolvedNames,
          selectedConversation: selectedConversation ?? null,
          selectedConversationId: selectedId,
          onSelectConversation: setSelectedId,
          search,
          setSearch,
          queueFilter,
          setQueueFilter,
          reply,
          setReply,
          outboundDraft,
          setOutboundDraft,
          outboundSubmitting: sendingOutbound,
          queueLoading: attendanceQueueLoading,
          queueRefreshing: attendanceQueueRefreshing,
          conversationLoading: attendanceConversationLoading,
          notesLoading: attendanceNotesLoading,
          replySubmitting: attendanceReplySending,
          noteSubmitting: attendanceNoteSaving,
          contactSaving: attendanceContactSaving,
          quickReplySaving: attendanceQuickReplySaving,
          statusPendingConversationId: attendanceStatusPendingId,
          assignmentPendingConversationId: attendanceAssignmentPendingId,
          whatsAppChannels,
          startOutboundConversation,
          sendHumanReply,
          refreshInbox: refreshInboxOnly,
          feedbackDraft,
          setFeedbackDraft,
          saveConversationFeedback,
          contactPanelDraft: conversationContactDraft,
          setContactPanelDraft: setConversationContactDraft,
          saveContactPanelDraft: () => saveConversationContactPanel(conversationContactDraft),
          hasSelectedContact: Boolean(selectedContact),
          stateOptions,
          contactStatusOptions,
          managedUsers,
          canAssignConversations: canManage,
          assignConversation: assignSelectedConversation,
          updateConversationStatus: updateSelectedConversationStatus,
          attendanceRealtimeState,
          attendanceRealtimeLastPublishedAt,
          attendanceRealtimeLastReceivedAt,
          notes: conversationNotes,
          noteDraft,
          setNoteDraft,
          addConversationNote,
          quickReplies,
          quickReplyDraft,
          setQuickReplyDraft,
          saveQuickReply,
          editQuickReply,
          deleteQuickReply,
          applyQuickReply,
          formatDate
        }}
        aiProps={{
          role: auth.role,
          settingsDraft,
          setSettingsDraft,
          trainingKeyword,
          setTrainingKeyword,
          trainingAnswer,
          setTrainingAnswer,
          trainingEntries: settings?.trainingEntries ?? [],
          saveSettings,
          addTrainingEntry
        }}
        usersProps={{
          canManageCompanies,
          tenants,
          managedUsers,
          filteredUsers,
          userDraft,
          setUserDraft,
          editingUserId,
          saveUser,
          cancelUserEdit,
          userSearch,
          setUserSearch,
          userRoleFilter,
          setUserRoleFilter,
          userTenantFilter,
          setUserTenantFilter,
          editUser,
          deleteUser,
          formatDate
        }}
        commercialProps={{
          billingSubscription,
          valueMetrics,
          billingPlans,
          subscribePlan,
          formatCurrency,
          formatDate,
          currentTenantId: auth.tenantId,
          currentTenantName: auth.tenantName,
          canSwitchTenant: auth.role === "SuperAdmin",
          tenants,
          switchTenant,
          switchingTenant,
          whatsAppChannelLimit,
          whatsAppChannelCount: whatsAppChannels.length
        }}
        whatsAppProps={{
          authToken: auth.token,
          whatsAppConfig,
          whatsAppChannels,
          whatsAppChannelLimit,
          onRefreshMetaState: () => loadEngagement(auth.token, auth.role),
          onOpenMetaChannel: openMetaWhatsAppChannel,
          onSurfaceError: setError,
          onSurfaceNotice: setNotice,
          formatDate
        }}
        crmProps={{
          contacts,
          filteredContacts,
          contactDraft,
          setContactDraft,
          editingContactId,
          saveContact,
          cancelContactEdit,
          contactImportRaw,
          setContactImportRaw,
          importContacts,
          contactSearch,
          setContactSearch,
          contactStateFilter,
          setContactStateFilter,
          contactStatusFilter,
          setContactStatusFilter,
          contactTagFilter,
          setContactTagFilter,
          stateOptions,
          contactStatusOptions,
          availableTags,
          selectedBroadcastContacts,
          toggleBroadcastContact,
          editContact,
          deleteContact,
          scheduledBroadcasts,
          broadcastDraft,
          setBroadcastDraft,
          saveBroadcast,
          queueHealth,
          feedbackList,
          automationOptions,
          automationDraft,
          setAutomationDraft,
          automationPriorityOptions,
          editingAutomationId,
          saveAutomationOption,
          cancelAutomationEdit,
          editAutomationOption,
          deleteAutomationOption,
          openInternalConversation,
          formatDate
        }}
        companiesProps={{
          managedCompanies,
          filteredCompanies,
          companyDraft,
          setCompanyDraft,
          editingCompanyId,
          saveCompany,
          cancelCompanyEdit,
          companySearch,
          setCompanySearch,
          companySegmentFilter,
          setCompanySegmentFilter,
          availableSegments,
          editCompany,
          deleteCompany,
          formatDate
        }}
      />
    </AppShell>
  );
}






























