const rangeListeners = new Map();
const crosshairListeners = new Map();

export function rangesEqual(a, b, epsilon = 0.01) {
  return Boolean(a && b && Math.abs(a.from - b.from) <= epsilon && Math.abs(a.to - b.to) <= epsilon);
}

export function syncLogicalRange(source, target, lastRange = null) {
  const range = source?.timeScale?.().getVisibleLogicalRange?.();
  if (!range || rangesEqual(range, lastRange)) return lastRange;
  target?.timeScale?.().setVisibleLogicalRange?.(range);
  return { from: range.from, to: range.to };
}

export function publishChartRange(channel, range) {
  if (!range) return;
  (rangeListeners.get(channel) ?? []).forEach((listener) => listener({ from: range.from, to: range.to }));
}

export function subscribeChartRange(channel, listener) {
  const current = rangeListeners.get(channel) ?? [];
  current.push(listener);
  rangeListeners.set(channel, current);
  return () => {
    const next = (rangeListeners.get(channel) ?? []).filter((item) => item !== listener);
    if (next.length) rangeListeners.set(channel, next); else rangeListeners.delete(channel);
  };
}

export function publishChartCrosshair(channel, payload) {
  if (!payload) return;
  (crosshairListeners.get(channel) ?? []).forEach((listener) => listener({ ...payload }));
}

export function subscribeChartCrosshair(channel, listener) {
  const current = crosshairListeners.get(channel) ?? [];
  current.push(listener);
  crosshairListeners.set(channel, current);
  return () => {
    const next = (crosshairListeners.get(channel) ?? []).filter((item) => item !== listener);
    if (next.length) crosshairListeners.set(channel, next); else crosshairListeners.delete(channel);
  };
}
