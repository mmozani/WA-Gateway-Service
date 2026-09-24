const crypto = require("crypto");

const config = require("../config");

const entries = new Map();

function makeKey(payload) {
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

function getFreshEntry(key) {
  const entry = entries.get(key);

  if (!entry) {
    return null;
  }

  if (
    entry.state === "COMPLETE" &&
    entry.expiresAt <= Date.now()
  ) {
    entries.delete(key);
    return null;
  }

  return entry;
}

async function executeOnce(payload, operation) {
  const key = makeKey(payload);

  const existing = getFreshEntry(key);

  if (existing) {
    if (existing.state === "PENDING") {
      const result = await existing.promise;

      return {
        ...result,
        deduplicated: true,
      };
    }

    return {
      ...existing.result,
      deduplicated: true,
    };
  }

  const promise = Promise.resolve()
    .then(operation);

  entries.set(key, {
    state: "PENDING",
    promise,
  });

  try {
    const result = await promise;

    if (result.cache === false) {
      entries.delete(key);
    } else {
      entries.set(key, {
        state: "COMPLETE",
        result,
        expiresAt:
          Date.now() +
          config.delivery.dedupeWindowMs,
      });
    }

    return {
      ...result,
      deduplicated: false,
    };
  } catch (error) {
    entries.delete(key);
    throw error;
  }
}

const cleanupTimer = setInterval(
  () => {
    const now = Date.now();

    for (const [key, entry] of entries.entries()) {
      if (
        entry.state === "COMPLETE" &&
        entry.expiresAt <= now
      ) {
        entries.delete(key);
      }
    }
  },
  30000,
);

cleanupTimer.unref();

module.exports = {
  executeOnce,
};
