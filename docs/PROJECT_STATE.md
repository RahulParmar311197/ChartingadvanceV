# Project State

Updated: 2026-09-07

## Status
Phase 1 — Chart Core foundation in progress.

## Implemented
- React/Vite TradingView-inspired workspace shell.
- Lightweight candlestick/volume chart.
- Symbol search and watchlist UI.
- Project governance, agent rules, durable memory, and architecture documentation.
- Typed market-domain contracts for symbols, candles, quotes, intervals, historical requests, and provider adapters.
- Deterministic demo market-data provider behind the provider interface.
- Chart-engine indicator contract now imports the shared market-domain Candle type.
- Transport-neutral realtime market subscription/event contracts with sequence ordering.
- Node HTTP market API with validated historical candle endpoint and explicit demo-provider metadata.
- Web chart requests historical candles from the API when configured and falls back to the explicitly simulated provider when unavailable.
- Core deterministic SMA, EMA, and RSI indicator calculations.
- CI no longer assumes a lockfile that does not exist yet.

## Not production-ready
The current market-data implementation is deterministic demo data. No licensed live exchange feed, durable historical market database, authenticated API, persistent user state, production WebSocket gateway, alerts worker, paper brokerage simulator, or real order execution exists.

## Current risks / gaps
- Root project is still a Vite starter rather than a complete workspace build.
- Domain/indicator packages are not yet independently packaged and CI-tested.
- Web UI still contains static quote/news presentation data.
- Realtime subscriptions have contracts only; no WebSocket gateway exists yet.
- The API demo generator is intentionally temporary and must be replaced by an adapter backed by licensed data before any live-market claim.

## Next implementation slice
Add executable unit/integration tests for market-domain, indicators, and the HTTP API; package the TypeScript domains cleanly; then implement the first WebSocket market-event gateway and server-backed watchlist/chart state boundary.
