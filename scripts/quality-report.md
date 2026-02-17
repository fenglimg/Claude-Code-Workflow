# DQS 文档质量审计报告

- 时间：2026-02-16T05:31:45.751Z
- 文件数：130
- 总分：53 / 100（D）

## 分类汇总

| 分类 | 文件数 | 平均行数 | 浅层文档 | 低密度 | 平均分 |
|---|---:|---:|---:|---:|---:|
| agents | 22 | 223 | 0 | 0 | 65 |
| architecture | 1 | 167 | 0 | 0 | 26 |
| commands | 50 | 132 | 22 | 1 | 59 |
| docs | 5 | 334 | 0 | 1 | 40 |
| mcp | 1 | 172 | 0 | 0 | 34 |
| root | 20 | 459 | 1 | 5 | 43 |
| servers | 1 | 206 | 0 | 0 | 30 |
| skills | 29 | 103 | 23 | 1 | 58 |
| standards | 1 | 281 | 0 | 0 | 57 |

## 文件汇总

| 文件 | DQS | Q1 | Q2 | Q3 | Q4 | Q5 | 问题数 |
|---|---:|---:|---:|---:|---:|---:|---:|
| CHANGELOG.md | 31 (F) | 0 | 16 | 10 | 5 | 0 | 2 |
| COMMAND_REFERENCE.md | 0 (F) | 0 | 0 | 0 | 0 | 0 | 4 |
| CONTRIBUTING.md | 40 (F) | 4 | 16 | 10 | 10 | 0 | 1 |
| DASHBOARD_GUIDE.md | 36 (F) | 0 | 16 | 10 | 10 | 0 | 2 |
| FAQ.md | 40 (F) | 0 | 20 | 10 | 10 | 0 | 1 |
| GETTING_STARTED.md | 45 (F) | 0 | 20 | 20 | 5 | 0 | 1 |
| GETTING_STARTED_CN.md | 45 (F) | 4 | 16 | 20 | 5 | 0 | 1 |
| INSTALL.md | 36 (F) | 0 | 16 | 10 | 10 | 0 | 1 |
| INSTALL_CN.md | 40 (F) | 4 | 16 | 10 | 10 | 0 | 1 |
| META_SKILL_SUMMARY.md | 26 (F) | 0 | 16 | 10 | 0 | 0 | 1 |
| README.md | 30 (F) | 0 | 10 | 10 | 10 | 0 | 3 |
| README_CN.md | 34 (F) | 4 | 10 | 10 | 10 | 0 | 2 |
| TASK6_SUMMARY.md | 26 (F) | 0 | 16 | 10 | 0 | 0 | 1 |
| UNIFIED_EXECUTE_SUMMARY.md | 20 (F) | 0 | 20 | 0 | 0 | 0 | 3 |
| WORKFLOW_GUIDE.md | 67 (C) | 12 | 30 | 20 | 5 | 0 | 0 |
| WORKFLOW_GUIDE_CN.md | 67 (C) | 12 | 30 | 20 | 5 | 0 | 0 |
| ccw-contentPattern-optimization-summary.md | 26 (F) | 0 | 16 | 10 | 0 | 0 | 1 |
| codex_prompt.md | 21 (F) | 0 | 16 | 0 | 5 | 0 | 3 |
| contentPattern-library-options.md | 26 (F) | 0 | 16 | 10 | 0 | 0 | 1 |
| docs/COMMAND_SPEC.md | 31 (F) | 0 | 16 | 10 | 5 | 0 | 1 |
| docs/TYPESCRIPT_LSP_SETUP.md | 36 (F) | 0 | 16 | 10 | 10 | 0 | 1 |
| docs/knowledge-base/README.md | 33 (F) | 0 | 13 | 10 | 10 | 0 | 3 |
| docs/knowledge-base/_index.md | 50 (D) | 4 | 26 | 10 | 10 | 0 | 1 |
| docs/knowledge-base/agents/_index.md | 54 (D) | 8 | 26 | 10 | 10 | 0 | 1 |
| docs/knowledge-base/agents/action-planning.md | 61 (C) | 16 | 30 | 5 | 10 | 0 | 1 |
| docs/knowledge-base/agents/cli-discuss.md | 61 (C) | 16 | 30 | 5 | 10 | 0 | 1 |
| docs/knowledge-base/agents/cli-execution.md | 71 (B) | 16 | 30 | 15 | 10 | 0 | 0 |
| docs/knowledge-base/agents/cli-explore.md | 71 (B) | 16 | 30 | 15 | 10 | 0 | 0 |
| docs/knowledge-base/agents/cli-lite-planning.md | 71 (B) | 16 | 30 | 15 | 10 | 0 | 0 |
| docs/knowledge-base/agents/cli-planning.md | 71 (B) | 16 | 30 | 15 | 10 | 0 | 0 |
| docs/knowledge-base/agents/cli-roadmap-plan.md | 71 (B) | 16 | 30 | 15 | 10 | 0 | 0 |
| docs/knowledge-base/agents/code-developer.md | 71 (B) | 16 | 30 | 15 | 10 | 0 | 0 |
| docs/knowledge-base/agents/conceptual-planning.md | 57 (D) | 16 | 26 | 5 | 10 | 0 | 1 |
| docs/knowledge-base/agents/context-search.md | 71 (B) | 16 | 30 | 15 | 10 | 0 | 0 |
| docs/knowledge-base/agents/debug-explore.md | 71 (B) | 16 | 30 | 15 | 10 | 0 | 0 |
| docs/knowledge-base/agents/doc-generator.md | 62 (C) | 16 | 26 | 15 | 5 | 0 | 0 |
| docs/knowledge-base/agents/issue-plan.md | 71 (B) | 16 | 30 | 15 | 10 | 0 | 0 |
| docs/knowledge-base/agents/issue-queue.md | 71 (B) | 16 | 30 | 15 | 10 | 0 | 0 |
| docs/knowledge-base/agents/memory-bridge.md | 62 (C) | 12 | 30 | 15 | 5 | 0 | 0 |
| docs/knowledge-base/agents/tdd-developer.md | 57 (D) | 12 | 30 | 5 | 10 | 0 | 1 |
| docs/knowledge-base/agents/test-action-planning.md | 71 (B) | 16 | 30 | 15 | 10 | 0 | 0 |
| docs/knowledge-base/agents/test-context-search.md | 61 (C) | 16 | 30 | 5 | 10 | 0 | 1 |
| docs/knowledge-base/agents/test-fix.md | 61 (C) | 16 | 30 | 5 | 10 | 0 | 1 |
| docs/knowledge-base/agents/ui-design.md | 52 (D) | 12 | 30 | 5 | 5 | 0 | 1 |
| docs/knowledge-base/agents/universal-executor.md | 57 (D) | 16 | 26 | 5 | 10 | 0 | 1 |
| docs/knowledge-base/architecture.md | 50 (D) | 4 | 26 | 10 | 10 | 0 | 1 |
| docs/knowledge-base/architecture/overview.md | 26 (F) | 0 | 16 | 10 | 0 | 0 | 1 |
| docs/knowledge-base/commands/_index.md | 48 (F) | 8 | 20 | 10 | 10 | 0 | 2 |
| docs/knowledge-base/commands/ccw-coordinator.md | 71 (B) | 16 | 30 | 15 | 10 | 0 | 0 |
| docs/knowledge-base/commands/ccw-debug.md | 30 (F) | 0 | 10 | 10 | 10 | 0 | 4 |
| docs/knowledge-base/commands/ccw-plan.md | 54 (D) | 4 | 30 | 10 | 10 | 0 | 1 |
| docs/knowledge-base/commands/ccw-test.md | 30 (F) | 0 | 10 | 10 | 10 | 0 | 4 |
| docs/knowledge-base/commands/ccw.md | 54 (D) | 4 | 30 | 10 | 10 | 0 | 1 |
| docs/knowledge-base/commands/cli-reference.md | 61 (C) | 20 | 26 | 15 | 0 | 0 | 0 |
| docs/knowledge-base/commands/cli/cli-init.md | 66 (C) | 20 | 26 | 15 | 5 | 0 | 0 |
| docs/knowledge-base/commands/cli/codex-review.md | 66 (C) | 20 | 26 | 15 | 5 | 0 | 0 |
| docs/knowledge-base/commands/flow-create.md | 30 (F) | 0 | 10 | 10 | 10 | 0 | 4 |
| docs/knowledge-base/commands/issue/convert-to-plan.md | 60 (C) | 20 | 20 | 15 | 5 | 0 | 0 |
| docs/knowledge-base/commands/issue/discover-by-prompt.md | 60 (C) | 20 | 20 | 15 | 5 | 0 | 0 |
| docs/knowledge-base/commands/issue/discover.md | 65 (C) | 20 | 20 | 15 | 10 | 0 | 0 |
| docs/knowledge-base/commands/issue/execute.md | 60 (C) | 20 | 20 | 15 | 5 | 0 | 0 |
| docs/knowledge-base/commands/issue/from-brainstorm.md | 71 (B) | 20 | 26 | 15 | 10 | 0 | 0 |
| docs/knowledge-base/commands/issue/new.md | 66 (C) | 20 | 26 | 15 | 5 | 0 | 0 |
| docs/knowledge-base/commands/issue/plan.md | 65 (C) | 20 | 20 | 15 | 10 | 0 | 0 |
| docs/knowledge-base/commands/issue/queue.md | 60 (C) | 20 | 20 | 15 | 5 | 0 | 0 |
| docs/knowledge-base/commands/memory/prepare.md | 27 (F) | 0 | 7 | 10 | 10 | 0 | 4 |
| docs/knowledge-base/commands/memory/style-skill-memory.md | 27 (F) | 0 | 7 | 10 | 10 | 0 | 4 |
| docs/knowledge-base/commands/workflow/analyze-with-file.md | 61 (C) | 16 | 30 | 5 | 10 | 0 | 1 |
| docs/knowledge-base/commands/workflow/brainstorm-with-file.md | 71 (B) | 16 | 30 | 15 | 10 | 0 | 0 |
| docs/knowledge-base/commands/workflow/brainstorm/artifacts.md | 27 (F) | 0 | 7 | 10 | 10 | 0 | 4 |
| docs/knowledge-base/commands/workflow/brainstorm/auto-parallel.md | 27 (F) | 0 | 7 | 10 | 10 | 0 | 4 |
| docs/knowledge-base/commands/workflow/brainstorm/role-analysis.md | 56 (D) | 16 | 30 | 5 | 5 | 0 | 1 |
| docs/knowledge-base/commands/workflow/brainstorm/synthesis.md | 61 (C) | 16 | 30 | 5 | 10 | 0 | 1 |
| docs/knowledge-base/commands/workflow/clean.md | 27 (F) | 0 | 7 | 10 | 10 | 0 | 4 |
| docs/knowledge-base/commands/workflow/collaborative-plan-with-file.md | 61 (C) | 16 | 30 | 5 | 10 | 0 | 1 |
| docs/knowledge-base/commands/workflow/debug-with-file.md | 63 (C) | 12 | 26 | 15 | 10 | 0 | 0 |
| docs/knowledge-base/commands/workflow/init-guidelines.md | 27 (F) | 0 | 7 | 10 | 10 | 0 | 4 |
| docs/knowledge-base/commands/workflow/init.md | 27 (F) | 0 | 7 | 10 | 10 | 0 | 4 |
| docs/knowledge-base/commands/workflow/integration-test-cycle.md | 27 (F) | 0 | 7 | 10 | 10 | 0 | 4 |
| docs/knowledge-base/commands/workflow/refactor-cycle.md | 61 (C) | 16 | 30 | 5 | 10 | 0 | 1 |
| docs/knowledge-base/commands/workflow/req-plan-with-file.md | 27 (F) | 0 | 7 | 10 | 10 | 0 | 4 |
| docs/knowledge-base/commands/workflow/session/complete.md | 65 (C) | 20 | 20 | 15 | 10 | 0 | 0 |
| docs/knowledge-base/commands/workflow/session/list.md | 65 (C) | 20 | 20 | 15 | 10 | 0 | 0 |
| docs/knowledge-base/commands/workflow/session/resume.md | 65 (C) | 20 | 20 | 15 | 10 | 0 | 0 |
| docs/knowledge-base/commands/workflow/session/solidify.md | 71 (B) | 20 | 26 | 15 | 10 | 0 | 0 |
| docs/knowledge-base/commands/workflow/session/start.md | 71 (B) | 20 | 26 | 15 | 10 | 0 | 0 |
| docs/knowledge-base/commands/workflow/ui-design/animation-extract.md | 22 (F) | 0 | 7 | 10 | 5 | 0 | 4 |
| docs/knowledge-base/commands/workflow/ui-design/codify-style.md | 22 (F) | 0 | 7 | 10 | 5 | 0 | 4 |
| docs/knowledge-base/commands/workflow/ui-design/design-sync.md | 22 (F) | 0 | 7 | 10 | 5 | 0 | 4 |
| docs/knowledge-base/commands/workflow/ui-design/explore-auto.md | 22 (F) | 0 | 7 | 10 | 5 | 0 | 4 |
| docs/knowledge-base/commands/workflow/ui-design/generate.md | 22 (F) | 0 | 7 | 10 | 5 | 0 | 4 |
| docs/knowledge-base/commands/workflow/ui-design/imitate-auto.md | 22 (F) | 0 | 7 | 10 | 5 | 0 | 4 |
| docs/knowledge-base/commands/workflow/ui-design/import-from-code.md | 22 (F) | 0 | 7 | 10 | 5 | 0 | 4 |
| docs/knowledge-base/commands/workflow/ui-design/layout-extract.md | 22 (F) | 0 | 7 | 10 | 5 | 0 | 4 |
| docs/knowledge-base/commands/workflow/ui-design/reference-page-generator.md | 22 (F) | 0 | 7 | 10 | 5 | 0 | 4 |
| docs/knowledge-base/commands/workflow/ui-design/style-extract.md | 22 (F) | 0 | 7 | 10 | 5 | 0 | 4 |
| docs/knowledge-base/commands/workflow/unified-execute-with-file.md | 71 (B) | 16 | 30 | 15 | 10 | 0 | 0 |
| docs/knowledge-base/mcp/integration.md | 34 (F) | 8 | 16 | 10 | 0 | 0 | 1 |
| docs/knowledge-base/servers/architecture.md | 30 (F) | 4 | 16 | 10 | 0 | 0 | 1 |
| docs/knowledge-base/skills/_index.md | 67 (C) | 12 | 30 | 15 | 10 | 0 | 1 |
| docs/knowledge-base/skills/brainstorm.md | 30 (F) | 0 | 10 | 10 | 10 | 0 | 5 |
| docs/knowledge-base/skills/ccw-help.md | 30 (F) | 0 | 10 | 10 | 10 | 0 | 5 |
| docs/knowledge-base/skills/copyright-docs.md | 30 (F) | 0 | 10 | 10 | 10 | 0 | 5 |
| docs/knowledge-base/skills/flow-coordinator.md | 72 (B) | 16 | 26 | 20 | 10 | 0 | 1 |
| docs/knowledge-base/skills/issue-discover.md | 30 (F) | 0 | 10 | 10 | 10 | 0 | 5 |
| docs/knowledge-base/skills/issue-manage.md | 30 (F) | 0 | 10 | 10 | 10 | 0 | 5 |
| docs/knowledge-base/skills/issue-resolve.md | 30 (F) | 0 | 10 | 10 | 10 | 0 | 5 |
| docs/knowledge-base/skills/memory-capture.md | 30 (F) | 0 | 10 | 10 | 10 | 0 | 5 |
| docs/knowledge-base/skills/memory-manage.md | 30 (F) | 0 | 10 | 10 | 10 | 0 | 5 |
| docs/knowledge-base/skills/overview.md | 34 (F) | 4 | 20 | 10 | 0 | 0 | 1 |
| docs/knowledge-base/skills/project-analyze.md | 30 (F) | 0 | 10 | 10 | 10 | 0 | 5 |
| docs/knowledge-base/skills/review-code.md | 30 (F) | 0 | 10 | 10 | 10 | 0 | 5 |
| docs/knowledge-base/skills/review-cycle.md | 30 (F) | 0 | 10 | 10 | 10 | 0 | 5 |
| docs/knowledge-base/skills/skill-generator.md | 30 (F) | 0 | 10 | 10 | 10 | 0 | 5 |
| docs/knowledge-base/skills/skill-tuning.md | 30 (F) | 0 | 10 | 10 | 10 | 0 | 5 |
| docs/knowledge-base/skills/software-manual.md | 30 (F) | 0 | 10 | 10 | 10 | 0 | 5 |
| docs/knowledge-base/skills/spec-generator.md | 30 (F) | 0 | 10 | 10 | 10 | 0 | 5 |
| docs/knowledge-base/skills/team-command-designer.md | 30 (F) | 0 | 10 | 10 | 10 | 0 | 5 |
| docs/knowledge-base/skills/team-issue.md | 30 (F) | 0 | 10 | 10 | 10 | 0 | 5 |
| docs/knowledge-base/skills/team-lifecycle.md | 30 (F) | 0 | 10 | 10 | 10 | 0 | 5 |
| docs/knowledge-base/skills/team-skill-designer.md | 30 (F) | 0 | 10 | 10 | 10 | 0 | 5 |
| docs/knowledge-base/skills/workflow-execute.md | 76 (B) | 16 | 30 | 20 | 10 | 0 | 1 |
| docs/knowledge-base/skills/workflow-lite-plan.md | 30 (F) | 0 | 10 | 10 | 10 | 0 | 5 |
| docs/knowledge-base/skills/workflow-multi-cli-plan.md | 30 (F) | 0 | 10 | 10 | 10 | 0 | 5 |
| docs/knowledge-base/skills/workflow-plan.md | 75 (B) | 20 | 30 | 15 | 10 | 0 | 0 |
| docs/knowledge-base/skills/workflow-skill-designer.md | 30 (F) | 0 | 10 | 10 | 10 | 0 | 5 |
| docs/knowledge-base/skills/workflow-tdd.md | 67 (C) | 12 | 30 | 20 | 5 | 0 | 1 |
| docs/knowledge-base/skills/workflow-test-fix.md | 30 (F) | 0 | 10 | 10 | 10 | 0 | 5 |
| docs/knowledge-base/standards/document-quality-standard.md | 57 (D) | 16 | 16 | 15 | 10 | 0 | 0 |
| status-reference.md | 34 (F) | 4 | 10 | 10 | 10 | 0 | 2 |

## 详情

### CHANGELOG.md

- DQS：31 / 100
- 维度：Q1 0/20，Q2 16/30，Q3 10/20，Q4 5/20，Q5 0/10

| 严重性 | 分析器 | 代码 | 描述 |
|---|---|---|---|
| warn | KeywordDensityAnalyzer | keyword_density.low_density | 关键词密度偏低（0.82% < 2.00%），建议补充示例、图示或结构化表达。 |
| warn | DQSScorer | dqs.low_q1 | Q1（结构）得分偏低，建议补充标题层级、清单与分段。 |

### COMMAND_REFERENCE.md

- DQS：0 / 100
- 维度：Q1 0/20，Q2 0/30，Q3 0/20，Q4 0/20，Q5 0/10

| 严重性 | 分析器 | 代码 | 描述 |
|---|---|---|---|
| warn | KeywordDensityAnalyzer | keyword_density.low_density | 关键词密度偏低（0.56% < 2.00%），建议补充示例、图示或结构化表达。 |
| warn | DQSScorer | dqs.low_q1 | Q1（结构）得分偏低，建议补充标题层级、清单与分段。 |
| warn | DQSScorer | dqs.low_q2 | Q2（逻辑深度）得分偏低，建议补充 Mermaid 图、代码片段或阶段拆解。 |
| warn | DQSScorer | dqs.low_q3 | Q3（场景）得分偏低，建议增加示例、用法或边界条件说明。 |

### CONTRIBUTING.md

- DQS：40 / 100
- 维度：Q1 4/20，Q2 16/30，Q3 10/20，Q4 10/20，Q5 0/10

| 严重性 | 分析器 | 代码 | 描述 |
|---|---|---|---|
| warn | DQSScorer | dqs.low_q1 | Q1（结构）得分偏低，建议补充标题层级、清单与分段。 |

### DASHBOARD_GUIDE.md

- DQS：36 / 100
- 维度：Q1 0/20，Q2 16/30，Q3 10/20，Q4 10/20，Q5 0/10

| 严重性 | 分析器 | 代码 | 描述 |
|---|---|---|---|
| warn | KeywordDensityAnalyzer | keyword_density.low_density | 关键词密度偏低（1.66% < 2.00%），建议补充示例、图示或结构化表达。 |
| warn | DQSScorer | dqs.low_q1 | Q1（结构）得分偏低，建议补充标题层级、清单与分段。 |

### FAQ.md

- DQS：40 / 100
- 维度：Q1 0/20，Q2 20/30，Q3 10/20，Q4 10/20，Q5 0/10

| 严重性 | 分析器 | 代码 | 描述 |
|---|---|---|---|
| warn | DQSScorer | dqs.low_q1 | Q1（结构）得分偏低，建议补充标题层级、清单与分段。 |

### GETTING_STARTED.md

- DQS：45 / 100
- 维度：Q1 0/20，Q2 20/30，Q3 20/20，Q4 5/20，Q5 0/10

| 严重性 | 分析器 | 代码 | 描述 |
|---|---|---|---|
| warn | DQSScorer | dqs.low_q1 | Q1（结构）得分偏低，建议补充标题层级、清单与分段。 |

### GETTING_STARTED_CN.md

- DQS：45 / 100
- 维度：Q1 4/20，Q2 16/30，Q3 20/20，Q4 5/20，Q5 0/10

| 严重性 | 分析器 | 代码 | 描述 |
|---|---|---|---|
| warn | DQSScorer | dqs.low_q1 | Q1（结构）得分偏低，建议补充标题层级、清单与分段。 |

### INSTALL.md

- DQS：36 / 100
- 维度：Q1 0/20，Q2 16/30，Q3 10/20，Q4 10/20，Q5 0/10

| 严重性 | 分析器 | 代码 | 描述 |
|---|---|---|---|
| warn | DQSScorer | dqs.low_q1 | Q1（结构）得分偏低，建议补充标题层级、清单与分段。 |

### INSTALL_CN.md

- DQS：40 / 100
- 维度：Q1 4/20，Q2 16/30，Q3 10/20，Q4 10/20，Q5 0/10

| 严重性 | 分析器 | 代码 | 描述 |
|---|---|---|---|
| warn | DQSScorer | dqs.low_q1 | Q1（结构）得分偏低，建议补充标题层级、清单与分段。 |

### META_SKILL_SUMMARY.md

- DQS：26 / 100
- 维度：Q1 0/20，Q2 16/30，Q3 10/20，Q4 0/20，Q5 0/10

| 严重性 | 分析器 | 代码 | 描述 |
|---|---|---|---|
| warn | DQSScorer | dqs.low_q1 | Q1（结构）得分偏低，建议补充标题层级、清单与分段。 |

### README.md

- DQS：30 / 100
- 维度：Q1 0/20，Q2 10/30，Q3 10/20，Q4 10/20，Q5 0/10

| 严重性 | 分析器 | 代码 | 描述 |
|---|---|---|---|
| warn | KeywordDensityAnalyzer | keyword_density.low_density | 关键词密度偏低（1.95% < 2.00%），建议补充示例、图示或结构化表达。 |
| warn | DQSScorer | dqs.low_q1 | Q1（结构）得分偏低，建议补充标题层级、清单与分段。 |
| warn | DQSScorer | dqs.low_q2 | Q2（逻辑深度）得分偏低，建议补充 Mermaid 图、代码片段或阶段拆解。 |

### README_CN.md

- DQS：34 / 100
- 维度：Q1 4/20，Q2 10/30，Q3 10/20，Q4 10/20，Q5 0/10

| 严重性 | 分析器 | 代码 | 描述 |
|---|---|---|---|
| warn | DQSScorer | dqs.low_q1 | Q1（结构）得分偏低，建议补充标题层级、清单与分段。 |
| warn | DQSScorer | dqs.low_q2 | Q2（逻辑深度）得分偏低，建议补充 Mermaid 图、代码片段或阶段拆解。 |

### TASK6_SUMMARY.md

- DQS：26 / 100
- 维度：Q1 0/20，Q2 16/30，Q3 10/20，Q4 0/20，Q5 0/10

| 严重性 | 分析器 | 代码 | 描述 |
|---|---|---|---|
| warn | DQSScorer | dqs.low_q1 | Q1（结构）得分偏低，建议补充标题层级、清单与分段。 |

### UNIFIED_EXECUTE_SUMMARY.md

- DQS：20 / 100
- 维度：Q1 0/20，Q2 20/30，Q3 0/20，Q4 0/20，Q5 0/10

| 严重性 | 分析器 | 代码 | 描述 |
|---|---|---|---|
| warn | KeywordDensityAnalyzer | keyword_density.low_density | 关键词密度偏低（1.80% < 2.00%），建议补充示例、图示或结构化表达。 |
| warn | DQSScorer | dqs.low_q1 | Q1（结构）得分偏低，建议补充标题层级、清单与分段。 |
| warn | DQSScorer | dqs.low_q3 | Q3（场景）得分偏低，建议增加示例、用法或边界条件说明。 |

### WORKFLOW_GUIDE.md

- DQS：67 / 100
- 维度：Q1 12/20，Q2 30/30，Q3 20/20，Q4 5/20，Q5 0/10

- ✅ 未发现问题

### WORKFLOW_GUIDE_CN.md

- DQS：67 / 100
- 维度：Q1 12/20，Q2 30/30，Q3 20/20，Q4 5/20，Q5 0/10

- ✅ 未发现问题

### ccw-contentPattern-optimization-summary.md

- DQS：26 / 100
- 维度：Q1 0/20，Q2 16/30，Q3 10/20，Q4 0/20，Q5 0/10

| 严重性 | 分析器 | 代码 | 描述 |
|---|---|---|---|
| warn | DQSScorer | dqs.low_q1 | Q1（结构）得分偏低，建议补充标题层级、清单与分段。 |

### codex_prompt.md

- DQS：21 / 100
- 维度：Q1 0/20，Q2 16/30，Q3 0/20，Q4 5/20，Q5 0/10

| 严重性 | 分析器 | 代码 | 描述 |
|---|---|---|---|
| warn | LineCountAnalyzer | line_count.too_short | 文档有效行数过少（42 行），可能信息不足（阈值：50 行，空行/注释不计入）。 |
| warn | DQSScorer | dqs.low_q1 | Q1（结构）得分偏低，建议补充标题层级、清单与分段。 |
| warn | DQSScorer | dqs.low_q3 | Q3（场景）得分偏低，建议增加示例、用法或边界条件说明。 |

### contentPattern-library-options.md

- DQS：26 / 100
- 维度：Q1 0/20，Q2 16/30，Q3 10/20，Q4 0/20，Q5 0/10

| 严重性 | 分析器 | 代码 | 描述 |
|---|---|---|---|
| warn | DQSScorer | dqs.low_q1 | Q1（结构）得分偏低，建议补充标题层级、清单与分段。 |

### docs/COMMAND_SPEC.md

- DQS：31 / 100
- 维度：Q1 0/20，Q2 16/30，Q3 10/20，Q4 5/20，Q5 0/10

| 严重性 | 分析器 | 代码 | 描述 |
|---|---|---|---|
| warn | DQSScorer | dqs.low_q1 | Q1（结构）得分偏低，建议补充标题层级、清单与分段。 |

### docs/TYPESCRIPT_LSP_SETUP.md

- DQS：36 / 100
- 维度：Q1 0/20，Q2 16/30，Q3 10/20，Q4 10/20，Q5 0/10

| 严重性 | 分析器 | 代码 | 描述 |
|---|---|---|---|
| warn | DQSScorer | dqs.low_q1 | Q1（结构）得分偏低，建议补充标题层级、清单与分段。 |

### docs/knowledge-base/README.md

- DQS：33 / 100
- 维度：Q1 0/20，Q2 13/30，Q3 10/20，Q4 10/20，Q5 0/10

| 严重性 | 分析器 | 代码 | 描述 |
|---|---|---|---|
| warn | KeywordDensityAnalyzer | keyword_density.low_density | 关键词密度偏低（1.72% < 2.00%），建议补充示例、图示或结构化表达。 |
| warn | DQSScorer | dqs.low_q1 | Q1（结构）得分偏低，建议补充标题层级、清单与分段。 |
| warn | DQSScorer | dqs.low_q2 | Q2（逻辑深度）得分偏低，建议补充 Mermaid 图、代码片段或阶段拆解。 |

### docs/knowledge-base/_index.md

- DQS：50 / 100
- 维度：Q1 4/20，Q2 26/30，Q3 10/20，Q4 10/20，Q5 0/10

| 严重性 | 分析器 | 代码 | 描述 |
|---|---|---|---|
| warn | DQSScorer | dqs.low_q1 | Q1（结构）得分偏低，建议补充标题层级、清单与分段。 |

### docs/knowledge-base/agents/_index.md

- DQS：54 / 100
- 维度：Q1 8/20，Q2 26/30，Q3 10/20，Q4 10/20，Q5 0/10

| 严重性 | 分析器 | 代码 | 描述 |
|---|---|---|---|
| warn | DQSScorer | dqs.low_q1 | Q1（结构）得分偏低，建议补充标题层级、清单与分段。 |

### docs/knowledge-base/agents/action-planning.md

- DQS：61 / 100
- 维度：Q1 16/20，Q2 30/30，Q3 5/20，Q4 10/20，Q5 0/10

| 严重性 | 分析器 | 代码 | 描述 |
|---|---|---|---|
| warn | DQSScorer | dqs.low_q3 | Q3（场景）得分偏低，建议增加示例、用法或边界条件说明。 |

### docs/knowledge-base/agents/cli-discuss.md

- DQS：61 / 100
- 维度：Q1 16/20，Q2 30/30，Q3 5/20，Q4 10/20，Q5 0/10

| 严重性 | 分析器 | 代码 | 描述 |
|---|---|---|---|
| warn | DQSScorer | dqs.low_q3 | Q3（场景）得分偏低，建议增加示例、用法或边界条件说明。 |

### docs/knowledge-base/agents/cli-execution.md

- DQS：71 / 100
- 维度：Q1 16/20，Q2 30/30，Q3 15/20，Q4 10/20，Q5 0/10

- ✅ 未发现问题

### docs/knowledge-base/agents/cli-explore.md

- DQS：71 / 100
- 维度：Q1 16/20，Q2 30/30，Q3 15/20，Q4 10/20，Q5 0/10

- ✅ 未发现问题

### docs/knowledge-base/agents/cli-lite-planning.md

- DQS：71 / 100
- 维度：Q1 16/20，Q2 30/30，Q3 15/20，Q4 10/20，Q5 0/10

- ✅ 未发现问题

### docs/knowledge-base/agents/cli-planning.md

- DQS：71 / 100
- 维度：Q1 16/20，Q2 30/30，Q3 15/20，Q4 10/20，Q5 0/10

- ✅ 未发现问题

### docs/knowledge-base/agents/cli-roadmap-plan.md

- DQS：71 / 100
- 维度：Q1 16/20，Q2 30/30，Q3 15/20，Q4 10/20，Q5 0/10

- ✅ 未发现问题

### docs/knowledge-base/agents/code-developer.md

- DQS：71 / 100
- 维度：Q1 16/20，Q2 30/30，Q3 15/20，Q4 10/20，Q5 0/10

- ✅ 未发现问题

### docs/knowledge-base/agents/conceptual-planning.md

- DQS：57 / 100
- 维度：Q1 16/20，Q2 26/30，Q3 5/20，Q4 10/20，Q5 0/10

| 严重性 | 分析器 | 代码 | 描述 |
|---|---|---|---|
| warn | DQSScorer | dqs.low_q3 | Q3（场景）得分偏低，建议增加示例、用法或边界条件说明。 |

### docs/knowledge-base/agents/context-search.md

- DQS：71 / 100
- 维度：Q1 16/20，Q2 30/30，Q3 15/20，Q4 10/20，Q5 0/10

- ✅ 未发现问题

### docs/knowledge-base/agents/debug-explore.md

- DQS：71 / 100
- 维度：Q1 16/20，Q2 30/30，Q3 15/20，Q4 10/20，Q5 0/10

- ✅ 未发现问题

### docs/knowledge-base/agents/doc-generator.md

- DQS：62 / 100
- 维度：Q1 16/20，Q2 26/30，Q3 15/20，Q4 5/20，Q5 0/10

- ✅ 未发现问题

### docs/knowledge-base/agents/issue-plan.md

- DQS：71 / 100
- 维度：Q1 16/20，Q2 30/30，Q3 15/20，Q4 10/20，Q5 0/10

- ✅ 未发现问题

### docs/knowledge-base/agents/issue-queue.md

- DQS：71 / 100
- 维度：Q1 16/20，Q2 30/30，Q3 15/20，Q4 10/20，Q5 0/10

- ✅ 未发现问题

### docs/knowledge-base/agents/memory-bridge.md

- DQS：62 / 100
- 维度：Q1 12/20，Q2 30/30，Q3 15/20，Q4 5/20，Q5 0/10

- ✅ 未发现问题

### docs/knowledge-base/agents/tdd-developer.md

- DQS：57 / 100
- 维度：Q1 12/20，Q2 30/30，Q3 5/20，Q4 10/20，Q5 0/10

| 严重性 | 分析器 | 代码 | 描述 |
|---|---|---|---|
| warn | DQSScorer | dqs.low_q3 | Q3（场景）得分偏低，建议增加示例、用法或边界条件说明。 |

### docs/knowledge-base/agents/test-action-planning.md

- DQS：71 / 100
- 维度：Q1 16/20，Q2 30/30，Q3 15/20，Q4 10/20，Q5 0/10

- ✅ 未发现问题

### docs/knowledge-base/agents/test-context-search.md

- DQS：61 / 100
- 维度：Q1 16/20，Q2 30/30，Q3 5/20，Q4 10/20，Q5 0/10

| 严重性 | 分析器 | 代码 | 描述 |
|---|---|---|---|
| warn | DQSScorer | dqs.low_q3 | Q3（场景）得分偏低，建议增加示例、用法或边界条件说明。 |

### docs/knowledge-base/agents/test-fix.md

- DQS：61 / 100
- 维度：Q1 16/20，Q2 30/30，Q3 5/20，Q4 10/20，Q5 0/10

| 严重性 | 分析器 | 代码 | 描述 |
|---|---|---|---|
| warn | DQSScorer | dqs.low_q3 | Q3（场景）得分偏低，建议增加示例、用法或边界条件说明。 |

### docs/knowledge-base/agents/ui-design.md

- DQS：52 / 100
- 维度：Q1 12/20，Q2 30/30，Q3 5/20，Q4 5/20，Q5 0/10

| 严重性 | 分析器 | 代码 | 描述 |
|---|---|---|---|
| warn | DQSScorer | dqs.low_q3 | Q3（场景）得分偏低，建议增加示例、用法或边界条件说明。 |

### docs/knowledge-base/agents/universal-executor.md

- DQS：57 / 100
- 维度：Q1 16/20，Q2 26/30，Q3 5/20，Q4 10/20，Q5 0/10

| 严重性 | 分析器 | 代码 | 描述 |
|---|---|---|---|
| warn | DQSScorer | dqs.low_q3 | Q3（场景）得分偏低，建议增加示例、用法或边界条件说明。 |

### docs/knowledge-base/architecture.md

- DQS：50 / 100
- 维度：Q1 4/20，Q2 26/30，Q3 10/20，Q4 10/20，Q5 0/10

| 严重性 | 分析器 | 代码 | 描述 |
|---|---|---|---|
| warn | DQSScorer | dqs.low_q1 | Q1（结构）得分偏低，建议补充标题层级、清单与分段。 |

### docs/knowledge-base/architecture/overview.md

- DQS：26 / 100
- 维度：Q1 0/20，Q2 16/30，Q3 10/20，Q4 0/20，Q5 0/10

| 严重性 | 分析器 | 代码 | 描述 |
|---|---|---|---|
| warn | DQSScorer | dqs.low_q1 | Q1（结构）得分偏低，建议补充标题层级、清单与分段。 |

### docs/knowledge-base/commands/_index.md

- DQS：48 / 100
- 维度：Q1 8/20，Q2 20/30，Q3 10/20，Q4 10/20，Q5 0/10

| 严重性 | 分析器 | 代码 | 描述 |
|---|---|---|---|
| warn | KeywordDensityAnalyzer | keyword_density.low_density | 关键词密度偏低（1.50% < 2.00%），建议补充示例、图示或结构化表达。 |
| warn | DQSScorer | dqs.low_q1 | Q1（结构）得分偏低，建议补充标题层级、清单与分段。 |

### docs/knowledge-base/commands/ccw-coordinator.md

- DQS：71 / 100
- 维度：Q1 16/20，Q2 30/30，Q3 15/20，Q4 10/20，Q5 0/10

- ✅ 未发现问题

### docs/knowledge-base/commands/ccw-debug.md

- DQS：30 / 100
- 维度：Q1 0/20，Q2 10/30，Q3 10/20，Q4 10/20，Q5 0/10

| 严重性 | 分析器 | 代码 | 描述 |
|---|---|---|---|
| warn | LineCountAnalyzer | line_count.too_short | 文档有效行数过少（22 行），可能信息不足（阈值：50 行，空行/注释不计入）。 |
| warn | DQSScorer | dqs.low_q1 | Q1（结构）得分偏低，建议补充标题层级、清单与分段。 |
| warn | DQSScorer | dqs.low_q2 | Q2（逻辑深度）得分偏低，建议补充 Mermaid 图、代码片段或阶段拆解。 |
| info | BoilerplateDetector | boilerplate.autogenerated | 检测到 `Auto-generated` 标记，建议配套 `source-path/source-hash` 确保同步。 |

### docs/knowledge-base/commands/ccw-plan.md

- DQS：54 / 100
- 维度：Q1 4/20，Q2 30/30，Q3 10/20，Q4 10/20，Q5 0/10

| 严重性 | 分析器 | 代码 | 描述 |
|---|---|---|---|
| warn | DQSScorer | dqs.low_q1 | Q1（结构）得分偏低，建议补充标题层级、清单与分段。 |

### docs/knowledge-base/commands/ccw-test.md

- DQS：30 / 100
- 维度：Q1 0/20，Q2 10/30，Q3 10/20，Q4 10/20，Q5 0/10

| 严重性 | 分析器 | 代码 | 描述 |
|---|---|---|---|
| warn | LineCountAnalyzer | line_count.too_short | 文档有效行数过少（22 行），可能信息不足（阈值：50 行，空行/注释不计入）。 |
| warn | DQSScorer | dqs.low_q1 | Q1（结构）得分偏低，建议补充标题层级、清单与分段。 |
| warn | DQSScorer | dqs.low_q2 | Q2（逻辑深度）得分偏低，建议补充 Mermaid 图、代码片段或阶段拆解。 |
| info | BoilerplateDetector | boilerplate.autogenerated | 检测到 `Auto-generated` 标记，建议配套 `source-path/source-hash` 确保同步。 |

### docs/knowledge-base/commands/ccw.md

- DQS：54 / 100
- 维度：Q1 4/20，Q2 30/30，Q3 10/20，Q4 10/20，Q5 0/10

| 严重性 | 分析器 | 代码 | 描述 |
|---|---|---|---|
| warn | DQSScorer | dqs.low_q1 | Q1（结构）得分偏低，建议补充标题层级、清单与分段。 |

### docs/knowledge-base/commands/cli-reference.md

- DQS：61 / 100
- 维度：Q1 20/20，Q2 26/30，Q3 15/20，Q4 0/20，Q5 0/10

- ✅ 未发现问题

### docs/knowledge-base/commands/cli/cli-init.md

- DQS：66 / 100
- 维度：Q1 20/20，Q2 26/30，Q3 15/20，Q4 5/20，Q5 0/10

- ✅ 未发现问题

### docs/knowledge-base/commands/cli/codex-review.md

- DQS：66 / 100
- 维度：Q1 20/20，Q2 26/30，Q3 15/20，Q4 5/20，Q5 0/10

- ✅ 未发现问题

### docs/knowledge-base/commands/flow-create.md

- DQS：30 / 100
- 维度：Q1 0/20，Q2 10/30，Q3 10/20，Q4 10/20，Q5 0/10

| 严重性 | 分析器 | 代码 | 描述 |
|---|---|---|---|
| warn | LineCountAnalyzer | line_count.too_short | 文档有效行数过少（22 行），可能信息不足（阈值：50 行，空行/注释不计入）。 |
| warn | DQSScorer | dqs.low_q1 | Q1（结构）得分偏低，建议补充标题层级、清单与分段。 |
| warn | DQSScorer | dqs.low_q2 | Q2（逻辑深度）得分偏低，建议补充 Mermaid 图、代码片段或阶段拆解。 |
| info | BoilerplateDetector | boilerplate.autogenerated | 检测到 `Auto-generated` 标记，建议配套 `source-path/source-hash` 确保同步。 |

### docs/knowledge-base/commands/issue/convert-to-plan.md

- DQS：60 / 100
- 维度：Q1 20/20，Q2 20/30，Q3 15/20，Q4 5/20，Q5 0/10

- ✅ 未发现问题

### docs/knowledge-base/commands/issue/discover-by-prompt.md

- DQS：60 / 100
- 维度：Q1 20/20，Q2 20/30，Q3 15/20，Q4 5/20，Q5 0/10

- ✅ 未发现问题

### docs/knowledge-base/commands/issue/discover.md

- DQS：65 / 100
- 维度：Q1 20/20，Q2 20/30，Q3 15/20，Q4 10/20，Q5 0/10

- ✅ 未发现问题

### docs/knowledge-base/commands/issue/execute.md

- DQS：60 / 100
- 维度：Q1 20/20，Q2 20/30，Q3 15/20，Q4 5/20，Q5 0/10

- ✅ 未发现问题

### docs/knowledge-base/commands/issue/from-brainstorm.md

- DQS：71 / 100
- 维度：Q1 20/20，Q2 26/30，Q3 15/20，Q4 10/20，Q5 0/10

- ✅ 未发现问题

### docs/knowledge-base/commands/issue/new.md

- DQS：66 / 100
- 维度：Q1 20/20，Q2 26/30，Q3 15/20，Q4 5/20，Q5 0/10

- ✅ 未发现问题

### docs/knowledge-base/commands/issue/plan.md

- DQS：65 / 100
- 维度：Q1 20/20，Q2 20/30，Q3 15/20，Q4 10/20，Q5 0/10

- ✅ 未发现问题

### docs/knowledge-base/commands/issue/queue.md

- DQS：60 / 100
- 维度：Q1 20/20，Q2 20/30，Q3 15/20，Q4 5/20，Q5 0/10

- ✅ 未发现问题

### docs/knowledge-base/commands/memory/prepare.md

- DQS：27 / 100
- 维度：Q1 0/20，Q2 7/30，Q3 10/20，Q4 10/20，Q5 0/10

| 严重性 | 分析器 | 代码 | 描述 |
|---|---|---|---|
| warn | LineCountAnalyzer | line_count.too_short | 文档有效行数过少（14 行），可能信息不足（阈值：50 行，空行/注释不计入）。 |
| warn | DQSScorer | dqs.low_q1 | Q1（结构）得分偏低，建议补充标题层级、清单与分段。 |
| warn | DQSScorer | dqs.low_q2 | Q2（逻辑深度）得分偏低，建议补充 Mermaid 图、代码片段或阶段拆解。 |
| info | BoilerplateDetector | boilerplate.autogenerated | 检测到 `Auto-generated` 标记，建议配套 `source-path/source-hash` 确保同步。 |

### docs/knowledge-base/commands/memory/style-skill-memory.md

- DQS：27 / 100
- 维度：Q1 0/20，Q2 7/30，Q3 10/20，Q4 10/20，Q5 0/10

| 严重性 | 分析器 | 代码 | 描述 |
|---|---|---|---|
| warn | LineCountAnalyzer | line_count.too_short | 文档有效行数过少（14 行），可能信息不足（阈值：50 行，空行/注释不计入）。 |
| warn | DQSScorer | dqs.low_q1 | Q1（结构）得分偏低，建议补充标题层级、清单与分段。 |
| warn | DQSScorer | dqs.low_q2 | Q2（逻辑深度）得分偏低，建议补充 Mermaid 图、代码片段或阶段拆解。 |
| info | BoilerplateDetector | boilerplate.autogenerated | 检测到 `Auto-generated` 标记，建议配套 `source-path/source-hash` 确保同步。 |

### docs/knowledge-base/commands/workflow/analyze-with-file.md

- DQS：61 / 100
- 维度：Q1 16/20，Q2 30/30，Q3 5/20，Q4 10/20，Q5 0/10

| 严重性 | 分析器 | 代码 | 描述 |
|---|---|---|---|
| warn | DQSScorer | dqs.low_q3 | Q3（场景）得分偏低，建议增加示例、用法或边界条件说明。 |

### docs/knowledge-base/commands/workflow/brainstorm-with-file.md

- DQS：71 / 100
- 维度：Q1 16/20，Q2 30/30，Q3 15/20，Q4 10/20，Q5 0/10

- ✅ 未发现问题

### docs/knowledge-base/commands/workflow/brainstorm/artifacts.md

- DQS：27 / 100
- 维度：Q1 0/20，Q2 7/30，Q3 10/20，Q4 10/20，Q5 0/10

| 严重性 | 分析器 | 代码 | 描述 |
|---|---|---|---|
| warn | LineCountAnalyzer | line_count.too_short | 文档有效行数过少（14 行），可能信息不足（阈值：50 行，空行/注释不计入）。 |
| warn | DQSScorer | dqs.low_q1 | Q1（结构）得分偏低，建议补充标题层级、清单与分段。 |
| warn | DQSScorer | dqs.low_q2 | Q2（逻辑深度）得分偏低，建议补充 Mermaid 图、代码片段或阶段拆解。 |
| info | BoilerplateDetector | boilerplate.autogenerated | 检测到 `Auto-generated` 标记，建议配套 `source-path/source-hash` 确保同步。 |

### docs/knowledge-base/commands/workflow/brainstorm/auto-parallel.md

- DQS：27 / 100
- 维度：Q1 0/20，Q2 7/30，Q3 10/20，Q4 10/20，Q5 0/10

| 严重性 | 分析器 | 代码 | 描述 |
|---|---|---|---|
| warn | LineCountAnalyzer | line_count.too_short | 文档有效行数过少（14 行），可能信息不足（阈值：50 行，空行/注释不计入）。 |
| warn | DQSScorer | dqs.low_q1 | Q1（结构）得分偏低，建议补充标题层级、清单与分段。 |
| warn | DQSScorer | dqs.low_q2 | Q2（逻辑深度）得分偏低，建议补充 Mermaid 图、代码片段或阶段拆解。 |
| info | BoilerplateDetector | boilerplate.autogenerated | 检测到 `Auto-generated` 标记，建议配套 `source-path/source-hash` 确保同步。 |

### docs/knowledge-base/commands/workflow/brainstorm/role-analysis.md

- DQS：56 / 100
- 维度：Q1 16/20，Q2 30/30，Q3 5/20，Q4 5/20，Q5 0/10

| 严重性 | 分析器 | 代码 | 描述 |
|---|---|---|---|
| warn | DQSScorer | dqs.low_q3 | Q3（场景）得分偏低，建议增加示例、用法或边界条件说明。 |

### docs/knowledge-base/commands/workflow/brainstorm/synthesis.md

- DQS：61 / 100
- 维度：Q1 16/20，Q2 30/30，Q3 5/20，Q4 10/20，Q5 0/10

| 严重性 | 分析器 | 代码 | 描述 |
|---|---|---|---|
| warn | DQSScorer | dqs.low_q3 | Q3（场景）得分偏低，建议增加示例、用法或边界条件说明。 |

### docs/knowledge-base/commands/workflow/clean.md

- DQS：27 / 100
- 维度：Q1 0/20，Q2 7/30，Q3 10/20，Q4 10/20，Q5 0/10

| 严重性 | 分析器 | 代码 | 描述 |
|---|---|---|---|
| warn | LineCountAnalyzer | line_count.too_short | 文档有效行数过少（14 行），可能信息不足（阈值：50 行，空行/注释不计入）。 |
| warn | DQSScorer | dqs.low_q1 | Q1（结构）得分偏低，建议补充标题层级、清单与分段。 |
| warn | DQSScorer | dqs.low_q2 | Q2（逻辑深度）得分偏低，建议补充 Mermaid 图、代码片段或阶段拆解。 |
| info | BoilerplateDetector | boilerplate.autogenerated | 检测到 `Auto-generated` 标记，建议配套 `source-path/source-hash` 确保同步。 |

### docs/knowledge-base/commands/workflow/collaborative-plan-with-file.md

- DQS：61 / 100
- 维度：Q1 16/20，Q2 30/30，Q3 5/20，Q4 10/20，Q5 0/10

| 严重性 | 分析器 | 代码 | 描述 |
|---|---|---|---|
| warn | DQSScorer | dqs.low_q3 | Q3（场景）得分偏低，建议增加示例、用法或边界条件说明。 |

### docs/knowledge-base/commands/workflow/debug-with-file.md

- DQS：63 / 100
- 维度：Q1 12/20，Q2 26/30，Q3 15/20，Q4 10/20，Q5 0/10

- ✅ 未发现问题

### docs/knowledge-base/commands/workflow/init-guidelines.md

- DQS：27 / 100
- 维度：Q1 0/20，Q2 7/30，Q3 10/20，Q4 10/20，Q5 0/10

| 严重性 | 分析器 | 代码 | 描述 |
|---|---|---|---|
| warn | LineCountAnalyzer | line_count.too_short | 文档有效行数过少（14 行），可能信息不足（阈值：50 行，空行/注释不计入）。 |
| warn | DQSScorer | dqs.low_q1 | Q1（结构）得分偏低，建议补充标题层级、清单与分段。 |
| warn | DQSScorer | dqs.low_q2 | Q2（逻辑深度）得分偏低，建议补充 Mermaid 图、代码片段或阶段拆解。 |
| info | BoilerplateDetector | boilerplate.autogenerated | 检测到 `Auto-generated` 标记，建议配套 `source-path/source-hash` 确保同步。 |

### docs/knowledge-base/commands/workflow/init.md

- DQS：27 / 100
- 维度：Q1 0/20，Q2 7/30，Q3 10/20，Q4 10/20，Q5 0/10

| 严重性 | 分析器 | 代码 | 描述 |
|---|---|---|---|
| warn | LineCountAnalyzer | line_count.too_short | 文档有效行数过少（14 行），可能信息不足（阈值：50 行，空行/注释不计入）。 |
| warn | DQSScorer | dqs.low_q1 | Q1（结构）得分偏低，建议补充标题层级、清单与分段。 |
| warn | DQSScorer | dqs.low_q2 | Q2（逻辑深度）得分偏低，建议补充 Mermaid 图、代码片段或阶段拆解。 |
| info | BoilerplateDetector | boilerplate.autogenerated | 检测到 `Auto-generated` 标记，建议配套 `source-path/source-hash` 确保同步。 |

### docs/knowledge-base/commands/workflow/integration-test-cycle.md

- DQS：27 / 100
- 维度：Q1 0/20，Q2 7/30，Q3 10/20，Q4 10/20，Q5 0/10

| 严重性 | 分析器 | 代码 | 描述 |
|---|---|---|---|
| warn | LineCountAnalyzer | line_count.too_short | 文档有效行数过少（14 行），可能信息不足（阈值：50 行，空行/注释不计入）。 |
| warn | DQSScorer | dqs.low_q1 | Q1（结构）得分偏低，建议补充标题层级、清单与分段。 |
| warn | DQSScorer | dqs.low_q2 | Q2（逻辑深度）得分偏低，建议补充 Mermaid 图、代码片段或阶段拆解。 |
| info | BoilerplateDetector | boilerplate.autogenerated | 检测到 `Auto-generated` 标记，建议配套 `source-path/source-hash` 确保同步。 |

### docs/knowledge-base/commands/workflow/refactor-cycle.md

- DQS：61 / 100
- 维度：Q1 16/20，Q2 30/30，Q3 5/20，Q4 10/20，Q5 0/10

| 严重性 | 分析器 | 代码 | 描述 |
|---|---|---|---|
| warn | DQSScorer | dqs.low_q3 | Q3（场景）得分偏低，建议增加示例、用法或边界条件说明。 |

### docs/knowledge-base/commands/workflow/req-plan-with-file.md

- DQS：27 / 100
- 维度：Q1 0/20，Q2 7/30，Q3 10/20，Q4 10/20，Q5 0/10

| 严重性 | 分析器 | 代码 | 描述 |
|---|---|---|---|
| warn | LineCountAnalyzer | line_count.too_short | 文档有效行数过少（14 行），可能信息不足（阈值：50 行，空行/注释不计入）。 |
| warn | DQSScorer | dqs.low_q1 | Q1（结构）得分偏低，建议补充标题层级、清单与分段。 |
| warn | DQSScorer | dqs.low_q2 | Q2（逻辑深度）得分偏低，建议补充 Mermaid 图、代码片段或阶段拆解。 |
| info | BoilerplateDetector | boilerplate.autogenerated | 检测到 `Auto-generated` 标记，建议配套 `source-path/source-hash` 确保同步。 |

### docs/knowledge-base/commands/workflow/session/complete.md

- DQS：65 / 100
- 维度：Q1 20/20，Q2 20/30，Q3 15/20，Q4 10/20，Q5 0/10

- ✅ 未发现问题

### docs/knowledge-base/commands/workflow/session/list.md

- DQS：65 / 100
- 维度：Q1 20/20，Q2 20/30，Q3 15/20，Q4 10/20，Q5 0/10

- ✅ 未发现问题

### docs/knowledge-base/commands/workflow/session/resume.md

- DQS：65 / 100
- 维度：Q1 20/20，Q2 20/30，Q3 15/20，Q4 10/20，Q5 0/10

- ✅ 未发现问题

### docs/knowledge-base/commands/workflow/session/solidify.md

- DQS：71 / 100
- 维度：Q1 20/20，Q2 26/30，Q3 15/20，Q4 10/20，Q5 0/10

- ✅ 未发现问题

### docs/knowledge-base/commands/workflow/session/start.md

- DQS：71 / 100
- 维度：Q1 20/20，Q2 26/30，Q3 15/20，Q4 10/20，Q5 0/10

- ✅ 未发现问题

### docs/knowledge-base/commands/workflow/ui-design/animation-extract.md

- DQS：22 / 100
- 维度：Q1 0/20，Q2 7/30，Q3 10/20，Q4 5/20，Q5 0/10

| 严重性 | 分析器 | 代码 | 描述 |
|---|---|---|---|
| warn | LineCountAnalyzer | line_count.too_short | 文档有效行数过少（13 行），可能信息不足（阈值：50 行，空行/注释不计入）。 |
| warn | DQSScorer | dqs.low_q1 | Q1（结构）得分偏低，建议补充标题层级、清单与分段。 |
| warn | DQSScorer | dqs.low_q2 | Q2（逻辑深度）得分偏低，建议补充 Mermaid 图、代码片段或阶段拆解。 |
| info | BoilerplateDetector | boilerplate.autogenerated | 检测到 `Auto-generated` 标记，建议配套 `source-path/source-hash` 确保同步。 |

### docs/knowledge-base/commands/workflow/ui-design/codify-style.md

- DQS：22 / 100
- 维度：Q1 0/20，Q2 7/30，Q3 10/20，Q4 5/20，Q5 0/10

| 严重性 | 分析器 | 代码 | 描述 |
|---|---|---|---|
| warn | LineCountAnalyzer | line_count.too_short | 文档有效行数过少（13 行），可能信息不足（阈值：50 行，空行/注释不计入）。 |
| warn | DQSScorer | dqs.low_q1 | Q1（结构）得分偏低，建议补充标题层级、清单与分段。 |
| warn | DQSScorer | dqs.low_q2 | Q2（逻辑深度）得分偏低，建议补充 Mermaid 图、代码片段或阶段拆解。 |
| info | BoilerplateDetector | boilerplate.autogenerated | 检测到 `Auto-generated` 标记，建议配套 `source-path/source-hash` 确保同步。 |

### docs/knowledge-base/commands/workflow/ui-design/design-sync.md

- DQS：22 / 100
- 维度：Q1 0/20，Q2 7/30，Q3 10/20，Q4 5/20，Q5 0/10

| 严重性 | 分析器 | 代码 | 描述 |
|---|---|---|---|
| warn | LineCountAnalyzer | line_count.too_short | 文档有效行数过少（13 行），可能信息不足（阈值：50 行，空行/注释不计入）。 |
| warn | DQSScorer | dqs.low_q1 | Q1（结构）得分偏低，建议补充标题层级、清单与分段。 |
| warn | DQSScorer | dqs.low_q2 | Q2（逻辑深度）得分偏低，建议补充 Mermaid 图、代码片段或阶段拆解。 |
| info | BoilerplateDetector | boilerplate.autogenerated | 检测到 `Auto-generated` 标记，建议配套 `source-path/source-hash` 确保同步。 |

### docs/knowledge-base/commands/workflow/ui-design/explore-auto.md

- DQS：22 / 100
- 维度：Q1 0/20，Q2 7/30，Q3 10/20，Q4 5/20，Q5 0/10

| 严重性 | 分析器 | 代码 | 描述 |
|---|---|---|---|
| warn | LineCountAnalyzer | line_count.too_short | 文档有效行数过少（13 行），可能信息不足（阈值：50 行，空行/注释不计入）。 |
| warn | DQSScorer | dqs.low_q1 | Q1（结构）得分偏低，建议补充标题层级、清单与分段。 |
| warn | DQSScorer | dqs.low_q2 | Q2（逻辑深度）得分偏低，建议补充 Mermaid 图、代码片段或阶段拆解。 |
| info | BoilerplateDetector | boilerplate.autogenerated | 检测到 `Auto-generated` 标记，建议配套 `source-path/source-hash` 确保同步。 |

### docs/knowledge-base/commands/workflow/ui-design/generate.md

- DQS：22 / 100
- 维度：Q1 0/20，Q2 7/30，Q3 10/20，Q4 5/20，Q5 0/10

| 严重性 | 分析器 | 代码 | 描述 |
|---|---|---|---|
| warn | LineCountAnalyzer | line_count.too_short | 文档有效行数过少（13 行），可能信息不足（阈值：50 行，空行/注释不计入）。 |
| warn | DQSScorer | dqs.low_q1 | Q1（结构）得分偏低，建议补充标题层级、清单与分段。 |
| warn | DQSScorer | dqs.low_q2 | Q2（逻辑深度）得分偏低，建议补充 Mermaid 图、代码片段或阶段拆解。 |
| info | BoilerplateDetector | boilerplate.autogenerated | 检测到 `Auto-generated` 标记，建议配套 `source-path/source-hash` 确保同步。 |

### docs/knowledge-base/commands/workflow/ui-design/imitate-auto.md

- DQS：22 / 100
- 维度：Q1 0/20，Q2 7/30，Q3 10/20，Q4 5/20，Q5 0/10

| 严重性 | 分析器 | 代码 | 描述 |
|---|---|---|---|
| warn | LineCountAnalyzer | line_count.too_short | 文档有效行数过少（13 行），可能信息不足（阈值：50 行，空行/注释不计入）。 |
| warn | DQSScorer | dqs.low_q1 | Q1（结构）得分偏低，建议补充标题层级、清单与分段。 |
| warn | DQSScorer | dqs.low_q2 | Q2（逻辑深度）得分偏低，建议补充 Mermaid 图、代码片段或阶段拆解。 |
| info | BoilerplateDetector | boilerplate.autogenerated | 检测到 `Auto-generated` 标记，建议配套 `source-path/source-hash` 确保同步。 |

### docs/knowledge-base/commands/workflow/ui-design/import-from-code.md

- DQS：22 / 100
- 维度：Q1 0/20，Q2 7/30，Q3 10/20，Q4 5/20，Q5 0/10

| 严重性 | 分析器 | 代码 | 描述 |
|---|---|---|---|
| warn | LineCountAnalyzer | line_count.too_short | 文档有效行数过少（13 行），可能信息不足（阈值：50 行，空行/注释不计入）。 |
| warn | DQSScorer | dqs.low_q1 | Q1（结构）得分偏低，建议补充标题层级、清单与分段。 |
| warn | DQSScorer | dqs.low_q2 | Q2（逻辑深度）得分偏低，建议补充 Mermaid 图、代码片段或阶段拆解。 |
| info | BoilerplateDetector | boilerplate.autogenerated | 检测到 `Auto-generated` 标记，建议配套 `source-path/source-hash` 确保同步。 |

### docs/knowledge-base/commands/workflow/ui-design/layout-extract.md

- DQS：22 / 100
- 维度：Q1 0/20，Q2 7/30，Q3 10/20，Q4 5/20，Q5 0/10

| 严重性 | 分析器 | 代码 | 描述 |
|---|---|---|---|
| warn | LineCountAnalyzer | line_count.too_short | 文档有效行数过少（13 行），可能信息不足（阈值：50 行，空行/注释不计入）。 |
| warn | DQSScorer | dqs.low_q1 | Q1（结构）得分偏低，建议补充标题层级、清单与分段。 |
| warn | DQSScorer | dqs.low_q2 | Q2（逻辑深度）得分偏低，建议补充 Mermaid 图、代码片段或阶段拆解。 |
| info | BoilerplateDetector | boilerplate.autogenerated | 检测到 `Auto-generated` 标记，建议配套 `source-path/source-hash` 确保同步。 |

### docs/knowledge-base/commands/workflow/ui-design/reference-page-generator.md

- DQS：22 / 100
- 维度：Q1 0/20，Q2 7/30，Q3 10/20，Q4 5/20，Q5 0/10

| 严重性 | 分析器 | 代码 | 描述 |
|---|---|---|---|
| warn | LineCountAnalyzer | line_count.too_short | 文档有效行数过少（13 行），可能信息不足（阈值：50 行，空行/注释不计入）。 |
| warn | DQSScorer | dqs.low_q1 | Q1（结构）得分偏低，建议补充标题层级、清单与分段。 |
| warn | DQSScorer | dqs.low_q2 | Q2（逻辑深度）得分偏低，建议补充 Mermaid 图、代码片段或阶段拆解。 |
| info | BoilerplateDetector | boilerplate.autogenerated | 检测到 `Auto-generated` 标记，建议配套 `source-path/source-hash` 确保同步。 |

### docs/knowledge-base/commands/workflow/ui-design/style-extract.md

- DQS：22 / 100
- 维度：Q1 0/20，Q2 7/30，Q3 10/20，Q4 5/20，Q5 0/10

| 严重性 | 分析器 | 代码 | 描述 |
|---|---|---|---|
| warn | LineCountAnalyzer | line_count.too_short | 文档有效行数过少（13 行），可能信息不足（阈值：50 行，空行/注释不计入）。 |
| warn | DQSScorer | dqs.low_q1 | Q1（结构）得分偏低，建议补充标题层级、清单与分段。 |
| warn | DQSScorer | dqs.low_q2 | Q2（逻辑深度）得分偏低，建议补充 Mermaid 图、代码片段或阶段拆解。 |
| info | BoilerplateDetector | boilerplate.autogenerated | 检测到 `Auto-generated` 标记，建议配套 `source-path/source-hash` 确保同步。 |

### docs/knowledge-base/commands/workflow/unified-execute-with-file.md

- DQS：71 / 100
- 维度：Q1 16/20，Q2 30/30，Q3 15/20，Q4 10/20，Q5 0/10

- ✅ 未发现问题

### docs/knowledge-base/mcp/integration.md

- DQS：34 / 100
- 维度：Q1 8/20，Q2 16/30，Q3 10/20，Q4 0/20，Q5 0/10

| 严重性 | 分析器 | 代码 | 描述 |
|---|---|---|---|
| warn | DQSScorer | dqs.low_q1 | Q1（结构）得分偏低，建议补充标题层级、清单与分段。 |

### docs/knowledge-base/servers/architecture.md

- DQS：30 / 100
- 维度：Q1 4/20，Q2 16/30，Q3 10/20，Q4 0/20，Q5 0/10

| 严重性 | 分析器 | 代码 | 描述 |
|---|---|---|---|
| warn | DQSScorer | dqs.low_q1 | Q1（结构）得分偏低，建议补充标题层级、清单与分段。 |

### docs/knowledge-base/skills/_index.md

- DQS：67 / 100
- 维度：Q1 12/20，Q2 30/30，Q3 15/20，Q4 10/20，Q5 0/10

| 严重性 | 分析器 | 代码 | 描述 |
|---|---|---|---|
| warn | KeywordDensityAnalyzer | keyword_density.low_density | 关键词密度偏低（1.26% < 2.00%），建议补充示例、图示或结构化表达。 |

### docs/knowledge-base/skills/brainstorm.md

- DQS：30 / 100
- 维度：Q1 0/20，Q2 10/30，Q3 10/20，Q4 10/20，Q5 0/10

| 严重性 | 分析器 | 代码 | 描述 |
|---|---|---|---|
| error | BoilerplateDetector | boilerplate.arguments | 检测到占位符 `<arguments>`，可能未替换为真实内容。 |
| warn | LineCountAnalyzer | line_count.too_short | 文档有效行数过少（22 行），可能信息不足（阈值：50 行，空行/注释不计入）。 |
| warn | DQSScorer | dqs.low_q1 | Q1（结构）得分偏低，建议补充标题层级、清单与分段。 |
| warn | DQSScorer | dqs.low_q2 | Q2（逻辑深度）得分偏低，建议补充 Mermaid 图、代码片段或阶段拆解。 |
| info | BoilerplateDetector | boilerplate.autogenerated | 检测到 `Auto-generated` 标记，建议配套 `source-path/source-hash` 确保同步。 |

### docs/knowledge-base/skills/ccw-help.md

- DQS：30 / 100
- 维度：Q1 0/20，Q2 10/30，Q3 10/20，Q4 10/20，Q5 0/10

| 严重性 | 分析器 | 代码 | 描述 |
|---|---|---|---|
| error | BoilerplateDetector | boilerplate.arguments | 检测到占位符 `<arguments>`，可能未替换为真实内容。 |
| warn | LineCountAnalyzer | line_count.too_short | 文档有效行数过少（22 行），可能信息不足（阈值：50 行，空行/注释不计入）。 |
| warn | DQSScorer | dqs.low_q1 | Q1（结构）得分偏低，建议补充标题层级、清单与分段。 |
| warn | DQSScorer | dqs.low_q2 | Q2（逻辑深度）得分偏低，建议补充 Mermaid 图、代码片段或阶段拆解。 |
| info | BoilerplateDetector | boilerplate.autogenerated | 检测到 `Auto-generated` 标记，建议配套 `source-path/source-hash` 确保同步。 |

### docs/knowledge-base/skills/copyright-docs.md

- DQS：30 / 100
- 维度：Q1 0/20，Q2 10/30，Q3 10/20，Q4 10/20，Q5 0/10

| 严重性 | 分析器 | 代码 | 描述 |
|---|---|---|---|
| error | BoilerplateDetector | boilerplate.arguments | 检测到占位符 `<arguments>`，可能未替换为真实内容。 |
| warn | LineCountAnalyzer | line_count.too_short | 文档有效行数过少（22 行），可能信息不足（阈值：50 行，空行/注释不计入）。 |
| warn | DQSScorer | dqs.low_q1 | Q1（结构）得分偏低，建议补充标题层级、清单与分段。 |
| warn | DQSScorer | dqs.low_q2 | Q2（逻辑深度）得分偏低，建议补充 Mermaid 图、代码片段或阶段拆解。 |
| info | BoilerplateDetector | boilerplate.autogenerated | 检测到 `Auto-generated` 标记，建议配套 `source-path/source-hash` 确保同步。 |

### docs/knowledge-base/skills/flow-coordinator.md

- DQS：72 / 100
- 维度：Q1 16/20，Q2 26/30，Q3 20/20，Q4 10/20，Q5 0/10

| 严重性 | 分析器 | 代码 | 描述 |
|---|---|---|---|
| info | BoilerplateDetector | boilerplate.autogenerated | 检测到 `Auto-generated` 标记，建议配套 `source-path/source-hash` 确保同步。 |

### docs/knowledge-base/skills/issue-discover.md

- DQS：30 / 100
- 维度：Q1 0/20，Q2 10/30，Q3 10/20，Q4 10/20，Q5 0/10

| 严重性 | 分析器 | 代码 | 描述 |
|---|---|---|---|
| error | BoilerplateDetector | boilerplate.arguments | 检测到占位符 `<arguments>`，可能未替换为真实内容。 |
| warn | LineCountAnalyzer | line_count.too_short | 文档有效行数过少（22 行），可能信息不足（阈值：50 行，空行/注释不计入）。 |
| warn | DQSScorer | dqs.low_q1 | Q1（结构）得分偏低，建议补充标题层级、清单与分段。 |
| warn | DQSScorer | dqs.low_q2 | Q2（逻辑深度）得分偏低，建议补充 Mermaid 图、代码片段或阶段拆解。 |
| info | BoilerplateDetector | boilerplate.autogenerated | 检测到 `Auto-generated` 标记，建议配套 `source-path/source-hash` 确保同步。 |

### docs/knowledge-base/skills/issue-manage.md

- DQS：30 / 100
- 维度：Q1 0/20，Q2 10/30，Q3 10/20，Q4 10/20，Q5 0/10

| 严重性 | 分析器 | 代码 | 描述 |
|---|---|---|---|
| error | BoilerplateDetector | boilerplate.arguments | 检测到占位符 `<arguments>`，可能未替换为真实内容。 |
| warn | LineCountAnalyzer | line_count.too_short | 文档有效行数过少（22 行），可能信息不足（阈值：50 行，空行/注释不计入）。 |
| warn | DQSScorer | dqs.low_q1 | Q1（结构）得分偏低，建议补充标题层级、清单与分段。 |
| warn | DQSScorer | dqs.low_q2 | Q2（逻辑深度）得分偏低，建议补充 Mermaid 图、代码片段或阶段拆解。 |
| info | BoilerplateDetector | boilerplate.autogenerated | 检测到 `Auto-generated` 标记，建议配套 `source-path/source-hash` 确保同步。 |

### docs/knowledge-base/skills/issue-resolve.md

- DQS：30 / 100
- 维度：Q1 0/20，Q2 10/30，Q3 10/20，Q4 10/20，Q5 0/10

| 严重性 | 分析器 | 代码 | 描述 |
|---|---|---|---|
| error | BoilerplateDetector | boilerplate.arguments | 检测到占位符 `<arguments>`，可能未替换为真实内容。 |
| warn | LineCountAnalyzer | line_count.too_short | 文档有效行数过少（22 行），可能信息不足（阈值：50 行，空行/注释不计入）。 |
| warn | DQSScorer | dqs.low_q1 | Q1（结构）得分偏低，建议补充标题层级、清单与分段。 |
| warn | DQSScorer | dqs.low_q2 | Q2（逻辑深度）得分偏低，建议补充 Mermaid 图、代码片段或阶段拆解。 |
| info | BoilerplateDetector | boilerplate.autogenerated | 检测到 `Auto-generated` 标记，建议配套 `source-path/source-hash` 确保同步。 |

### docs/knowledge-base/skills/memory-capture.md

- DQS：30 / 100
- 维度：Q1 0/20，Q2 10/30，Q3 10/20，Q4 10/20，Q5 0/10

| 严重性 | 分析器 | 代码 | 描述 |
|---|---|---|---|
| error | BoilerplateDetector | boilerplate.arguments | 检测到占位符 `<arguments>`，可能未替换为真实内容。 |
| warn | LineCountAnalyzer | line_count.too_short | 文档有效行数过少（22 行），可能信息不足（阈值：50 行，空行/注释不计入）。 |
| warn | DQSScorer | dqs.low_q1 | Q1（结构）得分偏低，建议补充标题层级、清单与分段。 |
| warn | DQSScorer | dqs.low_q2 | Q2（逻辑深度）得分偏低，建议补充 Mermaid 图、代码片段或阶段拆解。 |
| info | BoilerplateDetector | boilerplate.autogenerated | 检测到 `Auto-generated` 标记，建议配套 `source-path/source-hash` 确保同步。 |

### docs/knowledge-base/skills/memory-manage.md

- DQS：30 / 100
- 维度：Q1 0/20，Q2 10/30，Q3 10/20，Q4 10/20，Q5 0/10

| 严重性 | 分析器 | 代码 | 描述 |
|---|---|---|---|
| error | BoilerplateDetector | boilerplate.arguments | 检测到占位符 `<arguments>`，可能未替换为真实内容。 |
| warn | LineCountAnalyzer | line_count.too_short | 文档有效行数过少（22 行），可能信息不足（阈值：50 行，空行/注释不计入）。 |
| warn | DQSScorer | dqs.low_q1 | Q1（结构）得分偏低，建议补充标题层级、清单与分段。 |
| warn | DQSScorer | dqs.low_q2 | Q2（逻辑深度）得分偏低，建议补充 Mermaid 图、代码片段或阶段拆解。 |
| info | BoilerplateDetector | boilerplate.autogenerated | 检测到 `Auto-generated` 标记，建议配套 `source-path/source-hash` 确保同步。 |

### docs/knowledge-base/skills/overview.md

- DQS：34 / 100
- 维度：Q1 4/20，Q2 20/30，Q3 10/20，Q4 0/20，Q5 0/10

| 严重性 | 分析器 | 代码 | 描述 |
|---|---|---|---|
| warn | DQSScorer | dqs.low_q1 | Q1（结构）得分偏低，建议补充标题层级、清单与分段。 |

### docs/knowledge-base/skills/project-analyze.md

- DQS：30 / 100
- 维度：Q1 0/20，Q2 10/30，Q3 10/20，Q4 10/20，Q5 0/10

| 严重性 | 分析器 | 代码 | 描述 |
|---|---|---|---|
| error | BoilerplateDetector | boilerplate.arguments | 检测到占位符 `<arguments>`，可能未替换为真实内容。 |
| warn | LineCountAnalyzer | line_count.too_short | 文档有效行数过少（22 行），可能信息不足（阈值：50 行，空行/注释不计入）。 |
| warn | DQSScorer | dqs.low_q1 | Q1（结构）得分偏低，建议补充标题层级、清单与分段。 |
| warn | DQSScorer | dqs.low_q2 | Q2（逻辑深度）得分偏低，建议补充 Mermaid 图、代码片段或阶段拆解。 |
| info | BoilerplateDetector | boilerplate.autogenerated | 检测到 `Auto-generated` 标记，建议配套 `source-path/source-hash` 确保同步。 |

### docs/knowledge-base/skills/review-code.md

- DQS：30 / 100
- 维度：Q1 0/20，Q2 10/30，Q3 10/20，Q4 10/20，Q5 0/10

| 严重性 | 分析器 | 代码 | 描述 |
|---|---|---|---|
| error | BoilerplateDetector | boilerplate.arguments | 检测到占位符 `<arguments>`，可能未替换为真实内容。 |
| warn | LineCountAnalyzer | line_count.too_short | 文档有效行数过少（22 行），可能信息不足（阈值：50 行，空行/注释不计入）。 |
| warn | DQSScorer | dqs.low_q1 | Q1（结构）得分偏低，建议补充标题层级、清单与分段。 |
| warn | DQSScorer | dqs.low_q2 | Q2（逻辑深度）得分偏低，建议补充 Mermaid 图、代码片段或阶段拆解。 |
| info | BoilerplateDetector | boilerplate.autogenerated | 检测到 `Auto-generated` 标记，建议配套 `source-path/source-hash` 确保同步。 |

### docs/knowledge-base/skills/review-cycle.md

- DQS：30 / 100
- 维度：Q1 0/20，Q2 10/30，Q3 10/20，Q4 10/20，Q5 0/10

| 严重性 | 分析器 | 代码 | 描述 |
|---|---|---|---|
| error | BoilerplateDetector | boilerplate.arguments | 检测到占位符 `<arguments>`，可能未替换为真实内容。 |
| warn | LineCountAnalyzer | line_count.too_short | 文档有效行数过少（22 行），可能信息不足（阈值：50 行，空行/注释不计入）。 |
| warn | DQSScorer | dqs.low_q1 | Q1（结构）得分偏低，建议补充标题层级、清单与分段。 |
| warn | DQSScorer | dqs.low_q2 | Q2（逻辑深度）得分偏低，建议补充 Mermaid 图、代码片段或阶段拆解。 |
| info | BoilerplateDetector | boilerplate.autogenerated | 检测到 `Auto-generated` 标记，建议配套 `source-path/source-hash` 确保同步。 |

### docs/knowledge-base/skills/skill-generator.md

- DQS：30 / 100
- 维度：Q1 0/20，Q2 10/30，Q3 10/20，Q4 10/20，Q5 0/10

| 严重性 | 分析器 | 代码 | 描述 |
|---|---|---|---|
| error | BoilerplateDetector | boilerplate.arguments | 检测到占位符 `<arguments>`，可能未替换为真实内容。 |
| warn | LineCountAnalyzer | line_count.too_short | 文档有效行数过少（22 行），可能信息不足（阈值：50 行，空行/注释不计入）。 |
| warn | DQSScorer | dqs.low_q1 | Q1（结构）得分偏低，建议补充标题层级、清单与分段。 |
| warn | DQSScorer | dqs.low_q2 | Q2（逻辑深度）得分偏低，建议补充 Mermaid 图、代码片段或阶段拆解。 |
| info | BoilerplateDetector | boilerplate.autogenerated | 检测到 `Auto-generated` 标记，建议配套 `source-path/source-hash` 确保同步。 |

### docs/knowledge-base/skills/skill-tuning.md

- DQS：30 / 100
- 维度：Q1 0/20，Q2 10/30，Q3 10/20，Q4 10/20，Q5 0/10

| 严重性 | 分析器 | 代码 | 描述 |
|---|---|---|---|
| error | BoilerplateDetector | boilerplate.arguments | 检测到占位符 `<arguments>`，可能未替换为真实内容。 |
| warn | LineCountAnalyzer | line_count.too_short | 文档有效行数过少（22 行），可能信息不足（阈值：50 行，空行/注释不计入）。 |
| warn | DQSScorer | dqs.low_q1 | Q1（结构）得分偏低，建议补充标题层级、清单与分段。 |
| warn | DQSScorer | dqs.low_q2 | Q2（逻辑深度）得分偏低，建议补充 Mermaid 图、代码片段或阶段拆解。 |
| info | BoilerplateDetector | boilerplate.autogenerated | 检测到 `Auto-generated` 标记，建议配套 `source-path/source-hash` 确保同步。 |

### docs/knowledge-base/skills/software-manual.md

- DQS：30 / 100
- 维度：Q1 0/20，Q2 10/30，Q3 10/20，Q4 10/20，Q5 0/10

| 严重性 | 分析器 | 代码 | 描述 |
|---|---|---|---|
| error | BoilerplateDetector | boilerplate.arguments | 检测到占位符 `<arguments>`，可能未替换为真实内容。 |
| warn | LineCountAnalyzer | line_count.too_short | 文档有效行数过少（22 行），可能信息不足（阈值：50 行，空行/注释不计入）。 |
| warn | DQSScorer | dqs.low_q1 | Q1（结构）得分偏低，建议补充标题层级、清单与分段。 |
| warn | DQSScorer | dqs.low_q2 | Q2（逻辑深度）得分偏低，建议补充 Mermaid 图、代码片段或阶段拆解。 |
| info | BoilerplateDetector | boilerplate.autogenerated | 检测到 `Auto-generated` 标记，建议配套 `source-path/source-hash` 确保同步。 |

### docs/knowledge-base/skills/spec-generator.md

- DQS：30 / 100
- 维度：Q1 0/20，Q2 10/30，Q3 10/20，Q4 10/20，Q5 0/10

| 严重性 | 分析器 | 代码 | 描述 |
|---|---|---|---|
| error | BoilerplateDetector | boilerplate.arguments | 检测到占位符 `<arguments>`，可能未替换为真实内容。 |
| warn | LineCountAnalyzer | line_count.too_short | 文档有效行数过少（22 行），可能信息不足（阈值：50 行，空行/注释不计入）。 |
| warn | DQSScorer | dqs.low_q1 | Q1（结构）得分偏低，建议补充标题层级、清单与分段。 |
| warn | DQSScorer | dqs.low_q2 | Q2（逻辑深度）得分偏低，建议补充 Mermaid 图、代码片段或阶段拆解。 |
| info | BoilerplateDetector | boilerplate.autogenerated | 检测到 `Auto-generated` 标记，建议配套 `source-path/source-hash` 确保同步。 |

### docs/knowledge-base/skills/team-command-designer.md

- DQS：30 / 100
- 维度：Q1 0/20，Q2 10/30，Q3 10/20，Q4 10/20，Q5 0/10

| 严重性 | 分析器 | 代码 | 描述 |
|---|---|---|---|
| error | BoilerplateDetector | boilerplate.arguments | 检测到占位符 `<arguments>`，可能未替换为真实内容。 |
| warn | LineCountAnalyzer | line_count.too_short | 文档有效行数过少（22 行），可能信息不足（阈值：50 行，空行/注释不计入）。 |
| warn | DQSScorer | dqs.low_q1 | Q1（结构）得分偏低，建议补充标题层级、清单与分段。 |
| warn | DQSScorer | dqs.low_q2 | Q2（逻辑深度）得分偏低，建议补充 Mermaid 图、代码片段或阶段拆解。 |
| info | BoilerplateDetector | boilerplate.autogenerated | 检测到 `Auto-generated` 标记，建议配套 `source-path/source-hash` 确保同步。 |

### docs/knowledge-base/skills/team-issue.md

- DQS：30 / 100
- 维度：Q1 0/20，Q2 10/30，Q3 10/20，Q4 10/20，Q5 0/10

| 严重性 | 分析器 | 代码 | 描述 |
|---|---|---|---|
| error | BoilerplateDetector | boilerplate.arguments | 检测到占位符 `<arguments>`，可能未替换为真实内容。 |
| warn | LineCountAnalyzer | line_count.too_short | 文档有效行数过少（22 行），可能信息不足（阈值：50 行，空行/注释不计入）。 |
| warn | DQSScorer | dqs.low_q1 | Q1（结构）得分偏低，建议补充标题层级、清单与分段。 |
| warn | DQSScorer | dqs.low_q2 | Q2（逻辑深度）得分偏低，建议补充 Mermaid 图、代码片段或阶段拆解。 |
| info | BoilerplateDetector | boilerplate.autogenerated | 检测到 `Auto-generated` 标记，建议配套 `source-path/source-hash` 确保同步。 |

### docs/knowledge-base/skills/team-lifecycle.md

- DQS：30 / 100
- 维度：Q1 0/20，Q2 10/30，Q3 10/20，Q4 10/20，Q5 0/10

| 严重性 | 分析器 | 代码 | 描述 |
|---|---|---|---|
| error | BoilerplateDetector | boilerplate.arguments | 检测到占位符 `<arguments>`，可能未替换为真实内容。 |
| warn | LineCountAnalyzer | line_count.too_short | 文档有效行数过少（22 行），可能信息不足（阈值：50 行，空行/注释不计入）。 |
| warn | DQSScorer | dqs.low_q1 | Q1（结构）得分偏低，建议补充标题层级、清单与分段。 |
| warn | DQSScorer | dqs.low_q2 | Q2（逻辑深度）得分偏低，建议补充 Mermaid 图、代码片段或阶段拆解。 |
| info | BoilerplateDetector | boilerplate.autogenerated | 检测到 `Auto-generated` 标记，建议配套 `source-path/source-hash` 确保同步。 |

### docs/knowledge-base/skills/team-skill-designer.md

- DQS：30 / 100
- 维度：Q1 0/20，Q2 10/30，Q3 10/20，Q4 10/20，Q5 0/10

| 严重性 | 分析器 | 代码 | 描述 |
|---|---|---|---|
| error | BoilerplateDetector | boilerplate.arguments | 检测到占位符 `<arguments>`，可能未替换为真实内容。 |
| warn | LineCountAnalyzer | line_count.too_short | 文档有效行数过少（22 行），可能信息不足（阈值：50 行，空行/注释不计入）。 |
| warn | DQSScorer | dqs.low_q1 | Q1（结构）得分偏低，建议补充标题层级、清单与分段。 |
| warn | DQSScorer | dqs.low_q2 | Q2（逻辑深度）得分偏低，建议补充 Mermaid 图、代码片段或阶段拆解。 |
| info | BoilerplateDetector | boilerplate.autogenerated | 检测到 `Auto-generated` 标记，建议配套 `source-path/source-hash` 确保同步。 |

### docs/knowledge-base/skills/workflow-execute.md

- DQS：76 / 100
- 维度：Q1 16/20，Q2 30/30，Q3 20/20，Q4 10/20，Q5 0/10

| 严重性 | 分析器 | 代码 | 描述 |
|---|---|---|---|
| info | BoilerplateDetector | boilerplate.autogenerated | 检测到 `Auto-generated` 标记，建议配套 `source-path/source-hash` 确保同步。 |

### docs/knowledge-base/skills/workflow-lite-plan.md

- DQS：30 / 100
- 维度：Q1 0/20，Q2 10/30，Q3 10/20，Q4 10/20，Q5 0/10

| 严重性 | 分析器 | 代码 | 描述 |
|---|---|---|---|
| error | BoilerplateDetector | boilerplate.arguments | 检测到占位符 `<arguments>`，可能未替换为真实内容。 |
| warn | LineCountAnalyzer | line_count.too_short | 文档有效行数过少（22 行），可能信息不足（阈值：50 行，空行/注释不计入）。 |
| warn | DQSScorer | dqs.low_q1 | Q1（结构）得分偏低，建议补充标题层级、清单与分段。 |
| warn | DQSScorer | dqs.low_q2 | Q2（逻辑深度）得分偏低，建议补充 Mermaid 图、代码片段或阶段拆解。 |
| info | BoilerplateDetector | boilerplate.autogenerated | 检测到 `Auto-generated` 标记，建议配套 `source-path/source-hash` 确保同步。 |

### docs/knowledge-base/skills/workflow-multi-cli-plan.md

- DQS：30 / 100
- 维度：Q1 0/20，Q2 10/30，Q3 10/20，Q4 10/20，Q5 0/10

| 严重性 | 分析器 | 代码 | 描述 |
|---|---|---|---|
| error | BoilerplateDetector | boilerplate.arguments | 检测到占位符 `<arguments>`，可能未替换为真实内容。 |
| warn | LineCountAnalyzer | line_count.too_short | 文档有效行数过少（22 行），可能信息不足（阈值：50 行，空行/注释不计入）。 |
| warn | DQSScorer | dqs.low_q1 | Q1（结构）得分偏低，建议补充标题层级、清单与分段。 |
| warn | DQSScorer | dqs.low_q2 | Q2（逻辑深度）得分偏低，建议补充 Mermaid 图、代码片段或阶段拆解。 |
| info | BoilerplateDetector | boilerplate.autogenerated | 检测到 `Auto-generated` 标记，建议配套 `source-path/source-hash` 确保同步。 |

### docs/knowledge-base/skills/workflow-plan.md

- DQS：75 / 100
- 维度：Q1 20/20，Q2 30/30，Q3 15/20，Q4 10/20，Q5 0/10

- ✅ 未发现问题

### docs/knowledge-base/skills/workflow-skill-designer.md

- DQS：30 / 100
- 维度：Q1 0/20，Q2 10/30，Q3 10/20，Q4 10/20，Q5 0/10

| 严重性 | 分析器 | 代码 | 描述 |
|---|---|---|---|
| error | BoilerplateDetector | boilerplate.arguments | 检测到占位符 `<arguments>`，可能未替换为真实内容。 |
| warn | LineCountAnalyzer | line_count.too_short | 文档有效行数过少（22 行），可能信息不足（阈值：50 行，空行/注释不计入）。 |
| warn | DQSScorer | dqs.low_q1 | Q1（结构）得分偏低，建议补充标题层级、清单与分段。 |
| warn | DQSScorer | dqs.low_q2 | Q2（逻辑深度）得分偏低，建议补充 Mermaid 图、代码片段或阶段拆解。 |
| info | BoilerplateDetector | boilerplate.autogenerated | 检测到 `Auto-generated` 标记，建议配套 `source-path/source-hash` 确保同步。 |

### docs/knowledge-base/skills/workflow-tdd.md

- DQS：67 / 100
- 维度：Q1 12/20，Q2 30/30，Q3 20/20，Q4 5/20，Q5 0/10

| 严重性 | 分析器 | 代码 | 描述 |
|---|---|---|---|
| info | BoilerplateDetector | boilerplate.autogenerated | 检测到 `Auto-generated` 标记，建议配套 `source-path/source-hash` 确保同步。 |

### docs/knowledge-base/skills/workflow-test-fix.md

- DQS：30 / 100
- 维度：Q1 0/20，Q2 10/30，Q3 10/20，Q4 10/20，Q5 0/10

| 严重性 | 分析器 | 代码 | 描述 |
|---|---|---|---|
| error | BoilerplateDetector | boilerplate.arguments | 检测到占位符 `<arguments>`，可能未替换为真实内容。 |
| warn | LineCountAnalyzer | line_count.too_short | 文档有效行数过少（22 行），可能信息不足（阈值：50 行，空行/注释不计入）。 |
| warn | DQSScorer | dqs.low_q1 | Q1（结构）得分偏低，建议补充标题层级、清单与分段。 |
| warn | DQSScorer | dqs.low_q2 | Q2（逻辑深度）得分偏低，建议补充 Mermaid 图、代码片段或阶段拆解。 |
| info | BoilerplateDetector | boilerplate.autogenerated | 检测到 `Auto-generated` 标记，建议配套 `source-path/source-hash` 确保同步。 |

### docs/knowledge-base/standards/document-quality-standard.md

- DQS：57 / 100
- 维度：Q1 16/20，Q2 16/30，Q3 15/20，Q4 10/20，Q5 0/10

- ✅ 未发现问题

### status-reference.md

- DQS：34 / 100
- 维度：Q1 4/20，Q2 10/30，Q3 10/20，Q4 10/20，Q5 0/10

| 严重性 | 分析器 | 代码 | 描述 |
|---|---|---|---|
| warn | DQSScorer | dqs.low_q1 | Q1（结构）得分偏低，建议补充标题层级、清单与分段。 |
| warn | DQSScorer | dqs.low_q2 | Q2（逻辑深度）得分偏低，建议补充 Mermaid 图、代码片段或阶段拆解。 |
