# Active Work

## Current milestone
Phase 6 — Screener/fundamentals application integration in progress.

## Completed in this slice
- Backtest application input semantics hardened and verified in CI.
- Strategy-engine Sharpe annualization is interval-aware with explicit equity-session assumptions.
- Durable project state, changelog, and completed-work memory updated.

## Immediate tasks
- Add defensive candle invariants at the strategy-engine boundary for non-HTTP callers without duplicating application-specific request limits.
- Keep exchange/calendar-aware annualization explicitly separate from the current equity-session assumption.
- After those invariants, return to the Phase 6 screener path: durable/real fundamentals pagination and freshness/completeness policy.

## Rule
When a task is completed, move it to `memory/completed-work.md` and update `docs/PROJECT_STATE.md`.
