# Agent Outline: memory:style-skill-memory

## Purpose

Implement and/or evolve the slash command according to CCW conventions with minimal regressions.

## Execution Model

- Default: incremental, testable changes
- Use ACE-tool to find existing patterns before adding new abstractions

## State & Artifacts

- Session folder (if used): `.workflow/.scratchpad/style-skill-memory-{timestamp}/`
- Required outputs:
  - Slash MD (command doc): `.claude/commands/memory/style-skill-memory.md`
  - Generated SKILL memory: `.claude/skills/style-{package-name}/SKILL.md`
  - Validation notes (package exists, overwrite rules respected)

## Tooling

- Allowed tools: Bash, Read, Write, TodoWrite
- Non-negotiables:
  - no unrelated changes
  - validate preconditions before writing outputs

## Validation Strategy

- P0 gates: frontmatter + allowed-tools + core sections + artifact references
- Behavioral checks:
  - package auto-detection behavior when no positional arg
  - overwrite protection unless `--regenerate`
  - required JSON inputs exist and parse
  - output SKILL.md is written and verified

