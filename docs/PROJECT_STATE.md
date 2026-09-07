# Project State

Updated: 2026-09-07

## Status
Phase 1 — Chart Core foundation in progress; historical API, quote API, demo realtime transport, demo workspace state, web workspace lifecycle, indicator overlays, validation boundaries, chart viewport controls, chart-engine viewport invariants, package workspace graph, package entrypoints/typecheck, RSI secondary pane, synchronized chart viewport, crosshair bus primitives, and drawing state foundations are implemented.

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
- Package manifests now expose source entrypoints for chart, indicator, market-domain, alert, and trading domains.
- Root `typecheck:packages` uses a dedicated TypeScript configuration to validate production package contracts without moving domain logic into React.
- Primary chart logical-range changes now propagate through a small browser-local synchronization bus to the RSI secondary pane, keeping pan/zoom viewport state aligned.
- Browser-local crosshair publish/subscribe primitives now provide a decoupled synchronization contract for multiple chart panes.
- Chart-engine drawing state now provides immutable add/update/remove operations plus visibility/locking controls and validation for finite drawing points.
- CI runs package typecheck, tests, and the browser build.

## Not production-ready
The current market-data implementation is deterministic demo data. No licensed live exchange feed, historical market database, authenticated API, durable user state, production market WebSocket gateway, alerts worker, paper brokerage simulator, or real order execution exists.

The workspace API is intentionally in-memory and `x-demo-user-id` is not authentication. The realtime gateway is a local/demo transport and is not an exchange connection.

## Verification
- GitHub Actions run 85 passed the complete `npm install`, `npm run test`, and `npm run build` gate after the CI cache fix.
- GitHub Actions run 88 passed the complete `npm install`, `npm run test`, and `npm run build` gate for the chart-interaction slice.
- GitHub Actions run 89 passed the complete `npm install`, `npm run test`, and `npm run build` gate for the viewport-control implementation.
- GitHub Actions run 100 passed the complete `npm install`, `npm run test`, and `npm run build` gate for the workspace package graph on main.
- GitHub Actions run 120 passed package typecheck, all Vitest tests, and the production Vite build after the package-entrypoint/typecheck changes.
- The first RSI CI run exposed incorrect expected Wilder-RSI values in the new test; the test was corrected and the full gate subsequently passed.
- GitHub Actions run 135 passed package typecheck, all Vitest tests, and the production Vite build for the synchronized chart viewport implementation.
- The crosshair bus and drawing-state tests were added after run 135; a fresh CI run is required before calling these new changes verified.

## Current risks / gaps
- The root Vite application still owns the browser build; package manifests establish source boundaries but production package publishing/build artifacts are not yet configured.
- Crosshair synchronization infrastructure exists, but the browser chart instances are not yet wired to it; bidirectional secondary-pane interaction remains future work.
- No durable persistence or authenticated session boundary exists.
- Realtime stream currently sends an initial quote snapshot only; candle streaming, heartbeats, provider failover, rate limits, and observability remain future work.
- Drawing state is now modeled and tested, but the React drawing toolbar is not yet connected to this domain state and no durable drawing persistence exists.
- News, screener, Pine runtime, strategy testing, alerts, paper trading, and community systems remain planned rather than implemented.

## Next implementation slice
Wire the crosshair bus into the Lightweight Charts primary/RSI instances using the installed v5 API, then connect the drawing state to a controlled workspace interaction path. Expand workspace persistence only after the domain contract safely includes drawings.
