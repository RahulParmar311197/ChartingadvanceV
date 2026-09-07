import { describe, expect, it, vi } from "vitest";
import { PostgresPaperRepository } from "./postgres-paper-repository.js";

function poolWithQuery(handler) {
  const client = { query: vi.fn(handler), release: vi.fn() };
  return {
    query: vi.fn(handler),
    connect: vi.fn(async () => client),
    client,
  };
}

describe("PostgresPaperRepository", () => {
  it("requires an injected PostgreSQL pool", () => {
    expect(() => new PostgresPaperRepository()).toThrow("Postgres pool is required");
    expect(() => new PostgresPaperRepository({ query() {} })).toThrow("Postgres pool is required");
  });

  it("maps account rows and preserves numeric fields", async () => {
    const pool = poolWithQuery(async () => ({ rows: [{ account_id: "paper:u1", currency: "USD", cash: "99000.5", buying_power: "99000.5", equity: "100001.25", version: "3" }] }));
    const repository = new PostgresPaperRepository(pool);
    await expect(repository.getAccount("paper:u1")).resolves.toEqual({ id: "paper:u1", currency: "USD", cash: 99000.5, buyingPower: 99000.5, equity: 100001.25, version: 3 });
  });

  it("uses optimistic concurrency when saving a portfolio", async () => {
    const pool = poolWithQuery(async () => ({ rowCount: 1, rows: [{ account_id: "paper:u1", currency: "USD", cash: "99000", buying_power: "99000", equity: "100000", version: "4", positions: [] }] }));
    const repository = new PostgresPaperRepository(pool);
    const portfolio = { account: { id: "paper:u1", currency: "USD", cash: 99000, buyingPower: 99000, equity: 100000, version: 3 }, positions: [], ledger: [] };
    const saved = await repository.savePortfolio(portfolio);
    expect(saved.account.version).toBe(4);
    expect(pool.query.mock.calls[0][1]).toEqual(["paper:u1", 99000, 99000, 100000, "[]", expect.any(Date), 3]);
  });

  it("rejects stale portfolio writes", async () => {
    const pool = poolWithQuery(async () => ({ rowCount: 0, rows: [] }));
    const repository = new PostgresPaperRepository(pool);
    const portfolio = { account: { id: "paper:u1", currency: "USD", cash: 1, buyingPower: 1, equity: 1, version: 2 }, positions: [], ledger: [] };
    await expect(repository.savePortfolio(portfolio)).rejects.toThrow("account version conflict");
  });

  it("commits successful transaction work", async () => {
    const pool = poolWithQuery(async () => ({ rows: [], rowCount: 0 }));
    const repository = new PostgresPaperRepository(pool);
    await expect(repository.runTransaction(async (tx) => {
      expect(tx).toBeInstanceOf(PostgresPaperRepository);
      return "ok";
    })).resolves.toBe("ok");
    expect(pool.client.query).toHaveBeenNthCalledWith(1, "BEGIN");
    expect(pool.client.query).toHaveBeenNthCalledWith(2, "COMMIT");
    expect(pool.client.query).not.toHaveBeenCalledWith("ROLLBACK");
    expect(pool.client.release).toHaveBeenCalledTimes(1);
  });

  it("rolls back and preserves the original transaction error", async () => {
    const pool = poolWithQuery(async (sql) => {
      if (sql === "BEGIN") return { rows: [], rowCount: 0 };
      if (sql === "ROLLBACK") throw new Error("rollback failed");
      return { rows: [], rowCount: 0 };
    });
    const repository = new PostgresPaperRepository(pool);
    await expect(repository.runTransaction(async () => { throw new Error("work failed"); })).rejects.toThrow("work failed");
    expect(pool.client.query).toHaveBeenNthCalledWith(1, "BEGIN");
    expect(pool.client.query).toHaveBeenNthCalledWith(2, "ROLLBACK");
    expect(pool.client.release).toHaveBeenCalledTimes(1);
  });
});
