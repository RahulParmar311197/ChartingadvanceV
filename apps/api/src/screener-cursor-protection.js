import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";

const ALGORITHM = "aes-256-gcm";
const IV_BYTES = 12;
const TAG_BYTES = 16;
const KEY_BYTES = 32;
const VERSION = 1;
const KEY_ID_PATTERN = /^[A-Za-z0-9_-]{1,64}$/;

function decodeKey(value) {
  if (Buffer.isBuffer(value)) {
    if (value.length !== KEY_BYTES) throw new Error("cursor encryption key must be 32 bytes");
    return value;
  }
  if (typeof value !== "string" || value.length === 0) throw new Error("SCREENER_CURSOR_ENCRYPTION_KEY is required");
  const key = Buffer.from(value, "base64");
  if (key.length !== KEY_BYTES) throw new Error("SCREENER_CURSOR_ENCRYPTION_KEY must be a base64-encoded 32-byte key");
  return key;
}

function validateKeyId(keyId) {
  if (typeof keyId !== "string" || !KEY_ID_PATTERN.test(keyId)) throw new Error("keyId must be 1-64 alphanumeric, underscore, or hyphen characters");
}

export function createScreenerCursorProtector({ key, keyId = "default" }) {
  const encryptionKey = decodeKey(key);
  validateKeyId(keyId);

  return {
    protect(providerCursor) {
      if (typeof providerCursor !== "string" || providerCursor.length === 0) throw new Error("provider cursor must be a non-empty string");
      const iv = randomBytes(IV_BYTES);
      const cipher = createCipheriv(ALGORITHM, encryptionKey, iv);
      cipher.setAAD(Buffer.from(`${VERSION}:${keyId}`, "utf8"));
      const ciphertext = Buffer.concat([cipher.update(providerCursor, "utf8"), cipher.final()]);
      const tag = cipher.getAuthTag();
      return `${VERSION}.${keyId}.${iv.toString("base64url")}.${tag.toString("base64url")}.${ciphertext.toString("base64url")}`;
    },
    unprotect(protectedCursor) {
      if (typeof protectedCursor !== "string") throw new Error("protected cursor must be a string");
      const [version, storedKeyId, ivText, tagText, ciphertextText] = protectedCursor.split(".");
      if (Number(version) !== VERSION || storedKeyId !== keyId || !ivText || !tagText || !ciphertextText) throw new Error("invalid protected screener cursor");
      try {
        const iv = Buffer.from(ivText, "base64url");
        const tag = Buffer.from(tagText, "base64url");
        const ciphertext = Buffer.from(ciphertextText, "base64url");
        if (iv.length !== IV_BYTES || tag.length !== TAG_BYTES || ciphertext.length === 0) throw new Error("invalid protected screener cursor");
        const decipher = createDecipheriv(ALGORITHM, encryptionKey, iv);
        decipher.setAAD(Buffer.from(`${VERSION}:${keyId}`, "utf8"));
        decipher.setAuthTag(tag);
        return Buffer.concat([decipher.update(ciphertext), decipher.final()]).toString("utf8");
      } catch {
        throw new Error("invalid protected screener cursor");
      }
    },
  };
}

export function createScreenerCursorKeyring({ active, previous = [] }) {
  if (!active || typeof active !== "object") throw new Error("active cursor encryption key is required");
  const entries = [active, ...previous];
  const protectors = new Map();
  for (const entry of entries) {
    if (!entry || typeof entry !== "object") throw new Error("cursor encryption key entry is invalid");
    if (protectors.has(entry.keyId)) throw new Error("duplicate cursor encryption key id");
    protectors.set(entry.keyId, createScreenerCursorProtector(entry));
  }
  const activeProtector = protectors.get(active.keyId);
  return {
    protect(providerCursor) { return activeProtector.protect(providerCursor); },
    unprotect(protectedCursor) {
      if (typeof protectedCursor !== "string") throw new Error("protected cursor must be a string");
      const [, storedKeyId] = protectedCursor.split(".");
      const protector = protectors.get(storedKeyId);
      if (!protector) throw new Error("invalid protected screener cursor");
      return protector.unprotect(protectedCursor);
    },
  };
}

function parseKeyEntries(value) {
  if (typeof value !== "string" || value.trim() === "") throw new Error("SCREENER_CURSOR_ENCRYPTION_KEYS is required");
  return value.split(";").map((entry) => {
    const separator = entry.indexOf("=");
    if (separator <= 0) throw new Error("SCREENER_CURSOR_ENCRYPTION_KEYS must use keyId=base64Key entries");
    return { keyId: entry.slice(0, separator), key: entry.slice(separator + 1) };
  });
}

export function createScreenerCursorProtectorFromEnv(env = process.env) {
  if (env.SCREENER_CURSOR_ENCRYPTION_KEYS) {
    const entries = parseKeyEntries(env.SCREENER_CURSOR_ENCRYPTION_KEYS);
    const activeKeyId = env.SCREENER_CURSOR_ENCRYPTION_KEY_ID ?? entries[0]?.keyId;
    const active = entries.find((entry) => entry.keyId === activeKeyId);
    if (!active) throw new Error("SCREENER_CURSOR_ENCRYPTION_KEY_ID must reference a configured cursor key");
    return createScreenerCursorKeyring({ active, previous: entries.filter((entry) => entry !== active) });
  }
  const key = env.SCREENER_CURSOR_ENCRYPTION_KEY;
  if (!key) return null;
  return createScreenerCursorProtector({ key, keyId: env.SCREENER_CURSOR_ENCRYPTION_KEY_ID ?? "default" });
}
