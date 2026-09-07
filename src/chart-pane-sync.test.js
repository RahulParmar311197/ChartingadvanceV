import { describe, expect, it, vi } from "vitest";
import { rangesEqual, syncLogicalRange } from "./chart-pane-sync.js";

function chartWithRange(range) {
  return { timeScale: () => ({ getVisibleLogicalRange: () => range }) };
}

describe("chart pane synchronization", () => {
  it("compares logical ranges with a small tolerance", () => {
    expect(rangesEqual({ from: 1, to: 100 }, { from: 1.005, to: 99.996 })).toBe(true);
    expect(rangesEqual({ from: 1, to: 100 }, { from: 2, to: 100 })).toBe(false);
  });

  it("copies a changed source range to the secondary pane", () => {
    const setVisibleLogicalRange = vi.fn();
    const source = chartWithRange({ from: 20, to: 119 });
    const target = { timeScale: () => ({ setVisibleLogicalRange }) };
    const next = syncLogicalRange(source, target);
    expect(setVisibleLogicalRange).toHaveBeenCalledWith({ from: 20, to: 119 });
    expect(next).toEqual({ from: 20, to: 119 });
  });

  it("does not reapply an unchanged range", () => {
    const setVisibleLogicalRange = vi.fn();
    const range = { from: 20, to: 119 };
    const source = chartWithRange(range);
    const target = { timeScale: () => ({ setVisibleLogicalRange }) };
    expect(syncLogicalRange(source, target, range)).toEqual(range);
    expect(setVisibleLogicalRange).not.toHaveBeenCalled();
  });
});
