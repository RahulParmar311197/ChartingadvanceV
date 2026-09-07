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
- Browser continuation state accumulates pages, forwards opaque cursors, prevents concurrent loads, rejects repeated cursors, and resets cleanly.
- Browser screener client regression coverage added for query encoding, cursor continuation, repeated-cursor protection, and reset behavior.
- CI run 34111239978 passed typecheck, full tests, and production build for the browser continuation slice.
- Canonicalized fundamentals `asOf`/`staleAt` timestamps to Unix epoch seconds, matching market-domain candle timestamps.
- Updated demo fundamentals fixtures and regression tests to enforce the timestamp convention.
- Added and hardened the provider-neutral HTTP fundamentals adapter with bounded request parameters, timeout cancellation, upstream error propagation, explicit normalization, and an exported package subpath.
- Added deterministic adapter regression coverage for pagination/query translation, timestamp mapping, upstream failures, request bounds, timeout cancellation, and invalid timeout configuration.

## Immediate tasks
- Define durable cursor/continuation policy for production provider adapters, including restart, expiry, and provider-token confidentiality behavior.
- Select and integrate a documented real fundamentals provider only when credentials/API terms are available.
- Keep freshness semantics explicit: `staleAt` is an advisory freshness boundary and missing `staleAt` means freshness is unknown.

## Rule
When a task is completed, move it to `memory/completed-work.md` and update `docs/PROJECT_STATE.md`.
