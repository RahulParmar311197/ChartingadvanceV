import { describe, expect, it } from "vitest";
import { parseFiniteNumber, validateCandleRequest, validSymbol } from "./validation.js";

describe("market request validation", () => {
  it("accepts EXCHANGE:TICKER symbols", () => {
    expect(validSymbol("NASDAQ:AAPL")).toBe(true);
    expect(validSymbol("BINANCE:BTCUSDT")).toBe(true);
    expect(validSymbol("AAPL")).toBe(false);
    expect(validSymbol("NASDAQ: AAPL")).toBe(false);
  });

  it("parses only finite numbers", () => {
    expect(parseFiniteNumber("123.5")).toBe(123.5);
    expect(parseFiniteNumber("Infinity")).toBeNull();
    expect(parseFiniteNumber("not-a-number")).toBeNull();
  });

  it("validates interval and ordered Unix-second range", () => {
    expect(validateCandleRequest({ symbol: "NASDAQ:AAPL", interval: "1D", from: "100", to: "200" })).toEqual({ ok: true, symbol: "NASDAQ:AAPL", interval: "1D", from: 100, to: 200 });
    expect(validateCandleRequest({ symbol: "NASDAQ:AAPL", interval: "2D", from: "100", to: "200" })).toEqual({ ok: false, code: "INVALID_INTERVAL" });
    expect(validateCandleRequest({ symbol: "NASDAQ:AAPL", interval: "1D", from: "200", to: "100" })).toEqual({ ok: false, code: "INVALID_RANGE" });
  });
});
