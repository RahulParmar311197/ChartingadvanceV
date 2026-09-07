# Project Memory

## Current truth
The repository contains a React/Vite TradingView-inspired starter and the project operating system. The chart currently uses generated demo data; it is not a production market-data feed.

## Stable decisions
- TypeScript is the target language for new production modules.
- Market-data providers are accessed through adapters.
- Paper trading is the first trading mode.
- Pine compatibility is a dedicated subsystem and is not implemented by evaluating arbitrary JavaScript.
- Persistence and server-side jobs are required for alerts and durable user state.

## Working principles
Prefer small composable packages, explicit interfaces, deterministic calculations, UTC timestamps internally, and user-localized display formatting.

## Known gaps
Realtime data, historical storage, indicator engine, drawing persistence, alert workers, screener, trading simulator, backtesting, authentication, billing, community, observability, and production deployment are not yet implemented.
