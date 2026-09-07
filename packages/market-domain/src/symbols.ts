import type { MarketSymbol, SymbolId } from "./index";

const SYMBOLS: readonly MarketSymbol[] = [
  { id: "NASDAQ:AAPL", exchange: "NASDAQ", ticker: "AAPL", name: "Apple Inc.", assetClass: "stock", currency: "USD", timezone: "America/New_York" },
  { id: "NASDAQ:MSFT", exchange: "NASDAQ", ticker: "MSFT", name: "Microsoft Corporation", assetClass: "stock", currency: "USD", timezone: "America/New_York" },
  { id: "NASDAQ:NVDA", exchange: "NASDAQ", ticker: "NVDA", name: "NVIDIA Corporation", assetClass: "stock", currency: "USD", timezone: "America/New_York" },
  { id: "NASDAQ:TSLA", exchange: "NASDAQ", ticker: "TSLA", name: "Tesla, Inc.", assetClass: "stock", currency: "USD", timezone: "America/New_York" },
  { id: "BINANCE:BTCUSDT", exchange: "BINANCE", ticker: "BTCUSDT", name: "Bitcoin / Tether", assetClass: "crypto", currency: "USDT", timezone: "UTC" },
  { id: "OANDA:EURUSD", exchange: "OANDA", ticker: "EURUSD", name: "Euro / U.S. Dollar", assetClass: "forex", currency: "USD", timezone: "UTC" },
];

export function listSymbols(): readonly MarketSymbol[] {
  return SYMBOLS;
}

export function findSymbol(id: SymbolId): MarketSymbol | undefined {
  return SYMBOLS.find((symbol) => symbol.id === id);
}
