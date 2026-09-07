import { afterEach, describe, expect, it } from "vitest";
import { cancelPaperOrder, getPaperAudit, getPaperPortfolio, replacePaperOrder, resetPaperTradingStore, submitPaperOrder } from "./paper-trading.js";

afterEach(() => resetPaperTradingStore());

describe("paper trading application service", () => {
  it("fills a valid market order and updates the portfolio ledger", () => {
    const result = submitPaperOrder("user-a", {
      id: "order-1",
      symbolId: "NASDAQ:AAPL",
      side: "buy",
      type: "market",
      quantity: 10,
    }, 1_000);

    expect(result.simulated).toBe(true);
    expect(result.order.status).toBe("filled");
    expect(result.fill).toMatchObject({ orderId: "order-1", quantity: 10, timestamp: 1_000 });
    expect(result.portfolio.positions).toHaveLength(1);
    expect(result.portfolio.positions[0].quantity).toBe(10);
    expect(result.portfolio.ledger).toHaveLength(1);
    expect(result.portfolio.account.cash).toBeLessThan(100_000);
  });

  it("keeps paper accounts isolated by user", () => {
    submitPaperOrder("user-a", { id: "order-a", symbolId: "NASDAQ:AAPL", side: "buy", type: "market", quantity: 1 }, 1_000);
    const other = getPaperPortfolio("user-b");

    expect(other.positions).toEqual([]);
    expect(other.account.cash).toBe(100_000);
  });

  it("rejects orders that exceed the demo risk limit without mutating the portfolio", () => {
    const result = submitPaperOrder("user-a", { id: "large", symbolId: "NASDAQ:AAPL", side: "buy", type: "market", quantity: 10_001 }, 1_000);

    expect(result.order.status).toBe("rejected");
    expect(result.fill).toBeNull();
    expect(result.risk.allowed).toBe(false);
    expect(result.portfolio.positions).toEqual([]);
    expect(result.portfolio.ledger).toEqual([]);
  });

  it("blocks short selling in the paper application by default", () => {
    const result = submitPaperOrder("user-a", { id: "short", symbolId: "NASDAQ:AAPL", side: "sell", type: "market", quantity: 1 }, 1_000);

    expect(result.order.status).toBe("rejected");
    expect(result.risk.reason).toBe("short positions are disabled");
  });

  it("does not fill an untriggered limit order", () => {
    const result = submitPaperOrder("user-a", { id: "limit", symbolId: "NASDAQ:AAPL", side: "buy", type: "limit", quantity: 1, limitPrice: 0.01 }, 1_000);

    expect(result.order.status).toBe("accepted");
    expect(result.fill).toBeNull();
    expect(result.reason).toBe("order conditions not met");
    expect(getPaperPortfolio("user-a").ledger).toEqual([]);
  });

  it("cancels an accepted untriggered order and records an audit event", () => {
    submitPaperOrder("user-a", { id: "cancel-me", symbolId: "NASDAQ:AAPL", side: "buy", type: "limit", quantity: 1, limitPrice: 0.01 }, 1_000);
    const result = cancelPaperOrder("user-a", "cancel-me", 2_000);

    expect(result.cancelled).toBe(true);
    expect(result.order.status).toBe("cancelled");
    expect(getPaperAudit("user-a").map((event) => event.action)).toEqual([
      "order_submitted", "order_accepted", "order_cancelled",
    ]);
  });

  it("rejects cancellation of a filled order without mutating the fill", () => {
    submitPaperOrder("user-a", { id: "filled", symbolId: "NASDAQ:AAPL", side: "buy", type: "market", quantity: 1 }, 1_000);
    expect(() => cancelPaperOrder("user-a", "filled", 2_000)).toThrow("order is terminal: filled");
    expect(getPaperPortfolio("user-a").ledger).toHaveLength(1);
  });

  it("replaces an accepted order with a new client order id", () => {
    submitPaperOrder("user-a", { id: "old", symbolId: "NASDAQ:AAPL", side: "buy", type: "limit", quantity: 1, limitPrice: 0.01 }, 1_000);
    const result = replacePaperOrder("user-a", "old", { id: "new", limitPrice: 0.02, quantity: 2 }, 2_000);

    expect(result.replaced).toBe(true);
    expect(result.order.status).toBe("cancelled");
    expect(result.replacement).toMatchObject({ id: "new", status: "accepted", quantity: 2, limitPrice: 0.02 });
    expect(getPaperAudit("user-a").map((event) => event.action)).toEqual([
      "order_submitted", "order_accepted", "order_cancelled", "order_replaced",
    ]);
  });

  it("prevents replacing a filled order and preserves account state", () => {
    submitPaperOrder("user-a", { id: "filled", symbolId: "NASDAQ:AAPL", side: "buy", type: "market", quantity: 1 }, 1_000);
    expect(() => replacePaperOrder("user-a", "filled", { id: "new" }, 2_000)).toThrow("only accepted orders can be replaced");
    expect(getPaperPortfolio("user-a").positions[0].quantity).toBe(1);
  });

  it("rejects duplicate client order ids without creating a second fill", () => {
    const first = submitPaperOrder("user-a", { id: "duplicate", symbolId: "NASDAQ:AAPL", side: "buy", type: "market", quantity: 1 }, 1_000);
    const second = submitPaperOrder("user-a", { id: "duplicate", symbolId: "NASDAQ:AAPL", side: "buy", type: "market", quantity: 1 }, 2_000);

    expect(first.order.status).toBe("filled");
    expect(second.order.status).toBe("rejected");
    expect(second.risk.reason).toBe("duplicate order id");
    expect(getPaperPortfolio("user-a").ledger).toHaveLength(1);
  });

  it("limits audit reads and keeps them isolated by user", () => {
    submitPaperOrder("user-a", { id: "one", symbolId: "NASDAQ:AAPL", side: "buy", type: "market", quantity: 1 }, 1_000);
    submitPaperOrder("user-a", { id: "two", symbolId: "NASDAQ:MSFT", side: "buy", type: "market", quantity: 1 }, 2_000);

    expect(getPaperAudit("user-a", 2)).toHaveLength(2);
    expect(getPaperAudit("user-b")).toEqual([]);
  });
});
