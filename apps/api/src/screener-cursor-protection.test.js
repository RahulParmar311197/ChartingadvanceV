import { describe, expect, it } from "vitest";
import { createScreenerCursorKeyring, createScreenerCursorProtector, createScreenerCursorProtectorFromEnv } from "./screener-cursor-protection.js";

const key = Buffer.alloc(32, 7);
const oldKey = Buffer.alloc(32, 8);

function encoded(value) { return value.toString("base64"); }

describe("screener cursor protection", () => {
  it("round-trips provider cursors without exposing plaintext", () => {
    const protector = createScreenerCursorProtector({ key, keyId: "k1" });
    const protectedCursor = protector.protect("vendor-secret-cursor");
    expect(protectedCursor).not.toContain("vendor-secret-cursor");
    expect(protector.unprotect(protectedCursor)).toBe("vendor-secret-cursor");
  });

  it("rejects tampering and wrong key identifiers", () => {
    const protector = createScreenerCursorProtector({ key, keyId: "k1" });
    const protectedCursor = protector.protect("secret");
    const parts = protectedCursor.split(".");
    parts[4] = `${parts[4]}x`;
    expect(() => protector.unprotect(parts.join("."))).toThrow("invalid protected screener cursor");
    expect(() => createScreenerCursorProtector({ key, keyId: "k2" }).unprotect(protectedCursor)).toThrow("invalid protected screener cursor");
  });

  it("supports active-key encryption with previous-key decryption during rotation", () => {
    const oldProtector = createScreenerCursorProtector({ key: oldKey, keyId: "old" });
    const oldCursor = oldProtector.protect("old-provider-cursor");
    const keyring = createScreenerCursorKeyring({ active: { key, keyId: "new" }, previous: [{ key: oldKey, keyId: "old" }] });
    expect(keyring.unprotect(oldCursor)).toBe("old-provider-cursor");
    const newCursor = keyring.protect("new-provider-cursor");
    expect(newCursor.split(".")[1]).toBe("new");
    expect(keyring.unprotect(newCursor)).toBe("new-provider-cursor");
  });

  it("rejects duplicate key ids and malformed key ids", () => {
    expect(() => createScreenerCursorKeyring({ active: { key, keyId: "same" }, previous: [{ key: oldKey, keyId: "same" }] })).toThrow("duplicate cursor encryption key id");
    expect(() => createScreenerCursorProtector({ key, keyId: "bad.key" })).toThrow("keyId must be");
  });

  it("does not silently enable encryption when the environment key is absent", () => {
    expect(createScreenerCursorProtectorFromEnv({})).toBeNull();
  });

  it("validates environment key length", () => {
    expect(() => createScreenerCursorProtectorFromEnv({ SCREENER_CURSOR_ENCRYPTION_KEY: Buffer.alloc(31).toString("base64") })).toThrow("32-byte key");
  });

  it("loads a rotating keyring from environment configuration", () => {
    const protector = createScreenerCursorProtectorFromEnv({
      SCREENER_CURSOR_ENCRYPTION_KEYS: `old=${encoded(oldKey)};new=${encoded(key)}`,
      SCREENER_CURSOR_ENCRYPTION_KEY_ID: "new",
    });
    expect(protector.unprotect(createScreenerCursorProtector({ key: oldKey, keyId: "old" }).protect("legacy"))).toBe("legacy");
    expect(protector.unprotect(protector.protect("current"))).toBe("current");
  });
});
