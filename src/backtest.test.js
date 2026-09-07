import { describe, expect, it, vi } from "vitest";
import { runBacktestRequest } from "./backtest.js";

describe("backtest browser client", () => {
  it("posts the deterministic strategy request and returns API data", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response(JSON.stringify({ data: { finalEquity: 1008 } }), { status: 200, headers: { "content-type": "application/json" } }));
    await expect(runBacktestRequest("http://api.test", { strategy: "buy-and-hold", candles: [{ time: 1 }] })).resolves.toMatchObject({ data: { finalEquity: 1008 } });
    expect(fetchMock).toHaveBeenCalledWith("http://api.test/v1/backtest", expect.objectContaining({ method: "POST", headers: { "content-type": "application/json" } }));
    fetchMock.mockRestore();
  });

  it("surfaces structured API errors", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response(JSON.stringify({ error: { message: "unsupported strategy" } }), { status: 400 }));
    await expect(runBacktestRequest("http://api.test/", { strategy: "bad" })).rejects.toThrow("unsupported strategy");
    fetchMock.mockRestore();
  });
});
