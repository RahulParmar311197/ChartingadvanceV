# Active Work

## Current milestone
Phase 6 — Screener/fundamentals provider hardening and application workflows.

## Completed in this slice
- Durable paper persistence boundary documented with transactional, idempotency, optimistic-concurrency, and authorization invariants.
- In-memory repository adapter implemented and tested.
- Paper application state migrated from direct Maps to repository-backed account, portfolio, order, fill, ledger, and audit stores.
- Canonical paper order-list endpoint/client added and Trading Panel now uses stored order status for open-order controls.
- Versioned workspace persistence contract added with owner binding and optimistic revisions.
- PostgreSQL paper repository adapter added with transaction support and idempotent durable writes.
- PostgreSQL migration runner added with ordered transactional migration application.
- Position snapshot migration added so durable paper portfolios can recover held positions after restart.

## Immediate tasks
- Wire the PostgreSQL repository into the API through an explicit production configuration path while keeping demo mode deterministic and isolated.
- Add real-database restart/recovery and concurrent lifecycle integration tests.
- Integrate the versioned workspace repository into the existing workspace API while retaining explicit demo authorization boundaries.
- Continue backtesting application integration, then dedicated script runtime, community, authentication, and production hardening in roadmap order.

## Rule
When a task is completed, move it to `memory/completed-work.md` and update `docs/PROJECT_STATE.md`.
