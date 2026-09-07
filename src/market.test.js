import { describe, expect, it, vi, afterEach } from "vitest";
import { fetchQuote, formatQuoteValue } from "./market.js";

describe("market client", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("requests a quote from the application API and returns normalized data", async () => {
    const fetcher = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ data: { symbol: "NASDAQ:AAPL", last: 123.45, changePercent: 1.2 } }) });
    vi.stubGlobal("fetch", fetcher);
    await expect(fetchQuote("NASDAQ:AAPL", "http://localhost:8787")).resolves.toEqual({ symbol: "NASDAQ:AAPL", last: 123.45, changePercent: 1.2 });
    expect(fetcher).toHaveBeenCalledWith("http://localhost:8787/v1/market/quote?symbol=NASDAQ%3AAAPL");
  });

  it("fails loudly on upstream API errors", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false, status: 503 }));
    await expect(fetchQuote("NASDAQ:AAPL", "http://localhost:8787")).rejects.toThrow("Market API returned 503");
  });

  it("formats quote magnitudes consistently", () => {
    expect(formatQuoteValue(1234.567)).toBe("1,234.57");
    expect(formatQuoteValue(12.3456)).toBe("12.35");
    expect(formatQuoteValue(1.23456)).toBe("1.2346");
    expect(formatQuoteValue(Number.NaN)).toBe("—");
  });
});
