const path = require("path");

require("dotenv").config({ quiet: true });

function required(name) {
  const value = process.env[name]?.trim();

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

function optional(name, fallback = "") {
  const value = process.env[name]?.trim();

  return value === undefined || value === ""
    ? fallback
    : value;
}

function boolean(name, fallback = false) {
  const raw = process.env[name];

  if (raw === undefined || raw === "") {
    return fallback;
  }

  const value = raw.trim().toLowerCase();

  if (value === "true") return true;
  if (value === "false") return false;

  throw new Error(
    `Environment variable ${name} must be either "true" or "false"`,
  );
}

function integer(name, fallback) {
  const raw = process.env[name];

  if (raw === undefined || raw === "") {
    return fallback;
  }

  const value = Number(raw);

  if (!Number.isInteger(value)) {
    throw new Error(`Environment variable ${name} must be an integer`);
  }

  return value;
}

const nodeEnv = optional("NODE_ENV", "development");

const sessions = optional("SESSION_IDS", "primary")
  .split(",")
  .map((id) => id.trim())
  .filter(Boolean);

const config = {
  env: nodeEnv,

  server: {
    host: optional("HOST", "127.0.0.1"),
    port: integer("PORT", 30033),
    bodyLimit: "8kb",
  },

  auth: {
    token: required("API_TOKEN"),
  },

  whatsapp: {
    sessions,

    authPath: path.resolve(
      optional("WHATSAPP_AUTH_PATH", ".wwebjs_auth"),
    ),

    executablePath: optional(
      "PUPPETEER_EXECUTABLE_PATH",
      "",
    ),

    noSandbox: boolean(
      "PUPPETEER_NO_SANDBOX",
      false,
    ),

    showQrInTerminal: boolean(
      "SHOW_QR_IN_TERMINAL",
      nodeEnv !== "production",
    ),

    sendTimeoutMs: integer(
      "WHATSAPP_SEND_TIMEOUT_MS",
      8000,
    ),

    deviceName: optional(
      "WHATSAPP_DEVICE_NAME",
      "NeoZone OTP Gateway",
    ),

    browserName: optional(
      "WHATSAPP_BROWSER_NAME",
      "Chrome",
    ),

    reconnectDelaysMs: [
      5000,
      10000,
      30000,
      60000,
    ],
  },

  delivery: {
    dedupeWindowMs: integer(
      "OTP_DEDUPE_WINDOW_MS",
      15000,
    ),

    globalPerMinute: integer(
      "OTP_GLOBAL_PER_MINUTE",
      60,
    ),
  },

  logging: {
    debug: boolean(
      "DEBUG_MODE",
      nodeEnv !== "production",
    ),
  },
};

if (
  config.server.port < 1 ||
  config.server.port > 65535
) {
  throw new Error("PORT must be between 1 and 65535");
}

if (config.auth.token.length < 32) {
  throw new Error("API_TOKEN must contain at least 32 characters");
}

if (config.whatsapp.sessions.length === 0) {
  throw new Error(
    "At least one WhatsApp session must be configured",
  );
}

for (const sessionId of config.whatsapp.sessions) {
  if (!/^[a-zA-Z0-9_-]{1,32}$/.test(sessionId)) {
    throw new Error(`Invalid WhatsApp session ID: ${sessionId}`);
  }
}

if (
  config.whatsapp.sendTimeoutMs < 1000 ||
  config.whatsapp.sendTimeoutMs > 30000
) {
  throw new Error(
    "WHATSAPP_SEND_TIMEOUT_MS must be between 1000 and 30000",
  );
}

if (
  config.whatsapp.deviceName.length < 1 ||
  config.whatsapp.deviceName.length > 64
) {
  throw new Error(
    "WHATSAPP_DEVICE_NAME must contain 1 to 64 characters",
  );
}

if (
  config.whatsapp.browserName.length < 1 ||
  config.whatsapp.browserName.length > 64
) {
  throw new Error(
    "WHATSAPP_BROWSER_NAME must contain 1 to 64 characters",
  );
}

if (
  config.delivery.dedupeWindowMs < 1000 ||
  config.delivery.dedupeWindowMs > 120000
) {
  throw new Error(
    "OTP_DEDUPE_WINDOW_MS must be between 1000 and 120000",
  );
}

if (config.delivery.globalPerMinute < 1) {
  throw new Error(
    "OTP_GLOBAL_PER_MINUTE must be greater than zero",
  );
}

module.exports = config;
