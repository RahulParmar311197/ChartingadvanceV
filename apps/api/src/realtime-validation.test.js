import { describe, expect, it } from "vitest";
import { normalizeSubscription } from "./realtime-validation.js";

describe("normalizeSubscription", () => {
  it("rejects malformed subscription messages", () => {
    expect(normalizeSubscription(null)).toBeNull();
    expect(normalizeSubscription({ type: "subscribe" })).toBeNull();
    expect(normalizeSubscription({ type: "quote", symbols: ["NASDAQ:AAPL"] })).toBeNull();
  });

  it("filters invalid symbols and removes duplicates", () => {
    expect(normalizeSubscription({
      type: "subscribe",
      symbols: ["NASDAQ:AAPL", "bad symbol", "NASDAQ:AAPL", "BINANCE:BTCUSDT"],
    })).toEqual(["NASDAQ:AAPL", "BINANCE:BTCUSDT"]);
  });

  it("bounds subscriptions to 50 symbols", () => {
    const symbols = Array.from({ length: 60 }, (_, index) => `NASDAQ:T${index}`);
    expect(normalizeSubscription({ type: "subscribe", symbols })).toHaveLength(50);
    expect(normalizeSubscription({ type: "subscribe", symbols })?.at(-1)).toBe("NASDAQ:T49");
  });
});
