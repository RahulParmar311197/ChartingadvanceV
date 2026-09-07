# Project State

Updated: 2026-09-07

## Status
Phase 4 — Paper Trading foundation in progress; Phase 1 chart core, Phase 2 indicator/drawing foundations, and deterministic alert evaluation are implemented. Paper-order execution and position accounting primitives are now implemented as pure domain logic.

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
- Line and trendline toolbar tools convert chart coordinates into two-point domain drawings and render them as chart line series.
- Drawings can be selected by clicking their rendered series and deleted with the toolbar or Delete/Backspace. Escape exits drawing/selection mode.
- Drawing interaction primitives have unit coverage for tool mapping, coordinate conversion, draft progression, commit thresholds, IDs, and drag lifecycle state.
- Drawing-series conversion sorts render-only copies without mutating domain drawings.
- Deterministic alert evaluation supports threshold/crossing operators, disabled rules, cooldowns, invalid-input rejection, and stable delivery IDs.
- Paper-trading execution supports market/limit/stop/stop-limit trigger evaluation, explicit bid/ask pricing, fee calculation, order validation, accepted/filled/rejected outcomes, deterministic fill IDs, and position realized-P&L accounting.
- Root npm workspace graph/typecheck and CI test/build gates are established.

## Not production-ready
The current market-data implementation is deterministic demo data. No licensed live exchange feed, historical market database, authenticated API, durable user state, production market WebSocket gateway, alerts worker, paper brokerage service, or real order execution exists.

The workspace API is intentionally in-memory and `x-demo-user-id` is not authentication. The realtime gateway is a local/demo transport and is not an exchange connection.

Drawing persistence is currently React/browser-session state only. It is intentionally not added to the server workspace contract until a versioned workspace schema and authorization boundary are defined.

Paper trading is currently a pure deterministic domain foundation; it is not connected to real-money brokerage APIs and does not represent broker execution guarantees, margin rules, or exchange microstructure.

## Verification
- GitHub Actions run 168 passed package typecheck, all tests, and the production Vite build for the drawing drag lifecycle documentation state.
- Alert and paper-trading changes have been committed with unit tests; their new CI run must pass before those slices are marked green.

## Current risks / gaps
- Drawing rendering currently uses Lightweight Charts line series rather than a dedicated chart primitive layer; point-drag UI wiring, handles, rays, and richer geometry remain future work.
- Drawing state is not yet part of the server workspace contract, so drawings are not durable across devices.
- Realtime stream currently sends an initial quote snapshot only; candle streaming, heartbeats, provider failover, rate limits, and observability remain future work.
- Paper trading still needs a durable ledger, cash/buying-power risk checks, order cancellation/replacement lifecycle, audit events, portfolio valuation, and application/API/UI integration.
- Alerts still need persistence, scheduler/worker delivery, webhook/notification adapters, idempotency, and application/UI integration.
- Backtesting, screener/fundamentals, script runtime, community systems, authentication, production persistence, and deployment hardening remain planned.

## Next implementation slice
Complete the paper-trading ledger/risk/audit domain and API boundary, then build the deterministic backtesting simulator on top of the same execution contracts. Keep real-money brokerage integration blocked behind explicit authorization, risk, audit, and security gates.
