const crypto = require("crypto");

const config = require("../config");

const store = new Map();

function fingerprint(
  payload,
) {
  return crypto
    .createHash("sha256")
    .update(
      JSON.stringify({
        phone: payload.phone,
        code: payload.code,
        locale: payload.locale,
      }),
    )
    .digest("hex");
}

function errorResponse(
  req,
  res,
  status,
  code,
  message,
) {
  return res.status(status).json({
    ok: false,

    request_id:
      req.requestId,

    error: {
      code,
      message,
    },
  });
}

function cleanupExpired() {
  const now = Date.now();

  for (
    const [key, value]
    of store.entries()
  ) {
    if (
      value.expiresAt <= now
    ) {
      store.delete(key);
    }
  }
}

const cleanupTimer =
  setInterval(
    cleanupExpired,
    30000,
  );

cleanupTimer.unref();

function idempotency(
  req,
  res,
  next,
) {
  const key =
    req.get("idempotency-key")
      ?.trim();

  if (!key) {
    return errorResponse(
      req,
      res,
      422,
      "IDEMPOTENCY_KEY_REQUIRED",
      "Idempotency-Key header is required",
    );
  }

  if (
    !/^[A-Za-z0-9._:-]{16,128}$/.test(
      key,
    )
  ) {
    return errorResponse(
      req,
      res,
      422,
      "INVALID_IDEMPOTENCY_KEY",
      "Invalid Idempotency-Key",
    );
  }

  const currentFingerprint =
    fingerprint(req.otp);

  const existing =
    store.get(key);

  if (existing) {
    if (
      existing.fingerprint
      !== currentFingerprint
    ) {
      return errorResponse(
        req,
        res,
        409,
        "IDEMPOTENCY_CONFLICT",
        "Idempotency-Key was already used with a different request",
      );
    }

    if (
      existing.state
      === "PENDING"
    ) {
      return errorResponse(
        req,
        res,
        409,
        "REQUEST_IN_PROGRESS",
        "A request with this Idempotency-Key is already in progress",
      );
    }

    res.setHeader(
      "Idempotency-Replayed",
      "true",
    );

    return res
      .status(existing.httpStatus)
      .json(existing.body);
  }

  const expiresAt =
    Date.now()
    + config.idempotency.ttlMs;

  store.set(key, {
    state: "PENDING",
    fingerprint:
      currentFingerprint,
    expiresAt,
  });

  req.idempotency = {
    key,

    commit(
      httpStatus,
      body,
    ) {
      store.set(key, {
        state: "COMPLETE",
        fingerprint:
          currentFingerprint,
        httpStatus,
        body,
        expiresAt:
          Date.now()
          + config.idempotency.ttlMs,
      });
    },

    release() {
      const value =
        store.get(key);

      if (
        value
        && value.fingerprint
          === currentFingerprint
      ) {
        store.delete(key);
      }
    },
  };

  next();
}

module.exports = {
  idempotency,
};