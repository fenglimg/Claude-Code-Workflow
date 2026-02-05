# Agent Outline: memory:docs-full-cli

## Purpose

Implement and/or evolve the `/memory:docs-full-cli` slash command according to CCW conventions with minimal regressions.

## Execution Model

- Default: incremental, testable changes to command docs + any touched tooling glue
- Evidence-first: confirm existing tooling surfaces (ccw tools + CLI executor) before adding new abstractions

## State & Artifacts

- Primary artifacts:
  - `.claude/commands/memory/docs-full-cli.md` (command doc)
  - `.workflow/docs/{project_name}/**/*.md` (generated documentation output)
- Optional session folder (if adding execution helpers):
  - `.workflow/...` (only if the command explicitly writes there)

## Tooling

- Allowed tools: AskUserQuestion(*), Bash(*), Task(*)
- Non-negotiables:
  - no unrelated changes
  - approval gate before any write-producing execution
  - verify non-regression against completed command corpus conventions (frontmatter + core sections)

## Validation Strategy

- P0 gates:
  - frontmatter completeness (`name`, `description`, `allowed-tools`)
  - core sections present (Overview/Usage/Execution Process/Outputs/Error Handling)
  - no broken artifact references (mark external dependencies as pre-existing)
- Execution verification:
  - confirm `.workflow/docs/{project_name}/` exists and contains expected `.md` outputs
  - summarize success/failure and tool fallback usage

