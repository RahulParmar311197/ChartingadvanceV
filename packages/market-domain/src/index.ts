export type SymbolId = `${string}:${string}`;

export interface MarketSymbol {
  id: SymbolId;
  exchange: string;
  ticker: string;
  name: string;
  assetClass: "stock" | "crypto" | "forex" | "future" | "index" | "etf";
  currency: string;
  timezone: string;
}

export interface Candle {
  time: number; // Unix epoch seconds, UTC.
  open: number;
  high: number;
  low: number;
  close: number;
  volume?: number;
}

export interface Quote {
  symbol: SymbolId;
  last: number;
  change: number;
  changePercent: number;
  timestamp: number; // Unix epoch milliseconds, UTC.
}

export type CandleInterval = "1m" | "5m" | "15m" | "1H" | "4H" | "1D" | "1W" | "1M";

export interface HistoricalCandleRequest {
  symbol: SymbolId;
  interval: CandleInterval;
  from: number;
  to: number;
}

export interface MarketDataProvider {
  getHistoricalCandles(request: HistoricalCandleRequest): Promise<ReadonlyArray<Candle>>;
  getQuote(symbol: SymbolId): Promise<Quote>;
}
