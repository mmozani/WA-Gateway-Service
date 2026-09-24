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

  return value || fallback;
}

function boolean(name, fallback = false) {
  const value = process.env[name];

  if (value === undefined) {
    return fallback;
  }

  if (value === "true") {
    return true;
  }

  if (value === "false") {
    return false;
  }

  throw new Error(
    `Environment variable ${name} must be either "true" or "false"`
  );
}

function integer(name, fallback) {
  const raw = process.env[name];

  if (raw === undefined || raw === "") {
    return fallback;
  }

  const value = Number(raw);

  if (!Number.isInteger(value)) {
    throw new Error(
      `Environment variable ${name} must be an integer`
    );
  }

  return value;
}

const nodeEnv = optional("NODE_ENV", "development");

const config = {
  env: nodeEnv,

  server: {
    host: optional("HOST", "127.0.0.1"),
    port: integer("PORT", 30033),
  },

  auth: {
    token: required("API_TOKEN"),
  },

  whatsapp: {
    sessions: optional("SESSION_IDS", "primary")
      .split(",")
      .map((id) => id.trim())
      .filter(Boolean),

    executablePath: optional(
      "PUPPETEER_EXECUTABLE_PATH",
      ""
    ),

    noSandbox: boolean(
      "PUPPETEER_NO_SANDBOX",
      false
    ),
  },

  logging: {
    debug: boolean(
      "DEBUG_MODE",
      nodeEnv !== "production"
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
  throw new Error(
    "API_TOKEN must contain at least 32 characters"
  );
}

if (config.whatsapp.sessions.length === 0) {
  throw new Error(
    "At least one WhatsApp session must be configured"
  );
}

for (const sessionId of config.whatsapp.sessions) {
  if (!/^[a-zA-Z0-9_-]{1,32}$/.test(sessionId)) {
    throw new Error(
      `Invalid WhatsApp session ID: ${sessionId}`
    );
  }
}

module.exports = config;