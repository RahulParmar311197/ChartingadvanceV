export function rangesEqual(a, b, epsilon = 0.01) {
  return Boolean(a && b && Math.abs(a.from - b.from) <= epsilon && Math.abs(a.to - b.to) <= epsilon);
}

export function syncLogicalRange(source, target, lastRange = null) {
  const range = source?.timeScale?.().getVisibleLogicalRange?.();
  if (!range || rangesEqual(range, lastRange)) return lastRange;
  target?.timeScale?.().setVisibleLogicalRange?.(range);
  return { from: range.from, to: range.to };
}
