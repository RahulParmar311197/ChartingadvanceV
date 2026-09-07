import { describe, expect, it } from "vitest";
import { clampVisibleBars, panViewport, zoomVisibleBars } from "./viewport";

describe("chart viewport", () => {
  it("clamps visible bars to safe bounds", () => {
    expect(clampVisibleBars(1)).toBe(20);
    expect(clampVisibleBars(99999)).toBe(5000);
    expect(clampVisibleBars(Number.NaN)).toBe(20);
  });

  it("zooms while preserving bounded state", () => {
    expect(zoomVisibleBars(100, 0.5)).toBe(50);
    expect(zoomVisibleBars(100, 2)).toBe(200);
    expect(() => zoomVisibleBars(100, 0)).toThrow(RangeError);
  });

  it("pans without allowing the viewport outside the dataset", () => {
    expect(panViewport({ start: 10, end: 110 }, 20, 200)).toEqual({ start: 30, end: 130 });
    expect(panViewport({ start: 10, end: 110 }, -1000, 200)).toEqual({ start: 0, end: 100 });
    expect(panViewport({ start: 100, end: 200 }, 1000, 200)).toEqual({ start: 100, end: 200 });
  });

  it("rejects invalid dataset sizes", () => {
    expect(() => panViewport({ start: 0, end: 20 }, 1, 0)).toThrow(RangeError);
  });
});
