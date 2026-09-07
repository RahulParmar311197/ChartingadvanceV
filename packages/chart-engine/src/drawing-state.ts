import type { Drawing, DrawingPoint } from "./chart";

export type DrawingState = ReadonlyArray<Drawing>;

const DRAWING_TYPES = new Set<Drawing["type"]>([
  "line",
  "ray",
  "trendline",
  "horizontal",
  "vertical",
  "text",
]);

function clonePoint(point: DrawingPoint): DrawingPoint {
  return { time: point.time, price: point.price };
}

function cloneDrawing(drawing: Drawing): Drawing {
  return {
    ...drawing,
    points: drawing.points.map(clonePoint),
  };
}

function assertPoint(point: DrawingPoint): void {
  if (!Number.isFinite(point.time) || !Number.isFinite(point.price)) {
    throw new Error("Drawing points require finite time and price values");
  }
}

function assertDrawing(drawing: Drawing): void {
  if (typeof drawing.id !== "string" || !drawing.id.trim()) throw new Error("Drawing id is required");
  if (!DRAWING_TYPES.has(drawing.type)) throw new Error(`Unsupported drawing type: ${drawing.type}`);
  if (!Array.isArray(drawing.points) || drawing.points.length === 0) throw new Error("Drawing requires at least one point");
  drawing.points.forEach(assertPoint);
}

export function addDrawing(state: DrawingState, drawing: Drawing): DrawingState {
  assertDrawing(drawing);
  if (state.some((item) => item.id === drawing.id)) throw new Error(`Drawing already exists: ${drawing.id}`);
  return [...state.map(cloneDrawing), cloneDrawing(drawing)];
}

export function updateDrawing(state: DrawingState, id: string, patch: Partial<Omit<Drawing, "id">>): DrawingState {
  const existing = state.find((item) => item.id === id);
  if (!existing) throw new Error(`Drawing not found: ${id}`);
  if (existing.locked) return state.map(cloneDrawing);
  const updated = { ...existing, ...patch, id, points: patch.points ? patch.points.map(clonePoint) : existing.points.map(clonePoint) };
  assertDrawing(updated);
  return state.map((item) => item.id === id ? cloneDrawing(updated) : cloneDrawing(item));
}

export function removeDrawing(state: DrawingState, id: string): DrawingState {
  return state.filter((item) => item.id !== id).map(cloneDrawing);
}

export function setDrawingVisibility(state: DrawingState, id: string, visible: boolean): DrawingState {
  return state.map((item) => item.id === id ? { ...cloneDrawing(item), visible } : cloneDrawing(item));
}

export function setDrawingLocked(state: DrawingState, id: string, locked: boolean): DrawingState {
  return state.map((item) => item.id === id ? { ...cloneDrawing(item), locked } : cloneDrawing(item));
}
