# Project State

Updated: 2026-09-07

## Status
Phase 6 — Screener/fundamentals application integration in progress; chart core, analysis foundations, deterministic alerts, paper trading, and deterministic backtesting are implemented.

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
- Deterministic fundamental screener contracts with typed financial fields, numeric operators, AND/OR groups, deterministic ranking, and bounded result limits.
- Fundamentals provider/application contract with freshness metadata and bounded pagination contract.
- Demo fundamentals screener API endpoint with symbol selection, full query/filter/group parsing, centralized request validation, and explicit stale/simulated metadata.
- Screener request validation regression coverage for fields, operators, groups, symbols, ranges, limits, and cursor shape.
- Browser screener API client with preflight validation and normalized query serialization.
- Workspace-integrated fundamentals screener panel with filter controls, deterministic results, score display, freshness state, and explicit simulated-data warning.
- Browser screener client regression coverage and TypeScript/JavaScript runtime conformance coverage.
- Root npm workspace graph/typecheck and CI test/build gates.

## Not production-ready
The market-data and fundamentals implementations are deterministic demo data. No licensed live exchange/fundamentals feeds, durable production market database, authenticated user system, production WebSocket gateway, alerts worker, or real order execution exists.

The workspace API remains intentionally in-memory and demo-only. Drawing state remains browser-session state until a versioned authorized workspace schema is implemented.

Paper trading and backtesting are simulation/domain logic only. They do not claim broker execution, margin, exchange microstructure, historical-data completeness, or real-money guarantees. Short backtests are intentionally cash-accounting simulations and do not model broker margin requirements.

The screener API has a pagination contract but the deterministic demo provider currently has no additional pages and therefore returns no next cursor. This is intentional; no fake pagination state is exposed.

## Verification
- Previous CI run 168 passed package typecheck, all tests, and the production Vite build.
- CI run 176 completed the substantive install, package typecheck, full test suite, and production build successfully for the previous project-state transition.
- Screener commits after those runs require fresh CI verification before being marked green; GitHub currently reports no workflow run for the recent main commits.

## Current risks / gaps
- Backtest Sharpe annualization currently assumes 252 periods/year; interval-aware annualization remains future work.
- Backtest benchmark comparison is deterministic buy-and-hold over supplied benchmark candles; durable application-level integration remains future work.
- Backtest execution is candle-level and does not model intrabar ordering, queue position, partial fills, borrow fees, margin calls, or corporate actions.
- Screener needs a real fundamentals provider, durable provider pagination, and freshness/completeness policy before production use.
- The screener TypeScript core and Node runtime currently have parallel implementations; conformance tests now cover representative filters/groups, but architectural consolidation remains future work.
- Drawing point-drag UI wiring, handles, rays, and richer geometry remain future work.
- Realtime stream currently sends an initial quote snapshot only; candle streaming, heartbeats, provider failover, rate limits, and observability remain future work.
- Paper trading still needs application/API/UI integration, cancellation/replacement lifecycle, audit-event persistence, portfolio mark-to-market valuation, and durable storage.
- Alerts still need persistence, scheduler/worker delivery, webhook/notification adapters, idempotency, and application/UI integration.
- Dedicated script runtime, community, authentication, durable persistence, deployment, and production security remain planned.

## Next implementation slice
Harden the screener provider boundary and runtime conformance, then move into real-provider pagination semantics and application-level screener workflows. In parallel, continue drawing endpoint drag wiring and paper-trading application integration without enabling real-money brokerage execution.
