# Changelog

## 2026-09-07
- Added an RSI 14 oscillator adapter in the indicator engine with deterministic warmup and timestamp mapping tests.
- Added a real secondary RSI chart pane to the web workspace using Lightweight Charts.
- Added fixed 0–100 RSI scaling and 70/30 reference levels.
- Added an Indicators menu toggle for RSI 14; it is explicitly local UI state and is not yet persisted in the demo workspace contract.
- Added source entrypoints for chart, indicator, market-domain, alert, and trading packages.
- Added a dedicated TypeScript package-contract typecheck configuration and CI gate.

## 2026-09-07
- Wired the web workspace to load normalized state from the demo workspace API and debounce saves after user state changes.
- Added SMA 20 and EMA 50 chart overlay controls backed by the indicator engine and Lightweight Charts line series.
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
