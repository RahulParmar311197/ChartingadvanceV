const DRAWING_TOOLS = new Set(["line", "trend"]);
const DEFAULT_HIT_RADIUS = 10;

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

export function drawingPointToCoordinates(chart, priceSeries, point) {
  const x = chart?.timeScale?.().timeToCoordinate?.(point?.time);
  const y = priceSeries?.priceToCoordinate?.(point?.price);
  if (!Number.isFinite(x) || !Number.isFinite(y)) return null;
  return { x, y };
}

export function hitTestDrawingPoint(chart, priceSeries, drawing, x, y, radius = DEFAULT_HIT_RADIUS) {
  if (!drawing?.points?.length || !Number.isFinite(x) || !Number.isFinite(y)) return null;
  const safeRadius = Number.isFinite(radius) && radius > 0 ? radius : DEFAULT_HIT_RADIUS;
  let bestIndex = -1;
  let bestDistance = safeRadius;
  drawing.points.forEach((point, index) => {
    const coordinates = drawingPointToCoordinates(chart, priceSeries, point);
    if (!coordinates) return;
    const distance = Math.hypot(coordinates.x - x, coordinates.y - y);
    if (distance <= bestDistance) {
      bestDistance = distance;
      bestIndex = index;
    }
  });
  return bestIndex >= 0 ? bestIndex : null;
}

export function moveDrawingPoint(drawing, pointIndex, point) {
  if (!drawing?.points?.length || !Number.isInteger(pointIndex) || pointIndex < 0 || pointIndex >= drawing.points.length) return drawing;
  if (!point || !Number.isFinite(point.time) || !Number.isFinite(point.price)) return drawing;
  return {
    ...drawing,
    points: drawing.points.map((current, index) => index === pointIndex ? { time: point.time, price: point.price } : { time: current.time, price: current.price }),
  };
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
