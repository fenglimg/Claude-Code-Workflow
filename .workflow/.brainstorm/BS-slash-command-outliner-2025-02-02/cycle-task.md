# Cycle Task: Slash Command Outliner (Corpus-driven, Non-regression)

Cycle ID: cycle-v1-20260203T001806-slashcmdoutliner-qmhuep
Source Brainstorm: .workflow/.brainstorm/BS-slash-command-outliner-2025-02-02/
Created: 2026-02-03T00:18:07+08:00

## Goal
Deliver a Skill at .claude/skills/slash-command-outliner/ that, given a slash-command requirement/spec document as input, generates a CCW-aligned end-to-end development outline (Slash MD + Agent MD + supporting artifacts) with a gap-report.

Accuracy converges via corpus-driven iteration against the full command corpus.

## Decision Locks (Confirmed)
1) MVP output: Skill skeleton + Slash MD + Agent MD + gap-report
2) Matching strategy: ACE-tool Top N recall + rule-based scoring + user confirms Top 1 (high-confidence can preselect but always overridable)
3) Landing: new skill .claude/skills/slash-command-outliner/ (possible later integration into skill-generator)

## Corpus Scope (Must Cover)
Slash command corpus (must be fully covered):
- .claude/commands/**/*.md (exclude node_modules/, exclude _disabled/)

Server/tooling capability corpus (must be referenced during gap analysis):
- ccw/src/server/routes/**/*
- ccw/src/mcp-server/**/*
- ccw/src/tools/**/*
- ccw/src/commands/**/*

## Acceptance Gate (Must Pass)
(A1) Corpus manifest exists and covers 100% of slash commands (paths + extracted metadata + per-command status).
(A2) TODO_LIST tracks per-command iteration state; every slash command is represented exactly once.
(A3) Non-regression gate exists: any generator change must run regression over already-completed commands.
(A4) Regression policy: no new P0 gaps introduced for any previously completed command.

## Definition of P0 Gap
- Missing/invalid frontmatter required by CCW command conventions
- Wrong/missing allowed-tools for the command class
- Missing core phases/sections required by the command type (workflow/issue/learn/cli)
- Broken references to artifacts

## Iteration Loop (Per Command)
spec(input) -> generated-outline -> gap-report(vs implementation + tooling corpus) -> fix-plan -> apply fix -> regression
