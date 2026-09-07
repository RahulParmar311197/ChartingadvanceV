# Permanent Project Rules

These rules apply to every agent, contributor, and automated coding session.

## 1. Source of truth
The blueprint defines intent; architecture defines boundaries; decisions explain exceptions; memory preserves durable context; project state records reality.

## 2. Before coding
Inspect existing code and documentation. Identify dependencies, affected modules, contracts, migrations, tests, and rollback impact.

## 3. During coding
Use TypeScript where practical. Keep UI, domain logic, infrastructure, and providers separated. Prefer interfaces and dependency inversion for external services. Avoid giant components and hidden global state.

## 4. Financial correctness
Use integer/minor units or decimal-safe representations where monetary precision matters. Never use floating-point equality for money. Normalize timestamps to UTC internally and retain exchange/session timezone metadata.

## 5. Realtime correctness
Handle reconnects, out-of-order events, duplicate events, gaps, stale subscriptions, backpressure, and provider outages. Every market-data stream must expose connection state.

## 6. Security
Validate all external input. Apply authentication and authorization server-side. Rate-limit public endpoints. Sanitize user-generated content. Audit sensitive operations. Keep secrets in environment/secret stores only.

## 7. Trading safety
Paper trading is the default. Real brokerage actions require explicit integration boundaries, user authorization, idempotency, audit logging, risk controls, and kill-switch behavior.

## 8. Testing
New domain behavior requires unit tests. Cross-service behavior requires integration tests. Critical user journeys require E2E coverage. Performance-sensitive chart/data paths require benchmarks or profiling evidence when practical.

## 9. Documentation maintenance
Any material change must update the relevant project state, memory, decision record, API/domain documentation, and changelog. Do not allow documentation to describe behavior that no longer exists.

## 10. No fake completeness
Do not mark a feature complete when it is only a visual placeholder. Label mocks, stubs, simulations, and unsupported capabilities explicitly.

## 11. Original implementation
Build an original product inspired by common charting workflows. Do not copy proprietary TradingView source code, private APIs, protected assets, or branding.

## 12. Definition of done
Code + tests + error handling + observability where appropriate + docs/memory updates + review of security/performance/regression impact.
