# Agent Workflow

## Mandatory startup sequence
1. Read `AGENTS.md`.
2. Read `PROJECT_BLUEPRINT.md`.
3. Read `MEMORY.md`.
4. Read `docs/PROJECT_STATE.md`.
5. Read `docs/DECISIONS.md`.
6. Inspect relevant source files and recent history.

## Planning
Before implementation, write a short plan in the task/PR description. Identify impacted modules, contracts, tests, and documentation.

## Handoff protocol
At handoff, record:
- completed work
- files changed
- assumptions
- unresolved issues
- tests/validation
- next recommended action

Update `MEMORY.md` only with durable information; do not turn it into a running chat transcript.

## Conflict resolution
Priority order:
1. Explicit current user requirement
2. `PROJECT_BLUEPRINT.md`
3. `AGENTS.md`
4. Accepted ADRs in `docs/DECISIONS.md`
5. Existing implementation conventions
6. Agent preference

When a new requirement conflicts with an accepted decision, document the new decision rather than silently deviating.
