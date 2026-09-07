const FUNDAMENTAL_FIELDS = ["marketCap", "peRatio", "priceToBook", "revenueGrowth", "earningsGrowth", "profitMargin", "returnOnEquity", "debtToEquity", "dividendYield"];
const OPERATORS = ["gt", "gte", "lt", "lte", "eq", "between"];
const DEFAULT_API_URL = import.meta.env.VITE_MARKET_API_URL?.replace(/\/$/, "");
const DEFAULT_USER_ID = import.meta.env.VITE_DEMO_USER_ID || "anonymous";

export function createFundamentalFilter(field = "revenueGrowth", operator = "gte", value = 0) {
  return operator === "between" ? { field, operator, value, upperValue: value } : { field, operator, value };
}

export function validateScreenerFilter(filter) {
  if (!filter || !FUNDAMENTAL_FIELDS.includes(filter.field)) throw new Error("unsupported fundamental field");
  if (!OPERATORS.includes(filter.operator)) throw new Error("unsupported numeric operator");
  if (!Number.isFinite(Number(filter.value))) throw new Error("filter value must be finite");
  if (filter.operator === "between" && (!Number.isFinite(Number(filter.upperValue)) || Number(filter.upperValue) < Number(filter.value))) throw new Error("between filter requires an upperValue >= value");
}

export async function fetchFundamentals({ apiUrl = DEFAULT_API_URL, filters = [], groups = [], symbols = [], limit = 25, cursor, userId = DEFAULT_USER_ID, signal } = {}) {
  if (!apiUrl) throw new Error("Screener API URL is not configured");
  filters.forEach(validateScreenerFilter);
  groups.forEach((group) => {
    if (!group || !["and", "or"].includes(group.logic) || !Array.isArray(group.filters)) throw new Error("invalid filter group");
    group.filters.forEach(validateScreenerFilter);
  });
  const query = { filters, groups };
  const params = new URLSearchParams({ query: JSON.stringify(query), limit: String(limit) });
  symbols.forEach((symbol) => params.append("symbol", symbol));
  if (cursor) params.set("cursor", cursor);
  const response = await fetch(`${apiUrl.replace(/\/$/, "")}/v1/screener/fundamentals?${params}`, { signal, headers: { "x-demo-user-id": userId } });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(body?.error?.message || `Screener API returned ${response.status}`);
  return body.data;
}

export { FUNDAMENTAL_FIELDS, OPERATORS };
