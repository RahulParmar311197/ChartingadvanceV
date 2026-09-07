import { runScreener } from '../../../packages/screener-engine/src/provider.ts';

// Demo fixtures use the same epoch-second convention as the fundamentals domain contract.
const DEMO_AS_OF = 1725667200;
const DEMO_STALE_AT = 1725753600;
const DEMO_SNAPSHOTS = [
  { symbolId: 'NYSE:AAPL', asOf: DEMO_AS_OF, marketCap: 3_400_000_000_000, peRatio: 31, revenueGrowth: 0.06, profitMargin: 0.26, returnOnEquity: 1.5, debtToEquity: 1.8, dividendYield: 0.004 },
  { symbolId: 'NASDAQ:MSFT', asOf: DEMO_AS_OF, marketCap: 3_000_000_000_000, peRatio: 36, revenueGrowth: 0.15, profitMargin: 0.35, returnOnEquity: 0.35, debtToEquity: 0.4, dividendYield: 0.007 },
  { symbolId: 'NASDAQ:NVDA', asOf: DEMO_AS_OF, marketCap: 2_900_000_000_000, peRatio: 52, revenueGrowth: 1.2, profitMargin: 0.55, returnOnEquity: 1.2, debtToEquity: 0.2, dividendYield: 0.0003 },
];

export function createDemoFundamentalsProvider() {
  return {
    async getFundamentals(request) {
      const symbols = request.symbols?.length ? new Set(request.symbols) : null;
      const filtered = symbols ? DEMO_SNAPSHOTS.filter(item => symbols.has(item.symbolId)) : DEMO_SNAPSHOTS;
      return { items: filtered, asOf: DEMO_AS_OF, staleAt: DEMO_STALE_AT };
    },
  };
}

export async function executeDemoScreener(request, now = Math.floor(Date.now() / 1000)) {
  return runScreener(createDemoFundamentalsProvider(), request, now);
}
