# Fix Plan: CMD-032 (/workflow:clean)

## Scope

Close gaps between the generated outlines and the oracle command doc while preserving CCW conventions and safety.

## Minimal Fix List

1) Doc outline (P1)
- Add a compact `cleanup-manifest.json` schema summary (fields + meanings) and the expected `cleanup-report.md` sections.
- Make platform differences explicit for staleness detection (Linux/Mac vs Windows PowerShell via bash).

2) Metadata normalization (P1)
- Verify whether `group: workflow` is required for workflow commands.
- If required, add `group: workflow` to `.claude/commands/workflow/clean.md` and validate command discovery still works.

3) Safety policy (P2)
- Add an explicit never-delete list and risk-level defaults for `--yes/-y`.

## Verify Steps

- Evidence tables gate:
  - `node .codex/skills/slash-command-outliner/scripts/verify-evidence.js --file=.workflow/.cycle/cycle-auto-20260205T010617-slashcmdoutliner-codex.progress/llm/CMD-032/specs/outputs/generated-slash-outline.md`
  - `node .codex/skills/slash-command-outliner/scripts/verify-evidence.js --file=.workflow/.cycle/cycle-auto-20260205T010617-slashcmdoutliner-codex.progress/llm/CMD-032/specs/outputs/gap-report.md`
- Pointer verification (existing):
  - `Test-Path .claude/commands/workflow/clean.md`
  - `Test-Path ccw/src/tools/command-registry.ts`

