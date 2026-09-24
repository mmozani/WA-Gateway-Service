const {
  Client,
  LocalAuth,
} = require("whatsapp-web.js");

const qrcodeTerminal =
  require("qrcode-terminal");

const config =
  require("../config");

const logger =
  require("../helpers/logger");

const sessions =
  new Map();

const initializing =
  new Set();

const reconnectTimers =
  new Map();

let shuttingDown = false;
let roundRobinIndex = 0;

function delay(ms) {
  return new Promise(
    (resolve) =>
      setTimeout(resolve, ms),
  );
}

function ensureSessionState(sessionId) {
  if (!sessions.has(sessionId)) {
    sessions.set(sessionId, {
      id: sessionId,
      client: null,
      status: "OFFLINE",
      number: null,
      readyAt: null,
      lastError: null,
      reconnectAttempts: 0,
      reconnectBlocked: false,
    });
  }

  return sessions.get(sessionId);
}

function clearReconnectTimer(sessionId) {
  const timer =
    reconnectTimers.get(sessionId);

  if (timer) {
    clearTimeout(timer);
    reconnectTimers.delete(sessionId);
  }
}

async function destroyClient(client) {
  if (!client) {
    return;
  }

  try {
    await Promise.race([
      client.destroy(),
      delay(5000),
    ]);
  } catch {
    // Browser cleanup failure must not crash the gateway.
  }
}

function buildPuppeteerConfig() {
  const puppeteer = {
    headless: true,
    args: [
      "--disable-dev-shm-usage",
    ],
  };

  if (config.whatsapp.executablePath) {
    puppeteer.executablePath =
      config.whatsapp.executablePath;
  }

  if (config.whatsapp.noSandbox) {
    puppeteer.args.push(
      "--no-sandbox",
      "--disable-setuid-sandbox",
    );
  }

  return puppeteer;
}

function scheduleReconnect(sessionId) {
  if (
    shuttingDown ||
    reconnectTimers.has(sessionId)
  ) {
    return;
  }

  const state =
    ensureSessionState(sessionId);

  if (state.reconnectBlocked) {
    return;
  }

  const delays =
    config.whatsapp.reconnectDelaysMs;

  const delayIndex =
    Math.min(
      state.reconnectAttempts,
      delays.length - 1,
    );

  const waitMs =
    delays[delayIndex];

  state.reconnectAttempts += 1;
  state.status = "RECONNECTING";

  logger(
    "warn",
    "whatsapp.reconnect_scheduled",
    {
      session: sessionId,
      attempt: state.reconnectAttempts,
      wait_ms: waitMs,
    },
  );

  const timer = setTimeout(
    () => {
      reconnectTimers.delete(sessionId);

      initializeSession(sessionId)
        .catch((error) => {
          logger(
            "error",
            "whatsapp.reconnect_failed",
            {
              session: sessionId,
              reason: error.message,
            },
          );

          scheduleReconnect(sessionId);
        });
    },
    waitMs,
  );

  timer.unref();

  reconnectTimers.set(
    sessionId,
    timer,
  );
}

function bindClientEvents(
  sessionId,
  client,
) {
  client.on(
    "qr",
    (qr) => {
      const state =
        ensureSessionState(sessionId);

      if (state.client !== client) {
        return;
      }

      state.status = "QR_REQUIRED";
      state.readyAt = null;

      logger(
        "warn",
        "whatsapp.qr_required",
        {
          session: sessionId,
        },
      );

      if (
        config.whatsapp.showQrInTerminal
      ) {
        process.stdout.write(
          `\nQR CODE FOR SESSION [${sessionId}]\n\n`,
        );

        qrcodeTerminal.generate(
          qr,
          {
            small: true,
          },
        );

        process.stdout.write("\n");
      }
    },
  );

  client.on(
    "authenticated",
    () => {
      const state =
        ensureSessionState(sessionId);

      if (state.client !== client) {
        return;
      }

      state.status = "AUTHENTICATED";
      state.lastError = null;

      logger(
        "info",
        "whatsapp.authenticated",
        {
          session: sessionId,
        },
      );
    },
  );

  client.on(
    "ready",
    () => {
      const state =
        ensureSessionState(sessionId);

      if (state.client !== client) {
        return;
      }

      const number =
        client.info?.wid?.user || null;

      state.status = "READY";
      state.number = number;
      state.readyAt =
        new Date().toISOString();
      state.lastError = null;
      state.reconnectAttempts = 0;
      state.reconnectBlocked = false;

      clearReconnectTimer(sessionId);

      logger(
        "info",
        "whatsapp.ready",
        {
          session: sessionId,
          number:
            logger.maskPhone(number),
        },
      );
    },
  );

  client.on(
    "auth_failure",
    (reason) => {
      const state =
        ensureSessionState(sessionId);

      if (state.client !== client) {
        return;
      }

      state.status = "AUTH_FAILURE";
      state.readyAt = null;
      state.lastError =
        String(reason || "");

      /*
       * An authentication failure normally needs
       * operator action and a new QR.
       * Do not create an infinite reconnect loop.
       */
      state.reconnectBlocked = true;

      logger(
        "error",
        "whatsapp.auth_failure",
        {
          session: sessionId,
          reason:
            String(reason || ""),
        },
      );

      void destroyClient(client);
    },
  );

  client.on(
    "disconnected",
    (reason) => {
      const state =
        ensureSessionState(sessionId);

      if (state.client !== client) {
        return;
      }

      state.client = null;
      state.readyAt = null;

      if (
        state.status !== "AUTH_FAILURE"
      ) {
        state.status = "DISCONNECTED";
      }

      state.lastError =
        String(reason || "");

      logger(
        "warn",
        "whatsapp.disconnected",
        {
          session: sessionId,
          reason:
            String(reason || ""),
        },
      );

      void destroyClient(client)
        .finally(() => {
          if (!state.reconnectBlocked) {
            scheduleReconnect(sessionId);
          }
        });
    },
  );
}

async function initializeSession(sessionId) {
  if (
    !config.whatsapp.sessions.includes(
      sessionId,
    )
  ) {
    throw new Error(
      `Unknown WhatsApp session: ${sessionId}`,
    );
  }

  if (shuttingDown) {
    return;
  }

  if (initializing.has(sessionId)) {
    return;
  }

  const state =
    ensureSessionState(sessionId);

  if (
    state.client &&
    [
      "INITIALIZING",
      "AUTHENTICATED",
      "QR_REQUIRED",
      "READY",
    ].includes(state.status)
  ) {
    return;
  }

  initializing.add(sessionId);
  clearReconnectTimer(sessionId);

  if (state.client) {
    const previousClient =
      state.client;

    state.client = null;

    await destroyClient(
      previousClient,
    );
  }

  logger(
    "info",
    "whatsapp.initializing",
    {
      session: sessionId,
      device_name:
        config.whatsapp.deviceName,
    },
  );

  const client =
    new Client({
      authStrategy:
        new LocalAuth({
          clientId: sessionId,
          dataPath:
            config.whatsapp.authPath,
        }),

      puppeteer:
        buildPuppeteerConfig(),

      /*
       * whatsapp-web.js applies these values before
       * the pairing/QR flow through setDeviceName().
       */
      deviceName:
        config.whatsapp.deviceName,

      browserName:
        config.whatsapp.browserName,
    });

  state.client = client;
  state.status = "INITIALIZING";
  state.lastError = null;
  state.reconnectBlocked = false;

  bindClientEvents(
    sessionId,
    client,
  );

  try {
    await client.initialize();
  } catch (error) {
    if (state.client === client) {
      state.client = null;
      state.status = "FAILED";
      state.readyAt = null;
      state.lastError =
        error.message;
    }

    logger(
      "error",
      "whatsapp.initialize_failed",
      {
        session: sessionId,
        reason: error.message,
      },
    );

    await destroyClient(client);

    scheduleReconnect(sessionId);
  } finally {
    initializing.delete(sessionId);
  }
}

function readySessions() {
  return config.whatsapp.sessions
    .map(
      (sessionId) =>
        ensureSessionState(sessionId),
    )
    .filter(
      (state) =>
        state.status === "READY" &&
        state.client,
    );
}

function gatewayError(
  code,
  httpStatus,
  message,
) {
  const error =
    new Error(message);

  error.code = code;
  error.httpStatus = httpStatus;

  return error;
}

function withTimeout(
  promise,
  timeoutMs,
) {
  return new Promise(
    (resolve, reject) => {
      const timer = setTimeout(
        () => {
          reject(
            gatewayError(
              "SEND_TIMEOUT",
              504,
              "WhatsApp send operation timed out",
            ),
          );
        },
        timeoutMs,
      );

      timer.unref();

      promise.then(
        (result) => {
          clearTimeout(timer);
          resolve(result);
        },

        (error) => {
          clearTimeout(timer);
          reject(error);
        },
      );
    },
  );
}

async function sendOtpMessage(
  phone,
  message,
) {
  const available =
    readySessions();

  if (available.length === 0) {
    throw gatewayError(
      "SESSION_UNAVAILABLE",
      503,
      "No WhatsApp session is ready",
    );
  }

  const state =
    available[
      roundRobinIndex %
      available.length
    ];

  roundRobinIndex =
    (roundRobinIndex + 1) %
    Number.MAX_SAFE_INTEGER;

  const digits =
    String(phone)
      .replace(/\D/g, "");

  const recipient =
    `${digits}@c.us`;

  logger(
    "info",
    "whatsapp.send_started",
    {
      session: state.id,
      phone:
        logger.maskPhone(phone),
    },
  );

  let result;

  try {
    result = await withTimeout(
      state.client.sendMessage(
        recipient,
        message,
      ),

      config.whatsapp.sendTimeoutMs,
    );
  } catch (error) {
    if (
      error.code === "SEND_TIMEOUT"
    ) {
      logger(
        "warn",
        "whatsapp.send_timeout",
        {
          session: state.id,
          phone:
            logger.maskPhone(phone),
        },
      );

      throw error;
    }

    logger(
      "error",
      "whatsapp.send_failed",
      {
        session: state.id,
        phone:
          logger.maskPhone(phone),
        reason: error.message,
      },
    );

    throw gatewayError(
      "SEND_FAILED",
      502,
      "WhatsApp rejected the send operation",
    );
  }

  const providerMessageId =
    result?.id?._serialized ||
    result?.id?.id ||
    null;

  logger(
    "info",
    "whatsapp.send_accepted",
    {
      session: state.id,
      phone:
        logger.maskPhone(phone),
    },
  );

  return {
    sessionId: state.id,
    providerMessageId,
  };
}

function getSessionReport() {
  return config.whatsapp.sessions
    .map((sessionId) => {
      const state =
        ensureSessionState(sessionId);

      return {
        id: state.id,
        status: state.status,

        number:
          state.number
            ? logger.maskPhone(
                state.number,
              )
            : null,

        ready_since:
          state.readyAt,

        reconnect_attempts:
          state.reconnectAttempts,

        last_error:
          state.lastError
            ? "present"
            : null,
      };
    });
}

function getReadiness() {
  const report =
    getSessionReport();

  const ready =
    report.filter(
      (item) =>
        item.status === "READY",
    ).length;

  return {
    ready: ready > 0,
    readySessions: ready,
    totalSessions:
      report.length,
  };
}

async function shutdownSessions() {
  shuttingDown = true;

  for (
    const sessionId
    of reconnectTimers.keys()
  ) {
    clearReconnectTimer(sessionId);
  }

  const clients = [];

  for (
    const state
    of sessions.values()
  ) {
    if (
      state &&
      typeof state === "object" &&
      state.client
    ) {
      clients.push(
        state.client,
      );

      state.client = null;
    }
  }

  await Promise.allSettled(
    clients.map(
      (client) =>
        destroyClient(client),
    ),
  );
}

module.exports = {
  initializeSession,
  sendOtpMessage,
  getSessionReport,
  getReadiness,
  shutdownSessions,
};
