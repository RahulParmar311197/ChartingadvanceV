# Active Work

## Current milestone
Phase 6 — Screener/fundamentals provider hardening and application workflows.

## Completed in this slice
- Durable paper persistence boundary documented with transactional, idempotency, optimistic-concurrency, and authorization invariants.
- In-memory repository adapter implemented and tested.
- Paper application state migrated from direct Maps to repository-backed account, portfolio, order, fill, ledger, and audit stores.
- Canonical paper order-list endpoint/client added and Trading Panel now uses stored order status for open-order controls.
- Versioned workspace persistence contract added with owner binding, schema version, validation, and optimistic revisions.
- PostgreSQL paper repository adapter added with transaction support and idempotent durable writes.
- PostgreSQL migration runner added with ordered transactional migration application.
- Position snapshot migration added so durable paper portfolios can recover held positions after restart.
- PostgreSQL portfolio saves now use optimistic account-version checks, including initial durable portfolio initialization.
- Paper application service now has an injected asynchronous repository boundary, allowing the same application workflow to use memory or PostgreSQL without provider-specific branching.
- API startup now supports explicit `PAPER_PERSISTENCE=postgres` with `DATABASE_URL`; development defaults remain deterministic in-memory, while `NODE_ENV=production` defaults to PostgreSQL and fails fast if `DATABASE_URL` is absent.
- Added PostgreSQL adapter contract tests for row mapping, optimistic portfolio writes, stale writes, commit, and rollback behavior.
- Wired the versioned PostgreSQL workspace repository/application service into the API durable mode while preserving the legacy in-memory demo workspace mode.
- Added workspace ETag/revision metadata and 409 optimistic-concurrency handling for durable updates.
- Restored workspace application validation at the persistence boundary and aligned the TypeScript workspace contract with the actual application state shape.

## Immediate tasks
- Add real-database restart/recovery and concurrent lifecycle integration tests, plus migration smoke coverage against PostgreSQL.
- Audit paper-service mutation sequences for transaction wrapping so order lifecycle, fills, ledger, audit, and portfolio snapshots commit atomically in PostgreSQL mode.
- Continue backtesting application integration, then dedicated script runtime, community, authentication, and production hardening in roadmap order.

## Rule
When a task is completed, move it to `memory/completed-work.md` and update `docs/PROJECT_STATE.md`.
