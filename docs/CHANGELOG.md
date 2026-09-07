# Changelog

## 2026-09-07
- Fixed drawing endpoint drag lifecycle by keeping the chart-construction effect independent of selection state.
- Wired DOM pointer capture for endpoint dragging, updating an immutable render preview during movement and committing the final point only on pointer release.
- Added a browser paper-trading API client with explicit API configuration failure semantics rather than silent client-side simulation.
- Integrated a Trading Panel into the workspace with market/limit/stop/stop-limit order controls, portfolio summary, positions, result/error messaging, and explicit paper-only disclosure.
- Added browser-client regression coverage for configuration errors, demo identity propagation, JSON order serialization, and API error propagation.

## 2026-09-07
- Added a paper-trading application service with isolated demo-user accounts, risk admission, order lifecycle submission, deterministic demo execution, fill application, and portfolio retrieval.
- Added paper-only HTTP endpoints for portfolio reads and order submission, with explicit simulated metadata and no brokerage execution path.
- Added application regression coverage for successful fills, user isolation, risk rejection, short-sale rejection, and untriggered limit orders.
- Documented the demo execution policy: generated last price is used as both bid and ask, a fixed demo fee rate is applied, short selling is disabled, and order/position limits are enforced.

## 2026-09-07
- Replaced the duplicated JavaScript screener runtime with the canonical TypeScript screener implementation.
- Added `tsx` as the Node runtime bridge so API/realtime entrypoints can execute TypeScript package contracts without a second implementation.
- Removed the obsolete TypeScript/JavaScript runtime conformance test now that there is a single screener implementation.
- Hardened the fundamentals provider/application boundary with validation for provider page shape, finite freshness timestamps, staleAt ordering, and bounded next cursors.
- Added application-level regression coverage for multi-page cursor forwarding, limit propagation, freshness transitions, and malformed provider pagination metadata using a synthetic provider.
- Added a dedicated screener-engine package with normalized fundamental snapshots, typed numeric filters, AND/OR filter groups, deterministic scoring, and bounded results.
- Added regression coverage for operators, missing fundamentals, grouping, ranking, limits, and invalid input.
- Added a fundamentals provider/application boundary with freshness metadata and bounded pagination semantics.
- Added a deterministic demo fundamentals API endpoint and centralized HTTP request validation for symbols, filters, groups, operators, ranges, limits, cursors, and full query objects.
- Added regression coverage for the complete screener request-validation boundary.
- Kept demo screener pagination explicit: the provider returns no next cursor because the demo dataset has no additional page.
- Added a browser screener API client with local filter validation and normalized query serialization.
- Integrated a fundamentals screener panel into the workspace with filter controls, deterministic ranking/score display, freshness status, and explicit simulated-data disclosure.
- Added browser-client regression coverage.

## 2026-09-07
- Added deterministic backtesting support for opt-in short positions, average-entry tracking, realized P&L, win rate, profit factor, net/average trade P&L, maximum drawdown, equity curve, and Sharpe-style performance measurement.
- Added a benchmark comparison contract for strategy return, buy-and-hold return, excess return, and benchmark terminal value.
- Added regression coverage for long/short execution policy, realized P&L, and benchmark comparison.

## 2026-09-07
- Added deterministic alert evaluation for threshold and crossing operators, disabled rules, cooldowns, invalid values, and stable delivery IDs.
- Added unit coverage for alert triggering, crossing semantics, cooldown blocking, and invalid inputs.
- Added deterministic paper-trading execution primitives for market, limit, stop, and stop-limit orders using explicit bid/ask inputs.
- Added paper-order validation, fee calculation, rejected/accepted/filled lifecycle outcomes, deterministic fill IDs, and position fill accounting with realized P&L.
- Added unit coverage for order validation, trigger semantics, fills, invalid execution inputs, and realized P&L.

## 2026-09-07
- Added drawing drag lifecycle primitives for validating editable endpoints, creating unlocked drag state, producing immutable preview drawings, and finalizing a preview for persistence through the chart-engine update contract.
- Added unit coverage for locked endpoint rejection, invalid endpoint rejection, immutable drag previews, and invalid preview coordinates.
