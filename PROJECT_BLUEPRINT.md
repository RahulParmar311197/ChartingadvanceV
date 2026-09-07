# TradingView Clone — Project Blueprint

## Mission
Build a production-quality TradingView-inspired charting platform while keeping the project modular, testable, documented, and maintainable.

## Non-negotiables
1. `AGENTS.md` is the operating contract for every agent/contributor.
2. `MEMORY.md` is the durable project memory. Update it when architecture, decisions, APIs, or important behavior changes.
3. `docs/PROJECT_STATE.md` is the current source of truth for implementation status and next work.
4. Every meaningful architectural decision must be recorded in `docs/DECISIONS.md`.
5. Do not silently replace existing behavior. Preserve backwards compatibility or document breaking changes.
6. Never commit secrets, API keys, private credentials, or real brokerage credentials.
7. Run validation before declaring work complete: install/build/test/lint where available.
8. Prefer small, reviewable changes over large rewrites.
9. Keep UI, domain logic, data access, and infrastructure separated.
10. Trading functionality is simulation-only until a deliberately designed brokerage integration is approved.

## Product scope
### Phase 0 — Foundation
- React/Vite application shell
- Charting workspace
- Watchlist
- Symbol search
- Timeframe controls
- Chart and volume rendering
- Responsive dark UI
- Documentation/agent operating system

### Phase 1 — Market data
- Provider abstraction
- Historical OHLCV REST adapter
- Live quote/trade WebSocket adapter
- Connection state and reconnection
- Symbol metadata
- Market sessions/time zones
- Cached data and rate-limit handling

### Phase 2 — Charting engine
- Candlestick, line, area, bars
- Crosshair and cursor modes
- Drawing tools
- Pan/zoom
- Multiple panes
- Indicators and overlays
- Chart templates
- Layout persistence

### Phase 3 — Research
- Watchlists
- Screener
- News
- Symbol details
- Financials
- Economic/market overview
- Alerts

### Phase 4 — Trading simulation
- Paper account
- Positions/orders/fills
- Risk checks
- P&L
- Order ticket
- Replay/backtest infrastructure

### Phase 5 — Platform
- Authentication
- User persistence
- Cloud layouts
- Collaboration/sharing
- Observability
- CI/CD
- Security hardening

## Architecture principles
- Feature-first modules with explicit domain boundaries.
- Pure calculation/indicator logic where possible.
- Provider interfaces instead of vendor-specific logic leaking into UI.
- Server authority for persisted/user-sensitive state.
- Deterministic tests for indicators, orders, and transformations.
- UI components should receive data/actions through hooks or feature services, not global mutable state.

## Definition of done
A feature is done only when code, tests, documentation, project memory/state, and validation are updated as applicable. The final response must state what changed, validation performed, known limitations, and follow-up work.
