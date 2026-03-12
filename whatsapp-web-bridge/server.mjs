import cors from "cors";
import express from "express";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import Pino from "pino";
import QRCode from "qrcode";
import makeWASocket, {
  DisconnectReason,
  fetchLatestBaileysVersion,
  proto,
  useMultiFileAuthState
} from "@whiskeysockets/baileys";

const logger = Pino({ level: process.env.LOG_LEVEL || "info" });
const app = express();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PORT = Number.parseInt(process.env.PORT || "3011", 10);
const DATA_DIR = path.resolve(process.env.SESSIONS_DIR || path.join(__dirname, "data"));
const API_KEY = process.env.ATENDAI_BRIDGE_API_KEY || "";
const BACKEND_CALLBACK_BASE_URL = (process.env.BACKEND_CALLBACK_BASE_URL || "http://localhost:5155").trim().replace(/\/+$/, "");
const BACKEND_CALLBACK_KEY = process.env.BACKEND_CALLBACK_KEY || API_KEY;

const sessions = new Map();

app.use(cors());
app.use(express.json({ limit: "1mb" }));
app.use(async (_req, _res, next) => {
  await fs.mkdir(DATA_DIR, { recursive: true });
  next();
});
app.use((req, res, next) => {
  if (!API_KEY) {
    next();
    return;
  }

  if (req.header("X-Atendai-Bridge-Key") !== API_KEY) {
    res.status(401).json({ message: "Bridge API key invalida." });
    return;
  }

  next();
});

app.get("/health", (_req, res) => {
  res.json({ ok: true, uptime: process.uptime() });
});

app.get("/sessions/:tenantId", async (req, res) => {
  const session = getSession(req.params.tenantId);
  res.json(serializeSession(session));
});

app.post("/sessions/:tenantId/start", async (req, res) => {
  try {
    const tenantId = req.params.tenantId;
    const session = getSession(tenantId);
    const displayName = typeof req.body?.displayName === "string" ? req.body.displayName : null;

    session.displayName = displayName?.trim() || session.displayName || "WhatsApp QR";
    if (!session.socket) {
      session.status = "starting";
      session.detail = "Inicializando sessao QR em segundo plano.";
      session.lastUpdatedAt = new Date().toISOString();
    }

    void startSessionInBackground(tenantId, {
      displayName: session.displayName,
      forceRestart: Boolean(req.body?.forceRestart)
    });

    res.json({
      success: true,
      status: session.status,
      message: "Sessao QR iniciada. Aguarde alguns segundos enquanto o QR e carregado.",
      session: serializeSession(session)
    });
  } catch (error) {
    logger.error({ err: error }, "failed to start session");
    res.status(500).json({
      success: false,
      status: "error",
      message: error instanceof Error ? error.message : "Falha ao iniciar sessao QR.",
      session: serializeSession(getSession(req.params.tenantId))
    });
  }
});

app.post("/sessions/:tenantId/restart", async (req, res) => {
  try {
    const tenantId = req.params.tenantId;
    const existing = getSession(tenantId);
    await teardownSession(existing, false);
    existing.status = "starting";
    existing.detail = "Reiniciando sessao QR em segundo plano.";
    existing.lastUpdatedAt = new Date().toISOString();

    void startSessionInBackground(tenantId, {
      displayName: existing.displayName,
      forceRestart: true
    });

    res.json({
      success: true,
      status: existing.status,
      message: "Sessao QR reiniciada. Aguarde o novo QR ser carregado.",
      session: serializeSession(existing)
    });
  } catch (error) {
    logger.error({ err: error }, "failed to restart session");
    res.status(500).json({
      success: false,
      status: "error",
      message: error instanceof Error ? error.message : "Falha ao reiniciar a sessao QR.",
      session: serializeSession(getSession(req.params.tenantId))
    });
  }
});

app.post("/sessions/:tenantId/disconnect", async (req, res) => {
  try {
    const session = getSession(req.params.tenantId);
    session.manualDisconnect = true;
    if (session.socket) {
      try {
        await session.socket.logout();
      } catch {
        // ignore logout failures and continue teardown
      }
    }

    await teardownSession(session, true);
    clearSessionHistory(session);
    session.status = "disconnected";
    session.detail = "Sessao desconectada.";
    session.lastUpdatedAt = new Date().toISOString();

    res.json({
      success: true,
      status: "disconnected",
      message: "Sessao QR desconectada.",
      session: serializeSession(session)
    });
  } catch (error) {
    logger.error({ err: error }, "failed to disconnect session");
    res.status(500).json({
      success: false,
      status: "error",
      message: error instanceof Error ? error.message : "Falha ao desconectar a sessao QR.",
      session: serializeSession(getSession(req.params.tenantId))
    });
  }
});

app.post("/sessions/:tenantId/sync-history", async (req, res) => {
  try {
    const tenantId = req.params.tenantId;
    const session = getSession(tenantId);
    const hasChats = session.chats.size > 0;

    if (hasChats) {
      session.detail = "Sincronizando conversas recentes para o CRM em segundo plano.";
      session.lastUpdatedAt = new Date().toISOString();
      void startHistorySyncInBackground(tenantId, session);
    }

    res.json({
      success: true,
      status: session.status,
      message: hasChats
        ? "Sincronizacao iniciada em segundo plano. Aguarde alguns segundos e atualize o Atendimento."
        : "Nenhuma conversa recente foi encontrada para sincronizar.",
      session: serializeSession(session)
    });
  } catch (error) {
    logger.error({ err: error }, "failed to sync qr history");
    res.status(500).json({
      success: false,
      status: "error",
      message: error instanceof Error ? error.message : "Falha ao sincronizar historico do WhatsApp.",
      session: serializeSession(getSession(req.params.tenantId))
    });
  }
});

app.post("/sessions/:tenantId/send", async (req, res) => {
  const session = getSession(req.params.tenantId);
  const toPhone = typeof req.body?.toPhone === "string" ? req.body.toPhone : "";
  const message = typeof req.body?.message === "string" ? req.body.message : "";

  if (!session.socket || session.status !== "connected") {
    res.status(409).json({
      success: false,
      status: "not_connected",
      message: "A sessao QR nao esta conectada.",
      session: serializeSession(session)
    });
    return;
  }

  if (!toPhone.trim() || !message.trim()) {
    res.status(400).json({
      success: false,
      status: "invalid_request",
      message: "ToPhone e Message sao obrigatorios.",
      session: serializeSession(session)
    });
    return;
  }

  try {
    const recipientJid = resolveRecipientJid(session, toPhone);
    const sentMessage = await session.socket.sendMessage(recipientJid, { text: message.trim() });
    storeMessageForRetry(session, sentMessage);
    res.json({
      success: true,
      status: "sent",
      message: "Mensagem enviada pela sessao QR.",
      session: serializeSession(session)
    });
  } catch (error) {
    logger.error({ err: error }, "failed to send qr session message");
    res.status(500).json({
      success: false,
      status: "error",
      message: error instanceof Error ? error.message : "Falha ao enviar mensagem pela sessao QR.",
      session: serializeSession(session)
    });
  }
});

app.listen(PORT, () => {
  logger.info({ port: PORT, dataDir: DATA_DIR, backendCallbackBaseUrl: BACKEND_CALLBACK_BASE_URL }, "whatsapp-web-bridge listening");
});

function getSession(tenantId) {
  if (!sessions.has(tenantId)) {
    sessions.set(tenantId, createEmptySession(tenantId));
  }

  return sessions.get(tenantId);
}

function startSessionInBackground(tenantId, options = {}) {
  const session = getSession(tenantId);
  if (session.initPromise) {
    return session.initPromise;
  }

  const initPromise = ensureSession(tenantId, options)
    .catch((error) => {
      logger.error({ err: error, tenantId }, "failed to initialize qr session");
      session.status = "error";
      session.detail = error instanceof Error ? error.message : "Falha ao inicializar a sessao QR.";
      session.lastUpdatedAt = new Date().toISOString();
      return session;
    })
    .finally(() => {
      if (session.initPromise === initPromise) {
        session.initPromise = null;
      }
    });

  session.initPromise = initPromise;
  return initPromise;
}

function startHistorySyncInBackground(tenantId, session) {
  if (session.syncPromise) {
    return session.syncPromise;
  }

  const syncPromise = pushChatHistoryToBackend(tenantId, session)
    .catch((error) => {
      logger.warn({ err: error, tenantId }, "failed to sync qr history in background");
      if (session.status === "connected") {
        session.detail = error instanceof Error
          ? `Falha ao sincronizar o historico (${error.message}).`
          : "Falha ao sincronizar o historico do WhatsApp.";
        session.lastUpdatedAt = new Date().toISOString();
      }

      return 0;
    })
    .finally(() => {
      if (session.syncPromise === syncPromise) {
        session.syncPromise = null;
      }
    });

  session.syncPromise = syncPromise;
  return syncPromise;
}

async function ensureSession(tenantId, options = {}) {
  const session = getSession(tenantId);
  if (session.socket && !options.forceRestart) {
    return session;
  }

  if (session.socket && options.forceRestart) {
    await teardownSession(session, false);
  }

  session.displayName = options.displayName?.trim() || session.displayName || "WhatsApp QR";
  session.status = "starting";
  session.detail = "Inicializando sessao QR.";
  session.qrCodeDataUrl = null;
  session.lastUpdatedAt = new Date().toISOString();

  const authPath = path.join(DATA_DIR, tenantId);
  await fs.mkdir(authPath, { recursive: true });
  session.authPath = authPath;
  await hydrateSessionCache(session);

  const { state, saveCreds } = await useMultiFileAuthState(authPath);
  const { version } = await fetchLatestBaileysVersion();
  const socket = makeWASocket({
    auth: state,
    version,
    printQRInTerminal: false,
    markOnlineOnConnect: true,
    syncFullHistory: true,
    msgRetryCounterCache: session.msgRetryCounterCache,
    getMessage: async (key) => getStoredMessageForRetry(session, key),
    logger: Pino({ level: process.env.BAILEYS_LOG_LEVEL || "silent" })
  });

  session.socket = socket;
  session.authPath = authPath;

  socket.ev.on("creds.update", saveCreds);
  socket.ev.on("connection.update", async (update) => {
    if (update.connection === "connecting") {
      session.status = "connecting";
      session.detail = "Conectando ao WhatsApp.";
      session.manualDisconnect = false;
      session.lastUpdatedAt = new Date().toISOString();
    }

    if (update.qr) {
      session.qrCodeDataUrl = await QRCode.toDataURL(update.qr, { margin: 1, width: 320 });
      session.status = "qr_ready";
      session.detail = "Escaneie o QR no celular para concluir o pareamento.";
      session.pairingAttempts += 1;
      session.lastUpdatedAt = new Date().toISOString();
    }

    if (update.connection === "open") {
      session.status = "connected";
      session.detail = "Sessao QR conectada. Sincronizando conversas recentes para o CRM.";
      session.qrCodeDataUrl = null;
      session.phoneNumber = normalizeSocketUser(socket.user?.id || "");
      session.hasConnectedOnce = true;
      session.pairingAttempts = 0;
      session.lastUpdatedAt = new Date().toISOString();
      scheduleCachePersist(session);
      scheduleHistorySync(tenantId, session);
    }

    if (update.connection === "close") {
      const statusCode = getDisconnectStatusCode(update.lastDisconnect?.error);
      const isLoggedOut = statusCode === DisconnectReason.loggedOut;
      const requiresSessionReset = [
        DisconnectReason.loggedOut,
        DisconnectReason.badSession,
        DisconnectReason.multideviceMismatch,
        DisconnectReason.forbidden
      ].includes(statusCode);
      const canAutoRecover = !session.manualDisconnect && [
        DisconnectReason.restartRequired,
        DisconnectReason.connectionClosed,
        DisconnectReason.connectionLost,
        DisconnectReason.timedOut,
        DisconnectReason.unavailableService,
        DisconnectReason.badSession
      ].includes(statusCode);
      const reasonLabel = describeDisconnectReason(statusCode, update.lastDisconnect?.error);

      logger.warn({
        tenantId,
        statusCode,
        reason: reasonLabel,
        hasConnectedOnce: session.hasConnectedOnce,
        pairingAttempts: session.pairingAttempts,
        error: update.lastDisconnect?.error?.message
      }, "qr session closed");

      session.status = "disconnected";
      clearSessionHistory(session);
      session.detail = isLoggedOut
        ? "A sessao foi encerrada pelo WhatsApp e precisa de novo pareamento."
        : `A sessao foi desconectada (${reasonLabel}).`;
      session.qrCodeDataUrl = null;
      session.lastUpdatedAt = new Date().toISOString();

      if (requiresSessionReset) {
        await removeSessionFiles(session.authPath);
      }

      if (canAutoRecover) {
        await teardownSession(session, requiresSessionReset);
        session.status = "starting";
        session.detail = session.hasConnectedOnce
          ? `Conexao perdida (${reasonLabel}). Tentando reconectar automaticamente.`
          : `Pareamento interrompido (${reasonLabel}). Gerando um novo QR automaticamente.`;
        session.lastUpdatedAt = new Date().toISOString();
        scheduleSessionRestart(tenantId, session);
      }
    }
  });

  socket.ev.on("messaging-history.set", ({ chats, contacts, messages }) => {
    mergeHistorySnapshot(session, chats, contacts, messages);
    scheduleHistorySync(tenantId, session);
  });

  socket.ev.on("messages.upsert", async ({ messages }) => {
    for (const message of messages ?? []) {
      storeMessageForRetry(session, message);
      trackChatFromMessage(session, message);

      if (message.key?.fromMe) {
        continue;
      }

      const remoteJid = message.key?.remoteJid || "";
      if (!isDirectChat(remoteJid)) {
        logger.debug({ tenantId, remoteJid }, "ignoring non-direct qr inbound message");
        continue;
      }

      const text = extractMessageText(message.message);
      if (!text) {
        logger.debug({ tenantId, remoteJid, messageKeys: Object.keys(message.message || {}) }, "ignoring qr inbound message without text payload");
        continue;
      }

      const customerPhone = normalizePhone(remoteJid);
      if (!customerPhone) {
        logger.warn({ tenantId, remoteJid }, "ignoring qr inbound message without resolvable phone");
        continue;
      }

      const customerName = resolveCustomerName(customerPhone, message.pushName);
      logger.info({ tenantId, remoteJid, customerPhone }, "forwarding qr inbound message to backend");
      await notifyBackendIncomingMessage(tenantId, {
        customerPhone,
        customerName,
        message: text
      });
    }
  });

  return session;
}

async function teardownSession(session, removeFiles) {
  if (session.socket) {
    try {
      session.socket.end?.(new Error("session_restart"));
    } catch {
      // ignore end failures
    }
  }

  if (session.historySyncTimer) {
    clearTimeout(session.historySyncTimer);
    session.historySyncTimer = null;
  }

  if (session.restartTimer) {
    clearTimeout(session.restartTimer);
    session.restartTimer = null;
  }

  if (session.cachePersistTimer) {
    clearTimeout(session.cachePersistTimer);
    session.cachePersistTimer = null;
  }

  session.socket = null;
  session.qrCodeDataUrl = null;
  session.phoneNumber = null;
  session.lastUpdatedAt = new Date().toISOString();

  if (removeFiles && session.authPath) {
    await removeSessionFiles(session.authPath);
  }
}

function createEmptySession(tenantId) {
  return {
    tenantId,
    sessionId: tenantId,
    displayName: "WhatsApp QR",
    status: "idle",
    detail: "Sessao QR ainda nao iniciada.",
    qrCodeDataUrl: null,
    pairingCode: null,
    phoneNumber: null,
    lastUpdatedAt: null,
    lastHistorySyncAt: null,
    hasConnectedOnce: false,
    pairingAttempts: 0,
    manualDisconnect: false,
    chats: new Map(),
    msgRetryCounterCache: createMemoryCacheStore(),
    messageStore: new Map(),
    historySyncTimer: null,
    restartTimer: null,
    cachePersistTimer: null,
    initPromise: null,
    syncPromise: null,
    socket: null,
    authPath: path.join(DATA_DIR, tenantId)
  };
}

function serializeSession(session) {
  return {
    isConfigured: true,
    status: session.status,
    detail: session.detail,
    sessionId: session.sessionId,
    qrCodeDataUrl: session.qrCodeDataUrl,
    pairingCode: session.pairingCode,
    phoneNumber: session.phoneNumber,
    displayName: session.displayName,
    lastUpdatedAt: session.lastUpdatedAt,
    canStart: session.status === "idle" || session.status === "disconnected",
    canRestart: ["connected", "connecting", "qr_ready", "awaiting_scan", "disconnected", "error"].includes(session.status),
    canDisconnect: ["connected", "connecting", "qr_ready"].includes(session.status),
    cachedChatsCount: session.chats.size,
    lastHistorySyncAt: session.lastHistorySyncAt
  };
}

function scheduleHistorySync(tenantId, session, delayMs = 1500) {
  if (session.historySyncTimer) {
    clearTimeout(session.historySyncTimer);
  }

  session.historySyncTimer = setTimeout(() => {
    session.historySyncTimer = null;
    void startHistorySyncInBackground(tenantId, session);
  }, delayMs);
}

function scheduleCachePersist(session, delayMs = 400) {
  if (session.cachePersistTimer) {
    clearTimeout(session.cachePersistTimer);
  }

  session.cachePersistTimer = setTimeout(() => {
    session.cachePersistTimer = null;
    void persistSessionCache(session);
  }, delayMs);
}

function clearSessionHistory(session) {
  session.chats = new Map();
  session.lastHistorySyncAt = null;
  scheduleCachePersist(session);
}

function scheduleSessionRestart(tenantId, session, delayMs = 2500) {
  if (session.restartTimer) {
    clearTimeout(session.restartTimer);
  }

  session.restartTimer = setTimeout(() => {
    session.restartTimer = null;
    void startSessionInBackground(tenantId, {
      displayName: session.displayName,
      forceRestart: false
    });
  }, delayMs);
}

function mergeHistorySnapshot(session, chats = [], contacts = [], messages = []) {
  const contactNames = new Map();
  for (const contact of contacts ?? []) {
    if (contact?.id) {
      contactNames.set(contact.id, contact.notify || contact.name || contact.verifiedName || null);
    }
  }

  for (const chat of chats ?? []) {
    if (!isDirectChat(chat?.id)) {
      continue;
    }

    const customerPhone = normalizePhone(chat.id);
    const current = session.chats.get(customerPhone) || createChatPreview(customerPhone);
    const lastMessageAt = toIsoDate(chat.conversationTimestamp || chat.lastMessageRecvTimestamp || chat.lastMessageSendTimestamp);
    current.remoteJid = chat.id || current.remoteJid;
    current.customerName = resolveCustomerName(customerPhone, current.customerName, chat.name, contactNames.get(chat.id));
    current.unreadCount = Number(chat.unreadCount || 0);
    current.lastMessageAt = current.lastMessageAt || lastMessageAt;
    session.chats.set(customerPhone, current);
  }

  for (const message of messages ?? []) {
    trackChatFromMessage(session, message, contactNames);
  }

  scheduleCachePersist(session);
}

function trackChatFromMessage(session, message, contactNames = null) {
  const remoteJid = message?.key?.remoteJid || "";
  if (!isDirectChat(remoteJid)) {
    return;
  }

  const customerPhone = normalizePhone(remoteJid);
  if (!customerPhone) {
    return;
  }

  const text = extractMessageText(message.message);
  const current = session.chats.get(customerPhone) || createChatPreview(customerPhone);
  current.remoteJid = remoteJid || current.remoteJid;
  current.customerName = resolveCustomerName(customerPhone, current.customerName, message.pushName, contactNames?.get?.(remoteJid));
  current.lastMessage = text || current.lastMessage;
  current.lastMessageFromMe = Boolean(message.key?.fromMe);
  current.lastMessageAt = toIsoDate(message.messageTimestamp) || current.lastMessageAt;
  session.chats.set(customerPhone, current);
  scheduleCachePersist(session);
}

function createChatPreview(customerPhone) {
  return {
    customerPhone,
    remoteJid: null,
    customerName: resolveCustomerName(customerPhone),
    lastMessage: null,
    lastMessageFromMe: false,
    lastMessageAt: null,
    unreadCount: 0
  };
}

async function pushChatHistoryToBackend(tenantId, session) {
  if (!BACKEND_CALLBACK_BASE_URL) {
    return 0;
  }

  const chats = Array.from(session.chats.values())
    .filter((chat) => chat.customerPhone)
    .sort((left, right) => (right.lastMessageAt || "").localeCompare(left.lastMessageAt || ""))
    .slice(0, 200);

  if (chats.length === 0) {
    return 0;
  }

  try {
    const response = await fetch(`${BACKEND_CALLBACK_BASE_URL}/api/whatsapp-web/bridge/${tenantId}/history-sync`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(BACKEND_CALLBACK_KEY ? { "X-Atendai-Bridge-Key": BACKEND_CALLBACK_KEY } : {})
      },
      body: JSON.stringify({
        chats: chats.map((chat) => ({
          customerPhone: chat.customerPhone,
          customerName: chat.customerName,
          lastMessage: chat.lastMessage,
          lastMessageFromMe: Boolean(chat.lastMessageFromMe),
          lastMessageAt: chat.lastMessageAt,
          unreadCount: Number(chat.unreadCount || 0)
        }))
      })
    });

    if (!response.ok) {
      const body = await response.text();
      logger.warn({ tenantId, status: response.status, body }, "backend callback for qr history sync failed");
      return 0;
    }

    const result = await response.json();
    const imported = Number(result?.imported || 0);
    session.lastHistorySyncAt = new Date().toISOString();
    scheduleCachePersist(session);
    if (session.status === "connected") {
      session.detail = imported > 0
        ? `Sessao QR conectada. ${imported} conversa(s) recente(s) sincronizada(s) para o CRM.`
        : "Sessao QR conectada. Nenhuma conversa recente nova foi encontrada para sincronizar.";
    }
    session.lastUpdatedAt = new Date().toISOString();
    return imported;
  } catch (error) {
    logger.warn({ err: error, tenantId }, "failed to sync qr history with backend");
    return 0;
  }
}

async function removeSessionFiles(targetPath) {
  try {
    await fs.rm(targetPath, { recursive: true, force: true });
  } catch {
    // ignore file cleanup failures
  }
}

async function hydrateSessionCache(session) {
  try {
    const raw = await fs.readFile(getSessionCachePath(session), "utf8");
    const payload = JSON.parse(raw);
    const chats = Array.isArray(payload?.chats) ? payload.chats : [];

    session.chats = new Map(
      chats
        .filter((chat) => typeof chat?.customerPhone === "string" && chat.customerPhone.trim())
        .map((chat) => [chat.customerPhone, {
          customerPhone: chat.customerPhone,
          remoteJid: typeof chat.remoteJid === "string" ? chat.remoteJid : null,
          customerName: resolveCustomerName(chat.customerPhone, typeof chat.customerName === "string" ? chat.customerName : null),
          lastMessage: typeof chat.lastMessage === "string" ? chat.lastMessage : null,
          lastMessageFromMe: Boolean(chat.lastMessageFromMe),
          lastMessageAt: typeof chat.lastMessageAt === "string" ? chat.lastMessageAt : null,
          unreadCount: Number(chat.unreadCount || 0)
        }])
    );
    session.lastHistorySyncAt = typeof payload?.lastHistorySyncAt === "string" ? payload.lastHistorySyncAt : null;
  } catch {
    // ignore cache restore failures
  }
}

async function persistSessionCache(session) {
  if (!session.authPath) {
    return;
  }

  try {
    await fs.mkdir(session.authPath, { recursive: true });
    await fs.writeFile(
      getSessionCachePath(session),
      JSON.stringify({
        lastHistorySyncAt: session.lastHistorySyncAt,
        chats: Array.from(session.chats.values())
      }),
      "utf8"
    );
  } catch (error) {
    logger.warn({ err: error, tenantId: session.tenantId }, "failed to persist qr chat cache");
  }
}

function getSessionCachePath(session) {
  return path.join(session.authPath || path.join(DATA_DIR, session.tenantId), "chat-cache.json");
}

function createMemoryCacheStore() {
  const store = new Map();

  return {
    get(key) {
      const entry = store.get(key);
      if (!entry) {
        return undefined;
      }

      if (entry.expiresAt <= Date.now()) {
        store.delete(key);
        return undefined;
      }

      return entry.value;
    },
    set(key, value) {
      store.set(key, {
        value,
        expiresAt: Date.now() + 10 * 60 * 1000
      });
    },
    del(key) {
      store.delete(key);
    },
    flushAll() {
      store.clear();
    }
  };
}

function buildMessageStoreKey(key) {
  const remoteJid = key?.remoteJid || "";
  const participant = key?.participant || "";
  const id = key?.id || "";
  return `${remoteJid}|${participant}|${id}`;
}

function storeMessageForRetry(session, messageInfo) {
  if (!messageInfo?.key?.id || !messageInfo?.key?.remoteJid || !messageInfo?.message) {
    return;
  }

  session.messageStore.set(buildMessageStoreKey(messageInfo.key), messageInfo.message);
  if (session.messageStore.size > 500) {
    const firstKey = session.messageStore.keys().next().value;
    if (firstKey) {
      session.messageStore.delete(firstKey);
    }
  }
}

async function getStoredMessageForRetry(session, key) {
  return session.messageStore.get(buildMessageStoreKey(key)) || proto.Message.fromObject({});
}

function resolveRecipientJid(session, toPhone) {
  const normalizedPhone = normalizePhone(toPhone);
  const cached = session.chats.get(normalizedPhone);
  return cached?.remoteJid || toJid(toPhone);
}

function getDisconnectStatusCode(error) {
  return error?.output?.statusCode || error?.data?.statusCode || DisconnectReason.connectionClosed;
}

function describeDisconnectReason(statusCode, error) {
  switch (statusCode) {
    case DisconnectReason.restartRequired:
      return "reinicio necessario";
    case DisconnectReason.connectionClosed:
      return "conexao encerrada";
    case DisconnectReason.connectionLost:
      return "conexao perdida";
    case DisconnectReason.timedOut:
      return "tempo limite excedido";
    case DisconnectReason.loggedOut:
      return "sessao encerrada";
    case DisconnectReason.badSession:
      return "sessao invalida";
    case DisconnectReason.multideviceMismatch:
      return "multidispositivo nao habilitado";
    case DisconnectReason.forbidden:
      return "acesso negado";
    case DisconnectReason.unavailableService:
      return "servico indisponivel";
    default:
      return error?.message || "erro desconhecido";
  }
}

function toJid(value) {
  return `${value.replace(/\D+/g, "")}@s.whatsapp.net`;
}

function normalizeSocketUser(value) {
  return value.split(":")[0]?.replace(/\D+/g, "") || null;
}

function normalizePhone(value) {
  return value.replace(/\D+/g, "");
}

function resolveCustomerName(customerPhone, ...candidates) {
  for (const candidate of candidates) {
    if (isUsableCustomerName(candidate, customerPhone)) {
      return candidate.trim();
    }
  }

  return formatPhoneLabel(customerPhone);
}

function isUsableCustomerName(value, customerPhone) {
  if (typeof value !== "string") {
    return false;
  }

  const trimmed = value.trim();
  if (trimmed.length < 2 || trimmed.toLowerCase() === "cliente") {
    return false;
  }

  if (trimmed.includes("@s.whatsapp.net") || trimmed.includes("@c.us") || trimmed.includes("@lid") || trimmed.includes("status@broadcast")) {
    return false;
  }

  if (trimmed.includes(":") && trimmed.includes("@")) {
    return false;
  }

  const normalizedCandidate = normalizePhone(trimmed);
  const normalizedPhone = normalizePhone(customerPhone || "");
  if (normalizedCandidate && normalizedCandidate.length >= 8 && normalizedCandidate === normalizedPhone) {
    return false;
  }

  return !/^[+\d().\s-]+$/.test(trimmed);
}

function formatPhoneLabel(value) {
  const digits = normalizePhone(value || "");
  if (!digits) {
    return "Cliente";
  }

  if (digits.length === 13 && digits.startsWith("55")) {
    return `+${digits.slice(0, 2)} (${digits.slice(2, 4)}) ${digits.slice(4, 9)}-${digits.slice(9)}`;
  }

  if (digits.length === 12 && digits.startsWith("55")) {
    return `+${digits.slice(0, 2)} (${digits.slice(2, 4)}) ${digits.slice(4, 8)}-${digits.slice(8)}`;
  }

  if (digits.length === 11) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
  }

  if (digits.length === 10) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  }

  return digits.startsWith("55") ? `+${digits}` : digits;
}

function isDirectChat(value) {
  return typeof value === "string" && (value.endsWith("@s.whatsapp.net") || value.endsWith("@lid"));
}

function toIsoDate(value) {
  if (!value) {
    return null;
  }

  const raw = typeof value === "object" && "low" in value ? value.low : value;
  const numeric = Number(raw);
  if (Number.isNaN(numeric) || numeric <= 0) {
    return null;
  }

  const milliseconds = numeric > 1_000_000_000_000 ? numeric : numeric * 1000;
  return new Date(milliseconds).toISOString();
}

function extractMessageText(message) {
  if (!message) {
    return "";
  }

  if (message.ephemeralMessage?.message) {
    return extractMessageText(message.ephemeralMessage.message);
  }

  if (message.viewOnceMessage?.message) {
    return extractMessageText(message.viewOnceMessage.message);
  }

  if (message.viewOnceMessageV2?.message) {
    return extractMessageText(message.viewOnceMessageV2.message);
  }

  if (message.viewOnceMessageV2Extension?.message) {
    return extractMessageText(message.viewOnceMessageV2Extension.message);
  }

  if (typeof message.conversation === "string") {
    return message.conversation.trim();
  }

  if (typeof message.extendedTextMessage?.text === "string") {
    return message.extendedTextMessage.text.trim();
  }

  if (typeof message.imageMessage?.caption === "string") {
    return message.imageMessage.caption.trim();
  }

  if (typeof message.videoMessage?.caption === "string") {
    return message.videoMessage.caption.trim();
  }

  if (typeof message.documentWithCaptionMessage?.message?.documentMessage?.caption === "string") {
    return message.documentWithCaptionMessage.message.documentMessage.caption.trim();
  }

  if (typeof message.buttonsResponseMessage?.selectedDisplayText === "string") {
    return message.buttonsResponseMessage.selectedDisplayText.trim();
  }

  if (typeof message.listResponseMessage?.title === "string") {
    return message.listResponseMessage.title.trim();
  }

  if (typeof message.templateButtonReplyMessage?.selectedDisplayText === "string") {
    return message.templateButtonReplyMessage.selectedDisplayText.trim();
  }

  return "";
}

async function notifyBackendIncomingMessage(tenantId, payload) {
  if (!BACKEND_CALLBACK_BASE_URL) {
    return;
  }

  try {
    const response = await fetch(`${BACKEND_CALLBACK_BASE_URL}/api/whatsapp-web/bridge/${tenantId}/incoming`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(BACKEND_CALLBACK_KEY ? { "X-Atendai-Bridge-Key": BACKEND_CALLBACK_KEY } : {})
      },
      body: JSON.stringify({
        customerPhone: payload.customerPhone,
        customerName: payload.customerName,
        message: payload.message
      })
    });

    if (!response.ok) {
      const body = await response.text();
      logger.warn({ tenantId, status: response.status, body }, "backend callback for qr incoming message failed");
    }
  } catch (error) {
    logger.warn({ err: error, tenantId }, "failed to notify backend about qr incoming message");
  }
}
