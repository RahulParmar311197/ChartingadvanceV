# Architecture

```text
Providers -> Market Data Adapters -> Normalized Domain Events
                                      |
                                      v
                              Data/Cache Layer
                                      |
                 +--------------------+--------------------+
                 |                    |                    |
                 v                    v                    v
            Chart Engine         Indicator Engine      Screener
                 |                    |                    |
                 +--------------------+--------------------+
                                      |
                                Application API
                                      |
                 +--------------------+--------------------+
                 |                    |                    |
                 v                    v                    v
               Alerts           Paper Trading         Backtest
                 |                    |                    |
                 +--------------------+--------------------+
                                      v
                                  Web UI
```

## Boundaries
`market-domain` owns symbols, candles, quotes, sessions and normalized events. `chart-engine` owns rendering state and chart interaction. `indicator-engine` owns pure calculations. `trading-engine` owns orders, fills, positions and risk. `alert-engine` owns conditions and delivery. `strategy-engine` owns deterministic simulation. UI packages consume application contracts and never access provider SDKs directly.

## Runtime requirements
Realtime streams need reconnect/backoff, sequence handling, deduplication and stale-data detection. Historical data needs range queries, pagination and aggregation. Durable jobs require idempotency and retry policies. All financial mutations require audit records.
