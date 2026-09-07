import { describe, expect, it } from "vitest";
import { drawingPointsForSeries } from "./drawing-series.js";

describe("drawingPointsForSeries", () => {
  it("maps prices to Lightweight Charts values", () => {
    expect(drawingPointsForSeries({ points: [{ time: 10, price: 101 }] })).toEqual([{ time: 10, value: 101 }]);
  });

  it("sorts a reversed two-point drawing without mutating it", () => {
    const points = [{ time: 20, price: 102 }, { time: 10, price: 100 }];
    const drawing = { points };
    expect(drawingPointsForSeries(drawing)).toEqual([{ time: 10, value: 100 }, { time: 20, value: 102 }]);
    expect(drawing.points).toBe(points);
    expect(drawing.points).toEqual(points);
  });

  it("returns an empty series for missing points", () => {
    expect(drawingPointsForSeries({})).toEqual([]);
  });
});
