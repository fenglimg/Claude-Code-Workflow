# Fix Plan: memory:update-related

## P0 (Must)

- [docs] Add `allowed-tools: Task(*), AskUserQuestion(*), Read(*), Write(*), Bash(*)` to `.claude/commands/memory/update-related.md` frontmatter (and keep `argument-hint` as-is).
- [docs] If adding `allowed-tools` becomes a convention for memory commands, apply the same change to sibling command docs for consistency (optional but reduces future drift).

## P1 (Should)

- [docs] Make the safety verification section portable:
  - Keep the intent ("only CLAUDE.md changed") but avoid a single-platform `grep` snippet; include a PowerShell equivalent or a `ccw tool` check if one exists.

## Verify (Concrete)

- `Test-Path .claude/commands/memory/update-related.md`
- `Test-Path ccw/src/tools/detect-changed-modules.ts`
- `Test-Path ccw/src/tools/update-module-claude.js`
- `node .codex/skills/slash-command-outliner/scripts/verify-evidence.js --file=.workflow/.cycle/cycle-auto-20260205T010617-slashcmdoutliner-codex.progress/llm/CMD-025/specs/outputs/generated-slash-outline.md`
- `node .codex/skills/slash-command-outliner/scripts/verify-evidence.js --file=.workflow/.cycle/cycle-auto-20260205T010617-slashcmdoutliner-codex.progress/llm/CMD-025/specs/outputs/gap-report.md`
