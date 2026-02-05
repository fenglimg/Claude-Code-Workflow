# Gap Report: issue:from-brainstorm

## Reference

- Selected reference: `/issue:from-brainstorm` (`.claude/commands/issue/from-brainstorm.md`)

## P0 Gaps (Must Fix)

- Ensure all file-path pointers under `.workflow/issues/**` are labeled `Planned` unless the paths exist in the repo at generation time.
- Ensure evidence tables include both:
  - docs: `.claude/commands/**.md` / exact heading text
  - ts: `ccw/src/**` / literal anchor string present in file

## P1 Gaps (Should Fix)

- Clarify the minimal required schema expectations for `synthesis.json` (only what is needed to select an idea and form an issue).
- Document how the command behaves when optional enrichment files are missing (graceful fallback).

## P2 Gaps (Optional)

- Add a short "Troubleshooting" subsection with common CLI failure messages and next actions.

## Implementation Pointers (Evidence)

| Pointer | Status | Evidence | Verify | Notes |
|---|---|---|---|---|
| `.claude/commands/issue/from-brainstorm.md` | Existing | docs: `.claude/commands/issue/from-brainstorm.md` / `Overview` ; ts: `ccw/src/core/routes/commands-routes.ts` / `scanCommandsRecursive(projectDir, projectDir, 'project', projectPath);` | `Test-Path .claude/commands/issue/from-brainstorm.md` | oracle command doc |
| `.claude/commands/issue/convert-to-plan.md` | Existing | docs: `.claude/commands/issue/convert-to-plan.md` / `Implementation` ; ts: `ccw/src/commands/issue.ts` / `case 'bind':` | `Test-Path .claude/commands/issue/convert-to-plan.md` | closest bridge-pattern reference |
| `ccw/src/commands/issue.ts` | Existing | docs: `.claude/commands/issue/from-brainstorm.md` / `CLI Integration` ; ts: `ccw/src/commands/issue.ts` / `export async function issueCommand(` | `Test-Path ccw/src/commands/issue.ts` | create/bind/update endpoints |
| `.workflow/.brainstorm` | Existing | docs: `.claude/commands/issue/from-brainstorm.md` / `Session Files Reference` ; ts: `ccw/src/commands/issue.ts` / `getIssuesDir()` | `Test-Path .workflow/.brainstorm` | base session directory (inputs live under here) |
| `.workflow/.brainstorm/BS-{slug}-{date}/synthesis.json` | Planned | docs: `.claude/commands/issue/from-brainstorm.md` / `Input Files` ; ts: `ccw/src/commands/issue.ts` / `case 'create':` | `Test-Path .workflow/.brainstorm/<session>/synthesis.json` | required input payload |
| `.workflow/issues/issues.jsonl` | Planned | docs: `.claude/commands/issue/from-brainstorm.md` / `Output Files` ; ts: `ccw/src/commands/issue.ts` / `.workflow/issues/issues.jsonl` | `Test-Path .workflow/issues/issues.jsonl` | created/updated through CLI |
| `.workflow/issues/solutions/ISS-YYYYMMDD-001.jsonl` | Planned | docs: `.claude/commands/issue/from-brainstorm.md` / `Output Files` ; ts: `ccw/src/commands/issue.ts` / `.workflow/issues/solutions/*.jsonl` | `Test-Path .workflow/issues/solutions/<issue-id>.jsonl` | solution output storage |

## Implementation Hints (Tooling/Server)

- Command docs are discovered/scanned by the server command routes; keep command doc paths repo-relative and stable.
- Use `ccw issue` CLI for any stateful operations (create/bind/update) to avoid corrupting issue storage.

## Proposed Fix Plan (Minimal)

1) Keep outputs minimal and deterministic; avoid copying oracle content into spec.
2) Mark runtime-created `.workflow/issues/**` artifacts as `Planned` unless they exist in repo now.
3) Maintain dual-source evidence rows for each pointer and run `verify-evidence.js` on the generated markdown.

