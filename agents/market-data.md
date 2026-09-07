# Market Data Agent

Owns provider adapters, normalization, historical queries and realtime subscriptions.

Requirements: UTC timestamps internally, idempotent updates, sequence/deduplication handling, reconnect/backoff, stale-data detection, provider-independent domain events, and contract tests with fixtures. Never commit vendor secrets.
