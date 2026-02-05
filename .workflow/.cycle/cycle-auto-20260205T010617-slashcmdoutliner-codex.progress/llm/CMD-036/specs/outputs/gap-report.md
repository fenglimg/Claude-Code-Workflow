# Gap Report: workflow:init-guidelines

## Reference

- Selected reference: /workflow:session:solidify (`.claude/commands/workflow/session/solidify.md`)

## P0 Gaps (Must Fix)

- Frontmatter parity: `init-guidelines` doc currently lacks `allowed-tools` (and commonly `group`), which affects registry/metadata surfaces; align with CCW frontmatter gate.
- Idempotency + safety: explicitly define overwrite vs append/merge behavior when `.workflow/project-guidelines.json` is already populated and `--reset` is not provided.
- Tooling expectations: ensure written guidelines JSON stays parseable by CCW tooling that reads `.workflow/project-guidelines.json`.

## P1 Gaps (Should Fix)

- Cross-command integration: document how `/workflow:init` delegates to `/workflow:init-guidelines` and recommended next steps (`/workflow:plan`, `/workflow:session:solidify`).
- Answer processing rules: ensure each round has explicit mapping from answers to schema fields to avoid ambiguous writes.

## P2 Gaps (Optional)

- Add a short schema example snippet for the resulting `.workflow/project-guidelines.json` (without duplicating large schemas).

## Implementation Pointers (Evidence)

You MUST provide an evidence table for all key implementation pointers mentioned in the outlines.

Rules (P0):
- Every pointer MUST be labeled `Existing` or `Planned`.
- `Existing` MUST be verifiable (path exists). Include a concrete `Verify` command for each existing pointer.
- Do NOT describe `Planned` pointers as “validated/exists”.
- Evidence MUST reference BOTH sources somewhere in this section:
  - command docs: `.claude/commands/**.md` (section heading is enough)
  - TypeScript implementation: `ccw/src/**` (function name / subcommand case / ripgrep-able string)

| Pointer | Status | Evidence | Verify | Notes |
|---|---|---|---|---|
| `.claude/commands/workflow/init-guidelines.md` | Existing | docs: `.claude/commands/workflow/init-guidelines.md` / Workflow Init Guidelines Command (/workflow:init-guidelines) ; ts: `ccw/src/tools/command-registry.ts` / export class CommandRegistry { | `Test-Path .claude/commands/workflow/init-guidelines.md` | Target command doc to update (frontmatter + clarified behaviors) |
| `.claude/commands/workflow/session/solidify.md` | Existing | docs: `.claude/commands/workflow/session/solidify.md` / Session Solidify Command (/workflow:session:solidify) ; ts: `ccw/src/core/routes/ccw-routes.ts` / '.workflow', 'project-guidelines.json' | `Test-Path .claude/commands/workflow/session/solidify.md` | Reference for safe update semantics to guidelines file |
| `.claude/commands/workflow/init.md` | Existing | docs: `.claude/commands/workflow/init.md` / Workflow Init Command (/workflow:init) ; ts: `ccw/src/tools/command-registry.ts` / readFileSync(filePath, 'utf-8') | `Test-Path .claude/commands/workflow/init.md` | Caller that establishes prerequisites and can hand off to this wizard |
| `ccw/src/tools/command-registry.ts` | Existing | docs: `.claude/commands/ccw-coordinator.md` / CommandRegistry Integration ; ts: `ccw/src/tools/command-registry.ts` / const toolsStr = header['allowed-tools'] | `Test-Path ccw/src/tools/command-registry.ts` | Parses frontmatter (allowed-tools) and discovers commands |
| `ccw/src/core/routes/commands-routes.ts` | Existing | docs: `.claude/commands/ccw-coordinator.md` / Available Commands ; ts: `ccw/src/core/routes/commands-routes.ts` / interface CommandMetadata { | `Test-Path ccw/src/core/routes/commands-routes.ts` | Commands metadata surface that benefits from correct frontmatter |
| `ccw/src/core/routes/ccw-routes.ts` | Existing | docs: `.claude/commands/workflow/plan.md` / Coordinator Role ; ts: `ccw/src/core/routes/ccw-routes.ts` / '.workflow', 'project-guidelines.json' | `Test-Path ccw/src/core/routes/ccw-routes.ts` | Reads `.workflow/project-guidelines.json`; motivates strict JSON correctness |

Notes:
- Use **one row per pointer**.
- Evidence format recommendation:
  - `docs: <file> / <section heading>`
  - `ts: <file> / <function|case|pattern>`

## Implementation Hints (Tooling/Server)

- CCW tooling reads command frontmatter (including `allowed-tools`) via `CommandRegistry`; missing fields lead to incomplete command metadata.
- CCW routes read `.workflow/project-guidelines.json`; the wizard should keep writes minimal, parseable, and metadata-updated.

## Proposed Fix Plan (Minimal)

- Update `.claude/commands/workflow/init-guidelines.md` frontmatter to include `allowed-tools` and (if used in this corpus) `group: workflow`.
- Add an explicit decision point for populated guidelines when `--reset` is absent (overwrite vs append/merge), mirroring the semantics in `/workflow:session:solidify`.
- Ensure the write step preserves or initializes `_metadata` fields and avoids invalid JSON (fail fast with clear messaging).
