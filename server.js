const crypto =
  require("crypto");

const express =
  require("express");

const {
  rateLimit,
} = require(
  "express-rate-limit",
);

const config =
  require("./config");

const logger =
  require("./helpers/logger");

const {
  bearerAuth,
} = require(
  "./middleware/auth",
);

const {
  executeOnce,
} = require(
  "./services/dedupe",
);

const {
  buildOtpMessage,
} = require(
  "./templates/otp",
);

const {
  initializeSession,
  sendOtpMessage,
  getSessionReport,
  getReadiness,
  shutdownSessions,
} = require(
  "./services/whatsapp",
);

const app = express();

app.disable(
  "x-powered-by",
);

/*
 * Node is intentionally bound to localhost.
 * Nginx/TLS will be added in deployment.
 */
app.set(
  "trust proxy",
  false,
);

app.use(
  (req, res, next) => {
    req.requestId =
      crypto.randomUUID();

    res.setHeader(
      "X-Request-ID",
      req.requestId,
    );

    res.setHeader(
      "Cache-Control",
      "no-store",
    );

    res.setHeader(
      "X-Content-Type-Options",
      "nosniff",
    );

    res.setHeader(
      "Referrer-Policy",
      "no-referrer",
    );

    next();
  },
);

app.use(
  express.json({
    limit:
      config.server.bodyLimit,
    strict: true,
  }),
);

function errorBody(
  req,
  code,
  message,
) {
  return {
    ok: false,
    request_id:
      req.requestId,
    error: {
      code,
      message,
    },
  };
}

function sendError(
  req,
  res,
  httpStatus,
  code,
  message,
) {
  return res
    .status(httpStatus)
    .json(
      errorBody(
        req,
        code,
        message,
      ),
    );
}

function validateOtpRequest(
  req,
  res,
  next,
) {
  if (
    !req.is("application/json")
  ) {
    return sendError(
      req,
      res,
      415,
      "UNSUPPORTED_MEDIA_TYPE",
      "Content-Type must be application/json",
    );
  }

  const body =
    req.body;

  if (
    !body ||
    typeof body !== "object" ||
    Array.isArray(body)
  ) {
    return sendError(
      req,
      res,
      422,
      "INVALID_REQUEST",
      "Invalid request body",
    );
  }

  const allowedFields =
    new Set([
      "phone",
      "code",
      "locale",
    ]);

  const unknownFields =
    Object.keys(body)
      .filter(
        (key) =>
          !allowedFields.has(key),
      );

  if (
    unknownFields.length > 0
  ) {
    return sendError(
      req,
      res,
      422,
      "INVALID_REQUEST",
      "Request contains unsupported fields",
    );
  }

  if (
    typeof body.phone !== "string"
  ) {
    return sendError(
      req,
      res,
      422,
      "INVALID_PHONE",
      "Phone must be a string in E.164 format",
    );
  }

  const phone =
    body.phone.trim();

  if (
    !/^\+[1-9][0-9]{7,14}$/.test(
      phone,
    )
  ) {
    return sendError(
      req,
      res,
      422,
      "INVALID_PHONE",
      "Phone must be in E.164 format",
    );
  }

  if (
    typeof body.code !== "string"
  ) {
    return sendError(
      req,
      res,
      422,
      "INVALID_OTP_CODE",
      "OTP code must be a string",
    );
  }

  const code =
    body.code.trim();

  if (
    !/^[0-9]{4,8}$/.test(
      code,
    )
  ) {
    return sendError(
      req,
      res,
      422,
      "INVALID_OTP_CODE",
      "OTP code must contain 4 to 8 digits",
    );
  }

  const locale =
    typeof body.locale === "string"
      ? body.locale
          .trim()
          .toLowerCase()
      : "en";

  if (
    ![
      "fa",
      "ar",
      "en",
    ].includes(locale)
  ) {
    return sendError(
      req,
      res,
      422,
      "INVALID_LOCALE",
      "Supported locales are fa, ar and en",
    );
  }

  req.otp = {
    phone,
    code,
    locale,
  };

  next();
}

const otpGlobalLimiter =
  rateLimit({
    windowMs:
      60 * 1000,

    limit:
      config.delivery
        .globalPerMinute,

    standardHeaders:
      "draft-8",

    legacyHeaders:
      false,

    keyGenerator:
      () =>
        "otp-gateway",

    handler(req, res) {
      return sendError(
        req,
        res,
        429,
        "RATE_LIMITED",
        "OTP gateway rate limit exceeded",
      );
    },
  });

app.get(
  "/health/live",

  (req, res) => {
    return res.json({
      status: "up",
    });
  },
);

app.get(
  "/health/ready",

  bearerAuth,

  (req, res) => {
    const readiness =
      getReadiness();

    if (!readiness.ready) {
      return res
        .status(503)
        .json({
          ok: false,
          request_id:
            req.requestId,
          ready: false,
          channel:
            "whatsapp",
          sessions: {
            ready:
              readiness.readySessions,
            total:
              readiness.totalSessions,
          },
          error: {
            code:
              "NO_READY_SESSION",
            message:
              "No WhatsApp session is ready",
          },
        });
    }

    return res.json({
      ok: true,
      request_id:
        req.requestId,
      ready: true,
      channel:
        "whatsapp",
      sessions: {
        ready:
          readiness.readySessions,
        total:
          readiness.totalSessions,
      },
    });
  },
);

app.get(
  "/v1/status",

  bearerAuth,

  (req, res) => {
    return res.json({
      ok: true,
      request_id:
        req.requestId,
      channel:
        "whatsapp",
      sessions:
        getSessionReport(),
    });
  },
);

app.post(
  "/v1/otp",

  bearerAuth,

  validateOtpRequest,

  otpGlobalLimiter,

  async (req, res) => {
    try {
      const result =
        await executeOnce(
          req.otp,

          async () => {
            const {
              phone,
              code,
              locale,
            } = req.otp;

            const message =
              buildOtpMessage(
                code,
                locale,
              );

            try {
              const sent =
                await sendOtpMessage(
                  phone,
                  message,
                );

              return {
                cache: true,
                httpStatus: 200,
                payload: {
                  ok: true,
                  status:
                    "accepted",
                  channel:
                    "whatsapp",
                  provider_message_id:
                    sent.providerMessageId,
                },
              };
            } catch (error) {
              const codeValue =
                error.code ||
                "INTERNAL_ERROR";

              const httpStatus =
                Number(
                  error.httpStatus,
                ) || 500;

              if (
                codeValue ===
                "SESSION_UNAVAILABLE"
              ) {
                return {
                  cache: false,
                  httpStatus: 503,
                  payload: {
                    ok: false,
                    error: {
                      code:
                        "SESSION_UNAVAILABLE",
                      message:
                        "WhatsApp delivery channel is temporarily unavailable",
                    },
                  },
                };
              }

              let publicMessage =
                "OTP could not be sent";

              if (
                codeValue ===
                "SEND_TIMEOUT"
              ) {
                publicMessage =
                  "WhatsApp send operation timed out";
              }

              if (
                codeValue ===
                "SEND_FAILED"
              ) {
                publicMessage =
                  "WhatsApp message could not be sent";
              }

              return {
                /*
                 * Ambiguous failures are cached briefly.
                 * This prevents an HTTP retry from sending
                 * the same OTP twice immediately.
                 */
                cache: true,
                httpStatus,
                payload: {
                  ok: false,
                  error: {
                    code:
                      codeValue,
                    message:
                      publicMessage,
                  },
                },
              };
            }
          },
        );

      const responseBody = {
        ...result.payload,

        request_id:
          req.requestId,

        deduplicated:
          result.deduplicated,
      };

      return res
        .status(result.httpStatus)
        .json(responseBody);
    } catch (error) {
      logger(
        "error",
        "otp.unhandled_send_error",
        {
          request_id:
            req.requestId,
          reason:
            error.message,
        },
      );

      return sendError(
        req,
        res,
        500,
        "INTERNAL_ERROR",
        "Internal server error",
      );
    }
  },
);

app.use(
  (req, res) => {
    return sendError(
      req,
      res,
      404,
      "NOT_FOUND",
      "Endpoint not found",
    );
  },
);

app.use(
  (
    error,
    req,
    res,
    next,
  ) => {
    if (
      error?.type ===
      "entity.too.large"
    ) {
      return sendError(
        req,
        res,
        413,
        "PAYLOAD_TOO_LARGE",
        "Request body is too large",
      );
    }

    if (
      error instanceof SyntaxError &&
      error.status === 400
    ) {
      return sendError(
        req,
        res,
        400,
        "INVALID_JSON",
        "Request body contains invalid JSON",
      );
    }

    logger(
      "error",
      "http.unhandled_error",
      {
        request_id:
          req.requestId,
        reason:
          error.message,
      },
    );

    return sendError(
      req,
      res,
      500,
      "INTERNAL_ERROR",
      "Internal server error",
    );
  },
);

const server =
  app.listen(
    config.server.port,
    config.server.host,
    () => {
      logger(
        "info",
        "server.started",
        {
          host:
            config.server.host,
          port:
            config.server.port,
          environment:
            config.env,
        },
      );

      config.whatsapp.sessions
        .forEach(
          (
            sessionId,
            index,
          ) => {
            const timer =
              setTimeout(
                () => {
                  initializeSession(
                    sessionId,
                  ).catch(
                    (error) => {
                      logger(
                        "error",
                        "whatsapp.startup_failed",
                        {
                          session:
                            sessionId,
                          reason:
                            error.message,
                        },
                      );
                    },
                  );
                },

                index * 3000,
              );

            timer.unref();
          },
        );
    },
  );

let stopping = false;

async function shutdown(
  signal,
  exitCode = 0,
) {
  if (stopping) {
    return;
  }

  stopping = true;

  logger(
    "info",
    "server.shutdown_started",
    {
      signal,
    },
  );

  const forceTimer =
    setTimeout(
      () => {
        logger(
          "fatal",
          "server.shutdown_timeout",
        );

        process.exit(1);
      },
      10000,
    );

  forceTimer.unref();

  server.close(
    async () => {
      await shutdownSessions();

      clearTimeout(forceTimer);

      logger(
        "info",
        "server.shutdown_complete",
      );

      process.exit(
        exitCode,
      );
    },
  );
}

process.on(
  "SIGTERM",
  () =>
    void shutdown(
      "SIGTERM",
      0,
    ),
);

process.on(
  "SIGINT",
  () =>
    void shutdown(
      "SIGINT",
      0,
    ),
);

process.on(
  "uncaughtException",
  (error) => {
    logger(
      "fatal",
      "process.uncaught_exception",
      {
        reason:
          error.message,
      },
    );

    void shutdown(
      "uncaughtException",
      1,
    );
  },
);

process.on(
  "unhandledRejection",
  (reason) => {
    logger(
      "fatal",
      "process.unhandled_rejection",
      {
        reason:
          reason instanceof Error
            ? reason.message
            : String(reason),
      },
    );

    void shutdown(
      "unhandledRejection",
      1,
    );
  },
);
