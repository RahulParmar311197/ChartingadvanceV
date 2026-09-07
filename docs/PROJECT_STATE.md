# Project State

Updated: 2026-09-07

## Status
Phase 9 production hardening is active while Phase 6 screener/fundamentals integration remains the current product milestone. The application is feature-rich in demo/simulation mode but is **not yet safe to deploy as a live production trading platform**.

## Implemented
- React/Vite chart workspace with Lightweight Charts candlesticks, volume, synchronized RSI pane, SMA/EMA overlays, crosshair/range synchronization, timeframes, viewport controls, symbol search, watchlist, and drawing creation/selection/drag/deletion.
- Market-domain provider abstraction, deterministic demo historical/quote provider, normalized contracts, browser API client, realtime subscription contracts, monotonic sequence handling, and reconnect/backoff behavior.
- HTTP market APIs with strict symbol/interval/range validation and explicit `simulated` metadata.
- Demo WebSocket gateway with subscription validation; runtime payload cap, connection cap, ping/pong heartbeat, and graceful shutdown.
- Deterministic indicator calculations for SMA/EMA/RSI and chart overlays.
- Deterministic alert condition evaluation foundations.
- Paper-trading domain/service with market/limit/stop/stop-limit orders, deterministic fills, fees, position/P&L accounting, risk checks, cancellation/replacement, audit events, mark-to-market valuation, idempotency, optimistic concurrency, and PostgreSQL/in-memory repositories.
- Versioned PostgreSQL workspace persistence with owner scoping, ETags, and optimistic revision conflicts.
- Deterministic backtesting with bounded/validated candle input, built-in strategy allowlist, benchmark comparison, drawdown/equity metrics, and interval-aware Sharpe annualization assumptions.
- Screener engine with typed fundamentals, numeric filters, AND/OR groups, deterministic ranking, bounded limits, freshness/completeness semantics, provider pagination guards, and provider-neutral HTTP adapter.
- Browser screener client/panel with continuation paging, freshness/coverage state, and explicit simulated-data disclosure.
- Durable PostgreSQL/in-memory screener continuation storage with owner/query/provider binding, atomic single-use consumption, expiry cleanup, opaque client continuation IDs, AES-256-GCM cursor encryption, and active/previous key rotation support.
- Production API runtime hardening: fail-closed configuration validation, signed proxy-HMAC principal verification, authenticated-principal enforcement in production, explicit CORS allowlist, security headers, request rate limiting, `/health` liveness, `/ready` DB readiness, request-body limits, and graceful HTTP/DB shutdown.
- Browser demo quote fallback when the application API is not configured.
- CI provisions PostgreSQL and runs package typecheck, full unit/integration tests, production build, and service smoke tests covering REST readiness/market/screener/paper/workspace/backtest plus WebSocket reachability.

## Production gate
Production startup intentionally fails closed until all of the following are true:
1. A real authenticated identity gateway/adapter is deployed. The current application boundary supports signed proxy-HMAC principals; `x-demo-user-id` is development-only.
2. A licensed real market-data provider adapter is implemented behind the market-domain contract. The current market implementation is deterministic demo data.
3. A documented real fundamentals provider adapter is implemented behind the screener contract. The current fundamentals implementation is deterministic demo data.
4. PostgreSQL persistence is configured and migration/backup/restore procedures are verified.
5. Screener cursor encryption keys are deployment-managed and rotated through the supported keyring mechanism.
6. Explicit production CORS origins and TLS are configured.
7. Shared/edge rate limiting, gateway WebSocket capacity controls, observability, alerting, and incident response are deployed.
8. Security review is completed before enabling any real brokerage connectivity; real-money execution remains blocked by ADR-004.

## Verification
- Historical CI slices have passed package typecheck, full tests, PostgreSQL integration, and production build, including the browser market API client slice at run `34115606065`.
- CI run `34118624634` passed typecheck, tests, and build but failed the newly added smoke test because its fixture violated the enforced candle invariant. The fixture was corrected in commit `322fd590f6a6ff7156120c5530b8c5c2d932c6da`.
- The current CI workflow includes the smoke test; the latest head CI run must complete successfully before this hardening slice is called verified.

## Current risks / gaps
- No live market/fundamentals provider is installed; no live-data guarantees are made.
- No first-party identity provider integration exists; signed proxy-HMAC assumes a trusted authentication gateway and deployment-managed secret.
- API/WebSocket rate/capacity controls are process-local; horizontal production requires shared edge/gateway controls.
- Realtime still needs provider failover, candle streaming, market-data persistence, and data-quality monitoring.
- Alerts still need durable persistence, scheduler/worker delivery, adapters, idempotency, and UI integration.
- Drawings need richer geometry and durable server persistence.
- Observability needs structured logs, request correlation, metrics, traces, dependency dashboards, and actionable alerting.
- Production deployment needs TLS, secret management, automated migrations, backups, restore drills, rollout/rollback procedures, and formal security review.
- Backtesting remains candle-level deterministic simulation and does not model full exchange microstructure, intrabar ordering, borrow fees, margin calls, partial fills, or corporate actions.

## Next implementation slice
Build and integrate the real market-data adapter first, preserving the existing normalized market-domain contract, then the real fundamentals adapter. In parallel, connect the signed identity boundary to an actual authentication gateway and add shared edge rate limiting/observability. Do not remove the production fail-closed gates until those implementations are verified.
