# Exploration (v1.0.0)

**Cycle**: cycle-v1-20260201T170509-learnprofilev4-bwxjep  
**Updated**: 2026-02-01T17:09:36+08:00

## Key Existing Components

### 1) /learn:profile prompt
- File: .claude/commands/learn/profile.md
- Current behavior (needs change):
  - createFlow() always picks new profile- unless user passes id.
  - Topic recommendations come from ccw learn:parse-background.
  - Topic coverage loop uses a single question with many options (not 4x4).
  - Full assessment loop is delegated to .claude/commands/learn/_internal/assess.js.

### 2) Assessment runtime module
- File: .claude/commands/learn/_internal/assess.js
- Current behavior (needs change):
  - Has explicit self-rating AskUserQuestion (correct/partial/wrong/skip).
  - Uses discrete levels (1..5) convergence.
  - Persists events via ccw learn:append-profile-event per step (high bash noise).

### 3) Learn CLI (persistence + pack)
- File: ccw/src/commands/learn.ts
- Relevant capabilities:
  - learn:append-profile-event exists and enforces an explicit whitelist.
  - Snapshot folding is deterministic via oldSnapshotFromEvents().
  - learn:ensure-pack currently generates seed/full packs deterministically inside the lock.
  - Pack status computation exists: computePackStatusVNext().

### 4) Existing tests impacted
- ccw/tests/learn-pack-completeness-cli.test.js expects ensure-pack full to be synchronous -> will need adjustment (or test env uses deterministic path).
- ccw/tests/learn-assess-internal-vnext.test.js assumes self-rating keys -> must update.

## Gaps vs Cycle-4 Acceptance
- Need batch event append CLI to reduce flush count.
- Need seed=4 (Gemini-first) with schema and discriminative constraints.
- Need full pack async job with status file.
- Need continuous ability interval algorithm + confirm/edit UX.
- Need topic candidate generation in main agent (remove parse-background dependency).

