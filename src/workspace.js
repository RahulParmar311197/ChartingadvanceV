const DEFAULT_API_URL = import.meta.env.VITE_MARKET_API_URL?.replace(/\/$/, "");
const DEMO_USER_ID = import.meta.env.VITE_DEMO_USER_ID || "anonymous";

export async function loadWorkspace(apiUrl = DEFAULT_API_URL, userId = DEMO_USER_ID) {
  if (!apiUrl) return null;
  const response = await fetch(`${apiUrl}/v1/workspace`, { headers: { "x-demo-user-id": userId } });
  if (!response.ok) throw new Error(`Workspace API returned ${response.status}`);
  const payload = await response.json();
  return payload.data ?? null;
}

export async function saveWorkspace(workspace, apiUrl = DEFAULT_API_URL, userId = DEMO_USER_ID) {
  if (!apiUrl) return null;
  const response = await fetch(`${apiUrl}/v1/workspace`, {
    method: "PUT",
    headers: { "content-type": "application/json", "x-demo-user-id": userId },
    body: JSON.stringify(workspace),
  });
  if (!response.ok) throw new Error(`Workspace API returned ${response.status}`);
  const payload = await response.json();
  return payload.data ?? null;
}

export function normalizeWorkspace(workspace, fallback) {
  if (!workspace || typeof workspace !== "object") return fallback;
  const watchlist = Array.isArray(workspace.watchlist)
    ? [...new Set(workspace.watchlist.filter((symbol) => typeof symbol === "string" && /^[^:\s]+:[^:\s]+$/.test(symbol)))].slice(0, 50)
    : fallback.watchlist;
  const activeSymbol = typeof workspace.activeSymbol === "string" && watchlist.includes(workspace.activeSymbol)
    ? workspace.activeSymbol
    : fallback.activeSymbol;
  const intervals = new Set(["1m", "5m", "15m", "1H", "4H", "1D", "1W", "1M"]);
  const interval = intervals.has(workspace.interval) ? workspace.interval : fallback.interval;
  return { watchlist, activeSymbol, interval };
}
