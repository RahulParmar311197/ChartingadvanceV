# Changelog

## 2026-09-07
- Added project blueprint and non-negotiable engineering rules.
- Added durable project memory and agent handoff/state documentation.
- Added target architecture and phased roadmap.
- Added initial domain/service boundaries for the TradingView-class implementation.
- Added typed market-domain contracts for symbols, candles, quotes, intervals, and provider requests.
- Added a deterministic demo market-data provider behind the provider interface.
- Routed the web chart through the market-data provider boundary and removed UI-owned random candle generation.
