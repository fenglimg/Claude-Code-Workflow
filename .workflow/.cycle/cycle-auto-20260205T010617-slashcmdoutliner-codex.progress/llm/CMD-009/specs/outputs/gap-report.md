# Gap Report: flow-create

## Reference

- Selected reference: ccw-plan (`.claude/commands/ccw-plan.md`)

## P0 Gaps (Must Fix)

- `.claude/commands/flow-create.md` has no YAML frontmatter (`name`, `description`, `allowed-tools`, optional `argument-hint`). This prevents CCW from parsing metadata via `parseCommandFrontmatter`.
- Command invocation is inconsistent across docs:
  - docs-site uses `/flow-create`
  - `.claude/commands/flow-create.md` usage examples reference `/meta-skill:flow-create`
  Resolve to `/flow-create` for consistency with CCW docs-site and file naming.
- Missing CCW-standard core sections in `.claude/commands/flow-create.md` (at minimum: Overview, Inputs, Outputs/Artifacts, Error Handling). The doc currently relies on narrative + code blocks without CCW outline scaffolding.
- Implementation pointers need explicit Existing/Planned evidence tables in generated outlines (this output provides it; the command doc should adopt the same discipline when adding pointers).

## P1 Gaps (Should Fix)

- Align heading structure with docs-site (`Features`, `Usage`, `Execution Flow`, phases) to reduce drift between `.claude/commands` and docs-site.
- Add a concise Output Format section that describes the JSON schema (fields + examples) without embedding large code blocks.

## P2 Gaps (Optional)

- Add lightweight validation notes for template JSON (required keys, step normalization) and mention where validation is enforced.

## Implementation Pointers (Evidence)

| Pointer | Status | Evidence | Verify | Notes |
|---|---|---|---|---|
| `.claude/commands/flow-create.md` | Existing | docs: `.claude/commands/flow-create.md` / Flow Template Generator ; ts: `ccw/src/core/routes/commands-routes.ts` / function parseCommandFrontmatter(content: string): CommandMetadata | `Test-Path .claude/commands/flow-create.md` | primary command doc; needs frontmatter + CCW core sections |
| `ccw/src/core/routes/commands-routes.ts` | Existing | docs: `.claude/commands/flow-create.md` / Flow Template Generator ; ts: `ccw/src/core/routes/commands-routes.ts` / function getCommandsDir(location: CommandLocation, projectPath: string): string { | `Test-Path ccw/src/core/routes/commands-routes.ts` | parses frontmatter and serves command metadata via /api/commands |
| `ccw/src/templates/dashboard-js/views/commands-manager.js` | Existing | docs: `.claude/commands/flow-create.md` / Flow Template Generator ; ts: `ccw/src/templates/dashboard-js/views/commands-manager.js` / async function renderCommandsManager() { | `Test-Path ccw/src/templates/dashboard-js/views/commands-manager.js` | UI that consumes /api/commands and displays grouping |
| `ccw/docs-site/docs/commands/general/flow-create.mdx` | Existing | docs: `.claude/commands/flow-create.md` / Flow Template Generator ; ts: `ccw/src/core/routes/commands-routes.ts` / function parseCommandFrontmatter(content: string): CommandMetadata | `Test-Path ccw/docs-site/docs/commands/general/flow-create.mdx` | public docs already standardized on /flow-create |

## Implementation Hints (Tooling/Server)

- CCW command metadata parsing is frontmatter-based: `ccw/src/core/routes/commands-routes.ts` uses `parseCommandFrontmatter(...)`. Any command doc without frontmatter will default to empty name/description and group `other`.
- Commands UI fetches `/api/commands`: `ccw/src/templates/dashboard-js/views/commands-manager.js` calls `fetch('/api/commands?path=' + ...)`, so improving frontmatter directly improves UI display.

## Proposed Fix Plan (Minimal)

1. Update `.claude/commands/flow-create.md`:
   - Add YAML frontmatter (name/description/argument-hint/allowed-tools).
   - Normalize examples + usage to `/flow-create`.
   - Add CCW core sections (Overview, Inputs, Outputs/Artifacts, Execution Process, Error Handling).
2. Verify CCW surfaces:
   - Run the dashboard and confirm `/api/commands` returns a populated description + allowed-tools for flow-create.
   - Ensure docs-site and `.claude/commands` content do not contradict command invocation.
3. Run evidence gate:
   - `node .codex/skills/slash-command-outliner/scripts/verify-evidence.js --file=.workflow/.cycle/cycle-auto-20260205T010617-slashcmdoutliner-codex.progress/llm/CMD-009/specs/outputs/generated-slash-outline.md --file=.workflow/.cycle/cycle-auto-20260205T010617-slashcmdoutliner-codex.progress/llm/CMD-009/specs/outputs/gap-report.md`

