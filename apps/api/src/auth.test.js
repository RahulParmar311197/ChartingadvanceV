import { describe, expect, it } from "vitest";
import { createPrincipalResolver, signPrincipal } from "./auth.js";

const secret = "s".repeat(32);

describe("authenticated principal boundary", () => {
  it("verifies a signed proxy principal and rejects tampering", () => {
    let now = 1_700_000_000;
    const resolve = createPrincipalResolver({ mode: "proxy-hmac", secret, clock: () => now });
    const signature = signPrincipal({ userId: "user-123", timestamp: now, secret });
    const request = { headers: { "x-auth-user": "user-123", "x-auth-timestamp": String(now), "x-auth-signature": signature } };
    expect(resolve(request)).toMatchObject({ userId: "user-123", authenticated: true, mode: "proxy-hmac" });
    expect(resolve({ headers: { ...request.headers, "x-auth-user": "attacker" } })).toBeNull();
  });

  it("rejects stale, missing, and malformed principals", () => {
    const resolve = createPrincipalResolver({ mode: "proxy-hmac", secret, clock: () => 1_700_000_000 });
    expect(resolve({ headers: {} })).toBeNull();
    expect(resolve({ headers: { "x-auth-user": "user", "x-auth-timestamp": "1699999900", "x-auth-signature": "bad" } })).toBeNull();
    expect(resolve({ headers: { "x-auth-user": "user", "x-auth-timestamp": "not-a-number", "x-auth-signature": "bad" } })).toBeNull();
  });

  it("uses demo identity only in explicit demo mode", () => {
    const resolve = createPrincipalResolver({ mode: "demo" });
    expect(resolve({ headers: { "x-demo-user-id": "demo-user" } })).toMatchObject({ userId: "demo-user", authenticated: false });
  });

  it("requires a sufficiently strong shared secret", () => {
    expect(() => createPrincipalResolver({ mode: "proxy-hmac", secret: "short" })).toThrow("at least 32 characters");
  });
});
