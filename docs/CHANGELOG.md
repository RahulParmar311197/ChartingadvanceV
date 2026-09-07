# Changelog

## 2026-09-07
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
- Added browser-client regression tests and TypeScript/JavaScript runtime conformance coverage.

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

## 2026-09-07
- Added a browser-local drawing-series adapter that maps domain prices to Lightweight Charts values and sorts a render-only copy by time, preserving the immutable drawing model when users click endpoints in reverse chronological order.
- Added regression coverage for reversed drawing endpoints and non-mutating series conversion.

## 2026-09-07
- Added browser drawing interaction primitives for toolbar-to-domain tool mapping, chart-coordinate conversion, two-click draft progression, commit thresholds, and generated IDs.
- Wired the primary chart Line and Trend Line tools to create actual two-point drawings through the chart-engine immutable drawing-state contract.
- Rendered stored drawings as Lightweight Charts line series and added drawing selection by clicking a rendered drawing.
- Added Delete/Backspace and toolbar deletion for the selected drawing, plus Escape to exit drawing/selection mode.
- Kept drawing persistence explicitly client-session scoped; the server workspace contract is unchanged until a versioned, authorized persistence schema is defined.

## 2026-09-07
- Added an immutable chart-engine drawing-state model with validation, add/update/remove operations, visibility, and locking semantics.
- Added unit coverage for drawing-state immutability, duplicate IDs, invalid points, lock behavior, and lifecycle operations.
- Added a browser-local crosshair synchronization bus with subscription lifecycle tests and wired it between the primary and RSI Lightweight Charts panes.
- Confirmed GitHub Actions run 148 passed package typecheck, tests, and production build for the crosshair synchronization slice.

## 2026-09-07
- Added an RSI 14 oscillator adapter in the indicator engine with deterministic warmup and timestamp mapping tests.
- Added a real secondary RSI chart pane to the web workspace using Lightweight Charts.
- Added fixed 0–100 RSI scaling and 70/30 reference levels.
- Added an Indicators menu toggle for RSI 14; it is explicitly local UI state and is not yet persisted in the demo workspace contract.
- Added source entrypoints for chart, indicator, market-domain, alert, and trading packages.
- Added a dedicated TypeScript package-contract typecheck configuration and CI gate.

## 2026-09-07
- Wired the web workspace to load normalized state from the demo workspace API and debounce saves after user state changes.
- Added SMA 20 and EMA 50 chart overlay controls backed by the indicator engine and Lightweight Charts.
- Kept workspace identity explicitly demo-only and non-authenticated.

## 2026-09-07 — Phase 1 transport and chart core
- Advanced Phase 1 chart-core architecture with normalized realtime market-event contracts.
- Repaired chart-engine dependency on the canonical market-domain Candle type.
- Added deterministic SMA, EMA, and RSI calculation layer.
- Added executable unit-test coverage for market-data invariants, realtime sequence ordering, and indicators.
- Added shared deterministic demo market core, quote HTTP endpoint, demo WebSocket gateway, resilient web realtime client, and server-backed demo workspace boundary.
- Kept demo-provider semantics explicit; no live-market guarantees are introduced.

## 2026-09-07 — Project OS
- Added project blueprint, rules, master prompt, agent roles, durable memory, architecture, roadmap, state, decisions, CI and contribution conventions.
- Added initial React/Vite chart workspace and deterministic demo market-data boundary.
