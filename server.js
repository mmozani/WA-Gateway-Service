require("dotenv").config();
const express = require("express");
const rateLimit = require("express-rate-limit");
const fs = require("fs");
const fsPromises = require("fs").promises;
const path = require("path");
const logger = require("./helpers/logger");
const {
  sessions,
  initializeSession,
  sendSecureMessage,
} = require("./services/whatsapp");

const app = express();
app.use(express.json());

app.set(
  "trust proxy",
  process.env.TRUST_PROXY === "false" || process.env.TRUST_PROXY === "0"
    ? false
    : 1,
);

const globalLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 30,
  message: { error: "Too many requests, please try again later." },
});

const ipWhitelist = (req, res, next) => {
  if (process.env.IGNORE_IP_WHITELIST === "true") return next();

  const allowedIps = (process.env.ALLOWED_IPS || "")
    .split(",")
    .map((ip) => ip.trim())
    .filter(Boolean);
  if (allowedIps.length === 0) return next();

  const clientIp = req.ip;

  const isAllowed = allowedIps.some((allowedIp) =>
    clientIp.startsWith(allowedIp),
  );

  if (!isAllowed) {
    logger("security", `Forbidden IP attempt: ${clientIp}`);
    return res
      .status(403)
      .json({ error: "Forbidden: Your IP is not allowed." });
  }
  next();
};

const secureAPI = (req, res, next) => {
  const clientKey = (req.header("X-API-KEY") || "").trim();
  const serverKey = (process.env.SECRET_API_KEY || "").trim();

  if (process.env.DEBUG_MODE === "true") {
    logger(
      "debug",
      `Security Check - Client: [${clientKey}] | Server: [${serverKey}] | Match: ${clientKey === serverKey}`,
    );
  }

  if (!clientKey || clientKey !== serverKey) {
    logger("security", `Unauthorized access attempt from IP: ${req.ip}`);
    return res.status(401).json({ error: "Unauthorized: Invalid API Key" });
  }
  next();
};

app.use("/send-otp", globalLimiter);

app.post("/send-otp", ipWhitelist, secureAPI, async (req, res) => {
  const { phone, message, code, session_id } = req.body;

  if (!phone || (!message && !code)) {
    return res
      .status(400)
      .json({ error: "Phone and at least message or code are required" });
  }

  const activeSessionIds = process.env.SESSION_IDS
    ? process.env.SESSION_IDS.split(",")
    : [];
  const targetId = session_id || activeSessionIds[0];
  const session = sessions.get(targetId);

  if (!session || session.status !== "READY") {
    logger("error", `Send attempt failed: Session [${targetId}] is not READY`);
    return res
      .status(503)
      .json({ error: `WhatsApp session [${targetId}] is not ready` });
  }

  try {
    let cleanPhone = String(phone)
      .trim()
      .replace(/^(?:\+|00)/, "");
    const formattedPhone = `${cleanPhone}@c.us`;

    let finalMessage = message || "";
    if (code) {
      finalMessage = finalMessage ? `${finalMessage}${code}` : `${code}`;
    }

    await sendSecureMessage(session, formattedPhone, finalMessage);

    logger("success", `Message sent to ${cleanPhone} via [${targetId}]`);
    res.json({
      success: true,
      via: targetId,
      sender: session.number,
      status: "Sent",
    });
  } catch (err) {
    logger("error", `Send Error [${targetId}]: ${err.message}`);
    res
      .status(500)
      .json({ error: "Failed to send message", details: err.message });
  }
});

app.get("/status", ipWhitelist, secureAPI, (req, res) => {
  const activeSessionIds = process.env.SESSION_IDS
    ? process.env.SESSION_IDS.split(",")
    : [];
  const report = activeSessionIds.map((id) => {
    const s = sessions.get(id);
    return {
      id,
      status: s ? s.status : "OFFLINE",
      number: s ? s.number : null,
      ready_since: s ? s.readyAt : null,
    };
  });
  res.json(report);
});

app.get("/health", (req, res) => {
  const uptime = process.uptime();
  res.status(200).json({
    status: "UP",
    uptime: `${Math.floor(uptime / 3600)}h ${Math.floor((uptime % 3600) / 60)}m`,
    memory_usage: `${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)} MB`,
    timestamp: new Date().toISOString(),
  });
});

app.delete("/session/:id", ipWhitelist, secureAPI, async (req, res) => {
  const sessionId = req.params.id;
  const session = sessions.get(sessionId);

  logger("command", `Manual delete request for session: [${sessionId}]`);

  try {
    if (session) {
      await session.client.destroy().catch(() => {});
      sessions.delete(sessionId);
    }
    const sessionPath = path.join(
      __dirname,
      ".wwebjs_auth",
      `session-${sessionId}`,
    );

    await fsPromises.access(sessionPath).catch(() => null); // بررسی وجود
    await fsPromises.rm(sessionPath, { recursive: true, force: true });
    logger("system", `Directory for [${sessionId}] removed successfully.`);

    initializeSession(sessionId);

    res.json({
      success: true,
      message: `Session [${sessionId}] terminated and re-initializing for new QR.`,
    });
  } catch (err) {
    logger("error", `Session cleanup failed: ${err.message}`);
    res.status(500).json({ error: err.message });
  }
});

process.on("uncaughtException", (err) => {
  logger("fatal", `Uncaught Exception: ${err.message}`);
  process.exit(1);
});

process.on("unhandledRejection", (reason, promise) => {
  const errMsg =
    reason instanceof Error ? reason.message : JSON.stringify(reason);
  logger("fatal", `Unhandled Rejection: ${errMsg}`);
  process.exit(1);
});

const PORT = process.env.PORT || 30033;
app.listen(PORT, () => {
  logger("system", `------------------------------------------------`);
  logger("system", `WA-GATEWAY-SERVICE STARTED ON PORT ${PORT}`);
  logger("system", `DEBUG_MODE: ${process.env.DEBUG_MODE}`);
  logger("system", `TRUST_PROXY: ENABLED`);
  logger("system", `------------------------------------------------`);

  const activeSessionIds = process.env.SESSION_IDS
    ? process.env.SESSION_IDS.split(",")
    : [];
  activeSessionIds.forEach((id, index) => {
    setTimeout(() => initializeSession(id), index * 5000);
  });
});
