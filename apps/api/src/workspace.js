const store = new Map();

function keyFor(userId) {
  return typeof userId === "string" && userId.trim() ? userId.trim() : "anonymous";
}

export function getWorkspace(userId) {
  const key = keyFor(userId);
  if (!store.has(key)) store.set(key, { watchlist: ["NASDAQ:AAPL", "NASDAQ:MSFT", "NASDAQ:NVDA"], activeSymbol: "NASDAQ:AAPL", interval: "1D" });
  return store.get(key);
}

export function saveWorkspace(userId, patch) {
  const current = getWorkspace(userId);
  const next = {
    ...current,
    ...(Array.isArray(patch.watchlist) ? { watchlist: patch.watchlist.filter((s) => typeof s === "string" && s.includes(":")) } : {}),
    ...(typeof patch.activeSymbol === "string" && patch.activeSymbol.includes(":") ? { activeSymbol: patch.activeSymbol } : {}),
    ...(typeof patch.interval === "string" ? { interval: patch.interval } : {}),
  };
  store.set(keyFor(userId), next);
  return next;
}
