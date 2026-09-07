# TradingView Clone

A React/Vite market-charting workspace with a deterministic demo market-data path and an incremental TradingView-class architecture.

## Stack

- React 19
- Vite
- Lightweight Charts
- Lucide React
- TypeScript package domain/engine modules
- Vitest

## Run locally

```bash
npm install
npm run dev
```

The frontend works without external market-data credentials by using the explicitly simulated deterministic demo provider.

## GitHub Codespaces

The repository includes `.devcontainer/devcontainer.json` for a reproducible Node 20 development environment. Create a Codespace from the repository and run:

```bash
npm run typecheck:packages
npm run test
npm run build
```

For the interactive frontend:

```bash
npm run dev -- --host 0.0.0.0
```

Codespaces forwards the frontend on port `5173`, the demo REST API on `8787`, and the demo WebSocket gateway on `8788`.

To exercise the optional local API and WebSocket services in separate terminals:

```bash
npm run api
npm run realtime
```

## Verification gate

The CI workflow runs the same core gate:

```bash
npm install
npm run typecheck:packages
npm run test
npm run build
```

## Included

- Dark charting workspace
- Symbol search and watchlist
- Interactive timeframes and viewport controls
- Candlestick, volume, SMA/EMA overlays, and synchronized RSI pane
- Synchronized chart range and crosshair behavior
- Immutable drawing state
- Two-point line/trendline drawing, selection, and deletion
- Deterministic demo market-data provider, REST API, and WebSocket contract
- In-memory demo workspace API

## Current boundaries

The demo market provider is simulated and deterministic. Workspace persistence is in-memory, the demo identity header is not authentication, and drawings are currently browser-session state rather than durable server state. Real-money trading, broker execution, licensed live feeds, and production authentication are not implemented.

## Roadmap

1. Charting core hardening
2. Technical analysis
3. Alerts
4. Trading/paper trading with explicit safety controls
5. Backtesting
6. Screener/fundamentals
7. Pine-compatible runtime
8. Community features
9. Production infrastructure
