# Implementation (v0.1.0)

**Cycle**: cycle-v1-20260203T001806-slashcmdoutliner-qmhuep  
**Updated**: 2026-02-03T00:20:48+08:00

## Objective

Implement the Skill at `.claude/skills/slash-command-outliner/` to generate CCW-aligned development outlines for slash commands from a requirement/spec document, converging accuracy via corpus-driven iteration across **all** `.claude/commands/**/*.md`, while preventing regressions for previously completed commands.

## Deliverables (MVP)

1) Skill package skeleton (already created): `.claude/skills/slash-command-outliner/`
2) Single-command calibration pipeline:
   - Input: a spec document (rules/requirements) for a target slash command
   - Output:
     - `generated-outline.md` (Slash MD outline + Agent MD outline guidance)
     - `gap-report.md` (vs reference implementation + tooling corpus)
     - `fix-plan.md` (actionable improvements to generator/templates/matching/validators)
3) Non-regression gate:
   - Maintain `regression/expected/` snapshots for completed commands
   - Each generator change must run regression and must not introduce new P0 gaps

## Working Artifacts (Source of Truth)

- Slash corpus manifest (must cover 100%):  
  `.workflow/.cycle/cycle-v1-20260203T001806-slashcmdoutliner-qmhuep.progress/corpus/corpus-manifest.json`
- Tooling corpus manifest (reference for gap analysis):  
  `.workflow/.cycle/cycle-v1-20260203T001806-slashcmdoutliner-qmhuep.progress/corpus/tooling-manifest.json`
- TODO list (one item per command):  
  `.workflow/.cycle/cycle-v1-20260203T001806-slashcmdoutliner-qmhuep.progress/TODO_LIST.md`

## Proposed Skill Internal Architecture (pragmatic)

### Modules (logical)

1) `spec_input`:
   - Load/normalize a “spec document” (NOT the full implementation)
   - Output a structured spec object (goal, group, expected phases, artifacts, constraints)
2) `reference_retrieval`:
   - Use ACE-tool to recall Top N similar commands
   - Apply a deterministic rule-based scoring (weights) to rank candidates
   - Require user-confirm Top 1 (allow preselect if high-confidence)
3) `template_engine`:
   - Select a command-family template (workflow/issue/learn/cli/utility)
   - Fill placeholders from structured spec + selected reference
4) `outline_generator`:
   - Emit:
     - Slash MD outline (frontmatter + sections)
     - Agent MD outline (execution model + tools + state)
5) `gap_analyzer`:
   - Compare generated outline against:
     - Reference command md (implementation oracle)
     - Tooling corpus (server/routes, mcp-server, tools, ccw commands)
   - Output a structured `gap-report.md` with P0/P1/P2
6) `regression_harness`:
   - Snapshot “expected outline” per completed command
   - Diff new outputs against expected (focus on P0 gaps + core structure)

### Snapshot Format (recommendation)

Store a normalized JSON per command in:
- `regression/expected/{CMD-XXX}-{slug}.outline.json`
- `regression/current/{CMD-XXX}-{slug}.outline.json`

Normalize by:
- stripping timestamps and volatile IDs
- canonicalizing whitespace
- sorting lists where order is not semantically meaningful

## Iteration Strategy (all commands)

1) Pick “representative set” first (1-3 per family: workflow/issue/learn/cli/utility).
2) For each command:
   - derive `spec` (minimal, rule-like, not implementation details)
   - generate outline + gap-report
   - implement fixes in generator/templates/scoring/validators
   - once acceptable: store expected snapshot and mark as completed in TODO + manifest
3) After representative set stabilizes:
   - expand to full corpus (82 commands)

## Definition: P0 Gap (must not regress)

- Missing/invalid frontmatter required by CCW conventions
- Wrong/missing allowed-tools for the command class
- Missing core phases/sections required by the command family (workflow/issue/learn/cli)
- Broken artifact references (paths that should exist / cannot be generated)

