export const CHART_INTERVALS = ["1m", "5m", "15m", "1H", "4H", "1D", "1W", "1M"];

export function nextInterval(current, direction = 1) {
  const index = CHART_INTERVALS.indexOf(current);
  if (index === -1) return CHART_INTERVALS[0];
  const step = direction < 0 ? -1 : 1;
  return CHART_INTERVALS[(index + step + CHART_INTERVALS.length) % CHART_INTERVALS.length];
}

export function clampVisibleBars(value, minimum = 40, maximum = 500) {
  if (!Number.isFinite(value)) return minimum;
  return Math.min(maximum, Math.max(minimum, Math.round(value)));
}

export function isSupportedInterval(interval) {
  return CHART_INTERVALS.includes(interval);
}
