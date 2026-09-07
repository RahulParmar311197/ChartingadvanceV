export const INTERVALS = new Set(["1m", "5m", "15m", "1H", "4H", "1D", "1W", "1M"]);

export function parseFiniteNumber(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

export function validSymbol(symbol) {
  return typeof symbol === "string" && /^[^:\s]+:[^:\s]+$/.test(symbol);
}

export function validateCandleRequest({ symbol, interval = "1D", from, to }) {
  if (!validSymbol(symbol)) return { ok: false, code: "INVALID_SYMBOL" };
  if (!INTERVALS.has(interval)) return { ok: false, code: "INVALID_INTERVAL" };
  const start = parseFiniteNumber(from);
  const end = parseFiniteNumber(to);
  if (start === null || end === null || start >= end) return { ok: false, code: "INVALID_RANGE" };
  return { ok: true, symbol, interval, from: start, to: end };
}
