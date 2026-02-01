# Requirements (v1.0.0)

**Cycle**: cycle-v1-20260201T170509-learnprofilev4-bwxjep  
**Source Task (single source of truth)**: $taskPath  
**Updated**: 2026-02-01T17:06:47+08:00

## Goal
Upgrade /learn:profile create + single-topic assessment to be:
- Smooth UX (low tool-noise)
- Credible, cross-domain assessment
- Fully automatic calibration inside a topic (no "continue calibrate?" prompt)
- Deterministic persistence via ccw learn:* CLI

## Acceptance Gate (Must Pass)
Directly mapped from cycle-task.md FB-1..FB-7:
- (FB-1) pre_context: each AskUserQuestion call has **exactly 4 questions**, and each question header shows (1/4..4/4) (UI may paginate 2 per screen).
- (FB-2) profile reuse: /learn:profile create defaults to **upsert** into active profile (or fixed id), not always new.
- (FB-3) topics loop: topic candidates come from **main agent background parsing + association expansion**; coverage loop is feedback loop; per round <=16 topics (4x4) + free text; only user-selected/typed topics are resolved/ensured.
- (FB-4) seed+pack:
  - Seed=4: **Gemini CLI first**, blocking wait; schema + discriminative constraints enforced; fallback only on failure/timeout/invalid schema.
  - Full pack: **Gemini CLI async job**, non-blocking; fallback only on failure/timeout/invalid output.
  - Assessment uses question bank + scoring rules to infer ability.
- (FB-5) no self-rating: no "你觉得对/错/部分对" steps.
- (FB-6) answer confirm/edit only (no skip).
- (FB-7) bash noise reduction: target per topic: pack calls coarse-grained; event persistence flushed once per 4 questions via batch append; profile written once per topic.

## In Scope
### 1) /learn:profile prompt/runtime behavior
Files:
- .claude/commands/learn/profile.md
- .claude/commands/learn/_internal/assess.js

Changes:
- Remove dependency on ccw learn:parse-background for topic candidates.
- Implement topic coverage loop as **4 multiSelect questions** (<=4 options each) + a "type something" question, max 3 rounds.
- Profile create defaults to reusing active profile id (upsert). Passing explicit id keeps "create new" capability.
- Pre-context headers show per-batch progress.
- Assessment loop:
  - Seed stage uses Seed=4 generated pack (difficulty set {0.25,0.45,0.65,0.85} + capability nodes).
  - Ability inference is continuous interval [lo,hi] (0..1), stop only if sigma<=0.1 (plus minimal must evidence when taxonomy exists).
  - Scoring contract is rubric-based (p_correct, confidence, etc.).
  - No self rating; no skip; only confirm/edit submission.
  - Flush events every 4 questions.

### 2) CCW Learn CLI additions/changes
Files:
- ccw/src/cli.ts
- ccw/src/commands/learn.ts

Changes:
- Add new CLI command: learn:append-profile-events-batch.
  - Input: --profile-id, --events <json> (array of {type, actor?, payload?}).
  - Behavior: append N events with increasing versions inside one learn lock; update snapshot once.
- Extend learn:ensure-pack behavior:
  - Seed: Gemini-first blocking generation (fallback deterministic builder).
  - Full: start non-blocking background job + job status file.
  - Persist job status at .workflow/learn/packs/{topic_id}/jobs/{pack_key_hash}.full.json.

### 3) Tests
Update/add CCW CLI tests to cover:
- batch event append version increments and snapshot updated once.
- ensure-pack full creates job status file and returns quickly.
- deterministic test mode (avoid real Gemini calls).

## Out of Scope (This Cycle)
- Changing the AskUserQuestion UI renderer (we only annotate headers).
- Multi-topic fully automatic run without any topic selection prompt.
- Taxonomy governance changes beyond "resolve/ensure only on user selection".

## Data/Schema Requirements
### Pack question schema (incremental extension)
We keep pack file path layout stable, but extend questions with optional fields used by the new algorithm:
- difficulty: number (0..1)
- capability_node: 'see'|'explain'|'apply'|'debug'
- common_mistakes: string[]
- grading_notes: string

Back-compat: older packs lacking these fields still load; assessment falls back to session-level generation.

### Job status schema (new)
File: .workflow/learn/packs/{topic_id}/jobs/{pack_key_hash}.full.json
- pack_key_hash: string
- 	opic_id: string
- status: 'pending'|'running'|'done'|'failed'
- created_at, updated_at: string
- started_at?, completed_at?: string
- rror?: { code?: string, message: string }
- ttempts: number

## Bash/CLI Noise Budget (Implementation constraint)
Target visible CLI calls from the prompt per topic:
- seed ensure: 1 call
- full job start/status: <=1 call
- event persistence: 1 batch call per 4 questions
- profile persist: 1 write at end of topic

## Risks / Edge Cases
- Gemini CLI unavailable: must fallback fast to deterministic generator (tests rely on this).
- Background job racing with ensure-pack calls: must be lock-safe and idempotent.
- Job status file corruption: treat as not-ready and retry.
- Topic resolve ambiguity: must be handled in profile flow (do not ensure automatically).
- Pack schema drift: validate minimal shape + tolerate extra fields.

## Deliverables
- Updated prompts: .claude/commands/learn/profile.md, .claude/commands/learn/_internal/assess.js.
- Updated CLI: learn:append-profile-events-batch, improved learn:ensure-pack with job status.
- Tests updated/added; 
pm test passes.

