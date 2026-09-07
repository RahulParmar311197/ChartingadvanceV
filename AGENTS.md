# Agent Operating Rules

Before work: read `PROJECT_BLUEPRINT.md`, `MEMORY.md`, `docs/PROJECT_STATE.md`, `docs/ARCHITECTURE.md`, and applicable agent profile.

During work:
- Keep domain logic out of presentation components.
- Prefer typed contracts and deterministic functions.
- Never bypass market-data adapters.
- Never introduce real brokerage execution without an explicit architecture decision and security approval.
- Add tests for changed behavior.
- Preserve backwards compatibility unless a decision record approves a breaking change.
- Do not delete working functionality to make a task easier.

After work:
- Update `memory/active-work.md` and `docs/PROJECT_STATE.md`.
- Add an ADR to `docs/DECISIONS.md` for consequential architectural choices.
- Add an entry to `docs/CHANGELOG.md`.
- Record unresolved risks and follow-up work.

Handoff must include: objective, files changed, behavior changed, tests run, known issues, next recommended action.
