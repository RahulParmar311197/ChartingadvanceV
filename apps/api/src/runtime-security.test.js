import { describe, expect, it } from "vitest";
import { assertProductionConfig, createRateLimiter, createSecurityHeaders, parseCorsOrigins, productionConfigErrors } from "./runtime-security.js";

describe("runtime security", () => {
  it("rate-limits within a fixed window and exposes retry timing", () => {
    const limiter = createRateLimiter({ limit: 2, windowMs: 1000 });
    expect(limiter.check("client", 0)).toMatchObject({ allowed: true, remaining: 1 });
    expect(limiter.check("client", 10)).toMatchObject({ allowed: true, remaining: 0 });
    expect(limiter.check("client", 20)).toMatchObject({ allowed: false, retryAfterSeconds: 1 });
    expect(limiter.check("client", 1000)).toMatchObject({ allowed: true, remaining: 1 });
  });

  it("parses and de-duplicates explicit CORS origins", () => {
    expect(parseCorsOrigins("https://app.example.com, https://app.example.com,http://localhost:5173")).toEqual(["https://app.example.com", "http://localhost:5173"]);
  });

  it("rejects invalid production CORS configuration", () => {
    expect(() => parseCorsOrigins("", { production: true })).toThrow("CORS_ORIGINS is required in production");
    expect(() => parseCorsOrigins("javascript:alert(1)", { production: true })).toThrow("http(s)");
  });

  it("emits browser security and CORS preflight headers", () => {
    expect(createSecurityHeaders({ origin: "https://app.example.com", production: true })).toMatchObject({
      "x-content-type-options": "nosniff",
      "x-frame-options": "DENY",
      "strict-transport-security": "max-age=31536000; includeSubDomains",
      "access-control-allow-origin": "https://app.example.com",
      "access-control-allow-credentials": "true",
      "access-control-allow-methods": "GET,POST,PUT,DELETE,OPTIONS",
      "access-control-allow-headers": expect.stringContaining("x-auth-signature"),
      vary: "Origin",
    });
    expect(createSecurityHeaders({ production: false })).not.toHaveProperty("strict-transport-security");
  });

  it("blocks production startup until real identity, providers, persistence, and CORS are configured", () => {
    const env = { NODE_ENV: "production", PAPER_PERSISTENCE: "postgres", DATABASE_URL: "postgresql://example", SCREENER_CURSOR_ENCRYPTION_KEY: "configured", CORS_ORIGINS: "https://app.example.com" };
    expect(productionConfigErrors(env)).toEqual([
      "AUTH_MODE=proxy-hmac is required for production until a first-party identity adapter is installed",
      "AUTH_SHARED_SECRET must be at least 32 characters in production",
      "MARKET_DATA_MODE=live is required for production",
      "FUNDAMENTALS_DATA_MODE=live is required for production",
      "MARKET_DATA_PROVIDER=configured is required; a real provider adapter must be installed before production",
      "FUNDAMENTALS_DATA_PROVIDER=configured is required; a real provider adapter must be installed before production",
    ]);
    expect(() => assertProductionConfig(env)).toThrow("Production configuration invalid");
  });

  it("fails closed even when provider configuration flags are present because demo providers remain the only implementation", () => {
    const env = {
      NODE_ENV: "production",
      AUTH_MODE: "proxy-hmac",
      AUTH_SHARED_SECRET: "s".repeat(32),
      MARKET_DATA_MODE: "live",
      FUNDAMENTALS_DATA_MODE: "live",
      MARKET_DATA_PROVIDER: "configured",
      FUNDAMENTALS_DATA_PROVIDER: "configured",
      PAPER_PERSISTENCE: "postgres",
      DATABASE_URL: "postgresql://example",
      SCREENER_CURSOR_ENCRYPTION_KEY: "configured",
      CORS_ORIGINS: "https://app.example.com",
    };
    expect(productionConfigErrors(env)).toEqual([
      "production market provider adapter is not implemented in this build",
      "production fundamentals provider adapter is not implemented in this build",
    ]);
  });
});
