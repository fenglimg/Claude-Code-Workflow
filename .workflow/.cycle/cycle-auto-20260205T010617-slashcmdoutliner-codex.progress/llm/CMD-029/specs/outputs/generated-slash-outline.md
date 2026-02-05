---
name: auto-parallel
description: Parallel brainstorming automation with dynamic role selection and concurrent execution across multiple perspectives
argument-hint: "[-y|--yes] topic or challenge description [--count N]"
allowed-tools: Skill(*), Task(*), TodoWrite(*), Read(*), Write(*), Bash(*), Glob(*)
group: workflow:brainstorm
---

# Workflow Brainstorm Parallel Auto

## Overview

- Goal: Parallelize multi-role brainstorming with a coordinator that runs framework generation, role analysis, and synthesis as a single workflow.
- Command: `/workflow:brainstorm:auto-parallel`

## Usage

```bash
/workflow:brainstorm:auto-parallel "<topic-or-challenge>" [-y|--yes] [--count N]
```

## Inputs

- Required inputs:
  - Topic or challenge description (string)
- Optional inputs:
  - `-y|--yes`: Auto mode (skip clarifications / accept defaults in downstream steps)
  - `--count N`: Target number of roles / parallel analyses

## Outputs / Artifacts

- Writes:
  - `.workflow/active/WFS-{topic}/workflow-session.json`
  - `.workflow/active/WFS-{topic}/.brainstorming/guidance-specification.md`
  - `.workflow/active/WFS-{topic}/.brainstorming/{role}/analysis.md`
  - `.workflow/active/WFS-{topic}/.brainstorming/synthesis-specification.md`
- Reads:
  - `.workflow/active/` (session discovery)
  - `.workflow/active/WFS-*/.brainstorming/*` (inputs to synthesis)

## Implementation Pointers

- Command doc: `.claude/commands/workflow/brainstorm/auto-parallel.md`
- Likely code locations:
  - `.claude/commands/workflow/brainstorm/*.md` (subcommands invoked by the coordinator)
  - `ccw/src/tools/command-registry.ts` + tests (command discovery / listing)
  - `ccw/src/commands/session-path-resolver.ts` (brainstorm session path conventions)
  - `ccw/src/templates/dashboard-js/views/help.js` (UI workflow diagram labels)

### Evidence (Existing vs Planned)

| Pointer | Status | Evidence (docs + TS) | Verify | Why |
|---|---|---|---|---|
| `.claude/commands/workflow/brainstorm/auto-parallel.md` | Existing | docs: `.claude/commands/workflow/brainstorm/auto-parallel.md` / 3-Phase Execution ; ts: `ccw/src/templates/dashboard-js/views/help.js` / /workflow:brainstorm:auto-parallel | `Test-Path .claude/commands/workflow/brainstorm/auto-parallel.md; rg "^## 3-Phase Execution" .claude/commands/workflow/brainstorm/auto-parallel.md` | Primary command definition (orchestrator protocol) |
| `.claude/commands/workflow/brainstorm/artifacts.md` | Existing | docs: `.claude/commands/workflow/brainstorm/artifacts.md` / Execution Phases ; ts: `ccw/src/commands/session-path-resolver.ts` / '.brainstorming/': 'brainstorm', | `Test-Path .claude/commands/workflow/brainstorm/artifacts.md; rg "^## Execution Phases" .claude/commands/workflow/brainstorm/artifacts.md` | Phase 1: framework/spec generation invoked by coordinator |
| `.claude/commands/workflow/brainstorm/role-analysis.md` | Existing | docs: `.claude/commands/workflow/brainstorm/role-analysis.md` / Execution Protocol ; ts: `ccw/src/commands/session-path-resolver.ts` / '.brainstorming/': 'brainstorm', | `Test-Path .claude/commands/workflow/brainstorm/role-analysis.md; rg "Execution Protocol" .claude/commands/workflow/brainstorm/role-analysis.md` | Phase 2: per-role analysis behavior/patterns |
| `.claude/commands/workflow/brainstorm/synthesis.md` | Existing | docs: `.claude/commands/workflow/brainstorm/synthesis.md` / Execution Phases ; ts: `ccw/src/commands/session-path-resolver.ts` / '.brainstorming/': 'brainstorm', | `Test-Path .claude/commands/workflow/brainstorm/synthesis.md; rg "^## Execution Phases" .claude/commands/workflow/brainstorm/synthesis.md` | Phase 3: synthesis generation invoked by coordinator |
| `ccw/src/tools/command-registry.test.ts` | Existing | docs: `.claude/commands/workflow/brainstorm/auto-parallel.md` / Usage ; ts: `ccw/src/tools/command-registry.test.ts` / .claude/commands/workflow | `Test-Path ccw/src/tools/command-registry.test.ts; rg "\\.claude/commands/workflow" ccw/src/tools/command-registry.test.ts` | Confirms local command directory detection used by CCW tooling |
| `ccw/src/templates/dashboard-js/views/help.js` | Existing | docs: `.claude/commands/workflow/brainstorm/auto-parallel.md` / Reference Information ; ts: `ccw/src/templates/dashboard-js/views/help.js` / /workflow:brainstorm:auto-parallel | `Test-Path ccw/src/templates/dashboard-js/views/help.js; rg "\\/workflow:brainstorm:auto-parallel" ccw/src/templates/dashboard-js/views/help.js` | Help UI surfaces the workflow entry point |

## Execution Process

1) Parse args (`-y|--yes`, topic string, `--count N`).
2) Session management:
   - Discover or create a `.workflow/active/WFS-{topic}/` session folder.
   - Ensure `.brainstorming/` subfolder exists.
3) Phase 1 (interactive framework generation):
   - Run the framework/spec step (via Skill or delegated slash command) to produce `guidance-specification.md`.
4) Phase 2 (parallel role analysis):
   - Select roles (dynamic; driven by topic and/or `--count`).
   - Launch one Task per role (concurrent where allowed); each writes `{role}/analysis.md`.
   - Track progress using TodoWrite (attached tasks; one in_progress, others pending; collapse completed tasks).
5) Phase 3 (synthesis generation):
   - Aggregate role analyses into `synthesis-specification.md`.
6) Report completion:
   - Print session id/path, roles analyzed, and next-step suggestions (e.g., `/workflow:plan --session <id>`).

## Error Handling

- Missing/empty topic: prompt for topic or fail with a clear message.
- Invalid `--count` (non-numeric / <=0): clamp or error; document the behavior.
- Session discovery ambiguity (multiple sessions): require user selection or deterministic choice rule.
- Downstream phase failure (Skill/Task error): stop and report which phase failed; preserve partial artifacts.
- File conflicts: avoid concurrent writes to the same file; serialize when needed.
- Context overflow: summarize/trim intermediate content before synthesis; keep file sizes bounded.

## Examples

```bash
/workflow:brainstorm:auto-parallel "Design a real-time notification system" --count 5
/workflow:brainstorm:auto-parallel "Improve onboarding UX" -y
```

