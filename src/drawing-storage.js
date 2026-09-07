const STORAGE_PREFIX = "chartingadvancev:drawing:";

function storageKey(symbol, interval) {
  return `${STORAGE_PREFIX}${symbol}:${interval}`;
}

export function loadStoredDrawings(symbol, interval, storage = globalThis.localStorage) {
  if (!storage) return [];
  try {
    const raw = storage.getItem(storageKey(symbol, interval));
    if (!raw) return [];
    const value = JSON.parse(raw);
    return Array.isArray(value) ? value : [];
  } catch {
    return [];
  }
}

export function saveStoredDrawings(symbol, interval, drawings, storage = globalThis.localStorage) {
  if (!storage) return;
  try {
    storage.setItem(storageKey(symbol, interval), JSON.stringify(drawings));
  } catch {
    // Browser storage can be unavailable or quota-limited; chart state remains in memory.
  }
}
