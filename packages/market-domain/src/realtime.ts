import type { Candle, CandleInterval, Quote, SymbolId } from "./index";

export type MarketChannel = "quotes" | "candles";

export interface MarketSubscription {
  id: string;
  symbols: SymbolId[];
  channels: MarketChannel[];
  interval?: CandleInterval;
}

export interface QuoteEvent {
  type: "quote";
  sequence: number;
  timestamp: number;
  quote: Quote;
}

export interface CandleEvent {
  type: "candle";
  sequence: number;
  timestamp: number;
  symbol: SymbolId;
  interval: CandleInterval;
  candle: Candle;
  closed: boolean;
}

export interface MarketStatusEvent {
  type: "status";
  sequence: number;
  timestamp: number;
  status: "connected" | "degraded" | "disconnected";
  provider: "demo" | "licensed" | "unknown";
  message?: string;
}

export type MarketEvent = QuoteEvent | CandleEvent | MarketStatusEvent;

export function isNewerMarketEvent(previousSequence: number, event: MarketEvent): boolean {
  return event.sequence > previousSequence;
}
