# Agent Outline: workflow:brainstorm:role-analysis

## Purpose

Implement and/or evolve the slash command according to CCW conventions with minimal regressions.

## Execution Model

- Default: incremental, testable edits to docs + any supporting TS/tooling touched by the command workflow
- Find and reuse patterns from:
  - `.claude/commands/workflow/brainstorm/*.md` (brainstorm family)
  - `ccw/src/tools/session-manager.ts` and `ccw/src/commands/session-path-resolver.ts` (brainstorm artifacts)

## State & Artifacts

- Session folder (runtime): `.workflow/active/{session-id}/.brainstorming/`
- Required outputs (implementation deliverables):
  - Update/create the command doc: `.claude/commands/workflow/brainstorm/role-analysis.md`
  - Ensure referenced runtime artifacts are consistent with session tooling:
    - `.workflow/active/{session-id}/.brainstorming/{role-name}/analysis*.md`
    - `.workflow/active/{session-id}/.brainstorming/guidance-specification.md` (optional)
  - Validation notes (what was verified, what remains planned)

## Tooling

- Allowed tools: Task(conceptual-planning-agent), AskUserQuestion(*), TodoWrite(*), Read(*), Write(*), Edit(*), Glob(*)
- Non-negotiables:
  - no unrelated changes
  - evidence-based pointers (Existing vs Planned)

## Validation Strategy

- P0 gates:
  - command doc frontmatter complete + allowed-tools correct
  - core sections present
  - no broken artifact references (runtime paths clearly marked as runtime, not repo files)
  - evidence tables pass `node .codex/skills/slash-command-outliner/scripts/verify-evidence.js`
- Functional validation (when implementing beyond docs):
  - session path tooling recognizes `.brainstorming/` files
  - help/dashboard references remain consistent (if updated)

