export interface ViewportWindow {
  start: number;
  end: number;
}

export const MIN_VISIBLE_BARS = 20;
export const MAX_VISIBLE_BARS = 5000;

export function clampVisibleBars(value: number, min = MIN_VISIBLE_BARS, max = MAX_VISIBLE_BARS): number {
  if (!Number.isFinite(value)) return min;
  if (!Number.isFinite(min) || !Number.isFinite(max) || min < 1 || max < min) {
    throw new RangeError("Invalid viewport bounds");
  }
  return Math.min(max, Math.max(min, Math.round(value)));
}

export function zoomVisibleBars(current: number, factor: number): number {
  if (!Number.isFinite(factor) || factor <= 0) throw new RangeError("Zoom factor must be positive");
  return clampVisibleBars(current * factor);
}

export function panViewport(window: ViewportWindow, deltaBars: number, totalBars: number): ViewportWindow {
  if (!Number.isInteger(totalBars) || totalBars < 1) throw new RangeError("Total bars must be a positive integer");
  const size = Math.min(totalBars, Math.max(1, window.end - window.start));
  const maxStart = Math.max(0, totalBars - size);
  const start = Math.min(maxStart, Math.max(0, Math.round(window.start + deltaBars)));
  return { start, end: start + size };
}
