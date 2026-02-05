# Agent Outline: workflow:generate

## Purpose

Implement and/or evolve the slash command according to CCW conventions with minimal regressions.

## Execution Model

- Default: incremental, testable changes
- Use ACE-tool to find existing patterns before adding new abstractions
- For `/workflow:ui-design:generate`: keep the command as a pure assembler (no new content generation)

## State & Artifacts

- Session folder (if used): `.workflow/active/WFS-*/...`
- Required outputs:
  - Slash MD (command doc): `.claude/commands/workflow/ui-design/generate.md`
  - Generated prototypes: `{base_path}/prototypes/*`
  - Preview files: `{base_path}/prototypes/compare.html`, `index.html`, `PREVIEW.md`

## Tooling

- Allowed tools: TodoWrite(*), Read(*), Write(*), Task(ui-design-agent), Bash(*)
- Non-negotiables:
  - no unrelated changes
  - verify non-regression against completed corpus

## Validation Strategy

- P0 gates: frontmatter + allowed-tools + core sections + artifact references
- Deterministic evidence gate: verify evidence tables in outline + gap report
- Runtime checks (command-level):
  - base path resolution priority is correct
  - generated file count matches styles * layouts * targets
  - preview artifacts exist and contain basic expected markers (DOCTYPE, CSS links)
