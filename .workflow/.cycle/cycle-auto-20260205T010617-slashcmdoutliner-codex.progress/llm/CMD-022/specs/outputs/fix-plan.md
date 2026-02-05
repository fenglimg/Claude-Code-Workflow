# Fix Plan: memory:style-skill-memory

## Scope: Command Doc (P0)

- Document `.workflow/reference_style/{package-name}/` as a required precondition and add a fail-fast error message that points to `/workflow:ui-design:codify-style`.
- Specify overwrite rule precisely: do not overwrite `.claude/skills/style-{package-name}/SKILL.md` unless `--regenerate`.
- Require a post-write verification step: check the output SKILL.md exists before reporting success.

## Scope: Reproducibility (P1)

- Clarify whether SKILL generation is template-driven. If template-driven, document the template source location and required files.
- Define the minimal completion summary fields (component counts + whether animation tokens exist).

## Verify Steps

- `Test-Path .claude/commands/memory/style-skill-memory.md`
- `Test-Path .claude/commands/workflow/ui-design/codify-style.md`
- `Test-Path ccw/src/tools/command-registry.ts`
- `node .codex/skills/slash-command-outliner/scripts/verify-evidence.js --file=.workflow/.cycle/cycle-auto-20260205T010617-slashcmdoutliner-codex.progress/llm/CMD-022/specs/outputs/generated-slash-outline.md`
- `node .codex/skills/slash-command-outliner/scripts/verify-evidence.js --file=.workflow/.cycle/cycle-auto-20260205T010617-slashcmdoutliner-codex.progress/llm/CMD-022/specs/outputs/gap-report.md`

