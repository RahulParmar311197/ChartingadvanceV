# Active Work

## Current milestone
Phase 6 — Screener/fundamentals application integration in progress.

## Completed in this slice
- Backtest application and strategy-engine candle semantics hardened and verified in CI.
- Strategy-engine Sharpe annualization is interval-aware with explicit equity-session assumptions.
- Screener provider pagination now exposes explicit complete/partial coverage semantics.
- Empty pagination cursors are rejected at both request and provider boundaries.
- Provider continuation cursors are rejected when they do not advance beyond the incoming cursor.
- Screener freshness explicitly reports `fresh`, `stale`, or `unknown` instead of treating missing `staleAt` as freshness proof.
- Durable project state, changelog, and completed-work memory updated.

## Immediate tasks
- Verify the fresh CI run for the latest screener contract changes.
- Wire browser continuation state to the application cursor contract.
- Prepare a real fundamentals-provider adapter without exposing provider SDK semantics to the UI.
- Keep freshness semantics explicit: `staleAt` is an advisory freshness boundary and missing `staleAt` means freshness is unknown.

## Rule
When a task is completed, move it to `memory/completed-work.md` and update `docs/PROJECT_STATE.md`.
