import { afterEach, describe, expect, it, vi } from "vitest";
import { assertProductionConfig, createRateLimiter, createSecurityHeaders, parseCorsOrigins, productionConfigErrors } from "./runtime-security.js";

describe("runtime security", () => {
  afterEach(() => vi.restoreAllMocks());

  it("rate-limits within a fixed window and exposes retry timing", () => {
    const limiter = createRateLimiter({ limit: 2, windowMs: 1000 });
    expect(limiter.check("client", 0)).toMatchObject({ allowed: true, remaining: 1 });
    expect(limiter.check("client", 10)).toMatchObject({ allowed: true, remaining: 0 });
    expect(limiter.check("client", 20)).toMatchObject({ allowed: false, retryAfterSeconds: 1 });
    expect(limiter.check("client", 1000)).toMatchObject({ allowed: true, remaining: 1 });
  });

  it("parses and de-duplicates explicit CORS origins", () => {
    expect(parseCorsOrigins("https://app.example.com, https://app.example.com,http://localhost:5173")).toEqual([
      "https://app.example.com",
      "http://localhost:5173",
    ]);
  });

  it("rejects invalid production CORS configuration", () => {
    expect(() => parseCorsOrigins("", { production: true })).toThrow("CORS_ORIGINS is required in production");
    expect(() => parseCorsOrigins("javascript:alert(1)", { production: true })).toThrow("http(s)");
  });

  it("emits browser security headers and HSTS only in production", () => {
    expect(createSecurityHeaders({ origin: "https://app.example.com", production: true })).toMatchObject({
      "x-content-type-options": "nosniff",
      "x-frame-options": "DENY",
      "strict-transport-security": "max-age=31536000; includeSubDomains",
      "access-control-allow-origin": "https://app.example.com",
      "access-control-allow-credentials": "true",
      vary: "Origin",
    });
    expect(createSecurityHeaders({ production: false })).not.toHaveProperty("strict-transport-security");
  });

  it("blocks production startup until real identity, data, persistence, and CORS are configured", () => {
    const env = { NODE_ENV: "production", PAPER_PERSISTENCE: "postgres", DATABASE_URL: "postgresql://example", SCREENER_CURSOR_ENCRYPTION_KEY: "configured", CORS_ORIGINS: "https://app.example.com" };
    expect(productionConfigErrors(env)).toEqual([
      "AUTH_MODE=authenticated is required for production; demo identity is not accepted",
      "MARKET_DATA_MODE=live is required for production",
      "FUNDAMENTALS_DATA_MODE=live is required for production",
    ]);
    expect(() => assertProductionConfig(env)).toThrow("Production configuration invalid");
  });

  it("accepts a fully specified production configuration", () => {
    const env = {
      NODE_ENV: "production",
      AUTH_MODE: "authenticated",
      MARKET_DATA_MODE: "live",
      FUNDAMENTALS_DATA_MODE: "live",
      PAPER_PERSISTENCE: "postgres",
      DATABASE_URL: "postgresql://example",
      SCREENER_CURSOR_ENCRYPTION_KEY: "configured",
      CORS_ORIGINS: "https://app.example.com",
    };
    expect(productionConfigErrors(env)).toEqual([]);
    expect(() => assertProductionConfig(env)).not.toThrow();
  });
});
