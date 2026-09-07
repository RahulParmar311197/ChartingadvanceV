# System of Record

ChartingadvanceV uses the following precedence for project decisions:

1. Explicit current user requirement
2. `PROJECT_BLUEPRINT.md`
3. `PROJECT_RULES.md` and `AGENTS.md`
4. Architecture and accepted decision records
5. Current project state
6. Memory and historical notes
7. Agent assumptions

When two sources conflict, do not silently choose an assumption. Record the conflict and resolve it against the higher-priority source.

## Required maintenance chain

Every meaningful implementation change should evaluate:

`Blueprint -> Rules/Agents -> Architecture -> Code -> Tests -> Project State -> Memory -> Decisions -> Changelog`

## Capability principle

The project may use specialized agents and tools, but no agent is assumed to have unlimited capability. Missing information, unavailable integrations, and unverified external facts must be stated explicitly.
