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

## Evidence-Based Requirements (Deep Mode, P0)

This phase must be evidence-based. Do NOT turn “planned work” into “validated facts”.

1) **Pointers must be labeled**
   - Every implementation pointer (file/module/CLI subcommand/tool entry) MUST be labeled `Existing` or `Planned`.

2) **No false existence claims**
   - Anything labeled `Existing` MUST be verifiable in the repo now (at least path existence).
   - If you cannot verify, downgrade to `Planned` and add a concrete `Verify` step.

3) **Dual-source evidence**
   - This gap-report MUST reference both:
     - command docs: `.claude/commands/**.md`
     - TypeScript implementation: `ccw/src/**`
   - Evidence can be a section heading (docs) or a function/subcommand anchor / `rg`-able string (TS).

4) **Concrete verify commands**
   - For each `Existing` pointer, include at least one verify command:
     - `Test-Path <path>`
     - `rg "<pattern>" <path>`

## Deterministic Gate (Required)

After generating the gap-report and slash outline, you MUST run the deterministic evidence gate:

```bash
node .codex/skills/slash-command-outliner/scripts/verify-evidence.js --file=specs/outputs/gap-report.md
node .codex/skills/slash-command-outliner/scripts/verify-evidence.js --file=specs/outputs/generated-slash-outline.md
```

If this gate fails, treat it as **P0** (must-fix): your output contains unverifiable `Existing` claims and/or missing dual-source evidence.

Safety note:
- This script performs safe checks (path exists + anchor text contains) and does NOT execute arbitrary shell commands.


