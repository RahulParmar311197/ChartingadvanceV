# Project State

Updated: 2026-09-07

## Status
Phase 1 — Chart Core foundation in progress; historical API, quote API, demo realtime transport, demo workspace state, web workspace lifecycle, indicator overlays, viewport controls, synchronized chart panes/crosshair, package graph/typecheck, and interactive drawing foundations are implemented.

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
- SMA 20 and EMA 50 can be toggled and rendered as Lightweight Charts line series.
- RSI 14 has a dedicated indicator-engine oscillator adapter and rendered secondary chart pane with 0–100 scale and 70/30 reference levels.
- Primary logical-range changes propagate to the RSI pane through a browser-local synchronization bus.
- Primary crosshair movement propagates to RSI using the installed Lightweight Charts v5 crosshair APIs, with clear-on-leave handling.
- Chart-engine drawing state provides immutable add/update/remove operations plus visibility/locking controls and finite-point validation.
- Line and trendline toolbar tools now convert chart coordinates into two-point domain drawings and render them as chart line series.
- Drawings can be selected by clicking their rendered series and deleted with the toolbar or Delete/Backspace. Escape exits drawing/selection mode.
- Drawing interaction primitives have unit coverage for tool mapping, coordinate conversion, draft progression, commit thresholds, and IDs.
- Root `package.json` declares npm workspaces for `apps/*` and `packages/*`; package manifests expose source entrypoints for chart, indicator, market-domain, alert, and trading domains.
- Root `typecheck:packages` validates production package contracts without moving domain logic into React.
- CI runs package typecheck, tests, and the browser build.

## Not production-ready
The current market-data implementation is deterministic demo data. No licensed live exchange feed, historical market database, authenticated API, durable user state, production market WebSocket gateway, alerts worker, paper brokerage simulator, or real order execution exists.

The workspace API is intentionally in-memory and `x-demo-user-id` is not authentication. The realtime gateway is a local/demo transport and is not an exchange connection.

Drawing persistence is currently React/browser-session state only. It is intentionally not added to the server workspace contract until a versioned workspace schema and authorization boundary are defined.

## Verification
- GitHub Actions run 85 passed the complete `npm install`, `npm run test`, and `npm run build` gate after the CI cache fix.
- GitHub Actions run 88 passed the complete chart-interaction gate.
- GitHub Actions run 89 passed the viewport-control gate.
- GitHub Actions run 100 passed the workspace package graph gate.
- GitHub Actions run 120 passed package typecheck, all Vitest tests, and the production Vite build after package-entrypoint/typecheck changes.
- The first RSI CI run exposed incorrect expected Wilder-RSI values; the test was corrected and the full gate subsequently passed.
- GitHub Actions run 135 passed package typecheck, all Vitest tests, and the production Vite build for synchronized viewport changes.
- GitHub Actions run 148 passed package typecheck, all Vitest tests, and the production Vite build for crosshair bus changes.
- The current drawing interaction commit triggered CI run 153; verification is in progress and must pass before this slice is considered green.

## Current risks / gaps
- The root Vite application still owns the browser build; production package publishing/build artifacts are not configured.
- Drawing rendering currently uses Lightweight Charts line series rather than a dedicated chart primitive layer; point dragging, handles, rays, and richer drawing geometry remain future work.
- Drawing state is not yet part of the server workspace contract, so drawings are not durable across devices.
- Realtime stream currently sends an initial quote snapshot only; candle streaming, heartbeats, provider failover, rate limits, and observability remain future work.
- News, screener, Pine runtime, strategy testing, alerts, paper trading, and community systems remain planned rather than implemented.

## Next implementation slice
Add selected-drawing point editing/drag handles through the chart-engine update contract, then design a versioned workspace schema for safe drawing persistence. Keep real-money trading and live-provider integration behind explicit authorization/licensing boundaries.
