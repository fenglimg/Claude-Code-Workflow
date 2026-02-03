# Phase 04: Gap Report + Iterate

## Goal

Compare the generated outlines against:
1) The selected reference command implementation (oracle)
2) The CCW server/tooling corpus (routes, mcp tools, cli internals)

Then propose the smallest set of changes to close gaps.

## Inputs

- `specs/outputs/generated-slash-outline.md`
- `specs/outputs/generated-agent-outline.md`
- `specs/outputs/references.json`
- Tooling scope: `../specs/corpus-scope.md`

## Output

Write:
- `specs/outputs/gap-report.md` (use `../templates/gap-report.md`)
- `specs/outputs/fix-plan.md` (minimal fix list; label each fix with scope)

## Gap Severity

Follow `../specs/quality-gates.md`:
- P0: must-fix (breaks CCW conventions or tool surface)
- P1: should-fix (missing major sections/artifacts)
- P2: optional (nice-to-have)

