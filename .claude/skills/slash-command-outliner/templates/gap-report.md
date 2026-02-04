# Gap Report: {{command.group}}:{{command.name}}

## Reference

- Selected reference: {{reference.slash}} (`{{reference.file_path}}`)

## P0 Gaps (Must Fix)

{{gaps.p0}}

## P1 Gaps (Should Fix)

{{gaps.p1}}

## P2 Gaps (Optional)

{{gaps.p2}}

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
| `TBD` | Existing/Planned | docs: `TBD` ; ts: `TBD` | `Test-Path <path>` / `rg "<pattern>" <path>` | why this pointer matters |

Notes:
- Use **one row per pointer**.
- Evidence format recommendation:
  - `docs: <file> / <section heading>`
  - `ts: <file> / <function|case|pattern>`

## Implementation Hints (Tooling/Server)

{{tooling.notes}}

## Proposed Fix Plan (Minimal)

{{fix_plan}}
