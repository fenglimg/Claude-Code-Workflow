# Agent Outline: workflow:lite-execute

## Purpose

Implement and/or evolve the `/workflow:lite-execute` slash command to execute tasks from an in-memory plan, prompt, or file, with progress tracking and optional review.

## Execution Model

- Default: incremental, testable changes
- Use ACE-tool to find existing patterns before adding new abstractions

## State & Artifacts

- Primary command doc: `.claude/commands/workflow/lite-execute.md`
- Related upstream command: `.claude/commands/workflow/lite-plan.md`
- User/project config files (optional):
  - `.workflow/project-guidelines.json`
  - `.workflow/project-tech.json`

## Tooling

- Allowed tools: TodoWrite(*), Task(*), Bash(*)
- Non-negotiables:
  - no unrelated changes
  - verify non-regression for existing commands if any docs/templates/scripts are touched

## Validation Strategy

- P0 gates: frontmatter + allowed-tools + core sections + artifact references
- Evidence: implementation pointers labeled Existing/Planned with dual-source evidence
- Regression: if updating shared outliner templates/scripts, run corpus regression snapshots