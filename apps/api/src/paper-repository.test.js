import { describe, expect, it } from "vitest";
import { createPaperRepository } from "./paper-repository.js";

describe("paper persistence repository", () => {
  it("enforces account optimistic concurrency", () => {
    const repository = createPaperRepository();
    repository.createAccount({ id: "paper:a", currency: "USD", cash: 100, buyingPower: 100, equity: 100, version: 0 });
    const next = repository.updateAccount({ id: "paper:a", currency: "USD", cash: 90, buyingPower: 90, equity: 90, version: 0 }, 0);
    expect(next.version).toBe(1);
    expect(() => repository.updateAccount({ ...next, cash: 80 }, 0)).toThrow("account version conflict");
  });

  it("scopes order identity to an account", () => {
    const repository = createPaperRepository();
    repository.insertOrder({ id: "same", accountId: "paper:a", status: "accepted" });
    repository.insertOrder({ id: "same", accountId: "paper:b", status: "accepted" });
    expect(repository.getOrder("paper:a", "same").accountId).toBe("paper:a");
    expect(repository.getOrder("paper:b", "same").accountId).toBe("paper:b");
  });

  it("prevents stale order transitions", () => {
    const repository = createPaperRepository();
    repository.insertOrder({ id: "one", accountId: "paper:a", status: "accepted" });
    repository.transitionOrder("paper:a", "one", "accepted", { id: "one", accountId: "paper:a", status: "cancelled" });
    expect(() => repository.transitionOrder("paper:a", "one", "accepted", { id: "one", accountId: "paper:a", status: "filled" })).toThrow("order status conflict");
  });

  it("keeps audit append-only and idempotent", () => {
    const repository = createPaperRepository();
    const event = { id: "evt:1", accountId: "paper:a", action: "order_submitted", timestamp: 1 };
    repository.appendAuditEvent(event);
    repository.appendAuditEvent(event);
    expect(repository.listAuditEvents("paper:a")).toEqual([event]);
  });

  it("rolls back all in-memory aggregate stores when a transaction fails", async () => {
    const repository = createPaperRepository();
    await expect(repository.runTransaction(async (tx) => {
      tx.createAccount({ id: "paper:a", currency: "USD", cash: 100, buyingPower: 100, equity: 100, version: 0 });
      tx.insertOrder({ id: "order-1", accountId: "paper:a", status: "accepted" });
      tx.appendAuditEvent({ id: "event-1", accountId: "paper:a", action: "order_submitted", timestamp: 1 });
      throw new Error("atomic failure");
    })).rejects.toThrow("atomic failure");
    expect(repository.getAccount("paper:a")).toBeNull();
    expect(repository.getOrder("paper:a", "order-1")).toBeNull();
    expect(repository.listAuditEvents("paper:a")).toEqual([]);
  });
});
