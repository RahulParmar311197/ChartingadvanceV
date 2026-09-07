# MEMORY.md — Durable Project Memory

> Mandatory: update this file when durable project knowledge changes.

## Current identity
- Project: TradingView Clone
- Repository: `RahulParmar311197/ChartingadvanceV`
- Default branch: `main`
- Current stage: Phase 0 foundation

## Technology baseline
- React 19
- Vite 6
- Lightweight Charts 5
- Lucide React
- JavaScript/JSX for the current frontend

## Current implementation
- `src/App.jsx` contains the initial workspace shell and demo interactions.
- `src/styles.css` contains the initial dark charting-workspace styling.
- Chart data is generated locally for demonstration; it is NOT live market data.
- Watchlist/search/timeframe UI is functional at the demo level.

## Important constraints
- No secrets in source control.
- Paper trading only until a separately approved brokerage architecture exists.
- External market-data providers must be accessed through an abstraction layer.
- Preserve the project blueprint/agent documentation on every iteration.

## Decisions to remember
- Use Lightweight Charts as the initial chart rendering engine.
- Keep UI code independent from future market-data vendors.
- Prefer feature/domain boundaries as the codebase grows.

## Agent notes
- Read `AGENTS.md` before modifying the project.
- Update this memory when a future agent discovers a durable fact, changes architecture, changes an API contract, or makes a significant product decision.
