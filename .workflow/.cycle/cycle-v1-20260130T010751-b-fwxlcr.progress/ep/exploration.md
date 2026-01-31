# Codebase Exploration - v1.2.0

## Document Status
| Field | Value |
|-------|-------|
| Version | 1.2.0 |
| Iteration | 3 |
| Updated | 2026-01-31T15:11:06+08:00 |
| Scope | Milestone B: inferred skill state machine on top of events/snapshot/rollback |

---

## Key Files / Entry Points

- `ccw/src/commands/learn.ts`
  - Single-file implementation for learn workflow CLI commands.
  - Contains: event append, snapshot fold/rebuild, rollback, and now inferred-skill state machine.
- `ccw/src/cli.ts`
  - Registers CLI commands and wires options -> command handlers.
- Tests (Node test runner):
  - `ccw/tests/learn-profile-events-cli.test.js` (existing, NDJSON append + snapshot update)
  - `ccw/tests/learn-profile-snapshot-cli.test.js` (existing, rebuild + rollback)
  - `ccw/tests/learn-inferred-skill-cli.test.js` (new, TASK-005 state machine)

---

## Existing Patterns Followed

- CLI output format: `--json` emits `{ ok: true|false, data|error }` via `print()/fail()` in `ccw/src/commands/learn.ts`.
- Concurrency safety: coarse `withLearnLock()` lock file for all state/event writes.
- Append-only events: NDJSON append with monotonic `version`.
- Snapshot rebuild: deterministic fold from `loadProfileEvents()`; snapshot schema validation before persist.

---

## Notes for Iteration 3

- Added `CCW_NOW_ISO` override to make time-dependent tests deterministic (cooldown gating).
- Implemented inferred skills lifecycle via events + fold rules + dedicated CLI commands.

