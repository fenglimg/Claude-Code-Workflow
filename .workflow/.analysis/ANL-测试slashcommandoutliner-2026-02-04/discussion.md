# Analysis Session: ANL-测试slashcommandoutliner-2026-02-04

- Topic: 有一个问题 如何测试 `.claude/skills/slash-command-outliner` 以确保能够达到效果呢？
- Start (UTC+8): 2026-02-04T23:42:44
- Dimensions (auto): implementation, architecture, concept
- Mode: new

## Analysis Context

- Focus areas (assumed; please confirm): 代码实现 / 最佳实践 / 问题诊断
- Depth (assumed; please confirm): 标准分析
- Scope: 以“可重复验证”的方式测试 skill 行为，包括：输入/输出约束、边界场景、回归测试与 CI 可运行性。

## Initial Questions

1. 这个 skill 的“达到效果”具体指什么？（产物文件？输出文本？还是对其它命令的改写/生成？）
2. 你希望测试在什么环境跑：本机 CLI、CI、还是在 Claude/Codex 交互内？
3. 你更看重哪种验证方式：快（人工验收）/ 稳（自动化回归）/ 全（端到端）？

## Discussion Timeline

### Round 1 (Init)

- Created session folder and initialized discussion.
- Next: Explore codebase for `.claude/skills/slash-command-outliner` and existing test patterns.

### Round 2 (Exploration Results)

- Key artifacts:
  - Skill + rules: `.claude/skills/slash-command-outliner/SKILL.md`, `.claude/skills/slash-command-outliner/specs/quality-gates.md`
  - Deterministic gates:
    - LLM evidence gate: `.claude/skills/slash-command-outliner/scripts/verify-evidence.js`
    - Snapshot non-regression: `.claude/skills/slash-command-outliner/scripts/regress-all.js`
  - Existing unit test: `.claude/skills/slash-command-outliner/scripts/verify-evidence.test.js` (node:test)

- Confirmed behavior:
  - `verify-evidence.js` checks evidence tables (Existing/Planned + docs+ts anchors) and is intended as a **deterministic gate** for LLM outputs.
  - `regress-all.js` expects cycle manifests at `.workflow/.cycle/<id>.progress/corpus/{corpus-manifest.json,tooling-manifest.json}`.

- Current gap (blocks running regress-all out-of-box):
  - Example cycle folder exists (`cycle-v1-20260203T001806-slashcmdoutliner-qmhuep.progress`), but it does **not** contain `corpus/` manifests.
  - Running regress-all fails with: `ERROR: corpus manifest not found .../corpus/corpus-manifest.json`.

 - Validation (smoke):
  - After generating the missing manifests, `regress-all.js` runs successfully (limit=1) and initializes snapshots:
    - Example cycle created: `cycle-local-20260204T235906-slashcmdoutliner`
    - Output folders created under `.workflow/.cycle/cycle-local-20260204T235906-slashcmdoutliner.progress/` (corpus/specs/reports/regression/*)

## Proposed Test Ladder (Draft)

1) Unit (fast, deterministic): `node --test .claude/skills/slash-command-outliner/scripts/verify-evidence.test.js`
2) E2E gate (LLM output quality): run the skill to produce `specs/outputs/*.md`, then run:
   - `node .claude/skills/slash-command-outliner/scripts/verify-evidence.js --file=specs/outputs/gap-report.md`
   - `node .claude/skills/slash-command-outliner/scripts/verify-evidence.js --file=specs/outputs/generated-slash-outline.md`
3) Regression (corpus-wide snapshots): first generate the required manifests (currently missing), then run `regress-all.js`.

## Questions For You (to steer Round 3)

1) 你要验证的“效果”更偏向哪种？
   - A. 验证确定性脚本/非回归框架可靠（离线、CI 友好）
   - B. 验证 LLM 产物质量（evidence gate + P0 sections）
   - C. 两者都要
2) 你希望我们把 “生成 corpus/tooling manifests” 补齐成一个一键脚本/命令吗？（否则 regress-all 很难跑通）

## Current Understanding

- Pending exploration.

### Round 3 (User Direction + LLM Gate Trial)

User direction (C):
- 目标：以当前所有 slash 命令生成 TODO 列表；为每个命令生成“需求文档”（非泄漏/可复用）；基于该需求文档运行 skill（LLM），直到全量跑完；汇总具体修改建议。

LLM smoke trial (real run):
- Created a minimal requirement doc and executed Claude Code non-interactively to generate outputs:
  - Base: `.workflow/.scratchpad/slashcmdoutliner-llm-test/`
  - Outputs: `specs/outputs/{spec.json,references.json,generated-*.md,gap-report.md,fix-plan.md}`
- Deterministic evidence gate result:
  - Command: `node .claude/skills/slash-command-outliner/scripts/verify-evidence.js --file=<gap-report> --file=<generated-slash-outline>`
  - Result: FAIL (14 issues)
  - Typical failure patterns (actionable for “修改建议”):
    - Missing/invalid TS evidence (`ts:` must be `ccw/src/**` and anchor must be literal-in-file)
    - Non-existent “Existing” paths (e.g. `.workflow/issues.jsonl` should be Planned unless present)
    - Docs heading mismatch (evidence heading must match real headings in `.claude/commands/**.md`)
    - Placeholder `TBD`/`N/A` in evidence rows even when Status is Existing/Planned (gate requires docs+ts fields)

Implication:
- A corpus-wide LLM regression loop is feasible: run Claude skill per command and then gate with `verify-evidence.js`.
- The gate is strict enough to produce concrete, repeatable “改哪里” suggestions (primarily template/instruction changes to force conservative Existing claims + valid ccw/src anchors).
