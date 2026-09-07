# Project State

Updated: 2026-09-07

## Status
Phase 5 — Deterministic backtesting foundation in progress; chart core, analysis foundations, deterministic alert evaluation, paper execution/ledger/risk, and backtest simulation are implemented.

## Implemented
- React/Vite TradingView-inspired workspace shell with Lightweight Charts candlestick/volume rendering.
- Typed market-domain contracts for symbols, candles, quotes, intervals, historical requests, and provider adapters.
- Deterministic demo market-data provider and shared deterministic demo core.
- Chart-engine immutable chart/drawing state and viewport controls.
- Realtime subscription/event contracts with monotonic sequence handling and resilient browser reconnect logic.
- Historical candle and quote HTTP APIs with explicit demo/simulated metadata.
- Demo WebSocket gateway and server-backed demo workspace boundary.
- Workspace normalization, bounded state, API load, and debounced save lifecycle.
- Deterministic SMA, EMA, and RSI calculations with chart overlays and secondary RSI pane.
- Synchronized chart ranges and crosshairs between primary and RSI panes.
- Line/trendline drawing creation, selection, deletion, immutable drawing lifecycle helpers, and render-only point sorting.
- Deterministic alert evaluation with threshold/crossing operators, cooldowns, invalid-input rejection, and stable delivery IDs.
- Paper-trading market/limit/stop/stop-limit trigger evaluation, explicit bid/ask pricing, fee calculation, validation, and deterministic fills.
- Position accounting with realized P&L handling.
- Immutable paper portfolio ledger with idempotent fill application and account/symbol binding.
- Deterministic paper risk checks for buying power, maximum order notional, maximum position size, and short-sale policy.
- Deterministic candle-based backtesting with market/limit execution, fees, slippage, opt-in short positions, signed position accounting, realized P&L, equity curve, drawdown, win rate, profit factor, and Sharpe-style performance metrics.
- Root npm workspace graph/typecheck and CI test/build gates.

## Not production-ready
The market-data implementation is deterministic demo data. No licensed live exchange feed, durable production market database, authenticated user system, production WebSocket gateway, alerts worker, or real order execution exists.

The workspace API remains intentionally in-memory and demo-only. Drawing state remains browser-session state until a versioned authorized workspace schema is implemented.

Paper trading and backtesting are simulation/domain logic only. They do not claim broker execution, margin, exchange microstructure, historical-data completeness, or real-money guarantees. Short backtests are intentionally cash-accounting simulations and do not model broker margin requirements.

## Verification
- Previous CI run 168 passed package typecheck, all tests, and the production Vite build.
- CI run 176 completed the substantive install, package typecheck, full test suite, and production build successfully for the previous project-state transition.
- Backtesting commits after that run require fresh CI verification before being marked green.

## Current risks / gaps
- Backtest metrics currently use 252 periods/year for Sharpe annualization; interval-aware annualization and benchmark comparison remain future work.
- Backtest execution is candle-level and does not model intrabar ordering, queue position, partial fills, borrow fees, margin calls, or corporate actions.
- Drawing point-drag UI wiring, handles, rays, and richer geometry remain future work.
- Realtime stream currently sends an initial quote snapshot only; candle streaming, heartbeats, provider failover, rate limits, and observability remain future work.
- Paper trading still needs application/API/UI integration, cancellation/replacement lifecycle, audit-event persistence, portfolio mark-to-market valuation, and durable storage.
- Alerts still need persistence, scheduler/worker delivery, webhook/notification adapters, idempotency, and application/UI integration.
- Screener/fundamentals, script runtime, community, authentication, durable persistence, deployment, and production security remain planned.

## Next implementation slice
Add a stable backtest result/benchmark contract and application boundary, then begin screener/fundamentals domain contracts. Keep real-money brokerage integration blocked behind explicit authorization, risk, audit, and security gates.
