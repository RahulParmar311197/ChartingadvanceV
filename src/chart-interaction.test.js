import { describe, expect, it } from "vitest";
import { clampVisibleBars, isSupportedInterval, nextInterval } from "./chart-interaction.js";

describe("chart interaction primitives", () => {
  it("cycles intervals in both directions", () => {
    expect(nextInterval("1D")).toBe("1W");
    expect(nextInterval("1D", -1)).toBe("4H");
    expect(nextInterval("1M")).toBe("1m");
  });

  it("normalizes an unknown interval to the first supported interval", () => {
    expect(nextInterval("2D")).toBe("1m");
    expect(isSupportedInterval("1H")).toBe(true);
    expect(isSupportedInterval("2H")).toBe(false);
  });

  it("clamps visible bars to safe chart bounds", () => {
    expect(clampVisibleBars(10)).toBe(40);
    expect(clampVisibleBars(120.7)).toBe(121);
    expect(clampVisibleBars(1000)).toBe(500);
    expect(clampVisibleBars(Number.NaN)).toBe(40);
  });
});
