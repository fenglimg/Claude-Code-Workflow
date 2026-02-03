# Parallel Dev Cycle Task: Slash Command Outliner (Corpus-Driven, All Commands)

## Main Objective

Implement the **Slash Command Outliner** Skill so that it:

- takes a **slash command requirement/spec document** as input,
- generates a **CCW-aligned end-to-end development outline** (Slash MD outline + Agent MD outline guidance),
- produces a **gap-report** by comparing against:
  - the reference slash command implementation (command markdown + related modules/scripts),
  - and the CCW server/tooling corpus,
- and converges accuracy by iterating across **all** slash commands in `.claude/commands/**/*.md`.

## Context / Current State (Already Prepared)

### Active Cycle

- Cycle ID: `cycle-v1-20260203T001806-slashcmdoutliner-qmhuep`
- Cycle folder: `.workflow/.cycle/cycle-v1-20260203T001806-slashcmdoutliner-qmhuep.progress/`
- Slash corpus manifest (82 commands):
  - `.workflow/.cycle/cycle-v1-20260203T001806-slashcmdoutliner-qmhuep.progress/corpus/corpus-manifest.json`
- Tooling corpus manifest (server/tooling reference, 71 files):
  - `.workflow/.cycle/cycle-v1-20260203T001806-slashcmdoutliner-qmhuep.progress/corpus/tooling-manifest.json`
- TODO (one item per slash command, must reach 100%):
  - `.workflow/.cycle/cycle-v1-20260203T001806-slashcmdoutliner-qmhuep.progress/TODO_LIST.md`

### Skill Skeleton (Target Deliverable Container)

- `.claude/skills/slash-command-outliner/SKILL.md`

## Decision Locks (Must Not Change)

1. MVP output: Skill skeleton + Slash MD outline + Agent MD outline + gap-report
2. Matching strategy: ACE-tool Top N recall + rule-based scoring + user confirms Top 1 (high-confidence can preselect but always overridable)
3. Landing: new skill `.claude/skills/slash-command-outliner/`

## Key Strengths of This Approach

- Full coverage is auditable (manifest + TODO).
- Accuracy converges via golden/regression snapshots (non-regression gate).
- Server/tooling scope is explicitly included in gap analysis, so missing “hidden” dependencies can be iterated in.

## Main Challenges to Address

- Avoid “input leakage”: spec input must not simply be the full implementation.
- Design stable outline normalization so diffs are meaningful.
- Scale: keep iteration throughput reasonable when expanding to all 82 commands.

## Recommended Implementation Steps (High-Level)

1. Define a **spec input format** (minimal, rule-like) + validator (no leakage).
2. Implement retrieval + matching: ACE-tool Top N + deterministic scoring + user confirm Top 1.
3. Implement template-driven outline generation (frontmatter + required sections).
4. Implement gap analysis against:
   - the reference command md (oracle),
   - the tooling corpus (server/routes, mcp-server, tools, ccw commands).
5. Implement non-regression snapshots:
   - `regression/expected/` for completed commands,
   - diff gate: no new P0 gaps for previously completed commands.
6. Run representative set (1-3 per family) → then expand to full corpus until 100%.

## P0 Gap Definition (Non-regression)

- Missing/invalid command frontmatter required by CCW conventions
- Wrong/missing allowed-tools for the command class
- Missing core phases/sections required by the command family (workflow/issue/learn/cli)
- Broken artifact references

## Source

- Brainstorm session: `BS-slash-command-outliner-2025-02-02`
- Synthesis: `.workflow/.brainstorm/BS-slash-command-outliner-2025-02-02/synthesis.json`
