# Architecture Decisions

## ADR-001 — Independent implementation
Status: accepted. Build an independent implementation of the product concepts and workflows; do not copy proprietary TradingView source code, private APIs, or protected assets.

## ADR-002 — Provider abstraction
Status: accepted. All market data enters through provider adapters and is normalized into internal domain contracts.

## ADR-003 — TypeScript for production modules
Status: accepted. New services/packages use TypeScript unless a specialized runtime requires another language.

## ADR-004 — Paper trading first
Status: accepted. Real brokerage connectivity is blocked until the paper-trading ledger, risk controls, audit trail and security review are complete.

## ADR-005 — Dedicated script runtime
Status: accepted. Pine-compatible behavior is implemented by a dedicated parser/runtime/sandbox rather than arbitrary code execution.

## ADR-006 — Fail-closed production runtime
Status: accepted. Production API/runtime startup must fail closed unless authenticated identity, real market/fundamentals provider configuration, PostgreSQL persistence, encrypted screener continuation keys, and explicit CORS origins are configured. Demo providers and demo identity are development/demo capabilities only. Runtime hardening includes security headers, request limits, liveness/readiness endpoints, bounded WebSocket payload/connections, heartbeat liveness, and graceful shutdown. Process-local limits are not treated as a substitute for an edge/shared production limiter.

## ADR-007 — Signed proxy identity boundary
Status: accepted. Until a first-party identity adapter is selected, production application ownership is established by a trusted authentication gateway that supplies `x-auth-user`, `x-auth-timestamp`, and an HMAC-SHA256 `x-auth-signature` over `<timestamp>.<userId>`. The API verifies the signature in constant time and enforces a bounded clock-skew window. The shared secret is deployment-managed and never committed. Demo identity remains available only outside production.
