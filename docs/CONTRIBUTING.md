# Contributing

## Workflow
1. Read `AGENTS.md` and project-state documentation.
2. Create a focused branch for non-trivial work.
3. Implement the smallest coherent change.
4. Add/update tests where behavior changes.
5. Update `MEMORY.md`, `docs/PROJECT_STATE.md`, `docs/DECISIONS.md`, and `docs/CHANGELOG.md` as applicable.
6. Run `npm run build` and available tests/lint.
7. Open a focused PR with validation notes.

## Commit format
Prefer:
- `feat:` new functionality
- `fix:` bug fix
- `refactor:` structural change
- `test:` tests
- `docs:` documentation
- `chore:` maintenance

## Review checklist
- Does the change respect architecture boundaries?
- Are existing flows preserved?
- Are edge cases handled?
- Are secrets absent?
- Is demo/live data clearly distinguished?
- Are docs and project memory current?
