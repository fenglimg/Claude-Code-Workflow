# Exploration (Cycle-3): Taxonomy + Pack + Full Assessment vNext

## What Existed Before This Cycle
- Cycle-1 already had pack CLI: `learn:resolve-pack-key`, `learn:read-pack`, `learn:write-pack`.
- Cycle-2 already had `/learn:profile` flow vNext and internal assess module (minimal).

## Findings / Constraints
- `/learn:profile` must not get `Write(*)`; persistence must go through `ccw learn:*` CLI.
- User-facing AskUserQuestion text must be Chinese.
- `question_bank_version` must match `taxonomy_version` (already enforced by pack_key resolver).

## New Building Blocks Added In This Cycle
- Taxonomy index persisted at `.workflow/learn/taxonomy/index.json`.
- Taxonomy CLI:
  - `learn:resolve-topic`
  - `learn:ensure-topic`
  - `learn:taxonomy-alias`
  - `learn:taxonomy-redirect`
  - `learn:taxonomy-promote`
- Pack completeness CLI:
  - `learn:pack-status`
  - `learn:ensure-pack`
- Internal assessment upgraded:
  - `.claude/commands/learn/_internal/assess.js` now runs a conservative single-topic loop (max 20) with strict stop conditions and a full pack completeness gate.

