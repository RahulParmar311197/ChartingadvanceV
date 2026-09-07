export const INTERVALS = new Set(["1m", "5m", "15m", "1H", "4H", "1D", "1W", "1M"]);
export const FUNDAMENTAL_FIELDS = new Set(["marketCap", "peRatio", "priceToBook", "revenueGrowth", "earningsGrowth", "profitMargin", "returnOnEquity", "debtToEquity", "dividendYield"]);
export const NUMERIC_OPERATORS = new Set(["gt", "gte", "lt", "lte", "eq", "between"]);
const MAX_SCREENER_CURSOR_LENGTH = 512;

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

function validateFilter(filter) {
  if (!filter || typeof filter !== "object" || Array.isArray(filter)) throw new Error("filter must be an object");
  if (!FUNDAMENTAL_FIELDS.has(filter.field)) throw new Error("unsupported fundamental field");
  if (!NUMERIC_OPERATORS.has(filter.operator)) throw new Error("unsupported numeric operator");
  if (!Number.isFinite(filter.value)) throw new Error("filter value must be finite");
  if (filter.operator === "between" && (!Number.isFinite(filter.upperValue) || filter.upperValue < filter.value)) {
    throw new Error("between filter requires an upperValue >= value");
  }
}

function validateGroups(groups) {
  if (!Array.isArray(groups)) throw new Error("groups must be a JSON array");
  groups.forEach((group) => {
    if (!group || typeof group !== "object" || Array.isArray(group) || !["and", "or"].includes(group.logic)) {
      throw new Error("filter group logic must be 'and' or 'or'");
    }
    if (!Array.isArray(group.filters) || group.filters.length === 0) throw new Error("filter group must contain filters");
    group.filters.forEach(validateFilter);
  });
}

export function parseScreenerRequest({ symbols = [], filters, groups, query, limit, cursor }) {
  if (!Array.isArray(symbols) || symbols.some((symbol) => !validSymbol(symbol))) throw new Error("symbol must use EXCHANGE:TICKER format");
  if (cursor != null && (typeof cursor !== "string" || cursor.length === 0 || cursor.length > MAX_SCREENER_CURSOR_LENGTH)) {
    throw new Error("cursor must be a non-empty string of at most 512 characters");
  }

  let parsedQuery = {};
  if (query != null) {
    if (typeof query !== "object" || Array.isArray(query)) throw new Error("query must be a JSON object");
    parsedQuery = { ...query };
  }
  if (filters !== undefined) parsedQuery.filters = filters;
  if (groups !== undefined) parsedQuery.groups = groups;
  if (parsedQuery.filters !== undefined) {
    if (!Array.isArray(parsedQuery.filters)) throw new Error("filters must be a JSON array");
    parsedQuery.filters.forEach(validateFilter);
  }
  if (parsedQuery.groups !== undefined) validateGroups(parsedQuery.groups);

  const requestedLimit = limit ?? parsedQuery.limit;
  if (requestedLimit !== undefined && (!Number.isInteger(requestedLimit) || requestedLimit < 1 || requestedLimit > 100)) {
    throw new Error("limit must be an integer from 1 to 100");
  }
  if (parsedQuery.limit !== undefined && requestedLimit !== parsedQuery.limit) parsedQuery.limit = requestedLimit;
  return { symbols, query: Object.keys(parsedQuery).length ? parsedQuery : undefined, limit: requestedLimit, cursor };
}
