export interface BacktestRequest { strategy: "buy-and-hold"; candles: unknown[]; benchmarkCandles?: unknown[]; initialCash?: number; feeRate?: number; slippageBps?: number; allowShort?: boolean; interval?: string; }

export async function runBacktest(request: BacktestRequest, baseUrl = import.meta.env.VITE_MARKET_API_URL ?? "http://localhost:8787") {
  const response = await fetch(`${baseUrl}/v1/backtest`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(request) });
  const body = await response.json();
  if (!response.ok) throw new Error(body?.error?.message ?? "Backtest request failed");
  return body;
}
