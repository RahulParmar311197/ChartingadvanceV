# Project State

Updated: 2026-09-07

## Status
Phase 6 — Screener/fundamentals application integration in progress; chart core, analysis foundations, deterministic alerts, paper trading, deterministic backtesting, and first backtesting UI are implemented. Production-hardening work is active, but production deployment remains intentionally blocked until authenticated identity and real provider adapters are installed and verified.

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
- Screener provider pages cannot claim continuation with an empty item set or repeat the incoming continuation cursor.
- Screener freshness explicitly distinguishes `fresh`, `stale`, and `unknown`.
- Application-level screener pagination/freshness regression coverage using a synthetic multi-page provider; demo provider exposes no fabricated pages.
- Canonical TypeScript screener runtime consumed through `tsx`; duplicated JavaScript screener implementation removed.
- Demo fundamentals screener API endpoint with symbol selection, full query/filter/group parsing, centralized request validation, and explicit stale/simulated metadata.
- Browser screener API client and workspace-integrated fundamentals screener panel with filter controls, deterministic results, score display, freshness state, and explicit simulated-data warning.
- Browser screener client continuation pager with accumulated pages, opaque cursors, concurrency protection, repeated-cursor rejection, and reset behavior.
- Fundamentals snapshot `asOf`/`staleAt` timestamps use canonical Unix epoch seconds.
- Provider-neutral HTTP fundamentals adapter with bounded requests, timeout cancellation, explicit response normalization, and upstream error propagation.
- Durable screener continuation migration and in-memory/PostgreSQL repositories with owner/request/provider scoping, atomic single-use consumption, expiry, and cleanup.
- Provider cursors remain infrastructure-only; application cursors are opaque server-generated IDs.
- Screener cursor encryption with AES-256-GCM and deployment-managed keys; rotating keyring support can decrypt previous keys while always issuing cursors with the active key.
- Screener continuation repository storage bound expanded to accommodate the bounded encrypted envelope without permitting unbounded provider cursor storage.
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
- Backtest API metadata exposes the exact Sharpe annualization period assumption.
- Regression coverage spans 1m, 5m, 15m, 1H, 4H, 1D, 1W, and 1M annualization factors plus API metadata.
- Backtest application input validation enforces non-negative integer Unix epoch-second timestamps, strict chronological ordering, finite positive OHLC prices, valid high/low relationships, and finite non-negative volume when supplied, including benchmark candles.
- Strategy-engine direct callers receive the same candle semantic invariants through `validateBacktestCandles`.
- API runtime now has explicit production configuration gates, security response headers, allowlisted CORS, bounded in-memory request rate limiting, `/health` liveness and `/ready` database readiness checks, request-body abort on oversize input, and graceful shutdown of HTTP/DB resources.
- Market WebSocket runtime now has bounded payload size, connection-capacity protection, heartbeat/ping-pong liveness detection, graceful shutdown, and explicit status handling.
- Browser market client falls back to the deterministic demo provider when no application API URL is configured, instead of rendering a permanent `No quote` state.

## Not production-ready
Market-data and fundamentals implementations are still deterministic demo data. No licensed live exchange/fundamentals feeds, durable production market database, or production WebSocket provider adapter exists.

There is no authenticated user system yet; the current `x-demo-user-id` identity boundary is intentionally non-production. Production startup now fails closed unless authenticated identity, real market/fundamentals provider configuration, PostgreSQL persistence, cursor encryption, and explicit CORS origins are configured. The current repository does not yet contain those real identity/provider implementations, so a production environment must not be started.

Paper trading and backtesting remain simulation/domain logic only. They do not claim broker execution, margin, exchange microstructure, historical-data completeness, or real-money guarantees. Mark-to-market valuation uses deterministic demo quotes.

The backtest API accepts only registered built-in strategies and never evaluates arbitrary JavaScript/Pine/code. Current built-ins are Buy & Hold and Candle Direction. Candle-level execution does not model intrabar ordering, queue position, partial fills, borrow fees, margin calls, or corporate actions. Annualization assumptions are equity-market session assumptions, not universal exchange calendars.

The API rate limiter is process-local and is not a distributed production limiter; production deployment needs a shared limiter at the edge or a shared store. WebSocket connection caps are also process-local and should be coordinated at the gateway/load-balancer layer.

Drawings need richer geometry and durable server persistence. Realtime still needs candle streaming, provider failover, provider authentication, durable market storage, and observability. Alerts still need persistence, scheduler/worker delivery, adapters, idempotency, and UI integration. Dedicated script runtime, community, authentication, billing, deployment automation, and production security review remain planned.

## Verification
- CI run 34108387596 on commit `299a2d4` passed PostgreSQL provisioning, package typecheck, full tests, and production build for the screener cursor-validation slice.
- CI run 34109685837 passed PostgreSQL provisioning, package typecheck, full tests, and production build for the screener freshness-state slice.
- CI run 34111239978 passed package typecheck, full tests, and production build for the browser screener continuation slice at commit `1d70192`.
- CI run 34112051500 passed package typecheck, full tests, and production build for timestamp-unit hardening.
- CI run 34115606065 on commit `54bca691` passed typecheck, tests, build, and PostgreSQL initialization for the browser market API client slice.
- Current production-hardening commits were pushed to `main`; CI verification for the newest head must be checked before claiming the slice verified.

## Current risks / gaps
- Authenticated identity and authorization enforcement are still absent; demo identity must never be used for production user isolation.
- Real market and fundamentals provider adapters, credentials, licensing/terms, rate limits, failover, and data-quality monitoring are still absent.
- Intraday annualization uses a 6.5-hour/252-day equity-session assumption; exchange/calendar-aware annualization remains future work.
- External-provider timestamp units must be explicitly translated into the canonical Unix epoch-second application contract.
- Drawings need richer geometry and durable server persistence.
- Realtime needs candle streaming, provider failover, rate limits at the gateway, and observability.
- Alerts need persistence, scheduler/worker delivery, adapters, idempotency, and UI integration.
- Production deployment needs secrets management, TLS termination, shared rate limiting, metrics/traces/log correlation, backup/restore drills, migrations in deployment, and security review.

## Next implementation slice
Implement authenticated identity/authorization at the application boundary, replacing `x-demo-user-id` with a verified principal while preserving owner-scoped persistence and continuation semantics. Then wire a real provider adapter behind the existing market/fundamentals contracts and add deployment-level observability and shared rate limiting.
