import { describe, expect, it } from "vitest";
import { normalizeWorkspace } from "./workspace.js";

describe("web workspace normalization", () => {
  const fallback = {
    watchlist: ["NASDAQ:AAPL", "NASDAQ:MSFT"],
    activeSymbol: "NASDAQ:AAPL",
    interval: "1D",
  };

  it("removes invalid and duplicate symbols and preserves a valid active symbol", () => {
    expect(normalizeWorkspace({
      watchlist: ["NASDAQ:TSLA", "NASDAQ:TSLA", "bad", "BINANCE:BTCUSDT"],
      activeSymbol: "BINANCE:BTCUSDT",
      interval: "1H",
    }, fallback)).toEqual({
      watchlist: ["NASDAQ:TSLA", "BINANCE:BTCUSDT"],
      activeSymbol: "BINANCE:BTCUSDT",
      interval: "1H",
    });
  });

  it("falls back when active symbol or interval is invalid", () => {
    expect(normalizeWorkspace({ watchlist: ["NASDAQ:TSLA"], activeSymbol: "NASDAQ:AAPL", interval: "99m" }, fallback)).toEqual({
      watchlist: ["NASDAQ:TSLA"],
      activeSymbol: "NASDAQ:AAPL",
      interval: "1D",
    });
  });
});
