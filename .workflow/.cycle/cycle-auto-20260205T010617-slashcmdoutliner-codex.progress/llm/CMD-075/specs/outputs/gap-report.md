# Gap Report: workflow:ui-design:reference-page-generator

## Reference

- Selected reference: /workflow:ui-design:generate (`.claude/commands/workflow/ui-design/generate.md`)

## P0 Gaps (Must Fix)

- **Command identity normalization risk**: the oracle command doc frontmatter uses `name: workflow:ui-design:reference-page-generator` while the CCW outline template expects `group: workflow` + `name: ui-design:reference-page-generator`. Decide one convention and align docs/tooling to avoid ambiguous invocation strings.
- **Overwrite safety must be preserved**: refuse to overwrite a non-empty package directory unless it can be validated as a prior generated package (e.g., `metadata.json` exists).
- **Hard validation paths must be explicit**: required inputs inside `--design-run` must be checked before copying (layout templates + design tokens).

## P1 Gaps (Should Fix)

- Document the default `--output-dir` clearly (and ensure it is reflected in the completion message).
- Ensure all optional behaviors are stated as conditional: animation tokens copy, metadata-based overwrite, component count reporting.

## P2 Gaps (Optional)

- Add a short note about optional dependencies used in Bash snippets (e.g., `jq`) and ensure the flow degrades gracefully when missing.

## Implementation Pointers (Evidence)

| Pointer | Status | Evidence | Verify | Notes |
|---|---|---|---|---|
| `.claude/commands/workflow/ui-design/reference-page-generator.md` | Existing | docs: `.claude/commands/workflow/ui-design/reference-page-generator.md` / Execution Process ; ts: `ccw/src/core/routes/commands-routes.ts` / function scanCommandsRecursive( | `Test-Path .claude/commands/workflow/ui-design/reference-page-generator.md` | Oracle contract for behavior, artifacts, and safety rules |
| `.claude/agents/ui-design-agent.md` | Existing | docs: `.claude/commands/workflow/ui-design/reference-page-generator.md` / Phase 2: Preview Generation (Final Phase) ; ts: `ccw/src/core/routes/commands-routes.ts` / function parseCommandFrontmatter(content: string): CommandMetadata | `Test-Path .claude/agents/ui-design-agent.md` | Agent contract for generating preview.html/preview.css |
| `ccw/src/core/routes/commands-routes.ts` | Existing | docs: `.claude/commands/ccw-coordinator.md` / Universal Prompt Template ; ts: `ccw/src/core/routes/commands-routes.ts` / function scanCommandsRecursive( | `Test-Path ccw/src/core/routes/commands-routes.ts; rg \"parseCommandFrontmatter\" ccw/src/core/routes/commands-routes.ts` | How command docs are discovered and frontmatter is parsed for tooling |
| `.workflow/reference_style` | Planned | docs: `.claude/commands/workflow/ui-design/reference-page-generator.md` / Output Structure ; ts: `ccw/src/config/storage-paths.ts` / join(projectPath, '.workflow', '.cli-history') | `Test-Path .workflow/reference_style` | Default output root for generated packages |
| `ccw/src/config/storage-paths.ts` | Existing | docs: `.claude/commands/workflow/execute.md` / Workflow File Structure Reference ; ts: `ccw/src/config/storage-paths.ts` / join(projectPath, '.workflow', '.cli-history') | `Test-Path ccw/src/config/storage-paths.ts` | `.workflow/` conventions used across workflow/issue systems |

## Implementation Hints (Tooling/Server)

- `ccw/src/core/routes/commands-routes.ts` provides recursive scanning of `.claude/commands` and parses `allowed-tools` from frontmatter for dashboards/management.
- `ccw/src/config/storage-paths.ts` documents `.workflow/` conventions; keep default output dir under `.workflow/` unless there is a strong reason not to.

## Proposed Fix Plan (Minimal)

1. Normalize command identity in the command doc frontmatter (`group` + `name` without redundant prefix), or document why the current naming is intentional.
2. Keep overwrite protection and required-input validation as P0 invariants.
3. Ensure outputs are exactly: copied JSON artifacts + generated `preview.html`/`preview.css`, with a clear completion message.

