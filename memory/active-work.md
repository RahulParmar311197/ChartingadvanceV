# Active Work

## Current milestone
Phase 1 — Chart Core foundation.

## Completed in this slice
- Normalized symbol, quote, candle, interval, and historical request contracts.
- Market-data provider adapter interface.
- Deterministic demo provider implementation.
- Web chart routed through the provider boundary.
- Chart-engine Candle import repaired to use the shared market-domain contract.
- Transport-neutral realtime subscription/event contract added.
- Validated historical candle HTTP API added with explicit demo metadata.
- Web chart wired to the HTTP API with explicit demo fallback.
- Deterministic SMA, EMA, and RSI calculations added.
- CI corrected to use `npm install` until a committed lockfile exists.

## Immediate tasks
- Add executable unit/integration tests for market-domain, indicators, and HTTP API.
- Establish workspace/package build configuration and clean package boundaries.
- Implement the first WebSocket market-event gateway using the realtime contract.
- Replace static watchlist quote presentation with provider-backed state.
- Add server-backed chart/watchlist persistence before user-account features.

## Rule
When a task is completed, move it to `memory/completed-work.md` and update `docs/PROJECT_STATE.md`.
