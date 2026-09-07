import { describe, expect, it } from "vitest";
import { createScreenerApplication } from "./screener-application.js";

function pagedProvider() {
  return {
    calls: [],
    async getFundamentals(request) {
      this.calls.push(request);
      const cursor = request.cursor;
      if (!cursor) return { items: [{ symbolId: "NASDAQ:AAPL", asOf: 1, marketCap: 10 }], asOf: 1, nextCursor: "provider-secret-page-2" };
      if (cursor === "provider-secret-page-2") return { items: [{ symbolId: "NASDAQ:MSFT", asOf: 1, marketCap: 9 }], asOf: 1 };
      throw new Error("unexpected provider cursor");
    },
  };
}

describe("screener application continuation boundary", () => {
  it("replaces provider cursors with one-time application tokens", async () => {
    const provider = pagedProvider();
    const app = createScreenerApplication({ provider, providerName: "test" });
    const first = await app.run({ ownerId: "user-a", symbols: ["NASDAQ:AAPL"] });
    expect(first.nextCursor).toBeTruthy();
    expect(first.nextCursor).not.toBe("provider-secret-page-2");

    const second = await app.run({ ownerId: "user-a", symbols: ["NASDAQ:AAPL"], cursor: first.nextCursor });
    expect(second.items[0].snapshot.symbolId).toBe("NASDAQ:MSFT");
    expect(provider.calls[1].cursor).toBe("provider-secret-page-2");

    await expect(app.run({ ownerId: "user-a", symbols: ["NASDAQ:AAPL"], cursor: first.nextCursor })).rejects.toThrow("invalid or expired screener cursor");
  });

  it("does not allow a continuation token to cross owners or request fingerprints", async () => {
    const app = createScreenerApplication({ provider: pagedProvider(), providerName: "test" });
    const first = await app.run({ ownerId: "user-a", symbols: ["NASDAQ:AAPL"] });
    await expect(app.run({ ownerId: "user-b", symbols: ["NASDAQ:AAPL"], cursor: first.nextCursor })).rejects.toThrow("invalid or expired screener cursor");
    await expect(app.run({ ownerId: "user-a", symbols: ["NASDAQ:MSFT"], cursor: first.nextCursor })).rejects.toThrow("invalid or expired screener cursor");
  });
});
