# Active Work

## Current milestone
Phase 6 — Screener/fundamentals application integration in progress.

## Completed in this slice
- Hardened the backtest application boundary with strict candle timestamp chronology and OHLC/volume validation.
- Applied the same validation to optional benchmark candle input.
- Added regression coverage for duplicate/non-monotonic timestamps, invalid OHLC relationships, malformed timestamps, invalid volume, and invalid benchmark candles.

## Immediate tasks
- Verify the fresh CI run covering interval-aware Sharpe annualization and candle-semantics validation.
- After CI is green, add defensive candle invariants at the strategy-engine boundary for non-HTTP callers without duplicating application-specific request limits.
- Keep exchange/calendar-aware annualization explicitly separate from the current equity-session assumption.

## Rule
When a task is completed, move it to `memory/completed-work.md` and update `docs/PROJECT_STATE.md`.
