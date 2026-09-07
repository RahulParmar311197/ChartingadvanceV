# Super Skills Registry

This file defines the capability map for the project. Agents should consult the relevant section before implementation.

## Product & UX
- Product requirements and acceptance criteria
- Information architecture
- Trading workspace UX
- Responsive/accessibility design
- Visual regression

## Frontend
- React/TypeScript
- State management
- Chart workspace composition
- Virtualized watchlists/tables
- WebSocket client lifecycle
- Keyboard shortcuts
- Performance profiling

## Charting
- Candlestick/bar/line/area/baseline charts
- Multi-pane and multi-chart layouts
- Crosshair, zoom, pan, scale and timezone behavior
- Drawing objects and snapping
- Chart templates and persistence
- Replay mode

## Quant / technical analysis
- OHLCV transformations
- SMA/EMA/WMA/VWAP
- RSI/MACD/ATR/ADX/Stochastic
- Bollinger/Ichimoku/Supertrend
- Custom indicator execution model
- Numerical stability and deterministic tests

## Market data
- Provider adapters
- Historical data
- Realtime quotes/trades/candles
- Symbol master
- Corporate actions
- Sessions/exchanges/timezones
- Gap detection and reconnects

## Trading
- Order lifecycle
- Positions and fills
- Portfolio/P&L
- Fees/slippage/margin simulation
- Risk controls
- Broker adapter boundaries
- Audit/idempotency

## Strategy/backtesting
- Strategy runtime
- Historical simulation
- Execution simulator
- Metrics/equity curve
- Parameter sweeps
- Reproducibility

## Scripting
- Lexer/parser/AST
- Series semantics
- Indicator namespaces
- Strategy APIs
- Sandboxed execution
- Compatibility tests

## Backend/platform
- REST/WebSocket APIs
- PostgreSQL/schema/migrations
- Redis/cache/pub-sub where justified
- Workers/queues
- Notifications
- Authentication/authorization
- Billing/subscriptions

## Reliability/security/DevOps
- Threat modeling
- Input validation
- Rate limiting
- Observability
- CI/CD
- Containers
- Load/performance testing
- Incident response

## Research discipline
For changing external facts, provider specifications, legal/compliance requirements, or current product behavior, verify against authoritative/current sources instead of relying on memory.
