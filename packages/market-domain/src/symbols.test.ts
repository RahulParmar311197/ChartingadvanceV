import { describe, expect, it } from "vitest";
import { findSymbol, listSymbols } from "./symbols";

describe("symbol registry", () => {
  it("returns normalized symbols", () => {
    const symbols = listSymbols();
    expect(symbols.length).toBeGreaterThanOrEqual(6);
    expect(symbols.every((symbol) => symbol.id.includes(":"))).toBe(true);
  });

  it("resolves known symbols and rejects unknown ones", () => {
    expect(findSymbol("NASDAQ:AAPL")?.ticker).toBe("AAPL");
    expect(findSymbol("UNKNOWN:THING")).toBeUndefined();
  });
});
