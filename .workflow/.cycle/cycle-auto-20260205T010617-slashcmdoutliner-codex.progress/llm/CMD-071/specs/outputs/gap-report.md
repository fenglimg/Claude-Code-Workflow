# Gap Report: workflow:generate

## Reference

- Selected reference: /workflow:ui-design:generate (`.claude/commands/workflow/ui-design/generate.md`)

## P0 Gaps (Must Fix)

- None identified for this outline set (frontmatter/tooling/core sections present; artifact refs are explicit; evidence tables included).

## P1 Gaps (Should Fix)

- The generated slash outline is intentionally terse vs the oracle command doc; if used as a rewrite target, it should re-add:
  - detailed bash snippets for each validation sub-step (path resolution, multi-file checks)
  - the full quality checklist and recovery strategies
  - explicit batching limits (max layouts per agent, max concurrent agents) if those are enforced operationally

## P2 Gaps (Optional)

- Add a small set of concrete sample matrices (e.g. styles=2, layouts=3, targets=2) to clarify expected output counts and naming.

## Implementation Pointers (Evidence)

You MUST provide an evidence table for all key implementation pointers mentioned in the outlines.

Rules (P0):
- Every pointer MUST be labeled `Existing` or `Planned`.
- `Existing` MUST be verifiable (path exists). Include a concrete `Verify` command for each existing pointer.
- Do NOT describe `Planned` pointers as "validated/exists".
- Evidence MUST reference BOTH sources somewhere in this section:
  - command docs: `.claude/commands/**.md` (section heading is enough)
  - TypeScript implementation: `ccw/src/**` (function name / subcommand case / ripgrep-able string)

| Pointer | Status | Evidence | Verify | Notes |
|---|---|---|---|---|
| `.claude/commands/workflow/ui-design/generate.md` | Existing | docs: `.claude/commands/workflow/ui-design/generate.md` / `Overview` ; ts: `ccw/src/tools/ui-generate-preview.js` / `name: 'ui_generate_preview'` | `Test-Path .claude/commands/workflow/ui-design/generate.md` | Oracle command doc; defines phases and artifact contract |
| `ccw/src/tools/ui-generate-preview.js` | Existing | docs: `.claude/commands/workflow/ui-design/generate.md` / `Phase 3: Generate Preview Files` ; ts: `ccw/src/tools/ui-generate-preview.js` / `name: 'ui_generate_preview'` | `Test-Path ccw/src/tools/ui-generate-preview.js; rg "name: 'ui_generate_preview'" ccw/src/tools/ui-generate-preview.js` | Generates compare/index/PREVIEW artifacts |
| `ccw/src/tools/index.ts` | Existing | docs: `.claude/commands/workflow/ui-design/generate.md` / `File Operations` ; ts: `ccw/src/tools/index.ts` / `registerTool(uiGeneratePreviewTool);` | `Test-Path ccw/src/tools/index.ts; rg "registerTool\(uiGeneratePreviewTool\);" ccw/src/tools/index.ts` | Tool registration for `ccw tool exec` |
| `.claude/workflows/_template-compare-matrix.html` | Existing | docs: `.claude/commands/workflow/ui-design/generate.md` / `Phase 3: Generate Preview Files` ; ts: `ccw/src/tools/ui-generate-preview.js` / `.claude/workflows/_template-compare-matrix.html` | `Test-Path .claude/workflows/_template-compare-matrix.html` | Default compare matrix template used by preview tool |

## Implementation Hints (Tooling/Server)

- Preview generation is handled by `ui_generate_preview` (registered in `ccw/src/tools/index.ts`), so the command can treat preview creation as a tool invocation.
- The preview tool auto-detects matrix dimensions from file naming pattern `{target}-style-{s}-layout-{l}.html`.

## Proposed Fix Plan (Minimal)

- If promoting the terse outline into the canonical command doc, copy back the missing P1-level operational details from the oracle while keeping evidence labels correct.
- Keep preview generation delegated to `ui_generate_preview` and ensure template fallback behavior remains documented.
