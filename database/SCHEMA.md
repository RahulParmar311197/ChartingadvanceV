# Data Model

Core persistence entities:

- users
- user_preferences
- symbols
- exchanges
- watchlists
- watchlist_items
- chart_layouts
- chart_drawings
- alerts
- alert_events
- paper_accounts
- orders
- fills
- positions
- ledger_entries
- saved_screens
- strategies
- backtest_runs
- audit_events

All IDs are opaque identifiers. Timestamps are stored in UTC. Financial mutation tables require immutable audit linkage.
