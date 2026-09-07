# Active Work

## Current milestone
Phase 1 — Chart Core foundation.

## Completed in this slice
- Shared deterministic demo market core for API and provider consistency.
- Runnable Node demo WebSocket gateway using `ws` without importing TypeScript directly.
- Provider/API-backed watchlist quote state in the web workspace.
- Monotonic-sequence filtering and bounded reconnect/backoff in the web realtime client.
- Server-backed demo workspace GET/PUT boundary with bounded JSON input and defensive normalization.
- Root API/realtime scripts and `ws` runtime dependency.
- Web workspace lifecycle now loads normalized state from the demo workspace API and debounces state saves.
- SMA 20 and EMA 50 overlay controls are now wired into the Lightweight Charts rendering path.
- Pure market-request validation extracted from the HTTP server and covered by Vitest.

## Immediate tasks
- Add realtime subscription validation tests that do not require an external service.
- Improve chart interaction primitives: cursor, zoom/pan, symbol/timeframe state, and indicator configuration.
- Establish the workspace/package build graph before expanding into alerts, screeners, Pine, or trading.
- Replace the demo market boundary only with a licensed provider and authenticated/durable production services.

## Rule
When a task is completed, move it to `memory/completed-work.md` and update `docs/PROJECT_STATE.md`.
