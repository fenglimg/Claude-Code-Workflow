# Taxonomy Index 落盘与治理（Draft）

Timestamp: 2026-01-31T21:16:41+08:00

## Goals
- Canonical `topic_id` stability for reproducible assessment
- Support long-tail topics via provisional creation (user-confirmed)
- Governance for merges/renames via redirect without breaking history

## Storage Layout (Recommended)

- Taxonomy index registry (read-only by profile):
  - `.workflow/learn/taxonomy/index.json`
- Packs remain under:
  - `.workflow/learn/packs/{topic_id}/...`

## index.json Schema (Draft)

Top-level:
```json
{
  "version": "1.0.0",
  "updated_at": "2026-01-31T21:16:41+08:00",
  "topics": []
}
```

Topic entry:
```json
{
  "topic_id": "typescript",
  "display_name_zh": "TypeScript",
  "display_name_en": "TypeScript",
  "aliases": ["ts", "TypeScript", "类型脚本"],
  "status": "active",
  "redirect_to_topic_id": null,
  "active_pack_key": {
    "topic_id": "typescript",
    "taxonomy_version": "tax_v0.2",
    "rubric_version": "rub_v0.1",
    "question_bank_version": "qb_tax_v0.2_v1",
    "language": "zh"
  },
  "created_at": "2026-01-31T00:00:00+08:00",
  "updated_at": "2026-01-31T00:00:00+08:00"
}
```

## Resolution Rules (Concept)
- normalize raw input (lowercase, punctuation->underscore, collapse underscores)
- match order:
  1) exact topic_id
  2) alias exact/normalized
  3) if match is deprecated: follow redirect_to_topic_id
- ambiguous/unknown => AskUserQuestion:
  - map to existing
  - create new provisional
  - ignore

## Provisional Lifecycle

Create provisional:
- status=provisional
- aliases include: raw input + normalized
- active_pack_key can be null until pack exists

Promote to active:
- requires full pack completeness (must/core coverage possible)
- requires regression set size threshold (recommended >= 30)
- then set status=active and active_pack_key to latest pack

## Redirect / Merge / Rename

- old topic: status=deprecated, redirect_to_topic_id=new
- keep historical packs and events
- resolution always returns canonical active topic_id after redirects

## Alias Governance
- aliases must be unique across active topics
- if conflict, require human decision (or tie-breaker rules)

## Open Questions to Lock
1) index path locked to `.workflow/learn/taxonomy/index.json`?
2) topic_id conflict strategy (`_2` suffix + confirm)?
3) regression threshold for promotion (30)?

