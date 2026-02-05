---
name: analyze-with-file
description: Interactive collaborative analysis with documented discussions, CLI-assisted exploration, and evolving understanding
argument-hint: "[-y|--yes] [-c|--continue] \"topic or question\""
allowed-tools: TodoWrite(*), Task(*), AskUserQuestion(*), Read(*), Grep(*), Glob(*), Bash(*), Edit(*), Write(*)
group: workflow
---

# Analyze With File

## Overview

- Goal: Turn an ambiguous topic/question into a documented, evidence-backed analysis via structured discussion and CLI-assisted exploration.
- Command: `/workflow:analyze-with-file`

## Usage

```bash
/workflow:analyze-with-file [-y|--yes] [-c|--continue] "topic or question"
```

## Inputs

- Required inputs:
  - A topic or question to analyze (string)
- Optional inputs:
  - `-y`, `--yes`: auto-confirm exploration decisions (auto mode)
  - `-c`, `--continue`: continue an existing session (resume mode)

## Outputs / Artifacts

- Writes:
  - `.workflow/.analysis/{session-id}/discussion.md`
  - `.workflow/.analysis/{session-id}/exploration-codebase.json`
  - `.workflow/.analysis/{session-id}/explorations/{perspective}.json` (optional)
  - `.workflow/.analysis/{session-id}/perspectives.json` (optional)
  - `.workflow/.analysis/{session-id}/explorations.json` (optional)
- Reads:
  - `.workflow/.analysis/{session-id}/discussion.md` (resume)
  - `.workflow/project-tech.json` (optional)

## Implementation Pointers

- Command doc: `.claude/commands/workflow/analyze-with-file.md`
- Likely code locations:
  - `ccw/src/tools/cli-executor-core.ts` (CLI tool execution core used by `ccw cli`)
  - `ccw/src/core/routes/cli-routes.ts` (API endpoints for CLI execution/history/streaming)

### Evidence (Existing vs Planned)

You MUST label each pointer as `Existing` (verifiable in repo now) or `Planned` (will be created/modified).

Rules:
- `Existing` MUST include evidence from BOTH:
  - a command doc source: `.claude/commands/**.md` (section heading is sufficient)
  - a TypeScript source: `ccw/src/**` (function name / subcommand case / a ripgrep-able string)
- If you cannot verify, downgrade to `Planned` and add a concrete `Verify` step (e.g. `Test-Path <path>`, `rg "<pattern>" <path>`).

| Pointer | Status | Evidence (docs + TS) | Verify | Why |
|---|---|---|---|---|
| `.claude/commands/workflow/analyze-with-file.md` | Existing | docs: `.claude/commands/workflow/analyze-with-file.md` / `Workflow Analyze Command` ; ts: `ccw/src/tools/cli-executor-core.ts` / `async function executeCliTool(` | `Test-Path .claude/commands/workflow/analyze-with-file.md` | Defines the slash command contract and phases |
| `ccw/src/tools/cli-executor-core.ts` | Existing | docs: `.claude/commands/workflow/analyze-with-file.md` / `Phase 2: CLI Exploration` ; ts: `ccw/src/tools/cli-executor-core.ts` / `async function executeCliTool(` | `Test-Path ccw/src/tools/cli-executor-core.ts` | Executes underlying CLI tools (e.g. `ccw cli`) used during exploration |
| `ccw/src/core/routes/cli-routes.ts` | Existing | docs: `.claude/commands/workflow/analyze-with-file.md` / `Phase 2: CLI Exploration` ; ts: `ccw/src/core/routes/cli-routes.ts` / `if (pathname === '/api/cli/execution')` | `Test-Path ccw/src/core/routes/cli-routes.ts` | Server endpoints that power CLI execution, history, and streaming |
| `.workflow/.analysis/{session-id}/discussion.md` | Planned | docs: `.claude/commands/workflow/analyze-with-file.md` / `Output Structure` ; ts: `ccw/src/tools/cli-executor-core.ts` / `async function executeCliTool(` | `Test-Path .workflow/.analysis/{session-id}/discussion.md` | Primary artifact: multi-round documented discussion with evolving understanding |
| `.workflow/.analysis/{session-id}/exploration-codebase.json` | Planned | docs: `.claude/commands/workflow/analyze-with-file.md` / `Phase 2: CLI Exploration` ; ts: `ccw/src/core/routes/cli-routes.ts` / `if (pathname === '/api/cli/execution')` | `Test-Path .workflow/.analysis/{session-id}/exploration-codebase.json` | Captures codebase context gathered via cli-explore-agent |
| `.workflow/.analysis/{session-id}/perspectives.json` | Planned | docs: `.claude/commands/workflow/analyze-with-file.md` / `Phase 2: CLI Exploration` ; ts: `ccw/src/core/routes/cli-routes.ts` / `if (pathname === '/api/cli/native-session')` | `Test-Path .workflow/.analysis/{session-id}/perspectives.json` | Stores multi-perspective CLI findings and/or consolidated insights |

Notes:
- For TS evidence, prefer anchors like `function <name>` / `case '<subcommand>'` / a stable string literal that can be found via `rg`.

## Execution Process

1) Parse arguments
- Determine topic/question (string), `--yes` auto mode, and `--continue` resume mode.

2) Session initialization
- Create or reuse a session folder: `.workflow/.analysis/{session-id}/`.
- Initialize or load `discussion.md`.

3) Phase 1: Topic understanding
- Ask clarifying questions, identify analysis dimensions, and write the initial context to `discussion.md`.

4) Phase 2: CLI exploration (context gathering)
- Delegate codebase exploration to `cli-explore-agent` (Task) and write `exploration-codebase.json` (and/or `explorations/{perspective}.json`).
- Run CLI-assisted analysis (Bash `ccw cli ...`) after exploration; consolidate into `perspectives.json` (or `explorations.json` for single mode).

5) Phase 3: Interactive discussion (up to max rounds)
- Present findings, ask the user to confirm/correct assumptions, and iterate up to the configured max rounds.
- Update `discussion.md` each round with what changed (established/clarified/insights).

6) Phase 4: Synthesis & conclusion
- Produce a final conclusion and action-oriented recommendations.
- Finalize `discussion.md` (including session statistics and artifact index).

## Error Handling

- Missing/invalid args: ask user to restate the topic in a single sentence and proceed.
- `cli-explore-agent` failure: continue with reduced context; record the failure in `discussion.md`.
- CLI tool timeout/error: retry once with reduced scope; otherwise skip that perspective and proceed.
- Resume mode mismatch (no prior session artifacts): fall back to new session creation and record the decision.

## Examples

```bash
/workflow:analyze-with-file "Investigate authentication architecture and likely bottlenecks"
/workflow:analyze-with-file --continue "authentication architecture"
/workflow:analyze-with-file -y "Find root cause of intermittent API timeouts"
```

