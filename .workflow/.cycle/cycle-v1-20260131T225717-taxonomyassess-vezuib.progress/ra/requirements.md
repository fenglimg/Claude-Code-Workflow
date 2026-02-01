# Requirements (Cycle-3): Taxonomy + Pack Completeness + Full Assessment Algorithm

Version: v1.0.0  
Cycle: `cycle-v1-20260131T225717-taxonomyassess-vezuib`  
Source: `.workflow/.brainstorm/BS-learn-profile优化-2026-01-29/cycle-task-taxonomy-pack-assessment-vnext.md`

---

## Goal (最终态)

实现可长期稳定复用的 topic-level 评估闭环：
- **Taxonomy index** 作为 canonical topic_id 唯一来源（alias/redirect/provisional/active）
- **Topic resolve (taxonomy-first)**：把 raw topic label 映射到 canonical topic_id（可追溯 resolution_source + taxonomy_version）
- **Pack completeness gate**：支持 provisional seed=4 快速定位，但 **结束 topic 评估前必须 full completeness**
- **Full assessment algorithm**：单 topic 最大 20 题，严格 stop conditions（ALL），评估完成直接保存并询问下一个 topic

## Locked Decisions (from brainstorm)

- Taxonomy index path: `.workflow/learn/taxonomy/index.json`
- Pack root: `.workflow/learn/packs/`
- pack_key: `{topic_id, taxonomy_version, rubric_version, question_bank_version, language}`
- Strong binding: `question_bank_version` must match `taxonomy_version`
- Provisional seed questions: 4
- Promotion gate: provisional -> active requires regression cases >= 30
- Max questions per topic: 20
- Stop conditions (ALL):
  - `level_converged`
  - `must_cover_100_passed`
  - `overall_coverage_ratio>=0.85`
  - `overall_confidence>=0.90`
  - `last4_stable`
- No post-assessment light confirmation

## Constraints

- /learn:profile does not get Write(*); any taxonomy/pack persistence must be via `ccw learn:*` CLI.
- Use stable Chinese UX; keys/ids can remain English.
- Avoid breaking existing ccw unit tests; add new tests for taxonomy resolve + pack completeness + promotion gate.

## Deliverables

### D1) Taxonomy index + governance

- Create `.workflow/learn/taxonomy/index.json` (initial schema)
- Add ccw CLI to operate on taxonomy (internal-only):
  - `ccw learn:resolve-topic` (taxonomy-first resolve)
  - `ccw learn:ensure-topic` (create provisional if missing; alias attach)
  - `ccw learn:taxonomy-promote` (enforce regression>=30 before setting active)
  - `ccw learn:taxonomy-alias` and/or `ccw learn:taxonomy-redirect` (minimal)

### D2) Pack completeness + seed=4 strategy

- Extend pack schema to include:
  - taxonomy (subpoints with must/core/nice + min_evidence)
  - question bank (questions tagged to expected_subpoints + level)
  - regression skeleton metadata (count)
- Add ccw CLI:
  - `ccw learn:pack-status` (completeness report + regression count)
  - `ccw learn:ensure-pack` (generate seed=4 or full pack based on completeness needs)

### D3) Full assessment algorithm (internal module)

- Update `.claude/commands/learn/_internal/assess.js`:
  - uses taxonomy-first resolved topic_id
  - ensures full pack completeness before allowing the topic assessment to finish
  - runs up to 20 questions and evaluates coverage/confidence/stability
  - writes `ASSESSMENT_*` events (session/question/answer/scored/level_changed/summary)
  - supports noop if already assessed for same pack_key (reused session summary)

### D4) Tests

- Taxonomy:
  - resolve-topic canonical/alias/redirect/provisional
  - ensure-topic creates provisional and avoids id collision via suffix
  - promote requires regression>=30
- Pack:
  - ensure-pack seed=4 exists
  - completeness gate blocks “finish topic assessment” until full completeness

## Non-goals (Cycle-3 之外)

- Removing KeywordDictionary.json dependencies (separate milestone)

