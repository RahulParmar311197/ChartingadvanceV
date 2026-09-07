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
- PostgreSQL order insertion now uses an atomic `insertOrderIfAbsent` repository contract backed by `ON CONFLICT (account_id,order_id) DO NOTHING`; duplicate-order handling no longer raises a unique-key exception inside the active lifecycle transaction.
- Real PostgreSQL integration coverage added for idempotent migrations, restart/recovery, concurrent optimistic portfolio writes, and concurrent duplicate client-order races.
- CI provisions PostgreSQL 16 and runs the real integration suite alongside package typecheck, unit/integration tests, and production build.
- Application-level backtest boundary with bounded candle input, allowlisted Buy & Hold strategy execution, optional benchmark comparison, and explicit deterministic-simulation metadata.
- `POST /v1/backtest` HTTP integration and browser API client.
- Strategy Tester workspace panel with deterministic Buy & Hold controls, performance metrics, equity visualization, and explicit simulation limitations.
- Browser strategy-tester regression coverage for successful requests and structured API errors.

## Not production-ready
Market-data and fundamentals implementations are deterministic demo data. No licensed live exchange/fundamentals feeds, durable production market database, authenticated user system, production WebSocket gateway, alerts worker, or real order execution exists.

Paper trading and backtesting are simulation/domain logic only. They do not claim broker execution, margin, exchange microstructure, historical-data completeness, or real-money guarantees. The `x-demo-user-id` identity boundary is not authenticated production identity. Mark-to-market valuation uses deterministic demo quotes.

The backtest API intentionally accepts only a registered built-in strategy and never evaluates arbitrary JavaScript/Pine/code. The current built-in strategy is Buy & Hold. Candle-level execution does not model intrabar ordering, queue position, partial fills, borrow fees, margin calls, or corporate actions.

## Verification
- CI run 34099627805 on commit `601421f` passed package typecheck, the full test suite, and production Vite build.
- CI run 34100697084 on commit `2a57f6c` passed package typecheck, the full test suite, and production Vite build.
- PostgreSQL integration CI run 34101299681 completed successfully for the PostgreSQL-enabled integration slice.
- CI run 34103300368 on commit `631f686` passed package typecheck, the full test suite, and production Vite build.
- Atomic duplicate-order hardening commits `6bd29ff`, `2e753bd`, `0b89741`, `6c42f38`, and `5423869` require fresh CI verification.

## Current risks / gaps
- Demo identity must be bound to authenticated identity before production user isolation.
- Backtest Sharpe annualization assumes 252 periods/year; interval-aware annualization remains future work.
- Screener needs a real fundamentals provider, durable pagination, and freshness/completeness policy.
- Drawings need richer geometry and durable server persistence.
- Realtime needs candle streaming, heartbeats, provider failover, rate limits, and observability.
- Alerts need persistence, scheduler/worker delivery, adapters, idempotency, and UI integration.
- Dedicated script runtime, community, authentication, deployment, and production security remain planned.

## Next implementation slice
Verify the PostgreSQL atomic duplicate-order race end-to-end in CI, then expand the strategy runtime boundary.
