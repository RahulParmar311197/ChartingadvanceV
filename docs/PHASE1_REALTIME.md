# Phase 1 Realtime Boundary

## Scope

The first realtime implementation is deliberately a local/demo transport. It establishes the wire contract needed by the web client without claiming exchange connectivity.

## WebSocket

- Endpoint: `ws://localhost:8788`
- Client sends JSON: `{ "type": "subscribe", "symbols": ["EXCHANGE:TICKER"] }`
- Server sends `status` and `quote` events.
- Every event has a strictly increasing `sequence` value within the gateway process.
- Provider is always reported as `demo` and the stream is explicitly simulated.

## Workspace state

The initial workspace service is an in-memory boundary keyed by a caller-supplied user id. It is intentionally not authentication or durable storage. It validates symbol identifiers before accepting watchlist state.

## Production replacement

A licensed provider adapter, authenticated session identity, durable database, connection authorization, reconnect/backoff policy, heartbeat, rate limiting, and observability must be added before this transport can be considered production market infrastructure.
