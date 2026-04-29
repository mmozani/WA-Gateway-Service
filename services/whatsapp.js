const { Client, LocalAuth } = require("whatsapp-web.js");
const qrcodeTerminal = require("qrcode-terminal");
const qrcode = require("qrcode");
const axios = require("axios");
const logger = require("../helpers/logger");

const sessions = new Map();

/**
 * ا
 * @param {number} ms
 */
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const notifyLaravel = async (event, sessionId, data = {}) => {
  if (!process.env.WEBHOOK_URL) return;

  try {
    await axios.post(
      process.env.WEBHOOK_URL,
      {
        event: event,
        session_id: sessionId,
        ...data,
        timestamp: new Date().toISOString(),
      },
      {
        headers: { "X-API-KEY": process.env.SECRET_API_KEY },
        timeout: 5000,
      },
    );
  } catch (error) {
    logger("debug", `Webhook failed for [${sessionId}]: ${error.message}`);
  }
};

const sendSecureMessage = async (session, phone, message) => {
  const typingDelay = Math.min(message.length * 50, 3000);
  const randomExtraDelay = Math.floor(Math.random() * 1500) + 500;
  const totalWait = typingDelay + randomExtraDelay;

  logger("debug", `Anti-Ban: Simulating typing for ${totalWait}ms...`);
  await delay(totalWait);

  return session.client.sendMessage(phone, message);
};

const initializeSession = async (sessionId, isRetry = false) => {
  const maxRetries = 5;
  if (!sessions.has(`retry_${sessionId}`)) {
    sessions.set(`retry_${sessionId}`, 0);
  }

  const currentRetry = sessions.get(`retry_${sessionId}`);

  if (isRetry && currentRetry >= maxRetries) {
    logger(
      "error",
      `Session [${sessionId}] reached max reconnection attempts (${maxRetries}). Stopping.`,
    );
    notifyLaravel("RECONNECT_FAILED", sessionId, {
      reason: "Max retries exceeded",
    });
    sessions.delete(`retry_${sessionId}`);
    return;
  }

  if (isRetry) {
    const backoffTime = currentRetry * 10000;
    logger(
      "warning",
      `Session [${sessionId}] retry ${currentRetry}/${maxRetries} in ${backoffTime / 1000}s...`,
    );
    await delay(backoffTime);
    sessions.set(`retry_${sessionId}`, currentRetry + 1);
  } else {
    sessions.set(`retry_${sessionId}`, 0);
  }

  logger("system", `Initializing WhatsApp session: [${sessionId}]`);

  const client = new Client({
    authStrategy: new LocalAuth({ clientId: sessionId }),
    puppeteer: {
      headless: true,
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--disable-gpu",
        "--no-first-run",
        "--no-zygote",
        "--disable-extensions",
        "--disable-background-networking",
        "--disable-default-apps",
        "--disable-sync",
        "--disable-translate",
      ],
    },
  });

  client.on("qr", async (qr) => {
    console.log(`\n=========================================`);
    console.log(`📱 QR CODE FOR: [${sessionId}]`);
    console.log(`=========================================\n`);
    qrcodeTerminal.generate(qr, { small: true });

    sessions.set(`retry_${sessionId}`, 0);

    try {
      const qrImage = await qrcode.toDataURL(qr);
      notifyLaravel("QR_GENERATED", sessionId, { qr: qrImage, expires_in: 20 });
    } catch (err) {
      logger("error", `Failed to generate QR Base64: ${err.message}`);
      notifyLaravel("QR_GENERATED", sessionId); // فال‌بک بدون تصویر
    }
  });

  client.on("ready", () => {
    const currentSession = sessions.get(sessionId);
    if (currentSession && currentSession.status === "READY") {
      logger(
        "debug",
        `Session [${sessionId}] is already READY. Ignoring duplicate event.`,
      );
      return;
    }

    const myNumber = client.info.wid.user;
    logger("whatsapp", `Session [${sessionId}] is READY. Number: ${myNumber}`);

    sessions.set(sessionId, {
      client,
      status: "READY",
      number: myNumber,
      readyAt: new Date().toISOString(),
    });

    sessions.set(`retry_${sessionId}`, 0);
    notifyLaravel("SESSION_READY", sessionId, { number: myNumber });
  });

  client.on("auth_failure", (msg) => {
    logger("error", `Session [${sessionId}] Auth Failure: ${msg}`);
    sessions.delete(sessionId);
    sessions.delete(`retry_${sessionId}`);
    notifyLaravel("AUTH_FAILURE", sessionId, { reason: msg });
  });

  client.on("disconnected", (reason) => {
    logger("warning", `Session [${sessionId}] Disconnected: ${reason}`);
    sessions.delete(sessionId);
    notifyLaravel("DISCONNECTED", sessionId, {
      reason,
      auto_reconnecting: true,
    });
    initializeSession(sessionId, true);
  });

  client.on("message_ack", (msg, ack) => {
    if (ack === 3) {
      logger("debug", `Message to ${msg.to} was READ.`);
    }
  });

  client.initialize().catch((err) => {
    logger("fatal", `Failed to initialize [${sessionId}]: ${err.message}`);
  });
};

module.exports = {
  sessions,
  initializeSession,
  sendSecureMessage,
};