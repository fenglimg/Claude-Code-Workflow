# Fix Plan: workflow:style-extract

## Minimal Changes (Order Matters)

1) Scope: docs (P0)
- Decide the canonical command identifier:
  - Option A: keep doc under `workflow/ui-design/` and document invocation as `/workflow:ui-design:style-extract`
  - Option B: relocate to `workflow/` (or map via command-groups config) to document invocation as `/workflow:style-extract`

2) Scope: docs + tools (P0)
- Reconcile `allowed-tools` with behavior:
  - If keeping `TodoWrite/Read/Write/Glob/AskUserQuestion` only, replace any `bash(...)`/`Task(...)` references with `Glob`-based discovery + `Read/Write`-based I/O steps.
  - If the command must orchestrate agent tasks, add the required tool(s) to frontmatter and ensure they are used explicitly.

3) Scope: docs (P1)
- Specify a minimal `analysis-options.json` schema (fields required for interactive selection + downstream generation).

4) Scope: validation (P1)
- Add a deterministic output verification checklist (existence + non-empty + basic JSON parse) using only allowed tools.

