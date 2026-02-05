# Fix Plan: :ccw-coordinator

## P0 (Must)

- (Docs) Keep command invocation ungrouped (`/ccw-coordinator`) while retaining frontmatter completeness; do not introduce false `Existing` claims.
- (Validation) Ensure evidence tables stay green under `node .codex/skills/slash-command-outliner/scripts/verify-evidence.js`.

## P1 (Should)

- (Docs) Add concrete content for:
  - Minimum Execution Units (unit list + mapping table)
  - Recommendation algorithm + “display to user” format
  - Universal prompt template (variables + parameter patterns)
  - State file schema (status flow + field descriptions)
- (Examples) Add examples for:
  - planning-only
  - planning + execution with persisted session
  - resume from `.workflow/.ccw-coordinator/{session_id}/state.json`

## P2 (Optional)

- (Safety) Document skip/retry/abort semantics and how they affect persisted state.

