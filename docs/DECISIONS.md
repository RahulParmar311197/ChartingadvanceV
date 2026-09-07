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
