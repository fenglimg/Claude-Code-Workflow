---
name: learn
description: Internal CLI state API for learn workflow (abstracts file operations with validation + atomic writes)
argument-hint: "learn:<subcommand> [options]"
allowed-tools: Bash(*), Read(*)
---

# CCW Learn State Commands (Internal API)

**Goal**: Provide a stable, validated, atomic interface for `.workflow/learn/*` so agents do **not** directly `Read()`/`Write()` state files.

## Data Access Principle

| Operation | Correct | Incorrect |
|-----------|---------|-----------|
| Read learn state | `ccw learn:read-state --json` | `Read('.workflow/learn/state.json')` |
| Update active profile | `ccw learn:update-state --field active_profile_id --value profile-123 --json` | `Write(statePath, ...)` |
| Read profile | `ccw learn:read-profile --profile-id profile-123 --json` | `Read('.workflow/learn/profiles/...')` |
| Write profile | `ccw learn:write-profile --profile-id profile-123 --data '{"..."}' --json` | `Write(profilePath, ...)` |

## Canonical Schemas

All validation uses these schema files (single source of truth):
- `.claude/workflows/cli-templates/schemas/learn-state.schema.json`
- `.claude/workflows/cli-templates/schemas/learn-profile.schema.json`

## Output Contract (All Commands)

All commands MUST support `--json` and return:

```json
{
  "ok": true,
  "data": {}
}
```

On error:

```json
{
  "ok": false,
  "error": {
    "code": "SCHEMA_INVALID|NOT_FOUND|INVALID_ARGS|IO_ERROR|LOCKED",
    "message": "Human readable summary",
    "details": {}
  }
}
```

Exit codes:
- `0`: success
- `1`: validation/usage/IO error
- `2`: lock/conflict (caller may retry)

## Atomic Write Strategy

For any mutating operation:
1. Write to `*.tmp` in the same directory
2. Validate JSON against the corresponding schema
3. Backup current file to `*.bak` (best-effort)
4. Rename `*.tmp` → target (atomic on same filesystem)
5. On failure: restore from `*.bak` if present

## Security Considerations

- **Path traversal prevention**: `profile-id` must match `^[a-zA-Z0-9_-]+$` and MUST NOT contain `/` or `..`.
- **Scope restriction**: all resolved paths must remain under `.workflow/learn/`.
- **No arbitrary file writes**: only `state.json` and `profiles/<profile-id>.json` are writable targets.

## Commands

### 1) `ccw learn:read-state`

Read `.workflow/learn/state.json`. If missing, initialize a default state and return it.

Options:
- `--json` (required for agent usage)

Returns `data`:
- full state object

### 2) `ccw learn:update-state`

Update a single field in state (read-modify-write) with schema validation + atomic write.

Options:
- `--field <field>` (e.g. `active_profile_id`, `active_session_id`)
- `--value <value>` (string; use `null` to clear)
- `--json`

Returns `data`:
- updated state object

### 3) `ccw learn:read-profile`

Read `.workflow/learn/profiles/<profile-id>.json`.

Options:
- `--profile-id <id>`
- `--json`

Returns `data`:
- full profile object

### 4) `ccw learn:write-profile`

Write a profile with schema validation + atomic write.

Options:
- `--profile-id <id>`
- `--data <json>` (stringified JSON)
- `--json`

Returns `data`:
- written profile object

## Examples

```bash
ccw learn:read-state --json
ccw learn:update-state --field active_profile_id --value profile-1737734400000 --json
ccw learn:read-profile --profile-id profile-1737734400000 --json
ccw learn:write-profile --profile-id profile-1737734400000 --data '{"profile_id":"profile-1737734400000","experience_level":"beginner","known_topics":[]}' --json
```

