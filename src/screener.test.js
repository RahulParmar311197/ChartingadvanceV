import { describe, expect, it, vi } from "vitest";
import { createFundamentalFilter, fetchFundamentals, validateScreenerFilter } from "./screener.js";

describe("browser screener client", () => {
  it("creates between filters without losing the upper bound", () => {
    expect(createFundamentalFilter("peRatio", "between", 10)).toEqual({ field: "peRatio", operator: "between", value: 10, upperValue: 10 });
  });

  it("rejects unsupported filters before a network call", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch");
    await expect(fetchFundamentals({ apiUrl: "http://localhost:8787", filters: [{ field: "bad", operator: "gt", value: 1 }] })).rejects.toThrow("field");
    expect(fetchSpy).not.toHaveBeenCalled();
    fetchSpy.mockRestore();
  });

  it("serializes the application query and maps API errors", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response(JSON.stringify({ data: { items: [], freshness: { asOf: 1, stale: true } } }), { status: 200, headers: { "content-type": "application/json" } }));
    await fetchFundamentals({ apiUrl: "http://localhost:8787", filters: [createFundamentalFilter("revenueGrowth", "gte", 0.1)], limit: 10 });
    const requestUrl = new URL(fetchSpy.mock.calls[0][0]);
    const query = JSON.parse(requestUrl.searchParams.get("query"));
    expect(query.filters[0]).toEqual({ field: "revenueGrowth", operator: "gte", value: 0.1 });
    expect(requestUrl.searchParams.get("limit")).toBe("10");
    fetchSpy.mockRestore();
  });

  it("validates between bounds consistently", () => {
    expect(() => validateScreenerFilter({ field: "peRatio", operator: "between", value: 20, upperValue: 10 })).toThrow("upperValue");
  });
});
