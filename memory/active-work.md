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
- Browser screener API client now mirrors the application cursor/freshness/completeness contract.
- Browser continuation state accumulates pages, forwards opaque cursors, prevents concurrent page loads, rejects repeated cursors, and resets cleanly.
- Browser screener client regression coverage added for query encoding, cursor continuation, repeated-cursor protection, and reset behavior.
- CI run 34111239978 passed typecheck, full tests, and production build for the browser continuation slice.

## Immediate tasks
- Prepare a real fundamentals-provider adapter without exposing provider SDK semantics to the UI.
- Decide and document the canonical timestamp unit at the fundamentals application boundary before connecting an external provider.
- Define durable cursor/continuation policy for production provider adapters, including restart and expiry behavior.
- Keep freshness semantics explicit: `staleAt` is an advisory freshness boundary and missing `staleAt` means freshness is unknown.

## Rule
When a task is completed, move it to `memory/completed-work.md` and update `docs/PROJECT_STATE.md`.
