# Changelog

## 2026-09-07
- Canonicalized fundamentals snapshot `asOf` and `staleAt` timestamps to Unix epoch seconds, matching the market-domain candle convention.
- Updated demo fundamentals fixtures and regression coverage so freshness calculations cannot silently mix millisecond and second timestamps.

## 2026-09-07
- Added a browser screener API client that mirrors the application fundamentals request/result contract without importing provider SDK semantics.
- Added explicit browser continuation state that accumulates pages, forwards opaque application cursors, prevents concurrent page loads, rejects repeated cursors, and supports clean reset.
- Added browser regression coverage for query/symbol/limit/cursor encoding, multi-page accumulation, repeated-cursor protection, reset behavior, and response metadata shape.

## 2026-09-07
- Added explicit screener freshness states: `fresh`, `stale`, and `unknown`; missing `staleAt` is no longer represented as confirmed freshness.
- Added a provider continuation progress guard rejecting a `nextCursor` identical to the incoming request cursor.
- Added regression coverage for non-advancing cursors and all freshness states.

## 2026-09-07
- Added a screener provider progress guard: pages may not advertise a continuation cursor while returning zero items.
- Added regression coverage preventing empty-page cursor loops at the fundamentals application boundary.

## 2026-09-07
- Added explicit screener completeness semantics: a provider continuation cursor marks the returned coverage as partial, while an exhausted provider page is marked complete.
- Hardened provider and request cursors to reject empty continuation tokens in addition to the existing length/type bounds.
- Added regression coverage for partial/complete coverage and cursor invariants.

## 2026-09-07
- Added strategy-engine defensive candle validation for direct non-HTTP callers.
- Centralized backtest candle invariants across application and strategy-engine boundaries without moving application request-size limits into the domain runtime.
- Added direct-engine regression coverage for malformed chronology, OHLC relationships, non-finite prices, and invalid volume.

## 2026-09-07
- Hardened the backtest application boundary with strict candle timestamp chronology and OHLC/volume semantic validation.
- Rejected malformed timestamps, duplicate/non-monotonic bars, non-positive/non-finite prices, impossible high/low relationships, and negative/non-finite volume.
- Applied the same validation contract to optional benchmark candle input and added regression coverage.

## 2026-09-07
- Added interval-aware Sharpe annualization to the strategy engine for 1m/5m/15m/1H/4H/1D/1W/1M intervals.
- Added explicit annualization metadata to the backtest application response.
- Added regression coverage for intraday, daily, weekly, and monthly period assumptions.
