import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";

const ALGORITHM = "aes-256-gcm";
const IV_BYTES = 12;
const TAG_BYTES = 16;
const KEY_BYTES = 32;
const VERSION = 1;

function decodeKey(value) {
  if (typeof value !== "string" || value.length === 0) throw new Error("SCREENER_CURSOR_ENCRYPTION_KEY is required");
  const key = Buffer.from(value, "base64");
  if (key.length !== KEY_BYTES) throw new Error("SCREENER_CURSOR_ENCRYPTION_KEY must be a base64-encoded 32-byte key");
  return key;
}

export function createScreenerCursorProtector({ key, keyId = "default" }) {
  const encryptionKey = Buffer.isBuffer(key) ? key : decodeKey(key);
  if (encryptionKey.length !== KEY_BYTES) throw new Error("cursor encryption key must be 32 bytes");
  if (typeof keyId !== "string" || keyId.length === 0 || keyId.length > 64) throw new Error("keyId must be 1-64 characters");

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

export function createScreenerCursorProtectorFromEnv(env = process.env) {
  const key = env.SCREENER_CURSOR_ENCRYPTION_KEY;
  if (!key) return null;
  return createScreenerCursorProtector({ key, keyId: env.SCREENER_CURSOR_ENCRYPTION_KEY_ID ?? "default" });
}
