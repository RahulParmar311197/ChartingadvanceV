const store = new Map();

const VALID_INTERVALS = new Set(["1m", "5m", "15m", "1H", "4H", "1D", "1W", "1M"]);
const MAX_WATCHLIST = 100;

function keyFor(userId) {
  return typeof userId === "string" && userId.trim() ? userId.trim().slice(0, 128) : "anonymous";
}

function normalizeSymbols(value) {
  if (!Array.isArray(value)) return null;
  return [...new Set(value.filter((symbol) => typeof symbol === "string" && /^[A-Z0-9_.-]+:[A-Z0-9_.-]+$/i.test(symbol)).slice(0, MAX_WATCHLIST))];
}

export function getWorkspace(userId) {
  const key = keyFor(userId);
  if (!store.has(key)) store.set(key, { watchlist: ["NASDAQ:AAPL", "NASDAQ:MSFT", "NASDAQ:NVDA"], activeSymbol: "NASDAQ:AAPL", interval: "1D" });
  return structuredClone(store.get(key));
}

export function saveWorkspace(userId, patch = {}) {
  const current = getWorkspace(userId);
  const watchlist = normalizeSymbols(patch.watchlist);
  const next = {
    ...current,
    ...(watchlist ? { watchlist } : {}),
    ...(typeof patch.activeSymbol === "string" && /^[A-Z0-9_.-]+:[A-Z0-9_.-]+$/i.test(patch.activeSymbol) ? { activeSymbol: patch.activeSymbol } : {}),
    ...(typeof patch.interval === "string" && VALID_INTERVALS.has(patch.interval) ? { interval: patch.interval } : {}),
  };
  if (!next.watchlist.includes(next.activeSymbol)) next.activeSymbol = next.watchlist[0] ?? current.activeSymbol;
  store.set(keyFor(userId), structuredClone(next));
  return structuredClone(next);
}

export function resetWorkspaceStore() {
  store.clear();
}
