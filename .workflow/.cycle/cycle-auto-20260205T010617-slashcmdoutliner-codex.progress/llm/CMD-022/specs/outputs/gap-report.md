# Gap Report: memory:style-skill-memory

## Reference

- Selected reference: /workflow:ui-design:codify-style (`.claude/commands/workflow/ui-design/codify-style.md`)

## P0 Gaps (Must Fix)

- Prerequisite clarity: explicitly treat `.workflow/reference_style/{package-name}/` as a required pre-existing artifact (produced by codify-style) and fail fast if missing.
- Overwrite safety: ensure the outline and eventual implementation spell out the `--regenerate` gate (no overwrite without it).
- Deterministic verification: require an explicit post-write file existence check for `.claude/skills/style-{package-name}/SKILL.md`.

## P1 Gaps (Should Fix)

- Template dependency: document whether generation is fully dynamic vs template-driven (and where template files live) so the command is reproducible across machines.
- Metadata summary: define the minimal package summary fields that should be surfaced in the completion message (component counts + token-system characteristics).

## P2 Gaps (Optional)

- Provide an optional "dry run" mode (future) that prints intended paths + detected features without writing SKILL.md.

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
| `.claude/commands/memory/style-skill-memory.md` | Existing | docs: `.claude/commands/memory/style-skill-memory.md` / `Quick Reference` ; ts: `ccw/src/tools/command-registry.ts` / `'allowed-tools'` | `Test-Path .claude/commands/memory/style-skill-memory.md` | Source of truth for command behavior and sections |
| `.claude/commands/workflow/ui-design/codify-style.md` | Existing | docs: `.claude/commands/memory/style-skill-memory.md` / `Common Errors` ; ts: `ccw/src/tools/command-registry.ts` / `join('.claude', 'commands', 'workflow')` | `Test-Path .claude/commands/workflow/ui-design/codify-style.md` | Produces `.workflow/reference_style/*` inputs |
| `.workflow/reference_style/{package-name}/` | Planned | docs: `.claude/commands/memory/style-skill-memory.md` / `Overview` ; ts: `ccw/src/tools/command-registry.ts` / `join('.claude', 'commands', 'workflow')` | `Test-Path .workflow/reference_style/{package-name}` | Required input directory (must exist at runtime) |
| `.claude/skills/style-{package-name}/SKILL.md` | Planned | docs: `.claude/commands/memory/style-skill-memory.md` / `Overview` ; ts: `ccw/src/tools/command-registry.ts` / `readFileSync(filePath, 'utf-8')` | `Test-Path .claude/skills/style-{package-name}/SKILL.md` | Output SKILL memory index |
| `ccw/src/tools/command-registry.ts` | Existing | docs: `.claude/commands/memory/style-skill-memory.md` / `Implementation Details` ; ts: `ccw/src/tools/command-registry.ts` / `parseYamlHeader(content: string)` | `Test-Path ccw/src/tools/command-registry.ts` | CCW tooling that parses command docs frontmatter |

## Implementation Hints (Tooling/Server)

- Align with the reference orchestrator model from codify-style for phase naming + validation, but keep this command smaller (3 phases: validate, analyze, generate).
- If indexing/metadata extraction for command docs is needed, mirror the YAML-frontmatter parsing pattern in `ccw/src/tools/command-registry.ts`.

## Proposed Fix Plan (Minimal)

1. Tighten the outline language to treat `.workflow/reference_style/{package-name}/` as a hard precondition and make the failure mode explicit.
2. Add a deterministic post-write check step (verify output SKILL.md exists) and reflect it in completion messaging.
3. Clarify template sourcing (dynamic generation vs external templates) so the command is reproducible.

