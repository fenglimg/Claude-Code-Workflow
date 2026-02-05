# Gap Report: workflow:collaborative-plan-with-file

## Reference

- Selected reference: /workflow:multi-cli-plan (`.claude/commands/workflow/multi-cli-plan.md`)

## P0 Gaps (Must Fix)

- Command frontmatter naming is inconsistent across workflow corpus (some docs include `group`, some prefix `workflow:` inside `name`). This can break tooling that constructs `/workflow:<name>` from frontmatter.
- If `ccw/src/tools/command-registry.ts` is used to list commands, `header.name` values that already include `workflow:` will currently produce `/workflow:workflow:...` command strings.
- Implementation pointers must remain evidence-based (Existing vs Planned) for any new pointers introduced when iterating on this command.

## P1 Gaps (Should Fix)

- Make the session ID and session folder contract explicit and uniform (format + location) across docs and prompt mirror.
- Ensure conflict detection output format (`conflicts.json` + plan-note conflict markers) is documented consistently (what is considered a conflict; how it is resolved).

## P2 Gaps (Optional)

- Add a lightweight "resume existing session" behavior (when `.workflow/.planning/{session-id}/plan-note.md` exists) to reduce rework.

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
| `.claude/commands/workflow/collaborative-plan-with-file.md` | Existing | docs: `.claude/commands/workflow/collaborative-plan-with-file.md` / `Output Artifacts` ; ts: `ccw/src/tools/command-registry.ts` / `public getCommand(commandName: string): CommandMetadata | null {` | `Test-Path .claude/commands/workflow/collaborative-plan-with-file.md` | source-of-truth behavior + artifact contract |
| `.codex/prompts/collaborative-plan-with-file.md` | Existing | docs: `.claude/commands/workflow/collaborative-plan-with-file.md` / `Execution Steps` ; ts: `ccw/src/commands/workflow.ts` / `WORKFLOW_SOURCES` | `Test-Path .codex/prompts/collaborative-plan-with-file.md` | prompt mirror packaged/installed by `ccw workflow install` |
| `ccw/src/tools/command-registry.ts` | Planned | docs: `.claude/commands/workflow/collaborative-plan-with-file.md` / `Quick Start` ; ts: `ccw/src/tools/command-registry.ts` / `const normalized = commandName.startsWith('/workflow:')` | `rg "getAllCommandsSummary" ccw/src/tools/command-registry.ts` | likely needs normalization for `name: workflow:...` frontmatter |
| `ccw/src/core/routes/commands-routes.ts` | Existing | docs: `.claude/commands/workflow/collaborative-plan-with-file.md` / `Configuration` ; ts: `ccw/src/core/routes/commands-routes.ts` / `function getCommandsDir(location: CommandLocation, projectPath: string): string {` | `Test-Path ccw/src/core/routes/commands-routes.ts` | server UI/API listing and toggling commands |

## Implementation Hints (Tooling/Server)

- Prefer normalizing command identity at the tooling layer: treat `name` values that already contain `workflow:` as fully qualified; do not re-prefix.
- Keep `.codex/prompts/*` as a mirror/template source; do not rely on it for runtime session state (state lives under `.workflow/.planning/{session-id}/`).

## Proposed Fix Plan (Minimal)

- Align command identity normalization in `ccw/src/tools/command-registry.ts` (and any other command scanners) so `/workflow:<name>` is correct for both naming styles.
- If updating the command doc, prefer a single convention: either `group: workflow` + `name: collaborative-plan-with-file`, or fully-qualified `name` with no `group`.
- Keep evidence tables updated as pointers change; run the deterministic evidence gate on every iteration.

