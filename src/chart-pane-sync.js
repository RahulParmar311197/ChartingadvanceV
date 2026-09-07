const listeners = new Map();

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
  (listeners.get(channel) ?? []).forEach((listener) => listener({ from: range.from, to: range.to }));
}

export function subscribeChartRange(channel, listener) {
  const current = listeners.get(channel) ?? [];
  current.push(listener);
  listeners.set(channel, current);
  return () => {
    const next = (listeners.get(channel) ?? []).filter((item) => item !== listener);
    if (next.length) listeners.set(channel, next); else listeners.delete(channel);
  };
}
