# Changelog

## 2026-09-07
- Added paper portfolio mark-to-market valuation to the application workflow using deterministic demo quotes.
- Equity and unrealized P&L now update from held-position marks while cash remains unchanged.
- Added trading-engine valuation regression coverage for marked and unmarked positions.

## 2026-09-07
- Added paper-order cancellation and replacement workflows at the application boundary using the shared order lifecycle contract.
- Persisted accepted paper orders in the demo application store so untriggered limit/stop orders can be cancelled or replaced without touching filled terminal orders.
- Added deterministic lifecycle audit events for submission, acceptance, rejection, fill, cancellation, and replacement.
- Added bounded paper audit reads with per-demo-user isolation.
- Added paper-only HTTP cancellation, replacement, and audit endpoints with explicit simulated metadata; no brokerage execution path was introduced.
- Added browser paper-trading lifecycle client methods for audit, cancellation, and replacement.
- Added regression coverage for terminal-order protection, replacement semantics, audit ordering, user isolation, and bounded audit reads.

## 2026-09-07
- Fixed drawing endpoint drag lifecycle by keeping the chart-construction effect independent of selection state.
- Wired DOM pointer capture for endpoint dragging, updating an immutable render preview during movement and committing the final point only on pointer release.
- Added a browser paper-trading API client with explicit API configuration failure semantics rather than silent client-side simulation.
- Integrated a Trading Panel into the workspace with market/limit/stop/stop-limit order controls, portfolio summary, positions, result/error messaging, and explicit paper-only disclosure.
- Added browser-client regression coverage for configuration errors, demo identity propagation, JSON order serialization, and API error propagation.
