import { afterEach, describe, expect, it, vi } from "vitest";
import { createScreenerPager, runFundamentalsScreener } from "./screener";

afterEach(() => vi.restoreAllMocks());

const page = (nextCursor?: string) => ({
  data: {
    items: [{ snapshot: { symbolId: "NYSE:AAA", asOf: 100, revenueGrowth: 0.2 }, score: 0.2 }],
    ...(nextCursor ? { nextCursor } : {}),
    freshness: { asOf: 100, staleAt: 200, stale: false, status: "fresh" as const },
    completeness: nextCursor
      ? { status: "partial" as const, reason: "provider-pagination" as const }
      : { status: "complete" as const, reason: "provider-exhausted" as const },
  },
  meta: { provider: "demo", simulated: true },
});

describe("browser screener client", () => {
  it("encodes filters, symbols, limit and cursor in the application request", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response(JSON.stringify(page("page:2")), { status: 200 }));

    const result = await runFundamentalsScreener({
      symbols: ["NYSE:AAA", "NASDAQ:BBB"],
      query: { filters: [{ field: "revenueGrowth", operator: "gte", value: 0.1 }] },
      limit: 10,
      cursor: "page:1",
    }, "http://example.test");

    const url = new URL(fetchMock.mock.calls[0][0] as string);
    expect(url.pathname).toBe("/v1/screener/fundamentals");
    expect(url.searchParams.getAll("symbol")).toEqual(["NYSE:AAA", "NASDAQ:BBB"]);
    expect(url.searchParams.get("limit")).toBe("10");
    expect(url.searchParams.get("cursor")).toBe("page:1");
    expect(JSON.parse(url.searchParams.get("query")!)).toEqual({ filters: [{ field: "revenueGrowth", operator: "gte", value: 0.1 }] });
    expect(result.data.nextCursor).toBe("page:2");
  });

  it("accumulates pages and advances the application cursor", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(new Response(JSON.stringify(page("page:2")), { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify(page()), { status: 200 }));

    const pager = createScreenerPager({ limit: 1 }, "http://example.test");
    const first = await pager.loadNext();
    const second = await pager.loadNext();

    expect(first.items).toHaveLength(1);
    expect(second.items).toHaveLength(2);
    expect(second.nextCursor).toBeUndefined();
    expect(second.completeness).toEqual({ status: "complete", reason: "provider-exhausted" });
    expect(new URL(fetchMock.mock.calls[1][0] as string).searchParams.get("cursor")).toBe("page:2");
  });

  it("does not permit a repeated continuation cursor", async () => {
    vi.spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(new Response(JSON.stringify(page("page:2")), { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify(page("page:2")), { status: 200 }));

    const pager = createScreenerPager({}, "http://example.test");
    await pager.loadNext();
    await expect(pager.loadNext()).rejects.toThrow("Screener pagination cursor did not advance");
    expect(pager.getState().loading).toBe(false);
  });

  it("resets accumulated rows and cursor", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response(JSON.stringify(page("page:2")), { status: 200 }));
    const pager = createScreenerPager({}, "http://example.test");
    await pager.loadNext();
    pager.reset();
    expect(pager.getState()).toMatchObject({ items: [], nextCursor: undefined, loading: false });
  });
});
