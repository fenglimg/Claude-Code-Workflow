# Fix Plan: workflow:ui-design:reference-page-generator

## P0 (Must)

1. [Docs] Normalize command identity (avoid ambiguous invocation)
   - Option A (recommended): `group: workflow` + `name: ui-design:reference-page-generator`
   - Option B: keep current frontmatter `name: workflow:ui-design:reference-page-generator`, and add a clear note explaining how invocation is resolved.
   - Verify:
     - `rg \"^name:\" .claude/commands/workflow/ui-design/reference-page-generator.md`
     - `rg \"^group:\" .claude/commands/workflow/ui-design/reference-page-generator.md`
2. [Docs] Preserve overwrite safety
   - Refuse to overwrite non-empty `<output-dir>/<package-name>/` unless `metadata.json` exists and indicates a prior package.
   - Verify (doc contract):
     - `rg \"metadata.json\" .claude/commands/workflow/ui-design/reference-page-generator.md`
3. [Docs] Make required input validation explicit and early
   - Must check:
     - `style-extraction/style-1/design-tokens.json`
     - `layout-extraction/layout-templates.json`
   - Verify:
     - `rg \"design-tokens.json\" .claude/commands/workflow/ui-design/reference-page-generator.md`
     - `rg \"layout-templates.json\" .claude/commands/workflow/ui-design/reference-page-generator.md`

## P1 (Should)

4. [Docs] Clarify defaults and completion UX
   - Default `--output-dir` to `.workflow/reference_style`
   - Completion message lists generated/copied files and includes an open hint for `preview.html`
   - Verify:
     - `rg \"reference_style\" .claude/commands/workflow/ui-design/reference-page-generator.md`
5. [Docs] Document optional behaviors as conditional
   - Copy `animation-tokens.json` only if it exists
   - Component count reporting should degrade gracefully if tooling like `jq` is missing

## Verification (Deterministic Gates)

- Evidence tables:
  - `node .codex/skills/slash-command-outliner/scripts/verify-evidence.js --file=.workflow/.cycle/cycle-auto-20260205T010617-slashcmdoutliner-codex.progress/llm/CMD-075/specs/outputs/generated-slash-outline.md`
  - `node .codex/skills/slash-command-outliner/scripts/verify-evidence.js --file=.workflow/.cycle/cycle-auto-20260205T010617-slashcmdoutliner-codex.progress/llm/CMD-075/specs/outputs/gap-report.md`

