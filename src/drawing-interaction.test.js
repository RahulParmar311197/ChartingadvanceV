import { describe, expect, it, vi } from "vitest";
import { advanceDrawingDraft, createDrawingId, drawingPointFromCoordinates, drawingPointToCoordinates, drawingTypeForTool, hitTestDrawingPoint, moveDrawingPoint, shouldCommitDrawing } from "./drawing-interaction.js";

describe("drawing interaction primitives", () => {
  it("maps supported toolbar tools to domain drawing types", () => {
    expect(drawingTypeForTool("line")).toBe("line");
    expect(drawingTypeForTool("trend")).toBe("trendline");
    expect(drawingTypeForTool("crosshair")).toBeNull();
  });

  it("converts chart coordinates into a finite drawing point", () => {
    const chart = { timeScale: () => ({ coordinateToTime: vi.fn(() => 123) }) };
    const series = { coordinateToPrice: vi.fn(() => 456.5) };
    expect(drawingPointFromCoordinates(chart, series, 10, 20)).toEqual({ time: 123, price: 456.5 });
  });

  it("rejects incomplete coordinate conversion", () => {
    const chart = { timeScale: () => ({ coordinateToTime: () => null }) };
    const series = { coordinateToPrice: () => 456 };
    expect(drawingPointFromCoordinates(chart, series, 10, 20)).toBeNull();
  });

  it("maps a domain point back to chart coordinates", () => {
    const chart = { timeScale: () => ({ timeToCoordinate: vi.fn(() => 80) }) };
    const series = { priceToCoordinate: vi.fn(() => 40) };
    expect(drawingPointToCoordinates(chart, series, { time: 123, price: 456 })).toEqual({ x: 80, y: 40 });
  });

  it("hit-tests the nearest drawing endpoint within the configured radius", () => {
    const chart = { timeScale: () => ({ timeToCoordinate: (time) => time }) };
    const series = { priceToCoordinate: (price) => price };
    const drawing = { id: "d1", type: "line", points: [{ time: 20, price: 30 }, { time: 80, price: 40 }] };
    expect(hitTestDrawingPoint(chart, series, drawing, 22, 31, 5)).toBe(0);
    expect(hitTestDrawingPoint(chart, series, drawing, 50, 50, 5)).toBeNull();
  });

  it("moves one endpoint without mutating the original drawing", () => {
    const drawing = { id: "d1", type: "trendline", points: [{ time: 20, price: 30 }, { time: 80, price: 40 }] };
    const updated = moveDrawingPoint(drawing, 1, { time: 90, price: 45 });
    expect(updated.points).toEqual([{ time: 20, price: 30 }, { time: 90, price: 45 }]);
    expect(drawing.points[1]).toEqual({ time: 80, price: 40 });
  });

  it("builds a two-click draft and commits only after two points", () => {
    const first = { time: 100, price: 10 };
    const second = { time: 200, price: 12 };
    const draft = advanceDrawingDraft({ points: [] }, first);
    expect(draft.points).toEqual([first]);
    expect(shouldCommitDrawing(draft)).toBe(false);
    const complete = advanceDrawingDraft(draft, second);
    expect(complete.points).toEqual([first, second]);
    expect(shouldCommitDrawing(complete)).toBe(true);
  });

  it("creates uniquely shaped drawing ids", () => {
    const id = createDrawingId(123);
    expect(id).toMatch(/^drawing-123-/);
  });
});
