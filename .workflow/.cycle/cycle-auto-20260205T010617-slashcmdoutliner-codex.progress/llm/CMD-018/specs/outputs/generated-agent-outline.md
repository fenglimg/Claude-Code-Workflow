# Agent Outline: memory:compact

## Purpose

Implement and/or evolve `/memory:compact` so it reliably converts the current session into recovery-ready structured text and persists it as a Core Memory entry via `mcp__ccw-tools__core_memory`.

## Execution Model

- Default: single-shot extraction + import (no multi-round loop unless user asks to revise)
- Evidence-first: reuse established `core_memory` tool patterns before adding new abstractions

## State & Artifacts

- Inputs (typical):
  - Session context (objective, plan, recent actions, decisions, constraints, state)
  - Optional: `.workflow/IMPL_PLAN.md` (if present) + user-provided context files
- Outputs:
  - A structured text block (returned to user for transparency)
  - A persisted Core Memory entry (`CMEM-...` id) via MCP import

## Tooling

- Allowed tools: mcp__ccw-tools__core_memory(*), Read(*)
- Non-negotiables:
  - no unrelated changes
  - do not claim pointers exist unless verifiable
  - do not require Bash/Write; keep the flow within allowed tools

## Validation Strategy

- P0 gates:
  - frontmatter completeness + allowed-tools correctness
  - core sections present (overview/usage/outputs/execution/error handling)
  - evidence tables pass verify-evidence.js for any evidence sections included
- Behavioral checks:
  - import returns an id; id is clearly surfaced as the recovery key
  - plan source priority is explicit (workflow file > todos > user-stated > inferred)

