import { describe, expect, it, vi } from "vitest";
import { advanceDrawingDraft, createDrawingId, drawingPointFromCoordinates, drawingTypeForTool, shouldCommitDrawing } from "./drawing-interaction.js";

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
