---
name: artifacts
description: Interactive clarification generating confirmed guidance specification through role-based analysis and synthesis
argument-hint: "[-y|--yes] topic or challenge description [--count N]"
allowed-tools: TodoWrite(*), Read(*), Write(*), Glob(*), AskUserQuestion(*)
group: workflow
---

# Workflow Artifacts Command

## Overview

- Goal: Generate a Confirmed Guidance Specification for a topic/challenge via role-based Q&A and synthesis.
- Command: `/workflow:artifacts`
- Modes:
  - Interactive: multi-round AskUserQuestion (max 4 questions per call)
  - Auto: `-y|--yes` selects recommended roles and default answers, skipping questions

## Usage

```bash
/workflow:artifacts "GOAL: ... SCOPE: ... CONTEXT: ..." --count 3
/workflow:artifacts -y "GOAL: ... SCOPE: ... CONTEXT: ..." --count 3
```

## Inputs

- Required inputs:
  - Topic or challenge description (structured format recommended: GOAL/SCOPE/CONTEXT)
- Optional inputs:
  - `-y, --yes`: auto mode (skip questions, use defaults)
  - `--count N`: number of roles to select (recommend N+2 options; default 3)

## Outputs / Artifacts

- Writes:
  - `.workflow/active/WFS-{topic}/.brainstorming/guidance-specification.md`
  - `.workflow/active/WFS-{topic}/.brainstorming/context-package.json`
  - `.workflow/active/WFS-{topic}/.brainstorming/session-metadata.json`
- Reads:
  - `.workflow/active/WFS-{topic}/.brainstorming/context-package.json` (if resuming)
  - `.workflow/active/WFS-{topic}/.brainstorming/guidance-specification.md` (if updating)

## Implementation Pointers

- Command doc: `.claude/commands/workflow/brainstorm/artifacts.md`
- Likely code locations:
  - Command docs indexing/parsing: `ccw/src/tools/command-registry.ts`
  - Session folder lifecycle: `ccw/src/tools/session-manager.ts`
  - AskUserQuestion tool transport: `ccw/src/tools/ask-question.ts`
  - File I/O tools: `ccw/src/tools/write-file.ts`, `ccw/src/tools/read-file.ts`
  - Glob pattern expansion: `ccw/src/tools/pattern-parser.ts`

### Evidence (Existing vs Planned)

| Pointer | Status | Evidence (docs + TS) | Verify | Why |
|---|---|---|---|---|
| `.claude/commands/workflow/brainstorm/artifacts.md` | Existing | docs: `.claude/commands/workflow/brainstorm/artifacts.md` / `Overview` ; ts: `ccw/src/tools/command-registry.ts` / `join('.claude', 'commands', 'workflow')` | `Test-Path .claude/commands/workflow/brainstorm/artifacts.md` | oracle command doc + section source of truth |
| `ccw/src/tools/command-registry.ts` | Existing | docs: `.claude/commands/workflow/brainstorm/artifacts.md` / `Quick Reference` ; ts: `ccw/src/tools/command-registry.ts` / `class CommandRegistry` | `Test-Path ccw/src/tools/command-registry.ts; rg "class CommandRegistry" ccw/src/tools/command-registry.ts` | parsing/indexing for .claude/commands workflow corpus |
| `ccw/src/tools/session-manager.ts` | Existing | docs: `.claude/commands/workflow/brainstorm/artifacts.md` / `Session Management` ; ts: `ccw/src/tools/session-manager.ts` / `const ACTIVE_BASE = '.workflow/active';` | `Test-Path ccw/src/tools/session-manager.ts; rg "const ACTIVE_BASE = '.workflow/active';" ccw/src/tools/session-manager.ts` | session folder creation + read/write under .workflow/active |
| `.workflow/active/WFS-{topic}/.brainstorming/guidance-specification.md` | Planned | docs: `.claude/commands/workflow/brainstorm/artifacts.md` / `Output & Governance` ; ts: `ccw/src/tools/session-manager.ts` / `const ACTIVE_BASE = '.workflow/active';` | `Test-Path .workflow/active` | primary output artifact |
| `ccw/src/tools/ask-question.ts` | Existing | docs: `.claude/commands/workflow/brainstorm/artifacts.md` / `AskUserQuestion Pattern` ; ts: `ccw/src/tools/ask-question.ts` / `name: 'ask_question'` | `Test-Path ccw/src/tools/ask-question.ts; rg "name: 'ask_question'" ccw/src/tools/ask-question.ts` | interactive UI questions (max 4 per round) |
| `ccw/src/tools/write-file.ts` | Existing | docs: `.claude/commands/workflow/brainstorm/artifacts.md` / `Output Template` ; ts: `ccw/src/tools/write-file.ts` / `name: 'write_file'` | `Test-Path ccw/src/tools/write-file.ts; rg "name: 'write_file'" ccw/src/tools/write-file.ts` | persist guidance-specification + context-package |
| `ccw/src/tools/pattern-parser.ts` | Existing | docs: `.claude/commands/workflow/brainstorm/artifacts.md` / `Session Management` ; ts: `ccw/src/tools/pattern-parser.ts` / `import { glob } from 'glob';` | `Test-Path ccw/src/tools/pattern-parser.ts; rg "import \\{ glob \\} from 'glob';" ccw/src/tools/pattern-parser.ts` | Glob(*)-style path expansion support |

## Execution Process

### Auto Mode

- When `-y|--yes`:
  - Auto-select recommended roles
  - Skip all AskUserQuestion interactions
  - Use default answers and generate the specification directly

### Phase Summary (Interactive)

- Phase 0: Context collection (capture topic, constraints, initial assumptions)
- Phase 1: Topic analysis (2-4 targeted clarifications)
- Phase 2: Role selection (multi-select; batch options if >4)
- Phase 3: Role-specific questions (3-4 per role; store per-role decisions)
- Phase 4: Conflict resolution (cross-role contradictions; max 4 per round)
- Phase 4.5: Final clarification (progressive rounds until user confirms)
- Phase 5: Generate specification (render guidance-specification.md + append decision tracking)

### Task Tracking

- Use TodoWrite to track phases and per-role question rounds.
- Persist intermediate state in the session folder so the workflow can be resumed.

## Error Handling

- Invalid/missing topic: ask for a structured description (GOAL/SCOPE/CONTEXT).
- Invalid `--count`: default to 3 and note the fallback.
- AskUserQuestion timeout/cancel: persist partial state; offer resume or auto mode.
- Missing session folder: create `.workflow/active/WFS-{topic}/.brainstorming/` before writing.

## Examples

```bash
# Interactive
/workflow:artifacts "GOAL: Build a realtime collaboration MVP SCOPE: Web app CONTEXT: 100+ concurrent users" --count 3

# Auto mode
/workflow:artifacts -y "GOAL: Improve CI reliability SCOPE: Monorepo CONTEXT: flaky tests" --count 3
```

