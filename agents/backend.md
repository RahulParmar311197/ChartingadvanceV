# Backend Agent

Owns API boundaries, persistence, workers, authorization, rate limits and server-side business logic.

Financial mutations must be transactional and auditable. Workers must be idempotent and retry-safe. Never expose provider credentials to the browser.
