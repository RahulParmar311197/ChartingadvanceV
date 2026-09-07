import { describe, expect, it } from "vitest";
import { executeDemoScreener } from "./screener.js";

describe("demo fundamentals screener", () => {
  it("filters deterministically and exposes epoch-second freshness", async () => {
    const result = await executeDemoScreener({ query: { filters: [{ field: "revenueGrowth", operator: "gte", value: 0.1 }] }, limit: 10 }, 1725667200);
    expect(result.items.map(item => item.snapshot.symbolId)).toEqual(["NASDAQ:MSFT", "NASDAQ:NVDA"]);
    expect(result.freshness).toEqual({ asOf: 1725667200, staleAt: 1725753600, stale: false, status: "fresh" });
  });

  it("rejects invalid page sizes and cursors", async () => {
    await expect(executeDemoScreener({ limit: 101 })).rejects.toThrow("limit");
    await expect(executeDemoScreener({ cursor: "x".repeat(513) })).rejects.toThrow("cursor");
  });
});
