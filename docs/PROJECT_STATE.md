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
- Application-level screener pagination/freshness regression coverage using a synthetic multi-page provider; the demo provider still exposes no fabricated pages.
- Canonical TypeScript screener runtime consumed through `tsx`; duplicated JavaScript screener implementation removed.
- Demo fundamentals screener API endpoint with symbol selection, full query/filter/group parsing, centralized request validation, and explicit stale/simulated metadata.
- Browser screener API client and workspace-integrated fundamentals screener panel with filter controls, deterministic results, score display, freshness state, and explicit simulated-data warning.
- Browser screener client regression coverage.
- Paper-trading application service with isolated demo-user paper accounts, risk admission, order lifecycle submission, deterministic demo execution, fill application, and portfolio retrieval.
- Paper-only HTTP portfolio and order-submission endpoints with explicit simulated metadata and no brokerage execution path.
- Paper-trading application regression coverage for fills, user isolation, risk rejection, short-sale rejection, and untriggered limit orders.
- Browser paper-trading API client and workspace Trading Panel with market/limit/stop/stop-limit controls, portfolio summary, position display, and explicit simulation disclosure.
- Browser paper-trading client regression coverage for configuration errors, identity headers, JSON order serialization, and API error propagation.
- Paper-trading application cancellation and replacement workflows using the shared order lifecycle contract, with accepted-order-only mutation semantics, per-user order isolation, idempotent client order IDs, and explicit lifecycle audit events.
- Paper-only HTTP cancellation (`DELETE /v1/paper/orders/:id`), replacement (`PUT /v1/paper/orders/:id`), and bounded audit (`GET /v1/paper/audit`) endpoints with explicit simulated metadata.
- Browser paper-trading lifecycle API client methods for audit reads, cancellation, and replacement.
- Regression coverage for cancellation, replacement, terminal-order protection, audit ordering, user isolation, and bounded audit reads.
- Paper portfolio application valuation now marks every held symbol to the deterministic quote, updates unrealized P&L and equity without mutating cash, and exposes valuation through the existing portfolio response.
- Trading-engine valuation regression coverage verifies long-position marking and safe behavior for positions without a current mark.
- Trading Panel now surfaces open paper orders from bounded audit state and provides Cancel/Replace controls wired to the paper lifecycle API.
- Browser lifecycle client regression coverage verifies URL encoding, HTTP methods, identity propagation, and API error propagation.
- Durable paper persistence boundary documented with account/order/fill/ledger/audit aggregates, repository operations, transactional invariants, optimistic concurrency, idempotency, authorization separation, and migration strategy.
- In-memory repository adapter added to exercise the durable contract without coupling the trading engine to storage infrastructure; repository tests cover account version conflicts, account-scoped order IDs, stale order transitions, and idempotent audit appends.

## Not production-ready
The market-data and fundamentals implementations are deterministic demo data. No licensed live exchange/fundamentals feeds, durable production market database, authenticated user system, production WebSocket gateway, alerts worker, or real order execution exists.

The workspace API remains intentionally in-memory and demo-only. Drawing state remains browser-session state until a versioned authorized workspace schema is implemented.

Paper trading and backtesting are simulation/domain logic only. They do not claim broker execution, margin, exchange microstructure, historical-data completeness, or real-money guarantees. The current paper application uses deterministic demo quotes with bid/ask equal to the generated demo last price, a fixed demo fee rate, a bounded notional/position policy, and no short selling. Paper order lifecycle/audit state is still in-memory demo state and is not durable across process restart. Mark-to-market valuation is likewise based on the deterministic demo quote and is not a live valuation feed.

The screener API has a pagination contract but the deterministic demo provider currently has no additional pages and therefore returns no next cursor. This is intentional; no fake pagination state is exposed.

## Verification
- Previous CI run 168 passed package typecheck, all tests, and the production Vite build.
- CI run 176 completed the substantive install, package typecheck, full test suite, and production build successfully for the previous project-state transition.
- Latest paper-trading commits require fresh CI verification; GitHub currently reports no workflow status checks for the recent main commits.

## Current risks / gaps
- Backtest Sharpe annualization currently assumes 252 periods/year; interval-aware annualization remains future work.
- Backtest benchmark comparison is deterministic buy-and-hold over supplied benchmark candles; durable application-level integration remains future work.
- Backtest execution is candle-level and does not model intrabar ordering, queue position, partial fills, borrow fees, margin calls, or corporate actions.
- Screener needs a real fundamentals provider, durable provider pagination, and freshness/completeness policy before production use.
- Drawing handles, rays, richer geometry, and versioned server persistence remain future work.
- Realtime stream currently sends an initial quote snapshot only; candle streaming, heartbeats, provider failover, rate limits, and observability remain future work.
- Paper service migration from direct Maps to the repository interface and a concrete durable database adapter remain future work.
- Versioned authorized workspace persistence remains future work.
- Alerts still need persistence, scheduler/worker delivery, webhook/notification adapters, idempotency, and application/UI integration.
- Dedicated script runtime, community, authentication, durable persistence, deployment, and production security remain planned.

## Next implementation slice
Migrate the paper application service from direct Maps to the repository interface while preserving behavior, then add the concrete durable database schema/adapter.
