# Project State

Updated: 2026-09-07

## Status
Phase 6 — Screener/fundamentals application integration in progress; chart core, analysis foundations, deterministic alerts, paper trading, deterministic backtesting, and the first backtesting UI are implemented.

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
- Line/trendline drawing creation, selection, deletion, immutable drawing lifecycle helpers, endpoint hit-testing, and pointer-based drag previews/commit lifecycle.
- Deterministic alert evaluation with threshold/crossing operators, cooldowns, invalid-input rejection, and stable delivery IDs.
- Paper-trading market/limit/stop/stop-limit trigger evaluation, explicit bid/ask pricing, fee calculation, validation, and deterministic fills.
- Position accounting with realized P&L handling.
- Immutable paper portfolio ledger with idempotent fill application and account/symbol binding.
- Deterministic paper risk checks for buying power, maximum order notional, maximum position size, and short-sale policy.
- Deterministic candle-based backtesting with short-position policy, realized P&L, equity/drawdown, and performance metrics.
- Deterministic fundamental screener contracts with typed financial fields, numeric operators, AND/OR groups, deterministic ranking, and bounded result limits.
- Fundamentals provider/application contract with freshness metadata and bounded pagination contract.
- Provider-boundary validation for finite freshness timestamps, staleAt ordering, page shape, and bounded pagination cursors.
- Screener pagination now has explicit completeness semantics: a provider next cursor means partial coverage; absence of a cursor means provider-exhausted/complete coverage.
- Screener provider pages cannot claim continuation with an empty item set, preventing cursor loops that make no progress.
- Screener provider pages cannot repeat the incoming continuation cursor, preventing non-advancing pagination loops.
- Screener freshness now explicitly distinguishes `fresh`, `stale`, and `unknown`; missing `staleAt` no longer masquerades as confirmed freshness.
- Application-level screener pagination/freshness regression coverage using a synthetic multi-page provider; the demo provider still exposes no fabricated pages.
- Canonical TypeScript screener runtime consumed through `tsx`; duplicated JavaScript screener implementation removed.
- Demo fundamentals screener API endpoint with symbol selection, full query/filter/group parsing, centralized request validation, and explicit stale/simulated metadata.
- Browser screener API client and workspace-integrated fundamentals screener panel with filter controls, deterministic results, score display, freshness state, and explicit simulated-data warning.
- Browser screener client now has an explicit continuation pager that accumulates application results, forwards opaque cursors, prevents concurrent loads, rejects repeated cursors, and resets safely.
- Browser screener client regression coverage for query encoding, cursor continuation, repeated cursors, reset behavior, and response metadata shape.
- Fundamentals snapshot `asOf`/`staleAt` timestamps are now canonical Unix epoch seconds, matching the market-domain candle timestamp convention.
- Demo fundamentals fixtures and freshness tests use the canonical epoch-second convention.
- Provider-neutral HTTP fundamentals adapter now translates symbols/cursor/limit into transport parameters, delegates provider response normalization explicitly, propagates upstream HTTP failures without fabricating data, bounds transport page size/cursors, and aborts hung upstream requests after a configurable timeout.
- The HTTP fundamentals adapter is exported as an explicit package subpath so application infrastructure can consume it without importing provider internals.
- Deterministic HTTP adapter regression coverage verifies pagination/query translation, canonical timestamp mapping, upstream error propagation, request bounds, and timeout cancellation.
- Paper-trading application service with isolated demo paper accounts, risk admission, order lifecycle, deterministic execution, fills, and portfolio retrieval.
- Paper-only HTTP portfolio/order endpoints with explicit simulated metadata and no brokerage execution path.
- Browser paper-trading client and workspace Trading Panel with simulation disclosure.
- Paper-trading cancellation/replacement workflows, canonical order-list endpoint, audit events, mark-to-market valuation, and regression coverage.
- Durable paper persistence boundary with account/order/fill/ledger/audit aggregates, transactions, optimistic concurrency, idempotency, authorization separation, and migration strategy.
- In-memory and PostgreSQL repository adapters with transaction support and restart-safe position snapshots.
- Versioned PostgreSQL workspace persistence with owner-scoped reads, schema versions, ETags, and optimistic revision conflicts.
- PostgreSQL account initialization and duplicate client-order insertion are conflict-safe; concurrent duplicate submissions use atomic repository-level `insertOrderIfAbsent` semantics.
- Real PostgreSQL integration coverage for migrations, restart/recovery, optimistic portfolio writes, and concurrent duplicate-order races.
- CI provisions PostgreSQL 16 and runs typecheck, unit/integration tests, and production build.
- Application backtest boundary with bounded candle input, allowlisted deterministic strategies, optional benchmark comparison, and explicit simulation metadata.
- `POST /v1/backtest` and browser backtest client.
- Strategy Tester workspace panel with fixed Buy & Hold and Candle Direction strategies, performance metrics, equity visualization, and simulation limitations.
- Interval-aware Sharpe annualization using explicit assumptions: 252 trading days and 6.5 trading hours per trading day for intraday intervals; weekly and monthly frequencies use 52 and 12 periods/year.
- Backtest API metadata now exposes the exact Sharpe annualization period assumption.
- Regression coverage spans 1m, 5m, 15m, 1H, 4H, 1D, 1W, and 1M annualization factors plus API metadata.
- Backtest application input validation now enforces non-negative integer Unix epoch-second timestamps, strict chronological ordering, finite positive OHLC prices, valid high/low relationships, and finite non-negative volume when supplied, including benchmark candles.
- Strategy-engine direct callers now receive the same candle semantic invariants through `validateBacktestCandles`; transport/request-size concerns remain at the application boundary.

## Not production-ready
Market-data and fundamentals implementations are deterministic demo data. No licensed live exchange/fundamentals feeds, durable production market database, authenticated user system, production WebSocket gateway, alerts worker, or real order execution exists.

Paper trading and backtesting are simulation/domain logic only. They do not claim broker execution, margin, exchange microstructure, historical-data completeness, or real-money guarantees. The `x-demo-user-id` identity boundary is not authenticated production identity. Mark-to-market valuation uses deterministic demo quotes.

The backtest API accepts only registered built-in strategies and never evaluates arbitrary JavaScript/Pine/code. Current built-ins are Buy & Hold and Candle Direction. Candle-level execution does not model intrabar ordering, queue position, partial fills, borrow fees, margin calls, or corporate actions. Annualization assumptions are equity-market session assumptions, not universal exchange calendars.

## Verification
- CI run 34108387596 on commit `299a2d4` passed PostgreSQL provisioning, package typecheck, full tests, and production build for the screener cursor-validation slice.
- CI run 34109685837 passed PostgreSQL provisioning, package typecheck, full tests, and production build for the screener freshness-state slice.
- CI run 34111239978 passed package typecheck, full tests, and production build for the browser screener continuation slice at commit `1d70192`.
- CI run 34112051500 passed package typecheck, full tests, and production build for timestamp-unit hardening.
- HTTP fundamentals adapter tests were added in commit `c8580a4`; its PR-triggered workflow lookup returned no run, so that commit is not treated as independently verified.

## Current risks / gaps
- Demo identity must be bound to authenticated identity before production user isolation.
- Intraday annualization uses a 6.5-hour/252-day equity-session assumption; exchange/calendar-aware annualization remains future work.
- Screener needs a real fundamentals provider and durable production cursor storage/continuation policy.
- External-provider timestamp units must be explicitly translated into the canonical Unix epoch-second application contract.
- Drawings need richer geometry and durable server persistence.
- Realtime needs candle streaming, heartbeats, provider failover, rate limits, and observability.
- Alerts need persistence, scheduler/worker delivery, adapters, idempotency, and UI integration.
- Dedicated script runtime, community, authentication, deployment, and production security remain planned.

## Next implementation slice
Select and integrate a documented real fundamentals provider adapter only when provider credentials/API terms are available; until then, keep the transport/normalization seam provider-neutral and prevent demo data from being represented as live coverage.
