# Deep Dive: 混合模式模板生成器

**Idea Score**: 9/10
**Created**: 2026-02-02T15:20+08:00
**Status**: Active - Selected for exploration

---

## 详述概念

"混合模式模板生成器"结合了智能化和标准化两个关键优势，通过 ACE-tool 语义搜索发现最相似的现有工作流，然后使用标准模板进行参数适配和文档生成。

### 核心理念

1. **智能匹配**：使用 ACE-tool 的语义搜索能力，从现有 70+ slash 命令中找到最相似的工作流
2. **模板驱动**：基于 SKILL-DESIGN-SPEC.md 标准的模板系统，确保输出一致性
3. **参数适配**：将用户的具体需求映射到模板中的占位符
4. **完整输出**：一次性生成所有必需的文档组件

### 工作流程

```
用户输入结构化需求
         ↓
    [ACE-tool 语义搜索]
         ↓
    相似命令匹配评分
         ↓
    Top 3 参考命令选择
         ↓
    架构模式提取
         ↓
    [模板应用引擎]
         ↓
    参数适配与定制
         ↓
    [质量门控验证]
         ↓
    完整输出包生成
```

---

## 实施要求

### Phase 1: 模式库初始化

**任务**: 创建分类的模式库

**所需组件**:
```json
{
  "pattern_categories": {
    "analysis": {
      "name": "分析类",
      "reference_commands": ["workflow:analyze-with-file", "analyze-with-file"],
      "phases": ["session-start", "context-gather", "exploration", "discussion", "synthesis"],
      "key_features": ["multi-cli-collaboration", "documented-evolution", "interactive-refinement"]
    },
    "planning": {
      "name": "规划类",
      "reference_commands": ["workflow:plan"],
      "phases": ["session-start", "context-gather", "conflict-resolution", "task-generation", "validation"],
      "key_features": ["5-phase-process", "todo-write-coordination", "conflict-detection"]
    },
    "execution": {
      "name": "执行类",
      "reference_commands": ["workflow:execute"],
      "phases": ["discovery", "validation", "todo-generation", "execution", "completion"],
      "key_features": ["multi-execution-model", "lazy-loading", "parallel-execution"]
    },
    "brainstorm": {
      "name": "脑暴类",
      "reference_commands": ["workflow:brainstorm-with-file"],
      "phases": ["session-setup", "seed-understanding", "divergent-exploration", "interactive-refinement", "convergence"],
      "key_features": ["multi-cli-perspectives", "diverge-converge-cycles", "thought-evolution"]
    },
    "issue": {
      "name": "Issue 类",
      "reference_commands": ["issue:plan", "issue:discover", "issue:queue"],
      "phases": ["discovery", "planning", "queuing", "resolution"],
      "key_features": ["issue-tracking", "priority-management", "dependency-resolution"]
    },
    "learn": {
      "name": "学习类",
      "reference_commands": ["learn:plan", "learn:profile"],
      "phases": ["session-setup", "profile-analysis", "planning", "tracking"],
      "key_features": ["profile-memory", "progress-tracking", "milestone-based"]
    }
  },
  "templates": {
    "slash-command": ".claude/skills/slash-command-outliner/templates/slash-command.md",
    "agent-md": ".claude/skills/slash-command-outliner/templates/agent-md.md",
    "workflow-definition": ".claude/skills/slash-command-outliner/templates/workflow-definition.md",
    "task-json": ".claude/skills/slash-command-outliner/templates/task-json.json",
    "data-protocol": ".claude/skills/slash-command-outliner/templates/data-protocol.json"
  }
}
```

**执行步骤**:
1. 分析现有 70+ slash 命令，提取共性模式
2. 按功能类别（analyze/plan/execute/brainstorm/issue/learn）分类
3. 为每个类别创建参考命令列表
4. 提取每个参考命令的关键特征（phases, key_features）
5. 创建模板文件系统

### Phase 2: ACE-tool 集成

**任务**: 实现智能参考匹配

**技术方案**:
```javascript
// 语义搜索和相似度评分
async function findSimilarCommands(userRequest) {
  const searchQuery = `
    用户需求: ${userRequest}

    请从现有 slash 命令中找到最相似的命令，考虑：
    1. 功能相似性（工作流目的）
    2. 架构相似性（阶段数量和类型）
    3. 数据流相似性（输入输出模式）

    返回 Top 3 命令，每个包含：
    - command_name
    - similarity_score (0-100)
    - matching_reasons
    - applicable_patterns
  `;

  const results = await mcp__ace-tool__search_context({
    project_root_path: "/path/to/ccw",
    query: searchQuery
  });

  return results.code_sections
    .map(section => parseCommandMetadata(section))
    .sort((a, b) => b.similarity_score - a.similarity_score)
    .slice(0, 3);
}
```

**依赖**:
- `mcp__ace-tool__search_context`: 语义搜索
- 现有 slash 命令解析能力
- 相似度评分算法

### Phase 3: 模板应用引擎

**任务**: 参数适配和文档生成

**模板示例**:
```markdown
---
name: {{command_name}}
description: {{description}}. Triggers on "{{trigger_keywords}}".
argument-hint: "{{argument_hint}}"
allowed-tools: {{allowed_tools}}
group: {{group}}
---

# {{command_title}}

## Overview

{{overview}}

## Usage

```bash
/{{command_name}} [FLAGS] <ARGUMENTS>
```

## Execution Process

{{execution_diagram}}

### Phase 1: {{phase1_name}}

{{phase1_content}}

... (其他阶段)

## Auto Mode

When `{{auto_mode_flag}}`:
{{auto_mode_behavior}}
```

**参数映射**:
```javascript
const templateVars = {
  command_name: generateFromRequirement(userRequirement),
  description: generateFromRequirement(userRequirement),
  trigger_keywords: extractKeywords(userRequirement),
  argument_hint: buildArgumentHint(userRequirement),
  allowed_tools: determineToolsFromRequirement(userRequirement),
  group: determineCategoryFromMatch(matchedPattern),
  command_title: generateTitle(userRequirement),
  overview: generateOverview(userRequirement, matchedPattern),
  execution_diagram: generateMermaidDiagram(userRequirement, matchedPattern),
  phase1_name: matchedPattern.phases[0],
  phase1_content: adaptPhaseContent(matchedPattern.phases[0], userRequirement),
  // ... 其他变量
};
```

### Phase 4: 质量门控验证

**任务**: 确保生成输出符合标准

**验证检查清单**:
```javascript
const qualityChecks = {
  completeness: [
    { check: "frontmatter_complete", required: ["name", "description", "argument-hint", "allowed-tools"] },
    { check: "sections_complete", required: ["Overview", "Usage", "Execution Process", "Auto Mode"] },
    { check: "agent_files_complete", required: ["Agent System Prompt"] },
    { check: "data_protocol_complete", required: ["JSON Schema", "State Machine"] }
  ],
  consistency: [
    { check: "naming_convention", pattern: /^[a-z-]+(-[a-z-]+)*$/ },
    { check: "format_consistency", reference: "SKILL-DESIGN-SPEC.md" },
    { check: "terminology_consistency", dictionary: "CCW_GLOSSARY" }
  ],
  depth: [
    { check: "phase_detail_level", min_depth: 3 },
    { check: "implementation_clarity", has_examples: true },
    { check: "error_handling", coverage: "all_phases" }
  ],
  readability: [
    { check: "language_clarity", max_complexity: 8 },
    { check: "diagram_quality", has_mermaid: true },
    { check: "example_relevance", examples_match_use_cases: true }
  ]
};

function runQualityChecks(output) {
  const results = {};
  let totalScore = 0;

  for (const [dimension, checks] of Object.entries(qualityChecks)) {
    const score = checks.reduce((sum, check) => {
      return sum + (check.condition ? 1 : 0);
    }, 0) / checks.length * 25;
    results[dimension] = score;
    totalScore += score;
  }

  results.overall = totalScore / 4;
  results.gate = results.overall >= 80 ? 'pass' :
                  results.overall >= 60 ? 'review' : 'fail';

  return results;
}
```

---

## 挑战与缓解

| 挑战 | 严重性 | 缓解策略 |
|--------|--------|----------|
| ACE-tool 搜索准确性 | High | 多轮搜索策略 + 关键词扩展 |
| 模板通用性 vs 特异性 | Medium | 模板继承 + 可覆盖字段 |
| 模式库维护 | Medium | 自动发现 + 社区贡献机制 |
| 复杂需求的处理 | High | 分层模板 + 自定义支持 |

---

## MVP 定义

**最小可行产品 (MVP)** 应包含:

1. ✅ 至少 3 种模式类别的模板（planning, execution, brainstorm）
2. ✅ ACE-tool 智能匹配集成
3. ✅ 基础 Slash MD 生成
4. ✅ 基础 Agent MD 生成
5. ✅ 质量门控验证（完整性检查）

**MVP 后续增强**:
- 可视化架构图生成
- 完整的 Task JSON 生成
- 数据协议（JSON Schema）生成
- 多轮迭代优化
- 模式库自动更新

---

## 成功标准

| 标准 | 验证方法 |
|------|----------|
| 生成方案符合 CCW 规范 | 对照 SKILL-DESIGN-SPEC.md 检查 |
| 参考命令匹配准确度 > 80% | 用户评估 + 自动验证 |
| 质量门控通过率 > 90% | 自动化测试 |
| 新命令创建时间减少 > 60% | 对比手动创建 |
| 生成方案可直接执行 | /workflow:execute 测试 |

---

## 推荐: 执行

**理由**:
1. 结合了智能化和标准化，符合现代代码生成工具的最佳实践
2. 基于现有成功模式（skill-generator）扩展，风险低
3. 模式库可扩展，社区可贡献
4. 质量门控确保输出质量

**实施路径**:
1. 短期（1-2周）: 创建模式库 + ACE-tool 集成
2. 中期（2-4周）: 模板系统 + 质量门控
3. 长期（4-8周）: 可视化增强 + 多轮迭代

**后续跟进**:
1. 监控 ACE-tool 搜索准确性
2. 收集用户反馈优化模板
3. 扩展模式库覆盖更多命令类型
4. 集成到现有 skill-generator 或创建独立 skill

---

**状态**: 等待用户确认后进入实施阶段
