import type {
  Candle,
  HistoricalCandleRequest,
  MarketDataProvider,
  Quote,
  SymbolId,
} from "./index";

function hashSymbol(symbol: string): number {
  let hash = 2166136261;
  for (let i = 0; i < symbol.length; i += 1) {
    hash ^= symbol.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function seededNoise(seed: number): () => number {
  let state = seed || 1;
  return () => {
    state = Math.imul(state ^ (state >>> 16), 2246822507);
    state = Math.imul(state ^ (state >>> 13), 3266489909);
    state ^= state >>> 16;
    return (state >>> 0) / 4294967296;
  };
}

export class DeterministicDemoMarketDataProvider implements MarketDataProvider {
  async getHistoricalCandles(request: HistoricalCandleRequest): Promise<ReadonlyArray<Candle>> {
    const intervalSeconds: Record<HistoricalCandleRequest["interval"], number> = {
      "1m": 60,
      "5m": 300,
      "15m": 900,
      "1H": 3600,
      "4H": 14400,
      "1D": 86400,
      "1W": 604800,
      "1M": 2592000,
    };
    const step = intervalSeconds[request.interval];
    const count = Math.max(0, Math.min(5000, Math.floor((request.to - request.from) / step)));
    const noise = seededNoise(hashSymbol(request.symbol));
    let value = 100 + (hashSymbol(request.symbol) % 250);
    const candles: Candle[] = [];

    for (let i = 0; i < count; i += 1) {
      const time = request.from + i * step;
      const open = value;
      const drift = Math.sin(i / 8) * 0.8 + (noise() - 0.5) * 2.5;
      const close = Math.max(0.01, open + drift);
      const high = Math.max(open, close) + noise() * 2.2;
      const low = Math.max(0.01, Math.min(open, close) - noise() * 2.2);
      const volume = Math.round(1000 + noise() * 9000);
      candles.push({ time, open, high, low, close, volume });
      value = close;
    }

    return candles;
  }

  async getQuote(symbol: SymbolId): Promise<Quote> {
    const seed = hashSymbol(symbol);
    const last = 100 + (seed % 250);
    const changePercent = ((seed % 500) - 250) / 100;
    const change = last * changePercent / 100;
    return {
      symbol,
      last,
      change,
      changePercent,
      timestamp: Date.now(),
    };
  }
}
