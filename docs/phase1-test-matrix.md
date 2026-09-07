# Phase 1 Verification Matrix

| Area | Behavior | Test status |
|---|---|---|
| Market domain | deterministic candles repeat exactly | Added |
| Market domain | OHLCV invariants | Added |
| Market domain | quote symbol/timestamp/finite values | Added |
| Realtime | stale/equal sequences rejected | Added |
| Indicators | SMA warmup and values | Added |
| Indicators | EMA warmup and values | Added |
| Indicators | RSI rising-series behavior | Added |
| Indicators | invalid period rejection | Added |
| HTTP API | request parsing and response envelope | Pending integrated runner |
| WebSocket | subscription lifecycle | Pending gateway |
| Watchlist | provider-backed quote refresh | Pending |
| Workspace | persisted chart/watchlist state | Pending |

Tests are intentionally being added before live-provider integration so deterministic domain behavior remains independently verifiable.
