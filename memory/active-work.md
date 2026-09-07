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
- Realtime subscription validation extracted and covered by Vitest.
- CI no longer depends on an uncommitted npm lockfile for cache setup.
- Root npm workspace graph and explicit manifests for existing domain/API packages are established and verified by CI run 100.
- RSI 14 oscillator adapter and secondary chart pane are implemented; adapter behavior is covered by unit tests.
- Package source entrypoints and a dedicated production-package TypeScript typecheck gate are implemented and verified by CI run 120.
- Primary logical-range changes now propagate to the RSI pane through a local chart-range synchronization bus; CI run 135 verified typecheck, tests, and production build.
- Crosshair synchronization is wired between the primary and RSI Lightweight Charts instances, including clear-on-leave behavior.
- Drawing interaction primitives are covered by unit tests and the chart toolbar now places two-point line/trendline drawings through the chart-engine drawing-state contract.
- Drawings render as chart line series, can be selected, and can be deleted with the toolbar or Delete/Backspace; Escape cancels the active drawing tool/selection.

## Immediate tasks
- Add editing/drag handles for selected drawing points without bypassing chart-engine state transitions.
- Persist drawing state through a versioned workspace contract; local-only drawing state is not yet durable across devices/sessions.
- Improve chart interaction primitives: cursor, zoom/pan, symbol/timeframe state, and indicator configuration.
- Add persistent indicator configuration only after the workspace contract is expanded safely.
- Replace the demo market boundary only with a licensed provider and authenticated/durable production services.

## Rule
When a task is completed, move it to `memory/completed-work.md` and update `docs/PROJECT_STATE.md`.
