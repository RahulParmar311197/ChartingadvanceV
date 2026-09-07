import { describe, expect, it } from "vitest";
import { parseFiniteNumber, parseScreenerRequest, validateCandleRequest, validSymbol } from "./validation.js";

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

  it("parses the full screener query contract", () => {
    expect(parseScreenerRequest({
      symbols: ["NASDAQ:AAPL"],
      query: { filters: [{ field: "revenueGrowth", operator: "gte", value: 0.1 }] },
      groups: [{ logic: "or", filters: [{ field: "peRatio", operator: "lt", value: 20 }] }],
      limit: 25,
      cursor: "page-1",
    })).toEqual({
      symbols: ["NASDAQ:AAPL"],
      query: {
        filters: [{ field: "revenueGrowth", operator: "gte", value: 0.1 }],
        groups: [{ logic: "or", filters: [{ field: "peRatio", operator: "lt", value: 20 }] }],
      },
      limit: 25,
      cursor: "page-1",
    });
  });

  it("rejects malformed screener fields, groups, symbols, and limits", () => {
    expect(() => parseScreenerRequest({ filters: [{ field: "unknown", operator: "gt", value: 1 }] })).toThrow("field");
    expect(() => parseScreenerRequest({ groups: [{ logic: "xor", filters: [] }] })).toThrow("logic");
    expect(() => parseScreenerRequest({ symbols: ["AAPL"] })).toThrow("EXCHANGE:TICKER");
    expect(() => parseScreenerRequest({ limit: 101 })).toThrow("limit");
    expect(() => parseScreenerRequest({ filters: [{ field: "peRatio", operator: "between", value: 20, upperValue: 10 }] })).toThrow("upperValue");
  });
});
