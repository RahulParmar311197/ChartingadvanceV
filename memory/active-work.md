# Active Work

## Current milestone
Phase 6 — Screener/fundamentals provider hardening and application workflows.

## Completed in this slice
- Shared deterministic demo market core for API and provider consistency.
- Runnable Node demo WebSocket gateway using `ws` without importing TypeScript directly.
- Provider/API-backed watchlist quote state in the web workspace.
- Monotonic-sequence filtering and bounded reconnect/backoff in the web realtime client.
- Server-backed demo workspace GET/PUT boundary with bounded JSON input and defensive normalization.
- Root API/realtime scripts and `ws` runtime dependency.
- Web workspace lifecycle now loads normalized demo workspace state and debounces state saves.
- SMA 20 and EMA 50 overlay controls are wired into the Lightweight Charts rendering path.
- Market-request and realtime subscription validation are extracted and covered by Vitest.
- Root npm workspace graph and explicit manifests for existing domain/API packages are established and verified by CI.
- RSI 14 oscillator adapter and secondary chart pane are implemented and tested.
- Primary logical-range and crosshair synchronization are wired between primary/RSI chart panes.
- Immutable drawing state, line/trendline creation, selection/deletion, and drag lifecycle primitives are implemented and tested.
- Deterministic alert evaluator is implemented and tested.
- Paper-trading execution primitives, portfolio ledger, risk checks, and realized P&L accounting are implemented and tested.
- Deterministic candle-based backtesting with realized P&L, equity/drawdown, and performance metrics is implemented and tested.
- Deterministic fundamentals screener contracts, provider/application boundary, freshness metadata, pagination, demo API adapter, and browser panel are implemented and tested.
- Paper-trading application service, HTTP endpoints, Trading Panel, cancellation/replacement lifecycle, audit reads, and mark-to-market valuation are implemented with explicit simulation boundaries and regression coverage.
- Durable persistence boundary is now documented for paper accounts, orders, fills, ledger, and audit, including transaction/idempotency/optimistic-concurrency invariants.
- An in-memory repository adapter now implements that persistence contract and has regression coverage for account versions, account-scoped order identity, stale order transitions, and idempotent audit appends.

## Immediate tasks
- Migrate the paper application service from direct Maps to the repository interface without changing its external API.
- Add durable database adapter/schema migrations after repository-backed service behavior is verified.
- Define versioned authorized workspace persistence for drawings and richer chart state.
- Continue backtesting application integration, then dedicated script runtime, community, authentication/persistence, and production hardening in roadmap order.

## Rule
When a task is completed, move it to `memory/completed-work.md` and update `docs/PROJECT_STATE.md`.
