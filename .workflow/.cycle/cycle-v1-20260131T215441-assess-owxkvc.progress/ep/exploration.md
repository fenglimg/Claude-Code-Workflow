# Exploration (Cycle-1): Assessment Plumbing

Version: v1.0.0  
Cycle: `cycle-v1-20260131T215441-assess-owxkvc`

---

## Existing Related Implementations

### `/learn:profile`

- File: `.claude/commands/learn/profile.md`
- Current state:
  - `allowed-tools` lacks `Read(*)`
  - `argument-hint` still includes `--no-assessment`
  - No internal assessment module call yet
  - Contains legacy flows (add_topic/selectFlow) and some English prompts

### Markdown command internal modules

- Pattern exists: commands use ESM `await import('./_internal/error-handler.js')`
- Directory: `.claude/commands/learn/_internal/`
  - `error-handler.js` provides `safeExecJson`/`safeReadJson` with injected `Bash`/`Read`
  - This pattern can be reused for `assess.js` (factory injection + CLI calls)

### `ccw` learn storage + event system

- File: `ccw/src/commands/learn.ts`
  - `ensureLearnDirs()` currently creates:
    - `.workflow/learn/` root
    - `.workflow/learn/profiles/` (profiles, events, snapshots)
    - `.workflow/learn/sessions/`
    - `.workflow/learn/telemetry/`
  - `learnAppendProfileEventCommand` appends NDJSON events and updates snapshot (best-effort)
  - Snapshot fold ignores unknown event types (forward compatible) => safe to add `ASSESSMENT_*` events
  - **Gap**: `learnAppendProfileEventCommand` currently accepts any `--type` (no whitelist)

### `ccw` CLI wiring

- File: `ccw/src/cli.ts`
  - Learn commands are registered via commander and call functions exported from `ccw/src/commands/learn.ts`
  - **Gap**: No pack commands registered yet

### Tests baseline

- Existing CLI tests (pattern):
  - `ccw/tests/learn-profile-events-cli.test.js` runs `ccw/bin/ccw.js` with `CCW_PROJECT_ROOT` sandbox dir
  - Asserts `learn:append-profile-event` writes immutable NDJSON and updates snapshot

## Integration Points (Cycle-1)

- `.claude/commands/learn/profile.md`
- `.claude/commands/learn/_internal/assess.js` (new)
- `ccw/src/cli.ts` (new commands)
- `ccw/src/commands/learn.ts` (new command implementations + whitelist + packs dir)
- `ccw/tests/*` (new tests for pack + whitelist)

## Risks / Notes

- `--no-assessment` removal and default `--full-assessment` changes may impact doc-contract tests (cycle-1 keeps changes minimal, but must keep tests green)
- Pack JSON passed through CLI args must be robustly parsed; prefer `--pack <json>` (string) and validate required fields
- Path safety: pack storage must remain under project root; follow existing `validatePath`/`ensureLearnDirs` pattern

