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
- Immutable drawing state, line/trendline creation, selection/deletion, series conversion, and drag lifecycle primitives are implemented and tested.
- Deterministic alert evaluator is implemented and tested.
- Paper-trading execution primitives, portfolio ledger, risk checks, and realized P&L accounting are implemented and tested.
- Deterministic candle-based backtesting with short-position policy, realized P&L, equity/drawdown, and performance metrics is implemented and tested.
- Deterministic fundamentals screener domain contracts, operators, groups, ranking, limits, provider/application boundary, freshness metadata, and demo API adapter are implemented and tested.
- Screener HTTP request parsing validates the full filter/group/query contract centrally, including symbols, numeric operators, ranges, limits, and cursor shape.
- Browser screener API client and workspace-integrated fundamentals screener panel are implemented with explicit stale/demo disclosure.
- Browser client regression tests are implemented.
- Provider boundary validates provider page shape, freshness timestamps, staleAt ordering, and bounded pagination cursors.
- Synthetic multi-page provider tests verify cursor/limit forwarding, next-cursor propagation, and freshness transitions without manufacturing demo pages.
- Screener runtime now has a single canonical TypeScript implementation. Node API/realtime entrypoints use `tsx` to execute TypeScript package contracts, eliminating the duplicated JavaScript screener implementation.
- Paper-trading application service now owns per-demo-user paper accounts, risk admission, order lifecycle submission, deterministic demo execution, fill application, and portfolio retrieval.
- Paper-trading HTTP endpoints expose portfolio reads and paper-only order submission with explicit simulated metadata and no brokerage path.
- Paper-trading application regression tests cover fills, user isolation, risk rejection, short-sale rejection, and untriggered limit orders.
- Drawing endpoint dragging now uses DOM pointer lifecycle with pointer capture, immutable previews, and release-time state commit; selection styling is isolated from chart construction so selecting an endpoint does not tear down an active drag.
- Browser paper-trading API client and Trading Panel are integrated with order-type controls, portfolio summary, positions, and explicit simulation disclosure.
- Browser paper-trading client regression tests cover configuration errors, identity propagation, order serialization, and API error propagation.
- Paper-trading cancellation/replacement workflows now use the shared order lifecycle contract, persist accepted orders in the application store, enforce terminal-order protection, preserve per-user isolation, and emit deterministic audit events.
- Paper-only HTTP cancellation, replacement, and bounded audit-read endpoints are exposed without adding a brokerage path.
- Browser paper-trading client now exposes audit, cancellation, and replacement methods.

## Immediate tasks
- Add portfolio mark-to-market valuation to the paper-trading application workflow.
- Add application/UI order-list lifecycle controls using the new cancellation/replacement endpoints.
- Define versioned authorized workspace persistence for drawings and richer chart state.
- Continue backtesting application integration, then dedicated script runtime, community, authentication/persistence, and production hardening in roadmap order.

## Rule
When a task is completed, move it to `memory/completed-work.md` and update `docs/PROJECT_STATE.md`.
