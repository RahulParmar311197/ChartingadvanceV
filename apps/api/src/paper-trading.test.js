import { afterEach, describe, expect, it, vi } from "vitest";
import { cancelPaperOrder, createPaperTradingService, getPaperAudit, getPaperPortfolio, replacePaperOrder, resetPaperTradingStore, submitPaperOrder } from "./paper-trading.js";
import { createPaperRepository } from "./paper-repository.js";

afterEach(async () => resetPaperTradingStore());

describe("paper trading application service", () => {
  it("fills a valid market order and updates the portfolio ledger", async () => {
    const result = await submitPaperOrder("user-a", { id: "order-1", symbolId: "NASDAQ:AAPL", side: "buy", type: "market", quantity: 10 }, 1_000);
    expect(result.simulated).toBe(true); expect(result.order.status).toBe("filled"); expect(result.fill).toMatchObject({ orderId: "order-1", quantity: 10, timestamp: 1_000 }); expect(result.portfolio.positions).toHaveLength(1); expect(result.portfolio.positions[0].quantity).toBe(10); expect(result.portfolio.ledger).toHaveLength(1); expect(result.portfolio.account.cash).toBeLessThan(100_000);
  });
  it("marks filled positions to the deterministic demo quote", async () => {
    await submitPaperOrder("user-a", { id: "mark", symbolId: "NASDAQ:AAPL", side: "buy", type: "market", quantity: 2 }, 1_000); const portfolio = await getPaperPortfolio("user-a"); expect(portfolio.positions[0].unrealizedPnl).toBeTypeOf("number"); expect(portfolio.account.equity).toBeTypeOf("number");
  });
  it("keeps paper accounts isolated by user", async () => {
    await submitPaperOrder("user-a", { id: "order-a", symbolId: "NASDAQ:AAPL", side: "buy", type: "market", quantity: 1 }, 1_000); const other = await getPaperPortfolio("user-b"); expect(other.positions).toEqual([]); expect(other.account.cash).toBe(100_000);
  });
  it("rejects orders that exceed the demo risk limit without mutating the portfolio", async () => {
    const result = await submitPaperOrder("user-a", { id: "large", symbolId: "NASDAQ:AAPL", side: "buy", type: "market", quantity: 10_001 }, 1_000); expect(result.order.status).toBe("rejected"); expect(result.fill).toBeNull(); expect(result.risk.allowed).toBe(false); expect(result.portfolio.positions).toEqual([]); expect(result.portfolio.ledger).toEqual([]);
  });
  it("blocks short selling in the paper application by default", async () => {
    const result = await submitPaperOrder("user-a", { id: "short", symbolId: "NASDAQ:AAPL", side: "sell", type: "market", quantity: 1 }, 1_000); expect(result.order.status).toBe("rejected"); expect(result.risk.reason).toBe("short positions are disabled");
  });
  it("does not fill an untriggered limit order and allows cancellation", async () => {
    const result = await submitPaperOrder("user-a", { id: "limit", symbolId: "NASDAQ:AAPL", side: "buy", type: "limit", quantity: 1, limitPrice: 0.01 }, 1_000); expect(result.order.status).toBe("accepted"); expect(result.fill).toBeNull(); expect(result.reason).toBe("order conditions not met"); const cancelled = await cancelPaperOrder("user-a", "limit", 2_000); expect(cancelled.cancelled).toBe(true); expect(cancelled.order.status).toBe("cancelled"); expect((await getPaperAudit("user-a")).map((event) => event.action)).toEqual(["order_submitted", "order_accepted", "order_cancelled"]);
  });
  it("rejects cancellation of a filled order without mutating the fill", async () => {
    await submitPaperOrder("user-a", { id: "filled", symbolId: "NASDAQ:AAPL", side: "buy", type: "market", quantity: 1 }, 1_000); await expect(cancelPaperOrder("user-a", "filled", 2_000)).rejects.toThrow("open paper order not found"); expect((await getPaperPortfolio("user-a")).ledger).toHaveLength(1);
  });
  it("replaces an accepted order with a new lifecycle id", async () => {
    await submitPaperOrder("user-a", { id: "old", symbolId: "NASDAQ:AAPL", side: "buy", type: "limit", quantity: 1, limitPrice: 0.01 }, 1_000); const result = await replacePaperOrder("user-a", "old", { id: "new", limitPrice: 0.02, quantity: 2 }, 2_000); expect(result.replaced).toBe(true); expect(result.cancelled.status).toBe("cancelled"); expect(result.replacement).toMatchObject({ id: "new", status: "accepted", quantity: 2, limitPrice: 0.02 }); await expect(cancelPaperOrder("user-a", "old", 3_000)).rejects.toThrow("open paper order not found"); expect((await getPaperAudit("user-a")).map((event) => event.action)).toEqual(["order_submitted", "order_accepted", "order_cancelled", "order_replaced", "order_submitted", "order_accepted"]);
  });
  it("prevents replacing a filled order and preserves account state", async () => {
    await submitPaperOrder("user-a", { id: "filled", symbolId: "NASDAQ:AAPL", side: "buy", type: "market", quantity: 1 }, 1_000); await expect(replacePaperOrder("user-a", "filled", { id: "new" }, 2_000)).rejects.toThrow("open paper order not found"); expect((await getPaperPortfolio("user-a")).positions[0].quantity).toBe(1);
  });
  it("rejects duplicate client order ids without creating a second fill", async () => {
    const first = await submitPaperOrder("user-a", { id: "duplicate", symbolId: "NASDAQ:AAPL", side: "buy", type: "market", quantity: 1 }, 1_000); const second = await submitPaperOrder("user-a", { id: "duplicate", symbolId: "NASDAQ:AAPL", side: "buy", type: "market", quantity: 1 }, 2_000); expect(first.order.status).toBe("filled"); expect(second.order.status).toBe("rejected"); expect(second.risk.reason).toBe("duplicate order id"); expect((await getPaperPortfolio("user-a")).ledger).toHaveLength(1);
  });
  it("limits audit reads and keeps them isolated by user", async () => {
    await submitPaperOrder("user-a", { id: "one", symbolId: "NASDAQ:AAPL", side: "buy", type: "market", quantity: 1 }, 1_000); await submitPaperOrder("user-a", { id: "two", symbolId: "NASDAQ:MSFT", side: "buy", type: "market", quantity: 1 }, 2_000); expect(await getPaperAudit("user-a", 2)).toHaveLength(2); expect(await getPaperAudit("user-b")).toEqual([]);
  });
  it("wraps accepted paper lifecycle mutations in repository transactions", async () => {
    const repository = createPaperRepository();
    const transactionSpy = vi.spyOn(repository, "runTransaction");
    const service = createPaperTradingService(repository);
    await service.submitPaperOrder("user-a", { id: "tx-order", symbolId: "NASDAQ:AAPL", side: "buy", type: "market", quantity: 1 }, 1_000);
    expect(transactionSpy).toHaveBeenCalledTimes(1);
    await service.submitPaperOrder("user-a", { id: "tx-limit", symbolId: "NASDAQ:AAPL", side: "buy", type: "limit", quantity: 1, limitPrice: 0.01 }, 2_000);
    await service.cancelPaperOrder("user-a", "tx-limit", 3_000);
    expect(transactionSpy).toHaveBeenCalledTimes(3);
  });
});
