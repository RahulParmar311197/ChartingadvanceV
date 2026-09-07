# Active Work

## Current milestone
Phase 1 — Chart Core foundation.

## Completed in this slice
- Shared deterministic demo market core for API and provider consistency.
- Runnable Node demo WebSocket gateway using `ws` without importing TypeScript directly.
- Provider/API-backed watchlist quote state in the web workspace.
- Monotonic-sequence filtering and bounded reconnect/backoff in the web realtime client.
- Server-backed demo workspace GET/PUT boundary with bounded JSON input.
- Root API/realtime scripts and `ws` runtime dependency.
- Project state updated with explicit production gaps and verification limitations.

## Immediate tasks
- Add route-level/API and realtime integration tests that do not require external services.
- Add optional web workspace load/save against `/v1/workspace`, keeping demo identity explicitly non-authenticated.
- Improve chart interaction primitives: cursor, zoom/pan, symbol/timeframe state, and indicator overlays.
- Establish the workspace/package build graph before expanding into alerts, screeners, Pine, or trading.

## Rule
When a task is completed, move it to `memory/completed-work.md` and update `docs/PROJECT_STATE.md`.
