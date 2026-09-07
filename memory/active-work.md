# Active Work

## Current milestone
Phase 6 — Screener/fundamentals provider hardening and application workflows.

## Completed in this slice
- Durable paper persistence boundary documented with transactional, idempotency, optimistic-concurrency, and authorization invariants.
- In-memory repository adapter implemented and tested.
- Paper application state migrated from direct Maps to repository-backed account, portfolio, order, fill, ledger, and audit stores.
- Canonical paper order-list endpoint/client added and Trading Panel now uses stored order status for open-order controls.
- Versioned workspace persistence contract added with owner binding and optimistic revisions.

## Immediate tasks
- Add a concrete durable database schema/adapter behind the repository contract.
- Add restart/recovery and concurrent lifecycle tests against the durable adapter.
- Integrate the versioned workspace repository into the existing workspace API while retaining explicit demo authorization boundaries.
- Continue backtesting application integration, then dedicated script runtime, community, authentication, and production hardening in roadmap order.

## Rule
When a task is completed, move it to `memory/completed-work.md` and update `docs/PROJECT_STATE.md`.
