const DRAWING_TOOLS = new Set(["line", "trend"]);

export function drawingTypeForTool(tool) {
  if (!DRAWING_TOOLS.has(tool)) return null;
  return tool === "trend" ? "trendline" : "line";
}

export function drawingPointFromCoordinates(chart, priceSeries, x, y) {
  const time = chart?.timeScale?.().coordinateToTime?.(x);
  const price = priceSeries?.coordinateToPrice?.(y);
  if (time == null || !Number.isFinite(price)) return null;
  const numericTime = typeof time === "number" ? time : Number(time);
  if (!Number.isFinite(numericTime)) return null;
  return { time: numericTime, price };
}

export function advanceDrawingDraft(draft, point) {
  if (!point || !Number.isFinite(point.time) || !Number.isFinite(point.price)) return { points: [] };
  if (!draft?.points?.length) return { points: [point] };
  return { points: [...draft.points, point] };
}

export function shouldCommitDrawing(draft) {
  return Array.isArray(draft?.points) && draft.points.length >= 2;
}

export function createDrawingId(sequence = Date.now()) {
  return `drawing-${sequence}-${Math.random().toString(36).slice(2, 8)}`;
}
