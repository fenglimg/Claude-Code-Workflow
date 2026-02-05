# Fix Plan: other:ccw

## P0 (Required)

1) Evidence gate: keep evidence tables dual-source (docs + TS) and passing `verify-evidence.js` for both generated markdown outputs.

## P1 (Should)

1) Docs scope: add a short workflow-selection decision tree (task_type/complexity -> workflow level) aligned to `.claude/commands/ccw.md`.
2) Docs scope: add an explicit "minimum execution unit" mapping table (command pairs/groups) to prevent partial execution.
3) State scope: document the status file schema and state transitions for `.workflow/.ccw/<session_id>/status.json` (fields + example transitions).
4) Routing scope: make with-file routing explicit (keywords -> target with-file workflow commands) and add 1-2 ASCII examples.

## P2 (Optional)

1) Examples scope: add examples for replan after user adjustment and unit-boundary failure/retry behavior.
2) Clarification scope: add a short contrast note: `/ccw` main-process orchestration vs `/ccw-coordinator` external execution model.
