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
- Browser paper-trading API client and workspace Trading Panel with market/limit/stop/stop-limit controls, portfolio summary, position display, and explicit simulation disclosure.
- Browser paper-trading client regression coverage for configuration errors, identity headers, JSON order serialization, and API error propagation.
- Paper-trading cancellation/replacement workflows using the shared order lifecycle contract, per-user order isolation, idempotent client order IDs, and lifecycle audit events.
- Paper-only HTTP cancellation, replacement, bounded audit, and canonical order-list endpoints with explicit simulated metadata.
- Portfolio mark-to-market valuation using deterministic demo quotes with unrealized P&L/equity updates and no cash mutation.
- Trading Panel Cancel/Replace controls backed by canonical stored order state rather than bounded audit reconstruction.
- Durable paper persistence boundary documented with account/order/fill/ledger/audit aggregates, repository operations, transactional invariants, optimistic concurrency, idempotency, authorization separation, and migration strategy.
- In-memory repository adapter and regression coverage for account versions, account-scoped order identity, stale order transitions, and idempotent audit appends.
- Versioned workspace persistence contract with schema version, owner binding, monotonic revisions, validation, and regression coverage.
- PostgreSQL paper repository adapter with injected pool/transaction support, optimistic account/order mutation, idempotent fill/ledger/audit writes, account-scoped reads, and optimistic portfolio snapshot saves.
- PostgreSQL migration runner with ordered transactional migrations and a schema-migrations ledger.
- Position snapshot migration for durable paper portfolio recovery across process restarts.
- Asynchronous repository-injected paper application service shared by memory and PostgreSQL implementations.
- Explicit `PAPER_PERSISTENCE=postgres` API startup mode backed by `DATABASE_URL`; development remains deterministic/in-memory by default and `NODE_ENV=production` defaults to PostgreSQL with fail-fast configuration.
- PostgreSQL adapter contract tests for mapping, optimistic portfolio writes, stale-write rejection, transaction commit, rollback, and error preservation.
- PostgreSQL-backed versioned workspace service wired into the durable API mode, with owner-scoped reads, schema-version metadata, ETag revision responses, optimistic revision conflicts, and compatibility-preserving in-memory demo mode.
- Paper lifecycle submission, cancellation, and replacement now enter the repository transaction boundary when available, keeping order transitions, fills, portfolio snapshots, ledger entries, and audit events atomic in PostgreSQL mode.
- In-memory paper transactions now provide rollback semantics matching the repository atomicity contract.
- PostgreSQL account initialization now uses conflict-safe insertion and the application re-reads the durable portfolio when another concurrent initializer wins the race.
- Real PostgreSQL integration coverage added for idempotent migrations, restart/recovery through a new pool, and concurrent optimistic portfolio writes.
- CI now provisions PostgreSQL 16 and runs the real integration suite alongside package typecheck, unit/integration tests, and production build.
- Concurrent duplicate paper client-order submissions now convert PostgreSQL unique-key races into deterministic duplicate-order responses rather than leaking database errors.

## Not production-ready
The market-data and fundamentals implementations are deterministic demo data. No licensed live exchange/fundamentals feeds, durable production market database, authenticated user system, production WebSocket gateway, alerts worker, or real order execution exists.

Paper trading and backtesting are simulation/domain logic only. They do not claim broker execution, margin, exchange microstructure, historical-data completeness, or real-money guarantees. The current paper application uses deterministic demo quotes with bid/ask equal to the generated demo last price, a fixed demo fee rate, a bounded notional/position policy, and no short selling. PostgreSQL persistence is selectable, but it remains persistence for the simulation and does not turn the application into a brokerage system. The `x-demo-user-id` identity boundary is not an authenticated production identity mechanism. Mark-to-market valuation is based on the deterministic demo quote and is not a live valuation feed.

The screener API has a pagination contract but the deterministic demo provider currently has no additional pages and therefore returns no next cursor. This is intentional; no fake pagination state is exposed.

The durable PostgreSQL workspace path is wired, but it still uses the demo identity header and requires authenticated identity binding before production user isolation can be claimed.

## Verification
- CI run 34099627805 on commit `601421f` passed package typecheck, the full test suite, and the production Vite build.
- CI run 34100697084 on commit `2a57f6c` passed package typecheck, the full test suite, and the production Vite build.
- PostgreSQL integration CI run 34101299681 completed successfully for the PostgreSQL-enabled integration slice.
- The latest duplicate-order hardening commit requires a fresh CI run before its verification status is claimed.

## Current risks / gaps
- The latest duplicate-order hardening suite must pass before that change is marked verified.
- The demo identity header must be replaced/bound to authenticated identity before production user data isolation is claimed.
- Backtest Sharpe annualization currently assumes 252 periods/year; interval-aware annualization remains future work.
- Backtest benchmark comparison is deterministic buy-and-hold over supplied benchmark candles; durable application-level integration remains future work.
- Backtest execution is candle-level and does not model intrabar ordering, queue position, partial fills, borrow fees, margin calls, or corporate actions.
- Screener needs a real fundamentals provider, durable provider pagination, and freshness/completeness policy before production use.
- Drawing handles, rays, richer geometry, and durable server persistence remain future work.
- Realtime stream currently sends an initial quote snapshot only; candle streaming, heartbeats, provider failover, rate limits, and observability remain future work.
- Alerts still need persistence, scheduler/worker delivery, webhook/notification adapters, idempotency, and application/UI integration.
- Dedicated script runtime, community, authentication, durable persistence, deployment, and production security remain planned.

## Next implementation slice
Verify duplicate-order hardening, then resume backtesting application integration with a durable application boundary and regression coverage.
