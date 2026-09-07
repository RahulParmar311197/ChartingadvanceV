# Active Work

## Current milestone
Phase 6 — Screener/fundamentals application integration in progress.

## Completed in this slice
- Backtest application and strategy-engine candle semantics hardened and verified in CI.
- Strategy-engine Sharpe annualization is interval-aware with explicit equity-session assumptions.
- Screener provider pagination now exposes explicit complete/partial coverage semantics.
- Empty pagination cursors are rejected at both request and provider boundaries.
- Durable project state, changelog, and completed-work memory updated.

## Immediate tasks
- Verify the fresh CI run for screener completeness/cursor changes.
- Add provider-independent cursor integrity/continuation safeguards before wiring a real fundamentals provider.
- Keep freshness semantics explicit: `staleAt` is an advisory freshness boundary and missing `staleAt` means freshness is unknown rather than proof of current data.

## Rule
When a task is completed, move it to `memory/completed-work.md` and update `docs/PROJECT_STATE.md`.
