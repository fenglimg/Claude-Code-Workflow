---
name: imitate-auto
description: UI design workflow with direct code/image input for design token extraction and prototype generation
argument-hint: "[--input \"<value>\"] [--session <id>]"
allowed-tools: Skill(*), TodoWrite(*), Read(*), Write(*), Bash(*)
group: workflow
---

# UI Design Imitate-Auto Workflow Command

## Overview

- Goal: Auto-run a multi-phase UI imitation workflow: detect input (code/images/text), extract tokens (style/layout/animation), assemble prototypes, and optionally sync into an existing session.
- Command: `/workflow:ui-design:imitate-auto`

## Usage

```bash
/workflow:ui-design:imitate-auto --input "<glob|path|text[|...]" [--session <id>]
```

## Inputs

- Required inputs:
  - `--input "<value>"` (recommended)
    - Accepts: image globs, file/dir paths, pure text prompts, or `|`-separated combinations
  - OR legacy (deprecated): `--images "<glob>"` and/or `--prompt "<text or paths>"`
- Optional inputs:
  - `--session <id>` (integrate into an existing `.workflow/active/WFS-<session>/`)

## Outputs / Artifacts

- Writes:
  - `.workflow/active/<run_id>/style-extraction/`
  - `.workflow/active/<run_id>/animation-extraction/`
  - `.workflow/active/<run_id>/layout-extraction/`
  - `.workflow/active/<run_id>/prototypes/` (includes `compare.html`)
- Reads:
  - input files/images referenced by `--input` (or legacy flags)
  - `.workflow/active/WFS-<session>/` (when `--session` is provided; must exist)

## Implementation Pointers

- Command doc: `.claude/commands/workflow/ui-design/imitate-auto.md`
- Likely code locations:
  - `.claude/commands/workflow/ui-design/import-from-code.md` (Phase 0.5)
  - `.claude/commands/workflow/ui-design/style-extract.md` (Phase 2)
  - `.claude/commands/workflow/ui-design/animation-extract.md` (Phase 2.3)
  - `.claude/commands/workflow/ui-design/layout-extract.md` (Phase 2.5)
  - `.claude/commands/workflow/ui-design/generate.md` (Phase 3)
  - `.claude/commands/workflow/ui-design/design-sync.md` (Phase 4 session sync)
  - `ccw/src/core/routes/commands-routes.ts` (commands discovery + grouping)
  - `ccw/src/tools/command-registry.ts` (workflow command metadata helper; non-recursive)

### Evidence (Existing vs Planned)

| Pointer | Status | Evidence (docs + TS) | Verify | Why |
|---|---|---|---|---|
| `.claude/commands/workflow/ui-design/imitate-auto.md` | Existing | docs: .claude/commands/workflow/ui-design/imitate-auto.md / Overview ; ts: ccw/src/core/routes/commands-routes.ts / function scanCommandsRecursive( | `Test-Path .claude/commands/workflow/ui-design/imitate-auto.md` | Primary orchestrator command doc for this workflow |
| `.claude/commands/workflow/ui-design/import-from-code.md` | Existing | docs: .claude/commands/workflow/ui-design/import-from-code.md / Overview ; ts: ccw/src/core/routes/commands-routes.ts / const group = getCommandGroup(commandName, relativePath, location, projectPath); | `Test-Path .claude/commands/workflow/ui-design/import-from-code.md` | Conditional Phase 0.5 code import + completeness assessment |
| `.claude/commands/workflow/ui-design/style-extract.md` | Existing | docs: .claude/commands/workflow/ui-design/style-extract.md / Overview ; ts: ccw/src/core/routes/commands-routes.ts / function scanCommandsRecursive( | `Test-Path .claude/commands/workflow/ui-design/style-extract.md` | Phase 2 style token extraction step |
| `.claude/commands/workflow/ui-design/animation-extract.md` | Existing | docs: .claude/commands/workflow/ui-design/animation-extract.md / Overview ; ts: ccw/src/core/routes/commands-routes.ts / function scanCommandsRecursive( | `Test-Path .claude/commands/workflow/ui-design/animation-extract.md` | Phase 2.3 animation token extraction step |
| `.claude/commands/workflow/ui-design/layout-extract.md` | Existing | docs: .claude/commands/workflow/ui-design/layout-extract.md / Overview ; ts: ccw/src/core/routes/commands-routes.ts / function scanCommandsRecursive( | `Test-Path .claude/commands/workflow/ui-design/layout-extract.md` | Phase 2.5 layout template extraction step |
| `.claude/commands/workflow/ui-design/generate.md` | Existing | docs: .claude/commands/workflow/ui-design/generate.md / Overview ; ts: ccw/src/core/routes/commands-routes.ts / function scanCommandsRecursive( | `Test-Path .claude/commands/workflow/ui-design/generate.md` | Phase 3 prototype assembly + preview generation |
| `.claude/commands/workflow/ui-design/design-sync.md` | Existing | docs: .claude/commands/workflow/ui-design/design-sync.md / Overview ; ts: ccw/src/core/routes/commands-routes.ts / function scanCommandsRecursive( | `Test-Path .claude/commands/workflow/ui-design/design-sync.md` | Phase 4 sync references into brainstorming artifacts for `/workflow:plan` |
| `ccw/src/core/routes/commands-routes.ts` | Existing | docs: .claude/commands/workflow/ui-design/imitate-auto.md / Integration Points ; ts: ccw/src/core/routes/commands-routes.ts / return join(projectPath, '.claude', 'commands'); | `Test-Path ccw/src/core/routes/commands-routes.ts` | Server/tooling path that scans `.claude/commands/**` recursively |
| `ccw/src/tools/command-registry.ts` | Existing | docs: .claude/commands/workflow/plan.md / Execution Process ; ts: ccw/src/tools/command-registry.ts / const relativePath = join('.claude', 'commands', 'workflow'); | `Test-Path ccw/src/tools/command-registry.ts` | Tooling helper that reads `.claude/commands/workflow` non-recursively |

## Execution Process

1) Phase 0: Parameter parsing & input detection
- Normalize flags: prefer `--input`; accept legacy `--images/--prompt` with a deprecation warning.
- Detect sources from `--input` parts (split on `|`): glob → visual input; existing path → code import; plain text → prompt.
- Initialize run directories + metadata; initialize TodoWrite with phase checklist.

2) Phase 0.5 (conditional): Code import & completeness assessment
- If code files/dirs detected: run code import to extract available tokens/templates and emit completeness reports.

3) Phase 2: Style extraction
- Extract/derive production-ready style tokens; attach tasks as needed, execute them, then collapse into a phase summary.

4) Phase 2.3: Animation extraction
- If needed (or not provided by code import): extract animation tokens/guide; attach→execute→collapse; auto-continue.

5) Phase 2.5: Layout extraction
- Extract layout templates/guides; attach→execute→collapse; auto-continue.

6) Phase 3: UI assembly
- Invoke the assembler to generate prototypes and preview files; if tasks are attached, orchestrator executes them and collapses results.

7) Phase 4: Design system integration (optional)
- If `--session` provided: sync references into session brainstorming artifacts (reference-only; no content duplication).
- If standalone: emit completion report with output paths.

## Error Handling

- Pre-execution checks:
  - Reject missing input (`--input` or legacy flags).
  - If `--session` is provided, require the session folder to exist.
- Phase-specific errors:
  - Code import failure: degrade to visual-only when possible; record warning in TodoWrite and continue.
  - Extraction/assembly failure: stop the failing phase with a clear error message, preserving partial artifacts.
  - Integration failure: non-blocking; prototypes remain usable.

## Examples

```bash
# Visual-only
/workflow:ui-design:imitate-auto --input "design-refs/*.png"

# Code-only
/workflow:ui-design:imitate-auto --input "./src/components"

# Hybrid (glob + prompt), with multiple parts
/workflow:ui-design:imitate-auto --input "design-refs/*|modern dashboard style"

# Integrate into an existing session
/workflow:ui-design:imitate-auto --input "design-refs/*" --session WFS-12345
```
