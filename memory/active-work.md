# Active Work

## Current milestone
Phase 4 — Paper Trading foundation.

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
- Paper-trading execution primitives are implemented and tested for order validation, market/limit/stop/stop-limit triggers, deterministic fills/fees, and realized P&L.

## Immediate tasks
- Build durable paper-trading ledger state and audit-event contracts without connecting to real-money brokers.
- Add cash/buying-power/risk validation, cancellation/replacement lifecycle, portfolio valuation, and application/API boundary.
- Add browser drawing endpoint drag wiring and versioned workspace persistence once the chart interaction boundary is clean.
- Build deterministic backtesting simulator from normalized candles and paper execution semantics.
- Continue with screener/fundamentals, dedicated script runtime, community, authentication/persistence, and production hardening in roadmap order.

## Rule
When a task is completed, move it to `memory/completed-work.md` and update `docs/PROJECT_STATE.md`.
