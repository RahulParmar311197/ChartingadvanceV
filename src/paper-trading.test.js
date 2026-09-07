import { afterEach, describe, expect, it, vi } from "vitest";
import { cancelPaperOrder, fetchPaperAudit, fetchPaperPortfolio, replacePaperOrder, submitPaperOrder } from "./paper-trading.js";

afterEach(() => vi.restoreAllMocks());

describe("paper trading browser client", () => {
  it("requires an API URL instead of silently simulating orders", async () => {
    await expect(fetchPaperPortfolio("")).rejects.toThrow("Paper trading API is not configured");
  });

  it("sends the demo identity and normalized JSON order", async () => {
    const response = { ok: true, json: vi.fn().mockResolvedValue({ data: { order: { status: "filled" } } }) };
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(response);
    await submitPaperOrder({ symbolId: "NASDAQ:AAPL", side: "buy", type: "market", quantity: 2 }, "http://api.test", "user-a");
    expect(fetchMock).toHaveBeenCalledWith("http://api.test/v1/paper/orders", expect.objectContaining({ method: "POST", body: JSON.stringify({ symbolId: "NASDAQ:AAPL", side: "buy", type: "market", quantity: 2 }) }));
    expect(fetchMock.mock.calls[0][1].headers).toMatchObject({ "x-demo-user-id": "user-a", "content-type": "application/json" });
  });

  it("serializes lifecycle endpoints with the demo identity", async () => {
    const response = { ok: true, json: vi.fn().mockResolvedValue({ data: {} }) };
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(response);
    await cancelPaperOrder("order/1", "http://api.test", "user-a");
    await replacePaperOrder("order/1", { quantity: 2 }, "http://api.test", "user-a");
    await fetchPaperAudit("http://api.test", "user-a", 25);
    expect(fetchMock.mock.calls.map(([url, options]) => [url, options.method, options.headers["x-demo-user-id"]])).toEqual([
      ["http://api.test/v1/paper/orders/order%2F1", "DELETE", "user-a"],
      ["http://api.test/v1/paper/orders/order%2F1", "PUT", "user-a"],
      ["http://api.test/v1/paper/audit?limit=25", undefined, "user-a"],
    ]);
  });

  it("surfaces API errors to the panel", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue({ ok: false, status: 422, json: vi.fn().mockResolvedValue({ error: { message: "order is terminal: filled" } }) });
    await expect(cancelPaperOrder("filled", "http://api.test")).rejects.toThrow("order is terminal: filled");
  });
});
