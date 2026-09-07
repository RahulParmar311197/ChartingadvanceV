import { describe, expect, it } from "vitest";
import { DeterministicDemoMarketDataProvider } from "./demo-provider";

describe("deterministic demo market data", () => {
  it("returns reproducible candles for identical requests", async () => {
    const provider = new DeterministicDemoMarketDataProvider();
    const request = {
      symbol: "NASDAQ:AAPL" as const,
      interval: "1D" as const,
      from: 1_700_000_000,
      to: 1_700_864_000,
    };

    const first = await provider.getHistoricalCandles(request);
    const second = await provider.getHistoricalCandles(request);

    expect(first).toEqual(second);
    expect(first.length).toBeGreaterThan(0);
    for (const candle of first) {
      expect(candle.high).toBeGreaterThanOrEqual(Math.max(candle.open, candle.close));
      expect(candle.low).toBeLessThanOrEqual(Math.min(candle.open, candle.close));
      expect(candle.volume).toBeGreaterThan(0);
    }
  });

  it("produces different deterministic series for different symbols", async () => {
    const provider = new DeterministicDemoMarketDataProvider();
    const request = {
      interval: "1D" as const,
      from: 1_700_000_000,
      to: 1_700_864_000,
    };
    const aapl = await provider.getHistoricalCandles({ ...request, symbol: "NASDAQ:AAPL" });
    const msft = await provider.getHistoricalCandles({ ...request, symbol: "NASDAQ:MSFT" });

    expect(aapl).not.toEqual(msft);
  });

  it("returns a quote with the requested symbol", async () => {
    const provider = new DeterministicDemoMarketDataProvider();
    const quote = await provider.getQuote("BINANCE:BTCUSDT");

    expect(quote.symbol).toBe("BINANCE:BTCUSDT");
    expect(Number.isFinite(quote.last)).toBe(true);
    expect(Number.isFinite(quote.changePercent)).toBe(true);
    expect(quote.timestamp).toBeGreaterThan(0);
  });
});
