# Project State

Updated: 2026-09-07

## Status
Phase 1 — Chart Core foundation in progress; historical API, quote API, demo realtime transport, demo workspace state, web workspace lifecycle, indicator overlays, validation boundaries, and chart interaction primitives are implemented.

## Implemented
- React/Vite TradingView-inspired workspace shell with Lightweight Charts candlestick/volume rendering.
- Typed market-domain contracts for symbols, candles, quotes, intervals, historical requests, and provider adapters.
- Deterministic demo market-data provider and shared deterministic demo core.
- Chart-engine state model using the shared market-domain Candle contract.
- Transport-neutral realtime subscription/event contract with monotonic sequence handling.
- Historical candle HTTP API with explicit `provider: demo` and `simulated: true` metadata.
- Quote HTTP API at `/v1/market/quote` using the same deterministic demo core.
- Demo WebSocket gateway at `ws://localhost:8788` with subscription messages, normalized quote/status events, sequence numbers, and bounded client reconnect logic.
- Web watchlist quote state now comes from the provider/API instead of hardcoded presentation prices.
- Demo workspace GET/PUT API with bounded JSON input and explicitly non-persistent, demo-only identity via `x-demo-user-id`.
- Web workspace client with normalization, deduplication, bounded watchlist state, API load, and debounced API save.
- Pure deterministic SMA, EMA, and RSI indicator calculations with Vitest coverage.
- Moving-average overlay adapter mapping indicator output to chart timestamps, with tests.
- SMA 20 and EMA 50 can be toggled and are rendered as Lightweight Charts line series.
- Pure market-request and realtime subscription validation boundaries with Vitest coverage.
- Chart interaction primitives for supported interval cycling, interval validation, and bounded visible-bar state.
- CI runs `npm install`, `npm test`, and `npm run build`.

## Not production-ready
The current market-data implementation is deterministic demo data. No licensed live exchange feed, historical market database, authenticated API, durable user state, production market WebSocket gateway, alerts worker, paper brokerage simulator, or real order execution exists.

The workspace API is intentionally in-memory and `x-demo-user-id` is not authentication. The realtime gateway is a local/demo transport and is not an exchange connection.

## Verification
- GitHub Actions run 85 passed the complete `npm install`, `npm run test`, and `npm run build` gate after the CI cache fix.
- The subsequent chart-interaction commits require a new CI run before being treated as fully verified.
- Local execution verification was attempted previously, but this environment could not resolve `github.com`; CI remains the authoritative verification path.

## Current risks / gaps
- Root project is still a Vite application rather than the planned full workspace/package build graph.
- No durable persistence or authenticated session boundary exists.
- Realtime stream currently sends an initial quote snapshot only; candle streaming, heartbeats, provider failover, rate limits, and observability remain future work.
- Indicator configuration is intentionally limited to SMA 20 and EMA 50 controls; the RSI engine is not yet rendered in a pane.
- Drawing tools are still interaction-state placeholders rather than a persistent drawing model.
- News, screener, Pine runtime, strategy testing, alerts, paper trading, and community systems remain planned rather than implemented.

## Next implementation slice
Verify the chart-interaction test/build gate, then wire the interaction primitives into the chart UI and establish the workspace/package build graph. Keep all market outputs explicitly simulated until a licensed provider is integrated.
