import { describe, expect, it } from "vitest";
import { migrateDatabase } from "./migrate.js";
import { createPostgresPoolFromEnv, PostgresPaperRepository } from "./postgres-paper-repository.js";
import { createPaperTradingService } from "./paper-trading.js";

const describePostgres = process.env.DATABASE_URL ? describe : describe.skip;

describePostgres("PostgreSQL persistence integration", () => {
  it("is idempotently migratable and recovers paper state after a new pool", async () => {
    const pool = await createPostgresPoolFromEnv();
    const accountId = `paper:integration-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const userId = accountId.slice("paper:".length);
    try {
      await migrateDatabase(pool);
      await migrateDatabase(pool);
      const versions = await pool.query("SELECT version FROM schema_migrations ORDER BY version");
      expect(versions.rows.map((row) => row.version)).toEqual(expect.arrayContaining(["001", "002"]));

      const service = createPaperTradingService(new PostgresPaperRepository(pool));
      const submitted = await service.submitPaperOrder(userId, { id: "integration-order", symbolId: "NASDAQ:AAPL", side: "buy", type: "market", quantity: 2 }, 1_000);
      expect(submitted.order.status).toBe("filled");

      const recoveryPool = await createPostgresPoolFromEnv();
      try {
        const recovered = await new PostgresPaperRepository(recoveryPool).getPortfolio(accountId);
        expect(recovered.positions).toHaveLength(1);
        expect(recovered.positions[0].quantity).toBe(2);
        expect(recovered.ledger).toHaveLength(1);
        expect(await new PostgresPaperRepository(recoveryPool).getOrder(accountId, "integration-order")).toMatchObject({ status: "filled" });
      } finally {
        await recoveryPool.end();
      }
    } finally {
      await pool.query("DELETE FROM paper_audit_events WHERE account_id=$1", [accountId]);
      await pool.query("DELETE FROM paper_ledger_entries WHERE account_id=$1", [accountId]);
      await pool.query("DELETE FROM paper_fills WHERE account_id=$1", [accountId]);
      await pool.query("DELETE FROM paper_orders WHERE account_id=$1", [accountId]);
      await pool.query("DELETE FROM paper_accounts WHERE account_id=$1", [accountId]);
      await pool.end();
    }
  });

  it("rejects one of two concurrent optimistic portfolio writes", async () => {
    const pool = await createPostgresPoolFromEnv();
    const accountId = `paper:concurrency-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const repository = new PostgresPaperRepository(pool);
    try {
      await migrateDatabase(pool);
      await repository.createAccount({ id: accountId, currency: "USD", cash: 100, buyingPower: 100, equity: 100, version: 0 }, accountId);
      const base = await repository.getPortfolio(accountId);
      const left = { ...base, account: { ...base.account, cash: 99, buyingPower: 99 } };
      const right = { ...base, account: { ...base.account, cash: 98, buyingPower: 98 } };
      const results = await Promise.allSettled([repository.savePortfolio(left, 0), repository.savePortfolio(right, 0)]);
      expect(results.filter((result) => result.status === "fulfilled")).toHaveLength(1);
      expect(results.filter((result) => result.status === "rejected")).toHaveLength(1);
      expect(results.find((result) => result.status === "rejected").reason.message).toBe("account version conflict");
    } finally {
      await pool.query("DELETE FROM paper_audit_events WHERE account_id=$1", [accountId]);
      await pool.query("DELETE FROM paper_ledger_entries WHERE account_id=$1", [accountId]);
      await pool.query("DELETE FROM paper_fills WHERE account_id=$1", [accountId]);
      await pool.query("DELETE FROM paper_orders WHERE account_id=$1", [accountId]);
      await pool.query("DELETE FROM paper_accounts WHERE account_id=$1", [accountId]);
      await pool.end();
    }
  });

  it("serializes concurrent client-order races and keeps the losing transaction usable", async () => {
    const pool = await createPostgresPoolFromEnv();
    const accountId = `paper:order-race-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const userId = accountId.slice("paper:".length);
    const repository = new PostgresPaperRepository(pool);
    try {
      await migrateDatabase(pool);
      const created = await repository.createAccount({ id: accountId, currency: "USD", cash: 100_000, buyingPower: 100_000, equity: 100_000, version: 0 }, userId);
      expect(created).not.toBeNull();
      await repository.savePortfolio({ account: created, positions: [], ledger: [] }, created.version);

      const service = createPaperTradingService(repository);
      const results = await Promise.all([
        service.submitPaperOrder(userId, { id: "raced-order", symbolId: "NASDAQ:AAPL", side: "buy", type: "market", quantity: 1 }, 1_000),
        service.submitPaperOrder(userId, { id: "raced-order", symbolId: "NASDAQ:AAPL", side: "buy", type: "market", quantity: 1 }, 2_000),
      ]);
      const statuses = results.map((result) => result.order.status).sort();
      expect(statuses).toEqual(["filled", "rejected"]);
      expect(results.filter((result) => result.risk.reason === "duplicate order id")).toHaveLength(1);
      expect((await repository.listOrders(accountId))).toHaveLength(1);
      expect((await repository.getPortfolio(accountId)).ledger).toHaveLength(1);
    } finally {
      await pool.query("DELETE FROM paper_audit_events WHERE account_id=$1", [accountId]);
      await pool.query("DELETE FROM paper_ledger_entries WHERE account_id=$1", [accountId]);
      await pool.query("DELETE FROM paper_fills WHERE account_id=$1", [accountId]);
      await pool.query("DELETE FROM paper_orders WHERE account_id=$1", [accountId]);
      await pool.query("DELETE FROM paper_accounts WHERE account_id=$1", [accountId]);
      await pool.end();
    }
  });
});
