# cli-planning

> **分类**: CLI-Related
> **源文件**: [.claude/agents/cli-planning-agent.md](../../.claude/agents/cli-planning-agent.md)

## 概述

**CLI Planning Agent** 是一个专门化的执行 Agent，桥接 CLI 分析工具（Gemini/Qwen）与任务生成。它执行 CLI 命令进行失败诊断，解析结构化结果，并动态生成任务 JSON 文件供下游执行。

**核心能力**:
- 执行 CLI 分析（适当模板和上下文）
- 解析结构化结果（修复策略、根因、修改点）
- 动态生成任务 JSON（IMPL-fix-N.json, IMPL-supplement-N.json）
- 保存详细分析报告（iteration-N-analysis.md）

**主要用例**: 测试失败诊断和修复任务生成（test-cycle-execute 工作流）

## 能力说明

### 能做什么
- 执行 Gemini/Qwen CLI 进行深度分析
- 解析 CLI 输出为结构化数据
- 动态生成任务 JSON 文件
- 生成分析报告文档
- 处理 CLI 错误和降级模式

### 不能做什么
- 不执行代码修改
- 不直接运行测试
- 不处理用户交互

## 工作流程

```mermaid
flowchart LR
    A[Phase 1: CLI 分析执行] --> B[Phase 2: 结果解析]
    B --> C[Phase 3: 任务 JSON 生成]
```

### Phase 1: CLI 分析执行

**输入处理**:

```javascript
{
  "session_id": "WFS-xxx",
  "iteration": 1,
  "analysis_type": "test-failure|coverage-gap|regression-analysis",
  "failure_context": {
    "failed_tests": [
      {
        "test": "test_auth_token",
        "error": "AssertionError: expected 200, got 401",
        "file": "tests/test_auth.py",
        "line": 45,
        "criticality": "high",
        "test_type": "integration"  // L0-L3 层级
      }
    ],
    "pass_rate": 85.0,
    "previous_attempts": [...]
  },
  "cli_config": {
    "tool": "gemini|qwen",
    "template": "01-diagnose-bug-root-cause.txt",
    "timeout": 2400000,  // 40 分钟
    "fallback": "qwen"
  }
}
```

**执行流程**:
1. 验证上下文包并提取失败上下文
2. 构建带适当模板的 CLI 命令
3. 执行 Gemini/Qwen CLI 工具
4. 处理错误并在需要时回退到备用工具
5. 保存原始 CLI 输出到 `.process/iteration-N-cli-output.txt`

### Phase 2: 结果解析与策略提取

**解析内容**:
- 根因分析（RCA）
- 修复策略和方法
- 修改点（文件、函数、行号）
- 预期结果和验证步骤

**提取量化需求**:
- 需修改的文件数
- 需修复的具体函数（含行号）
- 需解决的测试用例

**生成结构化分析报告**: `iteration-N-analysis.md`

### Phase 3: 任务 JSON 生成

1. 加载任务 JSON 模板
2. 用解析的 CLI 结果填充模板
3. 添加迭代上下文和之前尝试
4. 写入任务 JSON 到 `.workflow/session/{session}/.task/IMPL-fix-N.json`
5. 返回成功状态和任务 ID 给协调器

## 测试层级感知

**CLI 命令构建包含层级特定指导**:

| 层级 | 诊断焦点 |
|------|----------|
| L0 (static) | 语法错误、lint 违规、类型不匹配 |
| L1 (unit) | 函数逻辑、边缘情况、单组件错误处理 |
| L2 (integration) | 组件交互、数据流、接口契约 |
| L3 (e2e) | 完整用户旅程、外部依赖、状态管理 |

**CLI 命令示例**:

```bash
ccw cli -p "
PURPOSE: Analyze {test_type} test failures and generate fix strategy for iteration {iteration}
TASK:
• Review {failed_tests.length} {test_type} test failures
• Since these are {test_type} tests, apply layer-specific diagnosis
• Identify root causes for each failure
• Generate fix strategy addressing root causes
MODE: analysis
CONTEXT: @{focus_paths} @.process/test-results.json
EXPECTED: Structured fix strategy with RCA, modification points, verification steps
" --tool gemini --mode analysis
```

## 任务 JSON 模板

**IMPL-fix-N.json 结构**:

```json
{
  "id": "IMPL-fix-{iteration}",
  "title": "Fix {failed_tests.length} {dominant_test_type} test failures - Iteration {iteration}",
  "status": "pending",
  "meta": {
    "type": "test-fix-iteration",
    "agent": "@test-fix-agent",
    "analysis_report": ".workflow/session/{session}/.process/iteration-{iteration}-analysis.md",
    "cli_output": ".workflow/session/{session}/.process/iteration-{iteration}-cli-output.txt",
    "iteration": {iteration}
  },
  "context": {
    "requirements": [
      "Fix {failed_tests.length} failing tests: [{test_names}]",
      "Target pass rate: 95%+ (current: {pass_rate}%)"
    ],
    "fix_strategy": "{parsed_from_cli}",
    "root_causes": [...],
    "modification_points": [...]
  },
  "flow_control": {
    "pre_analysis": [
      {
        "step": "load_analysis_context",
        "action": "Load CLI analysis report for full failure context"
      }
    ],
    "implementation_approach": [
      {
        "step": 1,
        "title": "Apply fixes from CLI analysis",
        "modification_points": [...],
        "logic_flow": [...]
      }
    ],
    "exit_conditions": {
      "success": "tests_pass_rate >= 95%",
      "failure": "max_iterations_reached"
    }
  }
}
```

## 模板变量替换

| 变量 | 来源 |
|------|------|
| `{iteration}` | context.iteration |
| `{test_type}` | failed_tests 中的主导测试类型 |
| `{dominant_test_type}` | failed_tests 数组中最常见的 test_type |
| `{layer_specific_approach}` | layerGuidance 映射中的指导 |
| `{fix_summary}` | fix_strategy.approach 的前 50 字符 |
| `{failed_tests.length}` | 失败数 |
| `{modification_points.length}` | 修改点数 |
| `{modification_points}` | file:function:lines 数组 |
| `{timestamp}` | ISO 8601 时间戳 |
| `{parent_task_id}` | 父测试任务 ID |

## 分析报告结构

**iteration-N-analysis.md**:

```markdown
---
iteration: {iteration}
analysis_type: test-failure
cli_tool: {cli_config.tool}
timestamp: {timestamp}
pass_rate: {pass_rate}%
---

# Test Failure Analysis - Iteration {iteration}

## Summary
- **Failed Tests**: {count}
- **Pass Rate**: {pass_rate}% (Target: 95%+)
- **Root Causes Identified**: {count}
- **Modification Points**: {count}

## Failed Tests Details
### {test.test}
- **Error**: {test.error}
- **File**: {test.file}:{test.line}
- **Criticality**: {test.criticality}
- **Test Type**: {test.test_type}

## Root Cause Analysis
{CLI output section}

## Fix Strategy
{CLI output section}

## Modification Points
- `file:function:line_range` - {change_description}

## Expected Outcome
{CLI output section}

## CLI Raw Output
See: `.process/iteration-{iteration}-cli-output.txt`
```

## 质量标准

### CLI 执行标准

| 标准 | 要求 |
|------|------|
| 超时管理 | 动态超时（分析 2400000ms = 40min） |
| 回退链 | Gemini → Qwen → degraded mode |
| 错误上下文 | 失败报告中包含完整错误详情 |
| 输出保留 | 保存原始 CLI 输出到 .process/ |

### 任务 JSON 标准

| 标准 | 要求 |
|------|------|
| 量化 | 所有需求包含计数和显式列表 |
| 特异性 | 修改点使用 file:function:line 格式 |
| 可衡量性 | 验收标准包含验证命令 |
| 可追溯性 | 链接到分析报告和 CLI 输出文件 |
| 最小冗余 | 使用引用代替嵌入完整上下文 |

### 分析报告标准

| 标准 | 要求 |
|------|------|
| 结构化格式 | 使用一致的 markdown 区块 |
| 元数据 | YAML frontmatter 包含关键指标 |
| 完整性 | 捕获所有 CLI 输出区块 |
| 交叉引用 | 链接到 test-results.json 和 CLI 输出文件 |

## 使用场景

### 什么时候使用这个 Agent

- **测试失败诊断**: 需要分析失败原因并生成修复任务
- **覆盖率差距分析**: 需要识别未覆盖代码并生成补充测试任务
- **回归分析**: 需要分析回归问题并生成修复任务
- **迭代修复流程**: test-cycle-execute 工作流中的迭代修复

### 输入要求

- `failure_context`: 包含失败测试详情
- `cli_config`: CLI 工具配置
- `iteration`: 当前迭代次数
- `previous_attempts`: 之前尝试的历史

### 预期输出

```
Generated:
- .process/iteration-1-cli-output.txt (原始 CLI 输出)
- .process/iteration-1-analysis.md (分析报告)
- .task/IMPL-fix-1.json (修复任务)
```

## 与其他 Agent 的协作

```mermaid
graph LR
    A[test-cycle-execute Skill] --> B[cli-planning-agent]
    C[test-fix-agent] --> B
    B --> D[@test-fix-agent]
    B --> E[IMPL-fix-N.json]
```

| 协作 Agent/Skill | 协作方式 |
|------------------|----------|
| test-cycle-execute Skill | 上游调用者，提供失败上下文 |
| test-fix-agent | 下游执行者，接收修复任务 |
| Gemini/Qwen CLI | 外部工具，执行分析 |

## 关联组件

- **相关 Skills**: [workflow-test-fix](../skills/workflow-test-fix.md)
- **相关 Agents**: [test-fix-agent](test-fix-agent.md), [test-action-planning](test-action-planning.md)
- **相关 Commands**: ccw-test

## 最佳实践

1. **验证上下文包**: CLI 执行前确保所有必需字段存在
2. **优雅处理 CLI 错误**: 使用回退链（Gemini → Qwen → degraded mode）
3. **结构化解析 CLI 输出**: 提取特定区块（RCA、修复建议、验证建议）
4. **保存完整 CLI 输出**: 用于调试和审计
5. **量化所有需求**: 任务 JSON 中包含计数和显式列表
6. **使用引用而非嵌入**: 链接到分析报告
7. **遵循测试层级指导**: 根据测试类型应用特定诊断方法
8. **限制迭代次数**: 设置 max_iterations 防止无限循环
