# Project State

Updated: 2026-09-07

## Status
Phase 1 — Chart Core foundation in progress; historical API, quote API, demo realtime transport, and demo workspace state are now wired as explicit boundaries.

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
- Pure deterministic SMA, EMA, and RSI indicator calculations with Vitest coverage.
- CI runs `npm install`, `npm test`, and `npm run build`.

## Not production-ready
The current market-data implementation is deterministic demo data. No licensed live exchange feed, historical market database, authenticated API, durable user state, production market WebSocket gateway, alerts worker, paper brokerage simulator, or real order execution exists.

The workspace API is intentionally in-memory and `x-demo-user-id` is not authentication. The realtime gateway is a local/demo transport and is not an exchange connection.

## Verification
- GitHub CI configuration includes test and build gates.
- Local execution verification was attempted, but this environment could not resolve `github.com`, so a fresh clone/install/test/build could not be completed here. Do not treat the current head as locally verified until CI produces a successful run.

## Current risks / gaps
- Root project is still a Vite application rather than the planned full workspace/package build graph.
- No durable persistence or authenticated session boundary exists.
- Realtime stream currently sends an initial quote snapshot only; candle streaming, heartbeats, provider failover, rate limits, and observability remain future work.
- News, screener, Pine runtime, strategy testing, alerts, paper trading, and community systems remain planned rather than implemented.

## Next implementation slice
Harden the API/realtime test boundary, add workspace client persistence behind the demo API, then move into chart interaction primitives and indicator overlays. Keep all market outputs explicitly simulated until a licensed provider is integrated.
