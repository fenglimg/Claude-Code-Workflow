---
name: slash-command-outliner
description: Generate CCW-aligned slash command development outlines from a requirement/spec doc, validated via corpus-wide iteration and non-regression. Triggers on "slash command outliner", "slash 命令大纲", "slash 命令生成器", "命令大纲".
allowed-tools: Read, Write, AskUserQuestion, Task, Bash, TodoWrite, mcp__ace-tool__search_context
---

# Slash Command Outliner

Input a **slash command requirement/spec document**. Output a **CCW-aligned, end-to-end development outline** (Slash MD outline + Agent MD outline) plus a **gap-report** that compares against reference implementations and CCW server/tooling corpus. Improve quality by iterating across **all** existing commands with **non-regression snapshots**.

This skill is designed to be **precise** (no fluff) and **stable** (non-regression gate).

## Canonical Workflow (Phases)

1) `phases/01-collect-spec.md`  
2) `phases/02-retrieve-and-rank-references.md`  
3) `phases/03-generate-outlines.md`  
4) `phases/04-gap-report-and-iterate.md`  
5) `phases/05-regression-and-closure.md`

## Specs (Hard Rules)

- Spec input format: `specs/spec-input.md`
- Quality gates (P0 non-regression): `specs/quality-gates.md`
- Corpus scope (slash + server/tooling): `specs/corpus-scope.md`

## Templates

- Slash command outline: `templates/slash-command-outline.md`
- Agent outline: `templates/agent-outline.md`
- Gap report: `templates/gap-report.md`

## Scripts (Optional, Deterministic Validation)

Use these to prove “all commands are covered” and to enforce non-regression:
- Corpus scan + stats: `scripts/scan-corpus.js`
- Init cycle (manifests + TODO + requirements): `scripts/init-cycle.js`
- Generate per-command spec (no leakage): `scripts/derive-spec.js`
- Generate outline from spec: `scripts/generate-outline.js`
- Gap report vs reference + tooling: `scripts/gap-report.js`
- Regress all commands: `scripts/regress-all.js`
- LLM regress all (runner + evidence gate): `scripts/llm-regress-all.js`
- LLM run until done (auto loop): `scripts/llm-run-until-done.js`

