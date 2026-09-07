# Project Blueprint

## Mission
Build an independent, TradingView-class market-analysis and paper-trading platform. Reproduce product capabilities and workflows, not proprietary source code, assets, or branding.

## Non-negotiables
1. Architecture and contracts are documented before implementation.
2. Market data is normalized behind provider adapters.
3. UI never owns business rules.
4. Real-money trading is out of scope until paper trading, risk, audit, and security gates pass.
5. Every agent must read `AGENTS.md`, `MEMORY.md`, and `docs/PROJECT_STATE.md` before changing code.
6. Every meaningful change updates the relevant decision/state/changelog records.
7. No secrets, credentials, or vendor keys are committed.

## Capability map
- Chart workspace: symbols, timeframes, chart types, panes, scales, crosshair, drawings, templates.
- Market data: historical OHLCV, quotes, trades, sessions, corporate actions, realtime streams.
- Technical analysis: indicator registry, calculations, overlays, oscillators, custom studies.
- Alerts: price, indicator, drawing, strategy and webhook alerts.
- Trading: paper accounts, orders, fills, positions, P&L, fees, margin and risk.
- Backtesting: deterministic historical simulation, slippage, commission, metrics and reports.
- Screener: technical/fundamental filters, ranking and saved screens.
- Pine-compatible roadmap: parser, AST, runtime, series semantics and sandbox.
- Platform: auth, profiles, persistence, notifications, billing and audit.
- Community: publishing, ideas, scripts, comments, follows and moderation.

## Delivery order
Phase 0 Project OS -> Phase 1 Chart Core -> Phase 2 Indicators/Drawings -> Phase 3 Alerts -> Phase 4 Paper Trading -> Phase 5 Backtesting -> Phase 6 Screener/Fundamentals -> Phase 7 Script Runtime -> Phase 8 Community -> Phase 9 Production hardening.

## Definition of done
Feature has a written contract, tests, error states, telemetry expectations, accessibility review, responsive behavior, security review where applicable, and updated project state.
