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
- Chart-engine state model with the shared market-domain Candle contract.
- Transport-neutral realtime market-event contract with monotonic sequence handling.
- Historical candle HTTP API boundary with explicit demo-provider metadata.
- Web chart API integration with explicit demo fallback.
- Pure deterministic SMA, EMA, and RSI indicator calculations.
- Vitest test files covering provider invariants, realtime ordering, and indicator behavior.
- CI adjusted to install dependencies without pretending a lockfile exists.
- Provider-backed demo quote HTTP endpoint for future dynamic watchlist state.

## Not production-ready
The current market-data implementation is deterministic demo data. No licensed live exchange feed, historical market database, authenticated API, persistent user state, production WebSocket gateway, alerts worker, paper brokerage simulator, or real order execution exists.

## Current risks / gaps
- Root project remains a Vite application rather than a fully configured workspace.
- Package test files exist and the root test command is configured, but CI has not yet produced a recorded run for the current head.
- Web watchlist quotes and news remain static presentation data.
- Realtime contracts exist, but the WebSocket gateway is not implemented.
- Chart/watchlist persistence is not implemented.

## Next implementation slice
Wire the watchlist to `/v1/market/quote` with an explicit demo-provider state, then implement the first WebSocket gateway that emits the normalized realtime contract. After that, establish server-backed workspace state and persistence boundaries.
