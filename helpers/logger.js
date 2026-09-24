const config = require("../config");

const sensitiveKeyPattern =
  /(token|secret|authorization|api.?key|otp|code|qr|message)/i;

function sanitizeString(value) {
  return String(value)
    .replace(/[\r\n]/g, " ")
    .slice(0, 1500);
}

function sanitizeMeta(meta) {
  if (!meta || typeof meta !== "object") {
    return {};
  }

  const output = {};

  for (const [key, value] of Object.entries(meta)) {
    if (sensitiveKeyPattern.test(key)) {
      output[key] = "[REDACTED]";
      continue;
    }

    if (typeof value === "string") {
      output[key] = sanitizeString(value);
      continue;
    }

    if (
      typeof value === "number" ||
      typeof value === "boolean" ||
      value === null
    ) {
      output[key] = value;
      continue;
    }

    output[key] = sanitizeString(
      JSON.stringify(value),
    );
  }

  return output;
}

function logger(level, event, meta = {}) {
  if (
    level === "debug" &&
    !config.logging.debug
  ) {
    return;
  }

  const entry = {
    timestamp: new Date().toISOString(),
    level: String(level).toLowerCase(),
    event: sanitizeString(event),
    ...sanitizeMeta(meta),
  };

  process.stdout.write(
    `${JSON.stringify(entry)}\n`,
  );
}

function maskPhone(phone) {
  const digits = String(phone || "")
    .replace(/\D/g, "");

  if (digits.length < 7) {
    return "***";
  }

  return (
    `${digits.slice(0, 4)}` +
    "****" +
    `${digits.slice(-3)}`
  );
}

logger.maskPhone = maskPhone;

module.exports = logger;
