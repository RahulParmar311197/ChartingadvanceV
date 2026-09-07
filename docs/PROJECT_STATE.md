# Project State

Updated: 2026-09-07

## Status
Phase 1 — Chart Core foundation in progress; historical API, quote API, demo realtime transport, demo workspace state, web workspace lifecycle, indicator overlays, validation boundaries, chart viewport controls, chart-engine viewport invariants, package workspace graph, and an RSI secondary pane are implemented.

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
- RSI 14 has a dedicated indicator-engine oscillator adapter with warmup/timestamp tests and a rendered secondary chart pane.
- RSI pane fixes its oscillator scale to 0–100 and renders 70/30 reference levels while using the same symbol, timeframe, and bounded visible-bar state as the primary chart.
- Pure market-request and realtime subscription validation boundaries with Vitest coverage.
- Chart interaction primitives for supported interval cycling, interval validation, and bounded visible-bar state.
- Chart UI timeframe selection is wired to chart data reloads.
- Chart viewport controls now maintain a bounded visible-bar window and expose zoom-in/zoom-out controls in the chart toolbar.
- Chart-engine viewport operations now provide tested clamping, zoom, and bounded pan invariants.
- Root `package.json` now declares npm workspaces for `apps/*` and `packages/*`.
- Existing API and domain packages now have explicit package manifests, establishing package ownership without moving runtime imports yet.
- CI runs `npm install`, `npm test`, and `npm run build`.

## Not production-ready
The current market-data implementation is deterministic demo data. No licensed live exchange feed, historical market database, authenticated API, durable user state, production market WebSocket gateway, alerts worker, paper brokerage simulator, or real order execution exists.

The workspace API is intentionally in-memory and `x-demo-user-id` is not authentication. The realtime gateway is a local/demo transport and is not an exchange connection.

## Verification
- GitHub Actions run 85 passed the complete `npm install`, `npm run test`, and `npm run build` gate after the CI cache fix.
- GitHub Actions run 88 passed the complete `npm install`, `npm run test`, and `npm run build` gate for the chart-interaction slice.
- GitHub Actions run 89 passed the complete `npm install`, `npm run test`, and `npm run build` gate for the viewport-control implementation.
- GitHub Actions run 100 passed the complete `npm install`, `npm run test`, and `npm run build` gate for the workspace package graph on main.
- The RSI implementation and adapter tests have been committed; the post-change CI gate remains the verification step for this slice.

## Current risks / gaps
- The root Vite application still owns the browser build; package manifests establish boundaries but package-specific build/typecheck scripts are not yet wired.
- The RSI pane is a separate Lightweight Charts instance; horizontal interaction synchronization beyond the shared bounded visible-bar control remains future work.
- No durable persistence or authenticated session boundary exists.
- Realtime stream currently sends an initial quote snapshot only; candle streaming, heartbeats, provider failover, rate limits, and observability remain future work.
- Drawing tools are still interaction-state placeholders rather than a persistent drawing model.
- News, screener, Pine runtime, strategy testing, alerts, paper trading, and community systems remain planned rather than implemented.

## Next implementation slice
Verify the RSI change with CI, then wire package-level entrypoints/build scripts without moving domain invariants into React. After that, improve synchronized primary/secondary chart interaction and continue Phase 1 drawing/crosshair primitives.
