import { describe, expect, it } from "vitest";
import type { Drawing } from "./chart";
import { addDrawing, removeDrawing, setDrawingLocked, setDrawingVisibility, updateDrawing } from "./drawing-state";

const base: Drawing = {
  id: "d1",
  type: "trendline",
  points: [{ time: 100, price: 10 }, { time: 200, price: 20 }],
  visible: true,
  locked: false,
};

describe("drawing state", () => {
  it("adds drawings without mutating the input", () => {
    const state = [base];
    const next = addDrawing(state, { ...base, id: "d2" });
    expect(state).toHaveLength(1);
    expect(next.map((item) => item.id)).toEqual(["d1", "d2"]);
  });

  it("rejects duplicate ids and invalid points", () => {
    expect(() => addDrawing([], base)).not.toThrow();
    expect(() => addDrawing([base], base)).toThrow("Drawing already exists");
    expect(() => addDrawing([], { ...base, points: [{ time: Number.NaN, price: 10 }] })).toThrow("finite");
  });

  it("updates unlocked drawings immutably", () => {
    const state = [base];
    const next = updateDrawing(state, "d1", { points: [{ time: 300, price: 30 }] });
    expect(state[0].points).toHaveLength(2);
    expect(next[0].points).toEqual([{ time: 300, price: 30 }]);
  });

  it("does not change a locked drawing", () => {
    const locked = setDrawingLocked([base], "d1", true);
    const next = updateDrawing(locked, "d1", { points: [{ time: 300, price: 30 }] });
    expect(next[0].points).toEqual(base.points);
    expect(next).not.toBe(locked);
  });

  it("supports visibility, locking, and removal", () => {
    const hidden = setDrawingVisibility([base], "d1", false);
    const locked = setDrawingLocked(hidden, "d1", true);
    expect(locked[0]).toMatchObject({ visible: false, locked: true });
    expect(removeDrawing(locked, "d1")).toEqual([]);
  });
});
