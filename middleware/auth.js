const crypto = require("crypto");

const config = require("../config");

function constantTimeEqual(value, expected) {
  if (
    typeof value !== "string" ||
    typeof expected !== "string"
  ) {
    return false;
  }

  const valueBuffer = Buffer.from(value, "utf8");
  const expectedBuffer = Buffer.from(expected, "utf8");

  if (valueBuffer.length !== expectedBuffer.length) {
    return false;
  }

  return crypto.timingSafeEqual(
    valueBuffer,
    expectedBuffer,
  );
}

function unauthorized(req, res, message) {
  res.setHeader("WWW-Authenticate", "Bearer");

  return res.status(401).json({
    ok: false,
    request_id: req.requestId || null,
    error: {
      code: "UNAUTHORIZED",
      message,
    },
  });
}

function bearerAuth(req, res, next) {
  const authorization = req.get("authorization");

  if (!authorization) {
    return unauthorized(
      req,
      res,
      "Authentication required",
    );
  }

  const match = authorization.match(
    /^Bearer\s+(.+)$/i,
  );

  if (!match) {
    return unauthorized(
      req,
      res,
      "Invalid authorization scheme",
    );
  }

  const token = match[1].trim();

  if (!constantTimeEqual(token, config.auth.token)) {
    return unauthorized(
      req,
      res,
      "Invalid credentials",
    );
  }

  next();
}

module.exports = {
  bearerAuth,
};
