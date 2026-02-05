# Agent Outline: issue:queue

## Purpose

Implement and/or evolve `/issue:queue` to form solution-level execution queues from bound solutions using issue-queue-agent.

## Execution Model

- Iterative, evidence-based workflow:
  - load solutions in one batch
  - delegate ordering/conflict analysis to `issue-queue-agent`
  - block on user clarifications when conflicts cannot be auto-resolved
- Prefer boring, existing CCW patterns (use `ccw` CLI; avoid direct `.workflow` file edits).

## State & Artifacts

- Runtime state (written by CLI/agent):
  - `.workflow/issues/queues/index.json`
  - `.workflow/issues/queues/{queue-id}.json`
  - `.workflow/issues/issues.jsonl`
- Docs/artifacts:
  - Slash command doc: `.claude/commands/issue/queue.md`
  - Agent spec/doc: `.codex/agents/issue-queue-agent.md`

## Tooling

- Allowed tools: TodoWrite(*), Task(*), Bash(*), Read(*), Write(*)
- Non-negotiables:
  - no unrelated changes
  - no false `Existing` claims in implementation pointers

## Validation Strategy

- P0 gates:
  - frontmatter complete
  - allowed-tools match required behavior
  - core sections present
  - artifact paths are either produced by the command or explicitly described as runtime outputs
- Deterministic evidence gate:
  - `node .codex/skills/slash-command-outliner/scripts/verify-evidence.js --file=<generated md>`
