# ADR-0004 — Realtime event sequencing

**Status:** Accepted

All normalized realtime market events carry a monotonically increasing sequence number. Consumers must reject events whose sequence is not strictly newer than their last accepted sequence. This provides a transport-neutral ordering primitive for WebSocket reconnects, duplicate delivery, and future provider fan-out.

The sequence is not a substitute for exchange timestamps or provider-specific trade identifiers; those remain part of future provider adapters where required.
