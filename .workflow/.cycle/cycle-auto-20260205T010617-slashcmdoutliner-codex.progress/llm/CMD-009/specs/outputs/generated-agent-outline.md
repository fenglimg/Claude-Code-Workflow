# Agent Outline: flow-create

## Purpose

Implement and/or evolve the `/flow-create` slash command documentation and supporting CCW integrations (UI/docs) with minimal regressions.

## Execution Model

- Default: incremental, testable changes (doc changes first, then UI/docs alignment)
- Use repo search to confirm existing patterns before adding new structure

## State & Artifacts

- Primary command doc: `.claude/commands/flow-create.md`
- Supporting surfaces (if updated):
  - `ccw/docs-site/docs/commands/general/flow-create.mdx`
  - CCW Commands UI/API via `ccw/src/core/routes/commands-routes.ts`

## Tooling

- Allowed tools (for the command): AskUserQuestion(*), Read(*), Write(*)
- Non-negotiables:
  - no unrelated changes
  - no false "Existing" claims in pointer tables

## Validation Strategy

- P0 gates: frontmatter + allowed-tools + core sections + artifact references
- Evidence: verify pointer tables via `node .codex/skills/slash-command-outliner/scripts/verify-evidence.js`

## Evidence (Pointers)

| Pointer | Status | Evidence | Verify | Notes |
|---|---|---|---|---|
| `.claude/commands/flow-create.md` | Existing | docs: `.claude/commands/flow-create.md` / Flow Template Generator ; ts: `ccw/src/core/routes/commands-routes.ts` / function parseCommandFrontmatter(content: string): CommandMetadata | `Test-Path .claude/commands/flow-create.md` | source doc to align with CCW frontmatter + sections |

