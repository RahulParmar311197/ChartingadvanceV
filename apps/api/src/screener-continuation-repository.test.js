import { describe, expect, it, vi } from "vitest";
import { InMemoryScreenerContinuationRepository, PostgresScreenerContinuationRepository } from "./screener-continuation-repository.js";

const input = { ownerId: "user-1", requestFingerprint: "fp-1", providerName: "fundamentals", providerCursor: "vendor-secret-cursor" };

describe("InMemoryScreenerContinuationRepository", () => {
  it("round-trips an opaque continuation and consumes it once", async () => {
    const repo = new InMemoryScreenerContinuationRepository({ now: () => new Date("2026-09-07T10:00:00Z") });
    const id = await repo.create(input);
    expect(id).not.toBe(input.providerCursor);
    await expect(repo.consume({ continuationId: id, ownerId: input.ownerId, requestFingerprint: input.requestFingerprint, providerName: input.providerName })).resolves.toMatchObject({ providerCursor: input.providerCursor });
    await expect(repo.consume({ continuationId: id, ownerId: input.ownerId, requestFingerprint: input.requestFingerprint, providerName: input.providerName })).resolves.toBeNull();
  });

  it("does not disclose or consume a token across owner/query/provider boundaries", async () => {
    const repo = new InMemoryScreenerContinuationRepository();
    const id = await repo.create(input);
    await expect(repo.consume({ continuationId: id, ownerId: "other", requestFingerprint: input.requestFingerprint, providerName: input.providerName })).resolves.toBeNull();
    await expect(repo.consume({ continuationId: id, ownerId: input.ownerId, requestFingerprint: "other", providerName: input.providerName })).resolves.toBeNull();
    await expect(repo.consume({ continuationId: id, ownerId: input.ownerId, requestFingerprint: input.requestFingerprint, providerName: "other" })).resolves.toBeNull();
  });

  it("expires continuations", async () => {
    let now = new Date("2026-09-07T10:00:00Z");
    const repo = new InMemoryScreenerContinuationRepository({ now: () => now });
    const id = await repo.create({ ...input, ttlSeconds: 60 });
    now = new Date("2026-09-07T10:01:00Z");
    await expect(repo.consume({ continuationId: id, ownerId: input.ownerId, requestFingerprint: input.requestFingerprint, providerName: input.providerName })).resolves.toBeNull();
  });
});

describe("PostgresScreenerContinuationRepository", () => {
  it("uses scoped atomic consume and never exposes provider cursor in the continuation id", async () => {
    const pool = { query: vi.fn(async () => ({ rows: [{ provider_cursor: "vendor-secret-cursor", expires_at: new Date("2026-09-07T10:15:00Z") }], rowCount: 1 })), connect: vi.fn() };
    const repo = new PostgresScreenerContinuationRepository(pool, { now: () => new Date("2026-09-07T10:00:00Z") });
    const id = await repo.create(input);
    expect(id).not.toBe(input.providerCursor);
    expect(pool.query.mock.calls[0][0]).toContain("INSERT INTO screener_continuations");
    const consumed = await repo.consume({ continuationId: id, ownerId: input.ownerId, requestFingerprint: input.requestFingerprint, providerName: input.providerName });
    expect(consumed.providerCursor).toBe(input.providerCursor);
    expect(pool.query.mock.calls[1][0]).toContain("DELETE FROM screener_continuations");
    expect(pool.query.mock.calls[1][0]).toContain("expires_at > $5");
  });

  it("purges expired rows", async () => {
    const pool = { query: vi.fn(async () => ({ rows: [], rowCount: 3 })), connect: vi.fn() };
    const repo = new PostgresScreenerContinuationRepository(pool);
    await expect(repo.purgeExpired()).resolves.toBe(3);
    expect(pool.query.mock.calls[0][0]).toContain("expires_at <= $1");
  });
});
