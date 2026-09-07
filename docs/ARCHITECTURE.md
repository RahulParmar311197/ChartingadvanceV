# Architecture

## Target structure
```text
src/
  app/                 Application composition, routes, providers
  components/          Reusable presentational UI
  features/
    chart/             Chart workspace, panes, drawings, indicators
    watchlist/         Watchlists and symbol selection
    market-data/       Quotes, candles, sessions, provider adapters
    screener/          Screening UI and query model
    alerts/            Alert rules and notifications
    trading/           Paper trading domain and order UI
    replay/            Historical replay/backtest UI
  domain/              Vendor-neutral models and business rules
  hooks/               Shared React hooks
  lib/                 Infrastructure utilities
  services/            Application services and adapters
  state/               App/session state
  styles/              Global design tokens/styles
```

## Data flow
`Provider -> adapter -> normalized market-data model -> state/service -> feature hook -> UI`

UI components must not know provider-specific payload shapes.

## Domain boundaries
### Market data
Responsible for symbols, quotes, OHLCV, sessions, subscriptions, and connection state.

### Chart
Responsible for viewport, series, drawing objects, indicators, panes, templates, and chart interaction state.

### Trading
Responsible for orders, positions, fills, account balance, risk checks, and P&L. The initial implementation is paper trading only.

### Persistence
Responsible for user/layout/watchlist storage. Keep persistence behind interfaces so local storage can later be replaced by an API.

## State strategy
Use local React state for isolated UI. Use a dedicated store only for cross-feature state. Avoid putting server data and ephemeral UI state into one undifferentiated global object.

## Testing strategy
- Unit tests: indicators, calculations, normalization, order/risk rules.
- Component tests: search, watchlist, order ticket, dialogs.
- Integration tests: market-data subscription -> chart update; order -> fill -> position.
- E2E: critical navigation and paper-trading flows.

## Security
Treat market data as untrusted input. Validate API responses. Keep secrets server-side. Enforce authorization server-side for persisted user resources and trading actions.
