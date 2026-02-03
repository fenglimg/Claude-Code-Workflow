# Validation (v0.1.0)

**Cycle**: cycle-v1-20260203T001806-slashcmdoutliner-qmhuep  
**Updated**: 2026-02-03T00:20:48+08:00

## Acceptance Gate Checklist

### A1) Slash corpus is complete

- File exists:
  - `.workflow/.cycle/cycle-v1-20260203T001806-slashcmdoutliner-qmhuep.progress/corpus/corpus-manifest.json`
- `total_commands` equals the count of `.claude/commands/**/*.md` (excluding `_disabled/` + `node_modules/`).

### A2) TODO covers all commands exactly once

- File exists:
  - `.workflow/.cycle/cycle-v1-20260203T001806-slashcmdoutliner-qmhuep.progress/TODO_LIST.md`
- For every entry in `corpus-manifest.json` there is exactly one `CMD-XXX` line in TODO.

### A3) Tooling corpus included for gap analysis

- File exists:
  - `.workflow/.cycle/cycle-v1-20260203T001806-slashcmdoutliner-qmhuep.progress/corpus/tooling-manifest.json`
- Manifest roots include:
  - `ccw/src/server/routes`
  - `ccw/src/mcp-server`
  - `ccw/src/tools`
  - `ccw/src/commands`

### A4) Non-regression gate is enforced (policy + storage)

- Directories exist:
  - `.workflow/.cycle/cycle-v1-20260203T001806-slashcmdoutliner-qmhuep.progress/regression/expected/`
  - `.workflow/.cycle/cycle-v1-20260203T001806-slashcmdoutliner-qmhuep.progress/regression/current/`
  - `.workflow/.cycle/cycle-v1-20260203T001806-slashcmdoutliner-qmhuep.progress/regression/diff/`
- Policy (must hold for every generator change):
  - No new P0 gaps for any previously completed command
  - No breakage of core structure (frontmatter, allowed-tools, required phases/sections)

## Manual Sanity Checks (first iteration)

- Skill skeleton exists:
  - `.claude/skills/slash-command-outliner/SKILL.md`
- Brainstorm linkage exists:
  - `.workflow/.brainstorm/BS-slash-command-outliner-2025-02-02/brainstorm.md`
  - `.workflow/.brainstorm/BS-slash-command-outliner-2025-02-02/synthesis.json`

## Regression Strategy (once generator exists)

For each command marked completed:
1) Generate normalized outline JSON into `regression/current/`
2) Compare against `regression/expected/`
3) Output diffs into `regression/diff/`
4) Block if any P0 gap appears or required structure regresses

## Latest Run (Corpus-Wide)

Executed (deterministic) full-corpus regression:
- Command: `node .claude/skills/slash-command-outliner/scripts/regress-all.js --cycle-id=cycle-v1-20260203T001806-slashcmdoutliner-qmhuep`
- Result:
  - Commands processed: 82 / 82
  - P0 gaps: 0
  - P1 gaps: 164

Notes:
- Some legacy/non-standard command docs lack `allowed-tools` (and sometimes full frontmatter). The harness forces a minimal placeholder in derived spec to keep generated outlines CCW-aligned; P1 diffs remain for section mismatches.
