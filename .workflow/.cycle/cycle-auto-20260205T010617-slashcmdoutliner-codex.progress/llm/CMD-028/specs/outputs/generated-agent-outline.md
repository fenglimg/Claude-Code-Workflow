# Agent Outline: workflow:artifacts

## Purpose

Implement and/or evolve `/workflow:artifacts` to generate a Confirmed Guidance Specification via phased, role-based clarification.

## Execution Model

- Default: incremental, testable changes; keep each phase independently verifiable.
- Interaction: iterative AskUserQuestion with batching (max 4 questions per call).
- Modes:
  - Interactive (default)
  - Auto (`-y|--yes`): skip questions, use defaults

## State & Artifacts

- Session folder (per topic): `.workflow/active/WFS-{topic}/.brainstorming/`
- Required outputs:
  - `.workflow/active/WFS-{topic}/.brainstorming/guidance-specification.md`
  - `.workflow/active/WFS-{topic}/.brainstorming/context-package.json`
  - `.workflow/active/WFS-{topic}/.brainstorming/session-metadata.json`

Suggested state model (minimal):
- `session.selected_roles[]`
- `session.intent_context{}` (topic keywords + constraints)
- `session.role_decisions{ [role]: { decisions[], rationale[] } }`
- `session.cross_role_decisions[]`
- `session.additional_decisions[]`

## Tooling

- Allowed tools: TodoWrite(*), Read(*), Write(*), Glob(*), AskUserQuestion(*)
- Non-negotiables:
  - No unrelated changes
  - Do not claim pointers exist unless verifiable
  - Persist state before each user interaction round

## Validation Strategy

- P0 gates:
  - Frontmatter completeness (name/description/allowed-tools/group)
  - Allowed-tools correctness (no missing tools implied by behavior)
  - Core sections present (Overview, Usage, Execution Process, Outputs/Artifacts, Error Handling)
  - No broken artifact references
  - Evidence tables pass: `node .codex/skills/slash-command-outliner/scripts/verify-evidence.js`
- Regression:
  - If this command is part of a completed corpus set, ensure snapshot diffs are expected before updating expected outputs.

