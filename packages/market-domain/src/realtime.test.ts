import { describe, expect, it } from "vitest";
import type { Quote } from "./index";
import { isNewerMarketEvent, type QuoteEvent } from "./realtime";

describe("market realtime contracts", () => {
  it("accepts only strictly newer event sequences", () => {
    const quote: Quote = {
      symbol: "NASDAQ:AAPL",
      last: 100,
      change: 1,
      changePercent: 1,
      timestamp: 1_700_000_000_000,
    };
    const event: QuoteEvent = {
      type: "quote",
      sequence: 12,
      timestamp: quote.timestamp,
      quote,
    };

    expect(isNewerMarketEvent(11, event)).toBe(true);
    expect(isNewerMarketEvent(12, event)).toBe(false);
    expect(isNewerMarketEvent(13, event)).toBe(false);
  });
});
