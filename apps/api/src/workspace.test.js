import { describe, expect, it } from "vitest";
import { getWorkspace, saveWorkspace } from "./workspace.js";

describe("workspace state", () => {
  it("creates a deterministic anonymous default", () => {
    expect(getWorkspace("test-user")).toEqual({
      watchlist: ["NASDAQ:AAPL", "NASDAQ:MSFT", "NASDAQ:NVDA"],
      activeSymbol: "NASDAQ:AAPL",
      interval: "1D",
    });
  });

  it("validates persisted symbol values", () => {
    expect(saveWorkspace("validation-user", {
      watchlist: ["NASDAQ:TSLA", "bad-symbol", 42],
      activeSymbol: "NASDAQ:TSLA",
      interval: "1H",
    })).toEqual({
      watchlist: ["NASDAQ:TSLA"],
      activeSymbol: "NASDAQ:TSLA",
      interval: "1H",
    });
  });
});
