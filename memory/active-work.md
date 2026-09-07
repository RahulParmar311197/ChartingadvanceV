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
- Web workspace lifecycle now loads normalized state from the demo workspace API and debounces state saves.
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
- Browser client regression tests and TypeScript/JavaScript runtime conformance tests are implemented.
- Provider boundary now validates provider page shape, freshness timestamps, staleAt ordering, and bounded pagination cursors.
- Synthetic multi-page provider tests verify cursor/limit forwarding, next-cursor propagation, and freshness transitions without manufacturing demo pages.

## Immediate tasks
- Decide and document a production build strategy that removes the parallel TypeScript/JavaScript screener-core implementations without changing the public contract.
- Continue drawing endpoint drag wiring and versioned workspace persistence once the chart interaction boundary is clean.
- Continue paper-trading application/API/UI integration without enabling real-money brokerage execution.
- Continue backtesting application integration, then dedicated script runtime, community, authentication/persistence, and production hardening in roadmap order.

## Rule
When a task is completed, move it to `memory/completed-work.md` and update `docs/PROJECT_STATE.md`.
