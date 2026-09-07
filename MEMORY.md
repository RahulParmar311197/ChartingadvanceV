# Project Memory

## Current truth
The repository contains a React/Vite TradingView-inspired market-analysis and paper-trading platform with deterministic demo market/fundamentals data. The product is not a production live-market system yet.

## Stable decisions
- TypeScript is the target language for new production modules.
- Market-data providers are accessed through adapters.
- Paper trading is the first trading mode.
- Pine compatibility is a dedicated subsystem and is not implemented by evaluating arbitrary JavaScript.
- Persistence and server-side jobs are required for alerts and durable user state.
- Production runtime fails closed rather than silently operating on demo identity/data.

## Working principles
Prefer small composable packages, explicit interfaces, deterministic calculations, UTC timestamps internally, and user-localized display formatting. Never treat demo data as live or provider-complete. Never expose provider cursors or secrets to browser clients.

## Current hardening
- API has production configuration gates, allowlisted CORS, security headers, bounded request rate limiting, `/health` liveness, `/ready` dependency readiness, body-size abort protection, and graceful shutdown.
- Market WebSocket has bounded payloads, connection caps, heartbeat liveness, and graceful shutdown.
- Screener continuation cursors are encrypted with AES-256-GCM; the keyring supports active-key issuance plus previous-key decryption for rotation.

## Known gaps
- Authenticated identity/authorization is not implemented; `x-demo-user-id` remains a demo-only identity boundary.
- No licensed live market-data or fundamentals provider adapter is installed.
- No durable production market database or production WebSocket provider exists.
- Process-local API/WebSocket limits are not a replacement for shared edge/gateway controls.
- Alerts worker, durable alert delivery, community, billing, deployment automation, and full observability are not implemented.
- Drawings still need richer geometry and durable server persistence.
- Backtesting remains deterministic candle-level simulation and does not model full exchange microstructure.
