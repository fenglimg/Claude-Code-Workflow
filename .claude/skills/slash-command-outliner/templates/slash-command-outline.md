---
name: {{command.name}}
description: {{command.description}}
argument-hint: "{{command.argument_hint}}"
allowed-tools: {{command.allowed_tools_csv}}
group: {{command.group}}
---

# {{command.title}}

## Overview

- Goal: {{intent.primary_user_value}}
- Command: `/{{command.group}}:{{command.name}}`

## Usage

```bash
/{{command.group}}:{{command.name}} {{command.usage_args}}
```

## Inputs

- Required inputs:
  - {{inputs.required}}
- Optional inputs:
  - {{inputs.optional}}

## Outputs / Artifacts

- Writes:
  - {{artifacts.writes}}
- Reads:
  - {{artifacts.reads}}

## Implementation Pointers

- Command doc: {{implementation.command_doc}}
- Likely code locations:
  - {{implementation.code_pointers}}

### Evidence (Existing vs Planned)

You MUST label each pointer as `Existing` (verifiable in repo now) or `Planned` (will be created/modified).

Rules:
- `Existing` MUST include evidence from BOTH:
  - a command doc source: `.claude/commands/**.md` (section heading is sufficient)
  - a TypeScript source: `ccw/src/**` (function name / subcommand case / a ripgrep-able string)
- If you cannot verify, downgrade to `Planned` and add a concrete `Verify` step (e.g. `Test-Path <path>`, `rg "<pattern>" <path>`).

| Pointer | Status | Evidence (docs + TS) | Verify | Why |
|---|---|---|---|---|
| `{{implementation.command_doc}}` | Planned | docs: `TBD` / `TBD` ; ts: `TBD` / `TBD` | `Test-Path {{implementation.command_doc}}` | command doc to be created/updated |

Notes:
- Expand `{{implementation.code_pointers}}` into **one row per pointer** (do not keep it as a single aggregated cell).
- For TS evidence, prefer anchors like `function <name>` / `case '<subcommand>'` / a stable string literal that can be found via `rg`.

## Execution Process

{{execution.process_outline}}

## Error Handling

{{error_handling.checklist}}

## Examples

{{examples}}
