const DEFAULT_API_URL = import.meta.env.VITE_MARKET_API_URL?.replace(/\/$/, "");
const DEMO_USER_ID = import.meta.env.VITE_DEMO_USER_ID || "anonymous";

async function request(path, options = {}, apiUrl = DEFAULT_API_URL, userId = DEMO_USER_ID) {
  if (!apiUrl) throw new Error("Paper trading API is not configured");
  const response = await fetch(`${apiUrl}${path}`, { ...options, headers: { "x-demo-user-id": userId, ...(options.headers ?? {}) } });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(payload?.error?.message ?? `Paper trading API returned ${response.status}`);
  return payload.data;
}
export function fetchPaperPortfolio(apiUrl = DEFAULT_API_URL, userId = DEMO_USER_ID) { return request("/v1/paper/portfolio", {}, apiUrl, userId); }
export function fetchPaperOrders(apiUrl = DEFAULT_API_URL, userId = DEMO_USER_ID) { return request("/v1/paper/orders", {}, apiUrl, userId); }
export function fetchPaperAudit(apiUrl = DEFAULT_API_URL, userId = DEMO_USER_ID, limit = 50) { return request(`/v1/paper/audit?limit=${encodeURIComponent(limit)}`, {}, apiUrl, userId); }
export function submitPaperOrder(order, apiUrl = DEFAULT_API_URL, userId = DEMO_USER_ID) { return request("/v1/paper/orders", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(order) }, apiUrl, userId); }
export function cancelPaperOrder(orderId, apiUrl = DEFAULT_API_URL, userId = DEMO_USER_ID) { return request(`/v1/paper/orders/${encodeURIComponent(orderId)}`, { method: "DELETE" }, apiUrl, userId); }
export function replacePaperOrder(orderId, replacement, apiUrl = DEFAULT_API_URL, userId = DEMO_USER_ID) { return request(`/v1/paper/orders/${encodeURIComponent(orderId)}`, { method: "PUT", headers: { "content-type": "application/json" }, body: JSON.stringify(replacement) }, apiUrl, userId); }
