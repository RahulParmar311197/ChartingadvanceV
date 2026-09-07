import { describe, expect, it } from "vitest";
import { createScreenerCursorProtector, createScreenerCursorProtectorFromEnv } from "./screener-cursor-protection.js";

const key = Buffer.alloc(32, 7);

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

  it("does not silently enable encryption when the environment key is absent", () => {
    expect(createScreenerCursorProtectorFromEnv({})).toBeNull();
  });

  it("validates environment key length", () => {
    expect(() => createScreenerCursorProtectorFromEnv({ SCREENER_CURSOR_ENCRYPTION_KEY: Buffer.alloc(31).toString("base64") })).toThrow("32-byte key");
  });
});
