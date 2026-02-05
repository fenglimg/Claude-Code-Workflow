---
name: animation-extract
description: Extract animation and transition patterns from prompt inference and image references for design system documentation
argument-hint: "[-y|--yes] [--design-id <id>] [--session <id>] [--images \"<glob>\"] [--focus \"<types>\"] [--interactive] [--refine]"
allowed-tools: TodoWrite(*), Read(*), Write(*), Glob(*), Bash(*), AskUserQuestion(*), Task(ui-design-agent)
group: workflow
---

# workflow:animation-extract

## Overview

- Goal: Extract a consistent motion system and produce `{base_path}/animation-extraction/animation-tokens.json` aligned with any existing design tokens.
- Command: `/workflow:animation-extract`

## Usage

```bash
/workflow:animation-extract [-y|--yes] [--design-id <id>] [--session <id>] [--images "<glob>"] [--focus "<types>"] [--interactive] [--refine]
```

## Inputs

- Required inputs:
  - Base path (resolved by priority: `--design-id` > `--session` > auto-detect)
- Optional inputs:
  - `--images "<glob>"` (visual references; absent => prompt-only mode)
  - `--focus "<types>"` (scope filter; e.g. `all`, `transitions`, `timing`, `easing`, `interactions`)
  - `--interactive` (present options + capture selection)
  - `--refine` (refinement mode; updates an existing token file)
  - `-y|--yes` (auto mode; skip clarification)

## Outputs / Artifacts

- Writes:
  - `{base_path}/.intermediates/animation-analysis/image-references.json`
  - `{base_path}/.intermediates/animation-analysis/analysis-options.json`
  - `{base_path}/.intermediates/animation-analysis/refinement-options.json`
  - `{base_path}/animation-extraction/animation-tokens.json`
- Reads:
  - `{base_path}/style-extraction/style-1/design-tokens.json` (optional)
  - `{base_path}/.intermediates/animation-analysis/image-references.json` (if present)
  - `{base_path}/.intermediates/animation-analysis/analysis-options.json` (interactive explore)
  - `{base_path}/.intermediates/animation-analysis/refinement-options.json` (interactive refine)
  - `{base_path}/animation-extraction/animation-tokens.json` (refine input)

## Implementation Pointers

- Command doc: `.claude/commands/workflow/ui-design/animation-extract.md`
- Likely code locations:
  - `.claude/commands/workflow/ui-design/layout-extract.md`
  - `.claude/commands/workflow/ui-design/style-extract.md`
  - `.claude/commands/workflow/ui-design/imitate-auto.md`
  - `ccw/src/commands/install.ts`
  - `{base_path}/.intermediates/animation-analysis/image-references.json`
  - `{base_path}/.intermediates/animation-analysis/analysis-options.json`
  - `{base_path}/.intermediates/animation-analysis/refinement-options.json`
  - `{base_path}/animation-extraction/animation-tokens.json`

### Evidence (Existing vs Planned)

You MUST label each pointer as `Existing` (verifiable in repo now) or `Planned` (will be created/modified).

| Pointer | Status | Evidence (docs + TS) | Verify | Why |
|---|---|---|---|---|
| `.claude/commands/workflow/ui-design/animation-extract.md` | Existing | docs: `.claude/commands/workflow/ui-design/animation-extract.md` / `Animation Extraction Command` ; ts: `ccw/src/commands/install.ts` / `scanDisabledCommandsRecursive(commandsDir, commandsDir, result.commands)` | `Test-Path .claude/commands/workflow/ui-design/animation-extract.md` | Slash command source (oracle) |
| `.claude/commands/workflow/ui-design/layout-extract.md` | Existing | docs: `.claude/commands/workflow/ui-design/layout-extract.md` / `Layout Extraction Command` ; ts: `ccw/src/commands/install.ts` / `scanDisabledCommandsRecursive(commandsDir, commandsDir, result.commands)` | `Test-Path .claude/commands/workflow/ui-design/layout-extract.md` | Closest sibling pipeline reference (base_path + modes + interactive selection) |
| `.claude/commands/workflow/ui-design/style-extract.md` | Existing | docs: `.claude/commands/workflow/ui-design/style-extract.md` / `Style Extraction Command` ; ts: `ccw/src/commands/install.ts` / `scanDisabledCommandsRecursive(commandsDir, commandsDir, result.commands)` | `Test-Path .claude/commands/workflow/ui-design/style-extract.md` | Artifact + verification pattern reference |
| `.claude/commands/workflow/ui-design/imitate-auto.md` | Existing | docs: `.claude/commands/workflow/ui-design/imitate-auto.md` / `UI Design Imitate-Auto Workflow Command` ; ts: `ccw/src/commands/install.ts` / `scanDisabledCommandsRecursive(commandsDir, commandsDir, result.commands)` | `Test-Path .claude/commands/workflow/ui-design/imitate-auto.md` | Orchestration reference for cross-command sequencing |
| `ccw/src/commands/install.ts` | Existing | docs: `.claude/commands/workflow/ui-design/animation-extract.md` / `Execution Process` ; ts: `ccw/src/commands/install.ts` / `scanDisabledCommandsRecursive(commandsDir, commandsDir, result.commands)` | `Test-Path ccw/src/commands/install.ts` | Tooling corpus anchor (repo command scanning recursion) |
| `{base_path}/.intermediates/animation-analysis/image-references.json` | Planned | docs: `.claude/commands/workflow/ui-design/animation-extract.md` / `Phase 0: Setup & Input Validation` ; ts: `ccw/src/commands/install.ts` / `scanDisabledCommandsRecursive(commandsDir, commandsDir, result.commands)` | `Test-Path \"{base_path}/.intermediates/animation-analysis/image-references.json\"` | Normalized image metadata for agent context (only when --images matches) |
| `{base_path}/.intermediates/animation-analysis/analysis-options.json` | Planned | docs: `.claude/commands/workflow/ui-design/animation-extract.md` / `Phase 1: Animation Specification Generation` ; ts: `ccw/src/commands/install.ts` / `scanDisabledCommandsRecursive(commandsDir, commandsDir, result.commands)` | `Test-Path \"{base_path}/.intermediates/animation-analysis/analysis-options.json\"` | Explore-mode specification questions/options (+ optional user_selection) |
| `{base_path}/.intermediates/animation-analysis/refinement-options.json` | Planned | docs: `.claude/commands/workflow/ui-design/animation-extract.md` / `Phase 1: Animation Specification Generation` ; ts: `ccw/src/commands/install.ts` / `scanDisabledCommandsRecursive(commandsDir, commandsDir, result.commands)` | `Test-Path \"{base_path}/.intermediates/animation-analysis/refinement-options.json\"` | Refine-mode options (+ user_selection.selected_refinements) |
| `{base_path}/animation-extraction/animation-tokens.json` | Planned | docs: `.claude/commands/workflow/ui-design/animation-extract.md` / `animation-tokens.json Format` ; ts: `ccw/src/commands/install.ts` / `scanDisabledCommandsRecursive(commandsDir, commandsDir, result.commands)` | `Test-Path \"{base_path}/animation-extraction/animation-tokens.json\"` | Final motion tokens output (written/overwritten by agent task 2) |

## Execution Process

1. Phase 0: Setup & Input Validation
   - Parse flags; resolve `base_path` (`--design-id` > `--session` > auto-detect)
   - If `--images`, expand glob + write `.intermediates/animation-analysis/image-references.json`
   - Optionally read `style-extraction/style-1/design-tokens.json` for duration/easing alignment
   - Memory check: if `animation-extraction/animation-tokens.json` exists, short-circuit unless refine/interactive path requires changes
2. Phase 1: Animation Specification Generation (Agent Task 1)
   - Explore mode (default): write `.intermediates/animation-analysis/analysis-options.json`
   - Refine mode (`--refine`): read current `animation-tokens.json` and write `.intermediates/animation-analysis/refinement-options.json`
3. Phase 1.5: User Confirmation (optional; `--interactive`)
   - Present options; capture selection; persist into the options JSON (`user_selection`)
4. Phase 2: Animation System Generation (Agent Task 2)
   - Use user_selection if present; otherwise use sensible defaults
   - Write `{base_path}/animation-extraction/animation-tokens.json` (create directory if needed)
5. Phase 3: Verify Output
   - Verify output exists, is readable JSON, and includes expected token categories (duration/easing + animation specs)
6. Completion
   - Update TODOs (TodoWrite) and print a compact output summary (paths written + mode used)

## Error Handling

- Base path not found: prompt for `--design-id`/`--session` or abort with clear guidance.
- `--images` glob has no matches: continue in prompt-only mode (unless user requires images).
- JSON read/parse fails (options/tokens): report the specific file path and fail fast (do not silently overwrite).
- Existing output found: do not overwrite unless `--refine` or user confirms in `--interactive`.
- Agent task failure: preserve intermediates for debugging and surface the failure context (mode, paths, counts).

## Examples

```bash
/workflow:animation-extract --design-id 42 --images "refs/**/*.png"
```

```bash
/workflow:animation-extract --session design-run-2026-02-05 --interactive --images "captures/*.jpg"
```

```bash
/workflow:animation-extract --design-id 42 --refine --focus "timing,easing"
```

