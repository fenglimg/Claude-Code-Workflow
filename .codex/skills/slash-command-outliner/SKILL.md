---
name: slash-command-outliner
description: Generate CCW-aligned slash command development outlines from a requirement/spec doc, validated via corpus-wide iteration and non-regression. Triggers on "slash command outliner", "slash 命令大纲", "slash 命令生成器", "命令大纲".
allowed-tools: Read, Write, Bash, AskUserQuestion, Task, Glob, Grep
---

# Slash Command Outliner

Input a **slash command requirement/spec document**. Output a **CCW-aligned, end-to-end development outline** (Slash MD outline + Agent MD outline) plus a **gap-report** that compares against reference implementations and CCW server/tooling corpus. Improve quality by iterating across **all** existing commands with **non-regression snapshots**.

This skill is designed to be **precise** (no fluff) and **stable** (non-regression gate).

## Scratchpad Output Layout（按 slash 聚合）

为避免 `.workflow/.scratchpad` 产物散落，默认把本技能的“最终产物”放到：

- `.workflow/.scratchpad/slash-command-outliner/<slash_slug>/<engine>/`

规则：

- `slash_slug`：去掉前导 `/`，再把 `:` 和 `/` 替换为 `__`
  - 例：`/learn:profile` → `learn__profile`
- `engine`：`codex` 或 `claude`（同一命令可并行保留两套产物）
- 全局共享的 corpus 文件放在：
  - `.workflow/.scratchpad/slash-command-outliner/corpus/`

推荐的文件命名（每个 `<slash_slug>/<engine>/` 下）：

- `spec.json`
- `references.json`
- `slash-outline.md`
- `agent-outline.md`
- `gap-report.full.md`（需求 vs corpus 的语义差距）
- `gap-report.outline-vs-reference.md`（outline vs oracle 的 P0/P1 差距）

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
- Generate per-command spec (no leakage): `scripts/derive-spec.js`
- Generate outline from spec: `scripts/generate-outline.js`
- Gap report vs reference + tooling: `scripts/gap-report.js`
- Regress all commands: `scripts/regress-all.js`
