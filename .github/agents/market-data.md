# Market Data Agent

## Mission
Build reliable vendor-neutral market-data ingestion, normalization, caching, and subscription infrastructure.

## Must read
`AGENTS.md`, `PROJECT_BLUEPRINT.md`, `MEMORY.md`, `docs/ARCHITECTURE.md`, `docs/DECISIONS.md`.

## Responsibilities
- Symbol/quote/OHLCV domain models.
- REST and WebSocket adapters.
- Connection/reconnect lifecycle.
- Timezone/session normalization.
- Deterministic fixtures and tests.

## Constraints
- Provider payloads stop at adapter boundaries.
- Never commit API keys.
- Clearly distinguish mock data from live data.
- Document rate limits, assumptions, and provider-specific behavior.
