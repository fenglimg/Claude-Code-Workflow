# Agent Outline: workflow:review

## Purpose

Implement and/or evolve `/workflow:review` according to CCW conventions while keeping changes minimal and verifiable.

## Execution Model

- Default: single-shot command execution (parse -> resolve session -> validate -> analyze -> write report)
- Use evidence-based pointers (docs + TS) before claiming any integration exists

## State & Artifacts

- Primary inputs (runtime):
  - `.workflow/active/` and/or `.workflow/archives/`
  - `<sessionPath>/.summaries/IMPL-*.md`
- Primary outputs (runtime):
  - `<sessionPath>/REVIEW-<type>.md`

## Tooling

- Allowed tools: Skill(*), TodoWrite(*), Read(*), Bash(*), Task(*)
- Non-negotiables:
  - do not mark pointers Existing unless verifiable in-repo
  - keep the command doc concise and aligned to existing workflow command style

## Validation Strategy

- P0 gates:
  - frontmatter includes: name/description/argument-hint/allowed-tools/group
  - core sections present (Overview/Usage/Execution Process/Outputs/Error Handling)
  - evidence tables pass `node .codex/skills/slash-command-outliner/scripts/verify-evidence.js`
- Manual spot-check:
  - confirm `.claude/commands/workflow/review.md` content matches the outline headings and usage
  - confirm references to other commands (e.g. docs redirect) are either existing or explicitly planned

