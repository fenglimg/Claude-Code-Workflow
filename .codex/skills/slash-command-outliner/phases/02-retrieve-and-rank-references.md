# Phase 02: Retrieve + Rank References

## Goal

Find the closest existing commands and extract **reusable patterns** without copying full content.

## Steps

1) Use `mcp__ace-tool__search_context` to recall similar commands and relevant tooling code.
2) Produce Top N candidates (default N=5) with deterministic scoring:
   - same `group` / command family
   - similar interaction model (AskUserQuestion, multi-round loop, etc.)
   - similar artifacts (writes to `.workflow/*`, `.claude/*`, etc.)
   - similar allowed-tools surface
3) Require user confirmation for Top 1 (high-confidence can be preselected but must be overridable).

## Output

Write:
- `specs/outputs/references.json`

Include:
- `candidates[]` with `{slash, file_path, score, why}`
- `selected` with the final choice

