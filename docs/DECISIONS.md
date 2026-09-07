# Architecture Decision Log

## ADR-001 — Initial chart engine
**Status:** Accepted

Use Lightweight Charts for the initial chart rendering layer because it provides a focused financial-charting primitive while allowing application-specific workspace behavior around it.

## ADR-002 — Provider abstraction
**Status:** Accepted

Market-data vendor payloads must not leak into UI components. Normalize provider data behind an adapter/interface so providers can be changed without rewriting the chart workspace.

## ADR-003 — Paper trading first
**Status:** Accepted

The project will implement simulation/paper trading before any real brokerage integration. Real-money functionality requires an explicit architecture and security review.

## ADR-004 — Documentation is part of delivery
**Status:** Accepted

Blueprint, agent instructions, durable memory, project state, and decision records are maintained as first-class project artifacts. Meaningful changes must update them.

## ADR-005 — Feature-oriented growth
**Status:** Accepted

As the starter grows, code will move from the initial single-page implementation toward feature/domain modules rather than one large application component.
