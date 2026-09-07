# Active Work

## Current milestone
Phase 6 — Screener/fundamentals provider hardening and application workflows.

## Completed in this slice
- Durable paper persistence boundary documented with transactional, idempotency, optimistic-concurrency, and authorization invariants.
- PostgreSQL paper persistence, workspace persistence, migrations, restart recovery, and transaction boundaries implemented and covered.
- PostgreSQL duplicate client-order races now use atomic repository-level insert-if-absent semantics and real concurrent integration coverage.
- Deterministic application backtest boundary and Strategy Tester UI implemented.
- Second allowlisted deterministic Candle Direction strategy added without introducing arbitrary-code execution.
- Strategy-engine Sharpe annualization is now interval-aware for intraday, daily, weekly, and monthly intervals.
- Backtest API exposes the exact annualization period assumption used for Sharpe.

## Immediate tasks
- Harden backtest input semantics at the application boundary: validate chronological candle timestamps and OHLC relationships, reject malformed/non-monotonic series, and add regression coverage.
- Verify the fresh CI run for the interval-aware metrics commits before advancing the runtime boundary.

## Rule
When a task is completed, move it to `memory/completed-work.md` and update `docs/PROJECT_STATE.md`.
