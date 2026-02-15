# Commands 索引

> **总数**: 48 个
> **最后更新**: 2025-02-15

---

## 概述

Commands 是 CCW 的单一职责命令，执行具体操作。每个 Command：

- 定义在 `.claude/commands/` 目录下
- 使用 YAML frontmatter 声明元数据
- 通过 `/command-name` 在 Claude Code 中调用

---

## 分类索引

### CLI 命令 (2)

外部 CLI 工具相关命令。

| 命令 | 描述 | 文档 |
|------|------|------|
| `cli-init` | 初始化 CLI 配置目录 | [详情](cli/cli-init.md) |
| `codex-review` | 使用 Codex 进行交互式代码审查 | [详情](cli/codex-review.md) |

### 核心命令 (6)

CCW 核心工作流命令。

| 命令 | 描述 | 文档 |
|------|------|------|
| **`ccw`** | 主工作流编排器 | [详情](core/ccw.md) |
| `ccw-coordinator` | 命令编排工具 | [详情](core/ccw-coordinator.md) |
| `ccw-debug` | 调试协调器 | [详情](core/ccw-debug.md) |
| `ccw-plan` | 规划协调器 | [详情](core/ccw-plan.md) |
| `ccw-test` | 测试协调器 | [详情](core/ccw-test.md) |
| `flow-create` | Flow 模板生成器 | [详情](core/flow-create.md) |

### Issue 命令 (8)

Issue 生命周期管理。

| 命令 | 描述 | 文档 |
|------|------|------|
| **`issue:new`** | 创建结构化 Issue | [详情](issue/new.md) |
| `issue:convert-to-plan` | 将工件转换为计划 | [详情](issue/convert-to-plan.md) |
| **`issue:discover`** | 发现潜在 Issue | [详情](issue/discover.md) |
| `issue:discover-by-prompt` | 从提示发现 Issue | [详情](issue/discover-by-prompt.md) |
| **`issue:execute`** | 执行 Issue 队列 | [详情](issue/execute.md) |
| `issue:from-brainstorm` | 从头脑风暴创建 Issue | [详情](issue/from-brainstorm.md) |
| `issue:plan` | 批量规划 Issue 解决 | [详情](issue/plan.md) |
| **`issue:queue`** | 形成执行队列 | [详情](issue/queue.md) |

### 内存命令 (2)

上下文和记忆管理。

| 命令 | 描述 | 文档 |
|------|------|------|
| `memory:prepare` | 分析项目准备内存 | [详情](memory/prepare.md) |
| `memory:style-skill-memory` | 生成 Skill 内存包 | [详情](memory/style-skill-memory.md) |

### 工作流命令 (25)

#### 会话管理 (5)

| 命令 | 描述 | 文档 |
|------|------|------|
| **`workflow:session:start`** | 启动新工作流会话 | [详情](workflow/session/start.md) |
| `workflow:session:list` | 列出所有会话 | [详情](workflow/session/list.md) |
| `workflow:session:resume` | 恢复暂停的会话 | [详情](workflow/session/resume.md) |
| `workflow:session:solidify` | 固化学习内容 | [详情](workflow/session/solidify.md) |
| `workflow:session:complete` | 标记会话完成 | [详情](workflow/session/complete.md) |

#### 头脑风暴 (4)

| 命令 | 描述 | 文档 |
|------|------|------|
| `workflow:brainstorm:role-analysis` | 角色特定分析 | [详情](workflow/brainstorm/role-analysis.md) |
| `workflow:brainstorm:synthesis` | 澄清和综合分析 | [详情](workflow/brainstorm/synthesis.md) |
| `workflow:brainstorm:artifacts` | 生成指导规范 | [详情](workflow/brainstorm/artifacts.md) |
| **`workflow:brainstorm:auto-parallel`** | 并行头脑风暴自动化 | [详情](workflow/brainstorm/auto-parallel.md) |

#### UI 设计 (10)

| 命令 | 描述 | 文档 |
|------|------|------|
| `workflow:ui-design:style-extract` | 提取设计令牌 | [详情](workflow/ui-design/style-extract.md) |
| `workflow:ui-design:layout-extract` | 提取布局模式 | [详情](workflow/ui-design/layout-extract.md) |
| `workflow:ui-design:animation-extract` | 提取动画 | [详情](workflow/ui-design/animation-extract.md) |
| `workflow:ui-design:generate` | 组装 UI 原型 | [详情](workflow/ui-design/generate.md) |
| `workflow:ui-design:design-sync` | 同步设计引用 | [详情](workflow/ui-design/design-sync.md) |
| `workflow:ui-design:import-from-code` | 从代码导入 | [详情](workflow/ui-design/import-from-code.md) |
| `workflow:ui-design:codify-style` | 提取并编码样式 | [详情](workflow/ui-design/codify-style.md) |
| `workflow:ui-design:reference-page-generator` | 生成参考页面 | [详情](workflow/ui-design/reference-page-generator.md) |
| **`workflow:ui-design:explore-auto`** | 自动 UI 设计工作流 | [详情](workflow/ui-design/explore-auto.md) |
| `workflow:ui-design:imitate-auto` | 自动模仿工作流 | [详情](workflow/ui-design/imitate-auto.md) |

#### 核心工作流 (11)

| 命令 | 描述 | 文档 |
|------|------|------|
| `workflow:init` | 初始化项目状态 | [详情](workflow/init.md) |
| `workflow:clean` | 智能代码清理 | [详情](workflow/clean.md) |
| `workflow:init-guidelines` | 填充项目指南 | [详情](workflow/init-guidelines.md) |
| `workflow:analyze-with-file` | 交互式分析 | [详情](workflow/analyze-with-file.md) |
| **`workflow:brainstorm-with-file`** | 交互式头脑风暴 | [详情](workflow/brainstorm-with-file.md) |
| `workflow:collaborative-plan-with-file` | 协作规划 | [详情](workflow/collaborative-plan-with-file.md) |
| **`workflow:debug-with-file`** | 假设驱动调试 | [详情](workflow/debug-with-file.md) |
| `workflow:req-plan-with-file` | 需求路线图规划 | [详情](workflow/req-plan-with-file.md) |
| `workflow:unified-execute-with-file` | 通用执行引擎 | [详情](workflow/unified-execute-with-file.md) |
| `workflow:integration-test-cycle` | 集成测试工作流 | [详情](workflow/integration-test-cycle.md) |
| `workflow:refactor-cycle` | 技术债务重构 | [详情](workflow/refactor-cycle.md) |

---

## 命令选择指南

### 按任务类型选择

```mermaid
graph TD
    A[任务类型] --> B{复杂度?}
    B -->|简单| C[Level 1-2]
    B -->|中等| D[Level 2-3]
    B -->|复杂| E[Level 3-4]
    
    C --> C1[/ccw 自动选择]
    C --> C2[/workflow:session:start]
    
    D --> D1[/ccw-plan]
    D --> D2[/issue:new]
    D --> D3[/workflow:debug-with-file]
    
    E --> E1[/workflow:brainstorm-with-file]
    E --> E2[/workflow:brainstorm:auto-parallel]
    E --> E3[team-lifecycle Skill]
```

### 按工作流阶段选择

| 阶段 | 推荐命令 |
|------|----------|
| **发现** | `issue:discover`, `workflow:analyze-with-file` |
| **规划** | `ccw-plan`, `issue:plan`, `workflow:brainstorm-with-file` |
| **执行** | `ccw`, `issue:execute`, `workflow:unified-execute-with-file` |
| **验证** | `ccw-test`, `workflow:integration-test-cycle` |
| **审查** | `codex-review`, `workflow:refactor-cycle` |

---

## 常用命令 TOP 10

| 排名 | 命令 | 用途 | 频次 |
|------|------|------|------|
| 1 | `/ccw` | 主工作流入口 | 极高 |
| 2 | `/ccw-plan` | 规划任务 | 高 |
| 3 | `/issue:new` | 创建 Issue | 高 |
| 4 | `/workflow:session:start` | 启动会话 | 高 |
| 5 | `/ccw-test` | 运行测试 | 高 |
| 6 | `/ccw-debug` | 调试问题 | 中 |
| 7 | `/issue:discover` | 发现 Issue | 中 |
| 8 | `/workflow:brainstorm-with-file` | 头脑风暴 | 中 |
| 9 | `/issue:execute` | 执行 Issue | 中 |
| 10 | `/workflow:debug-with-file` | 深度调试 | 中 |

---

## 参数速查

### 通用参数

| 参数 | 描述 | 示例 |
|------|------|------|
| `--session` | 指定会话 ID | `--session="abc123"` |
| `--force` | 强制执行 | `--force` |
| `--json` | JSON 输出 | `--json` |
| `--brief` | 简洁输出 | `--brief` |

### CLI 命令参数

| 参数 | 描述 | 示例 |
|------|------|------|
| `-p, --prompt` | 提示文本 | `-p "分析代码"` |
| `--tool` | CLI 工具 | `--tool gemini` |
| `--mode` | 执行模式 | `--mode analysis` |
| `--cd` | 工作目录 | `--cd src` |
| `--resume` | 恢复会话 | `--resume` |

### Issue 命令参数

| 参数 | 描述 | 示例 |
|------|------|------|
| `--title` | Issue 标题 | `--title "修复 Bug"` |
| `--type` | Issue 类型 | `--type bug` |
| `--status` | Issue 状态 | `--status pending` |
| `--priority` | 优先级 (1-5) | `--priority 3` |

---

## 使用示例

### 快速开始

```bash
# 自动分析意图并选择工作流
/ccw "添加用户认证功能"

# 明确规划模式
/ccw-plan "重构支付模块"

# 运行测试
/ccw-test
```

### Issue 工作流

```bash
# 创建 Issue
/issue:new "修复登录超时问题"

# 批量规划
/issue:plan

# 形成队列
/issue:queue

# 执行队列
/issue:execute
```

### 会话工作流

```bash
# 启动会话
/workflow:session:start "项目任务"

# 列出会话
/workflow:session:list

# 恢复会话
/workflow:session:resume

# 完成会话
/workflow:session:complete
```

### CLI 工具

```bash
# 使用 Gemini 分析代码
ccw cli -p "分析这个模块的架构" --tool gemini --mode analysis

# 使用 Codex 实现
ccw cli -p "实现用户服务" --tool codex --mode write

# 代码审查
ccw cli --tool codex --mode review --uncommitted
```

---

## 命令命名规范

### 前缀规范

| 前缀 | 类别 | 示例 |
|------|------|------|
| `ccw` | 核心工作流 | `ccw`, `ccw-plan`, `ccw-test` |
| `issue:` | Issue 管理 | `issue:new`, `issue:plan` |
| `workflow:` | 工作流操作 | `workflow:session:start` |
| `memory:` | 内存管理 | `memory:prepare` |

### 命名约定

- **动词-名词**: `ccw-plan`, `issue:discover`
- **冒号分隔**: `workflow:session:start`
- **kebab-case**: `brainstorm-with-file`

---

*由 CCW 知识系统自动生成*
