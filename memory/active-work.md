# Active Work

## Current milestone
Phase 9 — production hardening is active while Phase 6 screener integration remains the current product milestone.

## Completed in this slice
- Added fail-closed production configuration gates for authenticated proxy identity, live data modes, explicit provider configuration, PostgreSQL persistence, encrypted screener continuation keys, and explicit CORS origins.
- Added a signed proxy-HMAC principal boundary with replay-window validation and constant-time signature comparison; demo identity remains explicit development-only behavior.
- Enforced authenticated principals at the API boundary in production.
- Added API security response headers, allowlisted CORS, process-local rate limiting, `/health` liveness, `/ready` database readiness, request-body abort protection, and graceful shutdown.
- Hardened the market WebSocket with bounded payloads, connection-capacity protection, ping/pong heartbeat liveness, and graceful shutdown.
- Added screener cursor key rotation with active-key issuance and previous-key decryption.
- Increased durable screener continuation storage bounds to fit the bounded encrypted envelope.
- Added service smoke coverage to CI and improved startup-failure detection; corrected the smoke backtest fixture after CI exposed invalid candle semantics.
- Fixed browser quote fallback so development without an API URL uses the explicitly simulated demo provider instead of a permanent `No quote` state.

## Verification state
- Typecheck, unit tests, and production build passed in CI run 34118624634 before the smoke fixture fix.
- That CI run correctly failed the new smoke test because its third backtest candle violated the enforced low <= open/close/high invariant; the fixture was corrected in commit `322fd590f6a6ff7156120c5530b8c5c2d932c6da`.
- A new CI run is expected for the corrected head; do not claim the latest head CI-verified until that run completes successfully.

## Immediate tasks
- Complete a real market-data adapter behind the existing market-domain provider contract; production must remain blocked until a licensed provider and terms are configured.
- Complete a real fundamentals adapter behind the existing screener provider contract; production must remain blocked until a documented provider and terms are configured.
- Deploy the signed proxy-HMAC identity boundary behind an actual authenticated edge/IdP gateway, or replace it with a first-party identity adapter.
- Move API rate limiting and WebSocket connection coordination to a shared edge/gateway layer for horizontally scaled production.
- Add structured observability: request IDs, metrics, traces, dependency health, and alerting.
- Add deployment automation, TLS/secret management, database backup/restore drills, migration rollout/rollback checks, and security review.
- Keep freshness semantics explicit and preserve canonical Unix epoch-second timestamps.

## Rule
When a task is completed, move it to `memory/completed-work.md` and update `docs/PROJECT_STATE.md`.
