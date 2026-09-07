# Changelog

## 2026-09-07
- Added a browser strategy-tester client for the application backtest endpoint.
- Added a Strategy Tester workspace panel with deterministic Buy & Hold controls, return/P&L/drawdown/trade metrics, equity visualization, and benchmark comparison display.
- Strategy Tester loads the current symbol/interval candle window and sends it through the API application boundary; no arbitrary client-side strategy execution is exposed.
- Added browser-client regression coverage for successful requests and structured API errors.
- Added explicit simulation limitations for candle-level backtesting in the UI.

## 2026-09-07
- Added the application-level backtest boundary with a bounded candle request contract and an allowlisted built-in Buy & Hold strategy.
- Added `POST /v1/backtest` with deterministic strategy-engine execution and optional benchmark comparison.
- Added application regression coverage for deterministic results, benchmark comparison, and rejection of arbitrary/oversized strategies.

## 2026-09-07
- Hardened concurrent duplicate paper client-order handling: a PostgreSQL unique-key race is converted into the same deterministic duplicate-order response as the preflight duplicate path.
- Added regression coverage that simulates a unique-key race and verifies no second stored order is created.

## 2026-09-07
- Added an application-level transaction boundary around paper order submission, cancellation, and replacement when the repository supports transactions.
- PostgreSQL lifecycle mutations now commit order transitions, fills, portfolio snapshots, ledger writes, and audit events atomically through the transaction-scoped repository.
- Added regression coverage proving accepted paper lifecycle mutations enter the transaction boundary.

## 2026-09-07
- Wired the versioned PostgreSQL workspace repository/application service into the durable API mode while preserving deterministic in-memory demo mode.
- Added owner-scoped workspace reads, schema-version metadata, ETag revision responses, and optimistic-concurrency conflict handling.
- Restored workspace watchlist/symbol/interval validation at the application persistence boundary and aligned the TypeScript persistence contract with the actual workspace state.

## 2026-09-07
- Hardened PostgreSQL portfolio persistence with optimistic account-version checks, including initial portfolio initialization and stale-write rejection.
- Converted the paper application service to an injected asynchronous repository boundary so durable and in-memory persistence share the same application workflow.
- Added explicit `PAPER_PERSISTENCE=postgres` API startup mode backed by `DATABASE_URL`; development remains deterministic/in-memory by default and production defaults to PostgreSQL with fail-fast configuration.
- Added PostgreSQL adapter contract tests for account mapping, portfolio concurrency, transaction commit, rollback, and error preservation.

## 2026-09-07
- Added a PostgreSQL paper-trading repository adapter using an injected pool/transaction boundary, optimistic order/account updates, idempotent fill/ledger/audit writes, and account-scoped reads.
- Added a PostgreSQL migration runner with ordered, transactional migration application and a schema-migrations ledger.
- Added migration `002_paper_positions.sql` so position snapshots survive process restart alongside paper account state.
- Added the `pg` runtime dependency and explicit `db:migrate` script; normal API startup remains demo/in-memory unless durable wiring is enabled.

## 2026-09-07
- Added a versioned workspace persistence contract with explicit owner binding and optimistic revision semantics.
- Added repository-level paper persistence coverage for account concurrency, account-scoped order identity, stale lifecycle transitions, and idempotent audit appends.
- Routed paper application state through an in-memory repository adapter instead of direct service-level Maps, while retaining the explicit demo-only persistence boundary.
- Added `GET /v1/paper/orders` and a browser order-list client method so open-order UI state comes from canonical order records rather than reconstructing lifecycle state from a bounded audit window.
- Added CORS support for `DELETE` paper-order requests.
