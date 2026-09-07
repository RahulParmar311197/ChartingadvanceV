import { beforeEach, describe, expect, it } from "vitest";
import { getWorkspace, resetWorkspaceStore, saveWorkspace } from "./workspace.js";

describe("workspace state", () => {
  beforeEach(() => resetWorkspaceStore());

  it("creates a deterministic anonymous default", () => {
    expect(getWorkspace("test-user")).toEqual({
      watchlist: ["NASDAQ:AAPL", "NASDAQ:MSFT", "NASDAQ:NVDA"],
      activeSymbol: "NASDAQ:AAPL",
      interval: "1D",
    });
  });

  it("validates symbols, intervals and active-symbol membership", () => {
    expect(saveWorkspace("validation-user", {
      watchlist: ["NASDAQ:TSLA", "bad-symbol", 42, "NASDAQ:TSLA"],
      activeSymbol: "NASDAQ:AAPL",
      interval: "not-an-interval",
    })).toEqual({
      watchlist: ["NASDAQ:TSLA"],
      activeSymbol: "NASDAQ:TSLA",
      interval: "1D",
    });
  });

  it("returns copies so callers cannot mutate stored state", () => {
    const workspace = getWorkspace("copy-user");
    workspace.watchlist.push("NYSE:IBM");
    expect(getWorkspace("copy-user").watchlist).not.toContain("NYSE:IBM");
  });
});
