import { afterEach, describe, expect, it } from "vitest";
import { getPaperPortfolio, resetPaperTradingStore, submitPaperOrder } from "./paper-trading.js";

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

  it("rejects duplicate client order ids without creating a second fill", () => {
    const first = submitPaperOrder("user-a", { id: "duplicate", symbolId: "NASDAQ:AAPL", side: "buy", type: "market", quantity: 1 }, 1_000);
    const second = submitPaperOrder("user-a", { id: "duplicate", symbolId: "NASDAQ:AAPL", side: "buy", type: "market", quantity: 1 }, 2_000);

    expect(first.order.status).toBe("filled");
    expect(second.order.status).toBe("rejected");
    expect(second.risk.reason).toBe("duplicate order id");
    expect(getPaperPortfolio("user-a").ledger).toHaveLength(1);
  });
});
