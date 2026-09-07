# Durable Persistence Boundary

## Purpose
Define the storage contract required to move paper trading from process-local demo state to durable application state without coupling the trading engine to a database implementation.

## Boundary
The `trading-engine` remains pure domain logic. Persistence belongs to the application/API layer behind an explicit repository interface.

### Aggregate records
- `paper_accounts`: account identity, currency, cash, buying power, equity, version, created/updated timestamps.
- `paper_orders`: immutable client order ID, account ID, symbol, side, type, sizing/prices, lifecycle status, timestamps, replacement linkage.
- `paper_fills`: immutable fill ID, order ID, account ID, symbol, side, quantity, price, fee, timestamp.
- `paper_ledger_entries`: immutable ledger ID, account ID, entry type, signed amount, currency, timestamp, reference ID.
- `paper_audit_events`: append-only event ID, account ID, order ID where applicable, event type, timestamp, reason, correlation ID.

## Required repository operations
```text
getAccount(accountId)
createAccount(account)
updateAccount(account, expectedVersion)
getOrder(accountId, orderId)
insertOrder(order)
transitionOrder(accountId, orderId, expectedStatus, nextOrder)
insertFill(fill)
appendLedgerEntry(entry)
appendAuditEvent(event)
listAuditEvents(accountId, limit, before?)
runTransaction(work)
```

The concrete adapter may use PostgreSQL, SQLite for local development, or another transactional store, but the domain package must not import the adapter.

## Transaction invariants
1. Order acceptance and its acceptance audit event commit atomically.
2. Fill insertion, ledger mutation, position/account mutation, and fill audit event commit atomically.
3. Cancellation/replacement must use an optimistic version/status check so two concurrent requests cannot both mutate an accepted order.
4. Client order IDs are unique per account and enforced by a storage constraint, not only application memory.
5. Fill IDs are unique and fill application is idempotent.
6. Audit events are append-only; corrections are new events, never updates/deletes.
7. Account mutations require an expected version to prevent lost updates.
8. Repository transactions must be retry-safe only where the operation is explicitly idempotent.

## Authorization
The repository accepts an already-authorized account identity. HTTP authentication/authorization is an application concern. A user-supplied demo header is not a production authorization mechanism.

## Migration strategy
1. Introduce repository interfaces and an in-memory adapter implementing the same contract.
2. Move the current paper service off direct Maps and onto that interface.
3. Add a transactional durable adapter and schema migrations.
4. Add restart/recovery tests and concurrent lifecycle tests.
5. Only then remove the demo-only persistence warning.

## Current status
The existing paper service remains intentionally in-memory. This document defines the production boundary; it does not claim durable persistence has been implemented.
