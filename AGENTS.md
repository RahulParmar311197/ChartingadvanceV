# AGENTS.md — Mandatory Agent Contract

This file applies to all AI agents and human contributors working in this repository.

## Before starting work
- Read `PROJECT_BLUEPRINT.md`, `MEMORY.md`, `docs/PROJECT_STATE.md`, and `docs/DECISIONS.md`.
- Inspect the existing implementation before changing it.
- Identify the smallest coherent change that satisfies the request.
- Check whether the requested behavior already exists.

## During work
- Follow the architecture and naming conventions in `docs/ARCHITECTURE.md`.
- Keep provider, domain, UI, and persistence concerns separated.
- Reuse existing components/utilities before adding duplicates.
- Avoid speculative dependencies.
- Never hard-code secrets or credentials.
- Do not claim live market data is real when it is mock/demo data.
- Do not introduce real-money trading behavior without explicit approval.
- Preserve accessibility and responsive behavior.

## Documentation maintenance — mandatory
After any meaningful change, update the relevant files:
- `MEMORY.md`: durable facts, discoveries, and decisions that future agents need.
- `docs/PROJECT_STATE.md`: status, completed work, active work, blockers, and next steps.
- `docs/DECISIONS.md`: architectural/product decisions and their rationale.
- `docs/CHANGELOG.md`: user-visible or structural changes.

If a change does not require an update, explicitly consider that before finishing.

## Validation
At minimum run the applicable checks:
- `npm install` when dependencies changed or no install exists.
- `npm run build` before declaring frontend work complete.
- Tests/lint/type checks when they exist.
- Manually verify affected interaction paths when practical.

## Git discipline
- Use focused commits.
- Commit messages should describe the change, e.g. `feat: add symbol search`.
- Never commit `.env` or credentials.
- Do not rewrite unrelated files.

## Completion report
Every agent completion must report:
1. Changed files.
2. Behavior added/fixed.
3. Validation run and results.
4. Documentation/memory updates.
5. Known limitations and recommended next step.
