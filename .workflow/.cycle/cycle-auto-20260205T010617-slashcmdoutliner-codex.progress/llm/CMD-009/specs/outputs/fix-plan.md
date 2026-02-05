# Fix Plan: flow-create

## Goal

Make `.claude/commands/flow-create.md` CCW-aligned (frontmatter + core sections) and consistent with docs-site invocation `/flow-create`, without introducing regressions.

## Steps (Minimal)

1. Add YAML frontmatter to `.claude/commands/flow-create.md`
   - `name: flow-create`
   - `description: ...` (single sentence)
   - `argument-hint: "[template-name] [--output <path>]"`
   - `allowed-tools: AskUserQuestion(*), Read(*), Write(*)`
2. Normalize invocation strings
   - Replace `/meta-skill:flow-create` examples with `/flow-create` to match `ccw/docs-site/docs/commands/general/flow-create.mdx`.
3. Add/reshape core sections (keep content concise)
   - `## Overview`, `## Usage`, `## Inputs`, `## Outputs / Artifacts`, `## Execution Process`, `## Error Handling`, `## Examples`
4. Keep phase headings (non-leaky)
   - Preserve phase labels (Template Design / Step Definition / Generate JSON) but reduce embedded code blocks where possible.
5. Validate in CCW UI/API
   - Confirm `/api/commands` shows a non-empty description + allowed-tools for flow-create.

## Verify

- `Test-Path .claude/commands/flow-create.md`
- `Test-Path ccw/docs-site/docs/commands/general/flow-create.mdx`
- `node .codex/skills/slash-command-outliner/scripts/verify-evidence.js --file=.workflow/.cycle/cycle-auto-20260205T010617-slashcmdoutliner-codex.progress/llm/CMD-009/specs/outputs/generated-slash-outline.md --file=.workflow/.cycle/cycle-auto-20260205T010617-slashcmdoutliner-codex.progress/llm/CMD-009/specs/outputs/gap-report.md --file=.workflow/.cycle/cycle-auto-20260205T010617-slashcmdoutliner-codex.progress/llm/CMD-009/specs/outputs/generated-agent-outline.md --file=.workflow/.cycle/cycle-auto-20260205T010617-slashcmdoutliner-codex.progress/llm/CMD-009/specs/outputs/fix-plan.md`

## Evidence (Pointers)

| Pointer | Status | Evidence | Verify | Notes |
|---|---|---|---|---|
| `.claude/commands/flow-create.md` | Existing | docs: `.claude/commands/flow-create.md` / Flow Template Generator ; ts: `ccw/src/core/routes/commands-routes.ts` / function parseCommandFrontmatter(content: string): CommandMetadata | `Test-Path .claude/commands/flow-create.md` | update target for frontmatter + CCW core sections |

