# Changelog

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
- Added explicit package-boundary documentation and Phase 1 verification matrix.
- Added shared deterministic demo market core, quote HTTP endpoint, demo WebSocket gateway, resilient web realtime client, and server-backed demo workspace boundary.
- Kept demo-provider semantics explicit; no live-market guarantees are introduced.

## 2026-09-07 — Project OS
- Added project blueprint, rules, master prompt, agent roles, durable memory, architecture, roadmap, state, decisions, CI and contribution conventions.
- Added initial React/Vite chart workspace and deterministic demo market-data boundary.
