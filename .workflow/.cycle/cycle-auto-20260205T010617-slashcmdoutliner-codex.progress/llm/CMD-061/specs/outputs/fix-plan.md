# Fix Plan: workflow:tools:task-generate-agent

## P0 (Must)

1. Keep evidence tables valid:
   - Do not mark pointers as `Existing` unless paths exist.
   - For every pointer row, include `docs: .claude/commands/**.md / <heading>` and `ts: ccw/src/** / <literal anchor>`.

## P1 (Should)

1. Expand the outline to include the minimal prompt section skeletons needed by action-planning-agent:
   - CLI execution ID requirements (mandatory)
   - Planning notes record formats (single-module + per-module + coordinator)
   - Quality standards + measurable success criteria blocks
2. Define prerequisite behavior for missing `.process/context-package.json` (recommend hard-fail with guidance to run `/workflow:tools:context-gather`).

## P2 (Optional)

1. Add a multi-module worked example (2 modules + coordinator) including CROSS:: placeholder usage and resolution notes.
2. Add a short related-commands section (upstream context-gather; downstream execute/review).

