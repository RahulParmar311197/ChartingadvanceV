export type AssetClass = 'stock' | 'etf' | 'crypto' | 'forex' | 'future' | 'index' | 'bond';
export type Timeframe = '1m' | '5m' | '15m' | '1h' | '4h' | '1d' | '1w' | '1M';

export interface Symbol {
  id: string;
  ticker: string;
  exchange: string;
  name: string;
  assetClass: AssetClass;
  currency: string;
  timezone: string;
}

export interface Candle {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume?: number;
}

export interface Quote {
  symbolId: string;
  bid?: number;
  ask?: number;
  last?: number;
  timestamp: number;
}

export interface Trade {
  symbolId: string;
  price: number;
  size: number;
  timestamp: number;
  id: string;
}

export interface MarketDataProvider {
  getHistory(symbol: Symbol, timeframe: Timeframe, from: number, to: number): Promise<Candle[]>;
  subscribeQuotes(symbolIds: string[], onQuote: (quote: Quote) => void): () => void;
  subscribeTrades(symbolIds: string[], onTrade: (trade: Trade) => void): () => void;
}
