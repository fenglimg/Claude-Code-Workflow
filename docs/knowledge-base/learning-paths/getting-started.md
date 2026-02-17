# CCW 入门指南

> 30 分钟理解 CCW 核心概念

---

## 概述

Claude-Code-Workflow (CCW) 是一个 JSON 驱动的多代理开发框架，帮助你自动化软件开发工作流。

**核心理念**: 用声明式配置 + 运行时发现，让 AI 代理协同完成复杂任务。

---

## 核心概念 (5 分钟)

### 四大抽象

| 抽象 | 作用 | 类比 |
|------|------|------|
| **命令 (Command)** | 用户入口，斜杠命令 | 菜单选项 |
| **技能 (Skill)** | 多阶段工作流，编排代理 | 菜谱 |
| **代理 (Agent)** | 单一职责执行者 | 厨师 |
| **工具 (Tool)** | 底层能力，MCP 暴露 | 刀具 |

```
用户 → 命令 → 技能 → 代理 → 工具
       (入口)  (编排)  (执行)  (能力)
```

### 数据流

```
┌─────────┐    ┌─────────┐    ┌─────────┐    ┌─────────┐
│  用户   │───→│  命令   │───→│  技能   │───→│  代理   │
└─────────┘    └─────────┘    └─────────┘    └─────────┘
                    │              │              │
                    ▼              ▼              ▼
               /ccw          phases/        Task tool
               /workflow     01-xxx.md      code-developer
```

---

## 关键术语表 (5 分钟)

| 术语 | 定义 |
|------|------|
| **CLI** | 命令行工具，`ccw` 命令 |
| **MCP** | Model Context Protocol，工具协议 |
| **Session** | 工作流会话，存储状态 |
| **Phase** | 技能的执行阶段 |
| **Task JSON** | 任务定义文件 |
| **Context Package** | 上下文数据包 |

---

## 第一个工作流 (15 分钟)

### 1. 执行 CLI 分析

```bash
ccw cli -p "分析 src/auth 目录的代码结构" --tool gemini --mode analysis
```

**参数说明**:
- `-p`: 提示词
- `--tool`: 使用的 CLI 工具 (gemini/codex/claude)
- `--mode`: 执行模式 (analysis 只读 / write 写入)

### 2. 执行规划工作流

```bash
/ccw "实现用户登录功能"
```

系统会自动:
1. 分析需求
2. 选择合适的工作流
3. 生成任务计划
4. 执行实现

### 3. 查看会话状态

```bash
ccw session list
```

---

## 常用命令速查

| 命令 | 用途 |
|------|------|
| `/ccw "任务描述"` | 自动工作流编排 |
| `/workflow:plan` | 标准规划流程 |
| `/workflow:lite-plan` | 轻量规划 |
| `/issue:new` | 创建 Issue |
| `/review-code` | 代码审查 |

---

## 下一步

- [开发者指南](developer-guide.md) - 深入理解架构
- [心智模型](../deep-dive/architecture/mental-model.md) - 核心抽象详解
- [命令参考](../reference/commands/) - 完整命令列表

---

*入门指南 - CCW Knowledge Base*
