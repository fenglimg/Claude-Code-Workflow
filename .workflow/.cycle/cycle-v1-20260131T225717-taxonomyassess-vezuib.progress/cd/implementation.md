# Implementation (Cycle-3): Taxonomy + Pack + Full Assessment vNext

## Code Changes

### Taxonomy index + governance CLI
- `ccw/src/commands/learn.ts`
  - Added taxonomy storage constants:
    - `.workflow/learn/taxonomy/index.json`
    - `.workflow/learn/taxonomy/changes.ndjson`
  - Added taxonomy schema validation + normalization + resolve logic (taxonomy-first).
  - Added CLI commands:
    - `learn:resolve-topic`
    - `learn:ensure-topic`
    - `learn:taxonomy-alias`
    - `learn:taxonomy-redirect`
    - `learn:taxonomy-promote` (gate: regression>=30)
- `ccw/src/cli.ts`
  - Registered the above commands in Commander.

### Pack completeness (seed=4 -> full completeness)
- `ccw/src/commands/learn.ts`
  - Added pack vNext builders + completeness computation.
  - Added CLI commands:
    - `learn:pack-status`
    - `learn:ensure-pack` (auto|seed|full)
- `ccw/src/cli.ts`
  - Registered the above commands in Commander.

### Full assessment loop (internal-only)
- `.claude/commands/learn/_internal/assess.js`
  - Replaced Cycle-1 single-question placeholder with a conservative single-topic loop:
    - taxonomy-first resolve/ensure topic
    - seed pack first (fast定位) then upgrade to full pack before termination checks
    - max 20 questions
    - strict stop conditions (ALL)
    - writes `ASSESSMENT_*` events
    - noop when prior `ASSESSMENT_SESSION_SUMMARIZED` exists for same `pack_key_hash`

### /learn:profile integration
- `.claude/commands/learn/profile.md`
  - create flow: loops topic assessments; after each topic:
    - persists latest summary into `profile.known_topics[]` via `ccw learn:write-profile`
    - proposes inferred skill via `ccw learn:propose-inferred-skill` (no auto-confirm)
    - asks whether to continue to next topic (no “light confirmation” step)
  - update flow: runs assessment, persists summary, proposes inferred skill; if reused/noop -> exits early.

## Tests Added
- `ccw/tests/learn-taxonomy-cli.test.js`
- `ccw/tests/learn-pack-completeness-cli.test.js`
- `ccw/tests/learn-assess-internal-vnext.test.js`

