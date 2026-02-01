# Architecture (v1.0.0)

**Cycle**: cycle-v1-20260201T170509-learnprofilev4-bwxjep  
**Updated**: 2026-02-01T17:09:36+08:00

## Target Flow (Code-Level Diagram, non-mermaid)

### /learn:profile create (upsert by default)

`	ext
/learn:profile create [profile-id?] [--full-assessment[=true|false]]
  |
  v
profileId := (explicit arg) ?? (active_profile_id if exists) ?? new profile-
  |
  +-> AskUserQuestion pre_context_vNext (2 batches, each call=4 questions, headers show 1/4..4/4)
  |
  +-> AskUserQuestion background_text (reuse/update allowed)
  |
  +-> main-agent proposeTopicCandidates(background_text)  // no learn:parse-background
  |
  +-> topicCoverageValidationLoop(candidates)
  |     - per round:
  |       - AskUserQuestion #1: 4 multiSelect questions (<=4 options each) -> selected topics
  |       - AskUserQuestion #2: free text + covered/more confirm
  |     - max 3 rounds
  |     - for user-selected/typed labels only: resolve-topic -> ensure-topic fallback
  |
  +-> ccw learn:write-profile (upsert)
  |
  +-> ccw learn:append-profile-events-batch (PRECONTEXT_CAPTURED + optional FIELD_SET etc) [best-effort]
  |
  +-> ccw learn:update-state active_profile_id
  |
  +-> if full-assessment:
        loop topics (prompted) -> assessTopic(profileId, topicId)
          |
          +-> ccw learn:ensure-pack --mode seed   (blocking; gemini-first)
          +-> ccw learn:ensure-pack --mode full   (non-blocking; starts job if needed)
          +-> assessment loop (auto calibration):
                - ability_interval=[lo,hi] init [0,1]
                - ask question (open-ended)
                - user confirm/edit submission (no skip)
                - Claude rubric scoring -> p_correct/confidence
                - update lo/hi only if confidence>=gate and p_correct>=pass_th or <=fail_th
                - flush events via batch every 4 questions
                - stop when sigma<=0.1 and must-min-evidence satisfied (or N_seed_max reached -> low_conf)
          +-> persist assessment summary into profile.known_topics and write profile once per topic
`

## CCW CLI Changes

### 1) learn:append-profile-events-batch
- Adds a bulk write path under a single lock:
  - Append N events with monotonic versions
  - Update snapshot once after the batch
  - Enforce the same explicit event type whitelist as learn:append-profile-event

### 2) learn:ensure-pack (seed blocking + full async)
- Seed path:
  - Gemini-first generation (blocking) -> write seed pack
  - Fallback to deterministic builder when Gemini fails/disabled
- Full path:
  - If deterministic path: generate full immediately (fast) + mark job done
  - If Gemini path: spawn background process that generates + writes pack; job status tracked in .workflow/learn/packs/{topic_id}/jobs/{pack_key_hash}.full.json

## Backward Compatibility
- Older packs without the new optional question fields still load.
- Assessment module must tolerate missing difficulty/capability metadata by generating session questions.

