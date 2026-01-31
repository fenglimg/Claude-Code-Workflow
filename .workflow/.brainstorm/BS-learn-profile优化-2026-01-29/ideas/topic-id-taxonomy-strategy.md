# Topic ID 体系：taxonomy / alias / versioning（Draft）

Timestamp: 2026-01-31T18:52:52+08:00

## Decision Direction (Recommended)
Taxonomy is the single source of truth for any topic that enters:
- assessment pack generation
- assessment events / snapshot
- inferred skills canonical ids

## Why
评估闭环必须可回归、可比较；动态 topic_id 会导致历史数据与回归集失效。

## Canonical Topic ID Rules
- canonical `topic_id`: ASCII snake_case, e.g. `typescript`, `cocos_creator`, `game_dev_core`
- never change topic_id once published; if rename/merge -> deprecate + redirect
- user/agent input is always stored as raw text; resolution maps raw -> canonical

## Taxonomy Index (Concept)
Maintain a global registry (index) of topics:
- topic_id (canonical)
- name (display)
- aliases[] (synonyms, abbreviations, Chinese/English)
- status: active|deprecated
- redirect_to_topic_id (optional)
- taxonomy_version (subpoints version)
- updated_at

## Alias Resolution (Algorithm)
1) normalize(raw):
   - lower-case
   - replace punctuation/space with `_`
   - collapse multiple `_`
2) match:
   - exact match on topic_id
   - match against aliases_normalized
3) if deprecated -> redirect_to_topic_id
4) if unresolved -> AskUserQuestion:
   - create new topic
   - map to existing topic (search results)
   - ignore

## Versioning
- taxonomy_version bumps when subpoints scope changes
- rubric_version bumps when scoring criteria changes
- question_bank_version bumps when questions change
Assessment event must store:
- topic_id
- taxonomy_version
- rubric_version
- question_bank_version

## Open Design Points
- Index storage location/path
- Whether to allow auto-generate new topic packs on the fly (w/ user confirmation)
- How to handle multilingual display names and aliases cleanly

