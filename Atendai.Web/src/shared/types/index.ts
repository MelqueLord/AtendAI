export type AuthResponse = {
  token: string;
  refreshToken: string;
  expiresAtUtc: string;
  name: string;
  role: string;
  tenantId: string;
  tenantName: string;
};

export type TenantOption = {
  id: string;
  name: string;
  segment: string;
};

export type ManagedCompany = {
  id: string;
  name: string;
  segment: string;
  createdAt: string;
};

export type ManagedUser = {
  id: string;
  tenantId: string;
  tenantName: string;
  name: string;
  email: string;
  role: string;
  createdAt: string;
};

export type ConversationMessage = {
  id: string;
  sender: string;
  text: string;
  createdAt: string;
};

export type Conversation = {
  id: string;
  customerPhone: string;
  customerName: string;
  status: string | number;
  transport: string | null;
  channelId: string | null;
  channelName: string | null;
  assignedUserId: string | null;
  assignedUserName: string | null;
  lastCustomerMessageAt: string | null;
  lastHumanMessageAt: string | null;
  closedAt: string | null;
  updatedAt: string;
  messages: ConversationMessage[];
};

export type ConversationNote = {
  id: string;
  conversationId: string;
  userId: string;
  userName: string;
  note: string;
  createdAt: string;
};

export type QuickReplyTemplate = {
  id: string;
  tenantId: string;
  title: string;
  body: string;
  createdAt: string;
  updatedAt: string;
};

export type BotSettings = {
  businessName: string;
  welcomeMessage: string;
  humanFallbackMessage: string;
  trainingEntries: TrainingEntry[];
};

export type TrainingEntry = {
  id: string;
  keyword: string;
  answerTemplate: string;
};

export type AnalyticsPoint = {
  date: string;
  total: number;
  waitingHuman: number;
  schedulingIntent: number;
};

export type AnalyticsOverview = {
  totalConversations: number;
  waitingHumanConversations: number;
  slaWithinFiveMinutesRate: number;
  firstContactResolutionRate: number;
  averageFirstResponseSeconds: number;
  schedulingConversionRate: number;
  last7Days: AnalyticsPoint[];
};

export type QueueFilter = "ALL" | "WAITING_HUMAN" | "BOT" | "HUMAN";
export type AppPage = "ATTENDANCE" | "AI" | "CRM" | "WHATSAPP" | "COMMERCIAL" | "USERS" | "COMPANIES";

export type BillingPlan = {
  code: string;
  name: string;
  monthlyPrice: number;
  currency: string;
  includedMessages: number;
  includedAgents: number;
  includedWhatsAppNumbers: number;
  isPopular: boolean;
};

export type BillingSubscription = {
  tenantId: string;
  planCode: string;
  planName: string;
  status: string;
  effectiveStatus: string;
  trialEndsAt: string | null;
  trialDaysRemaining: number | null;
  isTrialExpired: boolean;
  currentPeriodEnd: string | null;
  currentPeriodDaysRemaining: number | null;
  updatedAt: string;
};

export type ValueMetrics = {
  conversations30d: number;
  messages30d: number;
  humanHandoffs30d: number;
  automationRate: number;
  estimatedHoursSaved: number;
  estimatedRevenueProtected: number;
};

export type WhatsAppConnection = {
  tenantId: string;
  wabaId: string | null;
  phoneNumberId: string | null;
  verifyToken: string;
  isActive: boolean;
  lastTestedAt: string | null;
  lastStatus: string | null;
  lastError: string | null;
  updatedAt: string;
};

export type CampaignRule = {
  id: string;
  tenantId: string;
  name: string;
  delayHours: number;
  template: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type WhatsAppLog = {
  id: string;
  tenantId: string;
  conversationId: string | null;
  toPhone: string;
  direction: string;
  status: string;
  errorDetail: string | null;
  createdAt: string;
};

export type WhatsAppChannel = {
  id: string;
  tenantId: string;
  displayName: string;
  wabaId: string | null;
  phoneNumberId: string;
  verifyToken: string;
  isActive: boolean;
  isPrimary: boolean;
  lastTestedAt: string | null;
  lastStatus: string | null;
  lastError: string | null;
  updatedAt: string;
};

export type WhatsAppChannelsPayload = {
  allowed: number;
  used: number;
  channels: WhatsAppChannel[];
};

export type MetaWhatsAppSetup = {
  isConfigured: boolean;
  callbackUrl: string;
  verifyToken: string;
  phoneNumberId: string | null;
  wabaId: string | null;
  channelId: string | null;
  displayName: string | null;
  lastStatus: string | null;
  lastError: string | null;
  lastTestedAt: string | null;
  webhookField: string;
  webhookPath: string;
};

export type MetaWhatsAppBootstrapResult = {
  channelId: string;
  displayName: string;
  callbackUrl: string;
  verifyToken: string;
  phoneNumberId: string;
  wabaId: string | null;
  isActive: boolean;
  isPrimary: boolean;
  testSucceeded: boolean;
  testStatus: string;
  testError: string | null;
};

export type MetaEmbeddedSignupConfig = {
  isReady: boolean;
  appId: string | null;
  configurationId: string | null;
  graphApiVersion: string;
  error: string | null;
};

export type CompleteMetaEmbeddedSignupPayload = {
  code: string;
  finishType: string;
  phoneNumberId: string | null;
  wabaId: string | null;
  businessPortfolioId: string | null;
  adAccountId: string | null;
  pageId: string | null;
  datasetId: string | null;
  displayName: string | null;
  isPrimary: boolean;
  publicBaseUrl: string | null;
};

export type MetaEmbeddedSignupResult = {
  success: boolean;
  status: string;
  message: string;
  channelId: string | null;
  displayName: string | null;
  callbackUrl: string | null;
  verifyToken: string | null;
  phoneNumberId: string | null;
  wabaId: string | null;
  testSucceeded: boolean;
  testStatus: string | null;
  testError: string | null;
};

export type WhatsAppWebSessionState = {
  isConfigured: boolean;
  status: string;
  detail: string;
  sessionId: string | null;
  qrCodeDataUrl: string | null;
  pairingCode: string | null;
  phoneNumber: string | null;
  displayName: string | null;
  lastUpdatedAt: string | null;
  canStart: boolean;
  canRestart: boolean;
  canDisconnect: boolean;
  cachedChatsCount: number;
  lastHistorySyncAt: string | null;
};

export type StartWhatsAppWebSessionPayload = {
  displayName: string | null;
  forceRestart: boolean;
};

export type WhatsAppWebSessionAction = {
  success: boolean;
  status: string;
  message: string;
  session: WhatsAppWebSessionState | null;
};

export type Contact = {
  id: string;
  name: string;
  phone: string;
  state: string | null;
  status: string | null;
  tags: string[];
  ownerName: string | null;
  createdAt: string;
};

export type ScheduledBroadcast = {
  id: string;
  tenantId: string;
  name: string;
  messageTemplate: string;
  scheduledAt: string;
  status: string;
  tagFilter: string | null;
  targetCount: number;
  deliveredCount: number;
  createdAt: string;
};

export type QueueAttentionItem = {
  conversationId: string;
  customerName: string;
  customerPhone: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  waitingMinutes: number;
  firstHumanReplyMinutes: number | null;
};

export type QueueHealth = {
  unattendedCount: number;
  averageFirstHumanReplyMinutes: number;
  averageCustomerRating: number;
  feedbackCount: number;
  unattended: QueueAttentionItem[];
};

export type CustomerFeedback = {
  id: string;
  conversationId: string;
  customerName: string;
  customerPhone: string;
  rating: number;
  comment: string | null;
  createdAt: string;
};

export type AutomationOption = {
  id: string;
  tenantId: string;
  name: string;
  triggerKeywords: string;
  responseTemplate: string;
  escalateToHuman: boolean;
  sortOrder: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};
