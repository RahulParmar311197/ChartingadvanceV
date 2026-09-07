# Changelog

## 2026-09-07
- Added fail-closed production configuration validation for authenticated identity, live-data modes/providers, PostgreSQL persistence, encrypted screener cursors, and explicit CORS origins.
- Added API security response headers, allowlisted CORS, process-local rate limiting with `429`/`Retry-After`, `/ready` database readiness, request-body abort protection, and graceful HTTP/DB shutdown.
- Hardened the market WebSocket with an 8 KiB payload cap, connection-capacity guard, ping/pong heartbeat liveness, and graceful shutdown.
- Added rotating screener cursor keyring support so old encrypted continuation cursors remain readable during controlled key rotation while new cursors use the active key.
- Expanded durable screener continuation storage bounds to accommodate the encrypted cursor envelope while keeping provider cursors bounded.
- Added regression coverage for production security configuration, CORS, rate limiting, security headers, and cursor-key rotation.
- Fixed browser quote fallback so demo development without `VITE_MARKET_API_URL` does not permanently render `No quote`.
- Added the service smoke test to CI and made smoke startup failures fail immediately instead of waiting for an HTTP timeout.

## 2026-09-07
- Added migration `003_screener_continuations.sql` for durable screener continuation state.
- Added in-memory and PostgreSQL continuation repositories with owner/query/provider scoping, single-use atomic consumption, expiry, and expired-row cleanup.
- Kept provider cursors infrastructure-only; continuation identifiers exposed to application callers are independently generated opaque IDs.
- Added regression coverage for scope isolation, expiry, single-use consumption, PostgreSQL query shape, and cleanup.

## 2026-09-07
- Hardened the provider-neutral fundamentals HTTP adapter with page-size and cursor bounds, configurable timeout cancellation, and upstream error propagation without fabricated fallback data.
- Exported the HTTP adapter through the screener-engine package subpath so application infrastructure can consume the transport seam without provider-specific imports.
- Added regression coverage for request-bound enforcement, timeout cancellation, invalid timeout configuration, query translation, timestamp mapping, and upstream HTTP failures.

## 2026-09-07
- Canonicalized fundamentals snapshot `asOf` and `staleAt` timestamps to Unix epoch seconds, matching the market-domain candle convention.
- Updated demo fundamentals fixtures and regression coverage so freshness calculations cannot silently mix millisecond and second timestamps.

## 2026-09-07
- Added a browser screener API client that mirrors the application fundamentals request/result contract without importing provider SDK semantics.
- Added explicit browser continuation state that accumulates pages, forwards opaque application cursors, prevents concurrent loads, rejects repeated cursors, and supports clean reset.
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
