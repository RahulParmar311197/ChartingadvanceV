const DEFAULT_API_URL = import.meta.env.VITE_MARKET_API_URL?.replace(/\/$/, "");

export async function fetchQuote(symbol, apiUrl = DEFAULT_API_URL, fallbackProvider = null) {
  if (apiUrl) {
    const response = await fetch(`${apiUrl}/v1/market/quote?symbol=${encodeURIComponent(symbol)}`);
    if (!response.ok) throw new Error(`Market API returned ${response.status}`);
    const payload = await response.json();
    return payload.data ?? null;
  }
  if (fallbackProvider?.getQuote) return fallbackProvider.getQuote(symbol);
  return null;
}

export function formatQuoteValue(value) {
  if (!Number.isFinite(value)) return "—";
  if (Math.abs(value) >= 1000) return value.toLocaleString(undefined, { maximumFractionDigits: 2 });
  if (Math.abs(value) >= 10) return value.toFixed(2);
  return value.toFixed(4);
}
