import { runScreener } from '../../../packages/screener-engine/src/provider.ts';

const DEMO_SNAPSHOTS = [
  { symbolId: 'NYSE:AAPL', asOf: 1725667200000, marketCap: 3_400_000_000_000, peRatio: 31, revenueGrowth: 0.06, profitMargin: 0.26, returnOnEquity: 1.5, debtToEquity: 1.8, dividendYield: 0.004 },
  { symbolId: 'NASDAQ:MSFT', asOf: 1725667200000, marketCap: 3_000_000_000_000, peRatio: 36, revenueGrowth: 0.15, profitMargin: 0.35, returnOnEquity: 0.35, debtToEquity: 0.4, dividendYield: 0.007 },
  { symbolId: 'NASDAQ:NVDA', asOf: 1725667200000, marketCap: 2_900_000_000_000, peRatio: 52, revenueGrowth: 1.2, profitMargin: 0.55, returnOnEquity: 1.2, debtToEquity: 0.2, dividendYield: 0.0003 },
];

export function createDemoFundamentalsProvider() {
  return {
    async getFundamentals(request) {
      const symbols = request.symbols?.length ? new Set(request.symbols) : null;
      const filtered = symbols ? DEMO_SNAPSHOTS.filter(item => symbols.has(item.symbolId)) : DEMO_SNAPSHOTS;
      return { items: filtered, asOf: 1725667200000, staleAt: 1725753600000, nextCursor: undefined };
    },
  };
}

export async function executeDemoScreener(request, now = Date.now()) {
  return runScreener(createDemoFundamentalsProvider(), request, now);
}
