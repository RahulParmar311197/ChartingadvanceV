import { createHmac, timingSafeEqual } from "node:crypto";

const MAX_USER_ID_LENGTH = 256;
const MAX_CLOCK_SKEW_SECONDS = 60;

function requiredSecret(value) {
  if (typeof value !== "string" || value.length < 32) throw new Error("AUTH_SHARED_SECRET must be at least 32 characters");
  return value;
}

function validUserId(value) {
  return typeof value === "string" && value.length > 0 && value.length <= MAX_USER_ID_LENGTH && !/[\r\n]/.test(value);
}

export function signPrincipal({ userId, timestamp, secret }) {
  if (!validUserId(userId)) throw new Error("userId must be a valid non-empty identifier");
  if (!Number.isInteger(timestamp)) throw new Error("timestamp must be an integer Unix second");
  return createHmac("sha256", requiredSecret(secret)).update(`${timestamp}.${userId}`, "utf8").digest("base64url");
}

export function createPrincipalResolver({ mode = "demo", secret = process.env.AUTH_SHARED_SECRET, clock = () => Math.floor(Date.now() / 1000), maxClockSkewSeconds = MAX_CLOCK_SKEW_SECONDS } = {}) {
  if (mode === "demo") return (req) => ({ userId: req.headers["x-demo-user-id"] || "anonymous", authenticated: false, mode });
  if (mode !== "proxy-hmac") throw new Error("AUTH_MODE must be demo or proxy-hmac");
  requiredSecret(secret);
  if (!Number.isInteger(maxClockSkewSeconds) || maxClockSkewSeconds < 1 || maxClockSkewSeconds > 300) throw new Error("maxClockSkewSeconds must be 1-300");

  return (req) => {
    const userId = req.headers["x-auth-user"];
    const timestamp = Number(req.headers["x-auth-timestamp"]);
    const signature = req.headers["x-auth-signature"];
    if (!validUserId(userId) || !Number.isInteger(timestamp) || typeof signature !== "string" || !signature) return null;
    if (Math.abs(clock() - timestamp) > maxClockSkewSeconds) return null;
    const expected = signPrincipal({ userId, timestamp, secret });
    const expectedBytes = Buffer.from(expected);
    const actualBytes = Buffer.from(signature);
    if (expectedBytes.length !== actualBytes.length || !timingSafeEqual(expectedBytes, actualBytes)) return null;
    return { userId, authenticated: true, mode };
  };
}

export function authConfigErrors(env = process.env) {
  if (env.NODE_ENV !== "production") return [];
  const errors = [];
  if (env.AUTH_MODE !== "proxy-hmac") errors.push("AUTH_MODE=proxy-hmac is required for production until a first-party identity adapter is installed");
  if (typeof env.AUTH_SHARED_SECRET !== "string" || env.AUTH_SHARED_SECRET.length < 32) errors.push("AUTH_SHARED_SECRET must be at least 32 characters in production");
  return errors;
}
