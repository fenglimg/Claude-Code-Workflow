# skill-generator 工作流解释

## 概述

**skill-generator** 是一个 Meta-skill（元技能），用于创建新的 Claude Code skills。它支持两种可配置的执行模式：Sequential（顺序）和 Autonomous（自主），能够自动生成完整的 Skill 目录结构、阶段文件、规范文档和模板。

### 基本信息

| 属性 | 值 |
|------|-----|
| 类型 | Skill |
| 名称 | skill-generator |
| 路径 | `~/.claude/skills/skill-generator/` |
| 触发词 | "create skill", "new skill", "skill generator", "生成技能", "创建技能" |
| 执行模式 | Sequential（5个阶段 + Phase 0 前置） |
| 允许工具 | Task, AskUserQuestion, Read, Bash, Glob, Grep, Write |

---

## 核心概念

| 概念 | 类别 | 定义 | 出现次数 |
|------|------|------|----------|
| **Skill** | 架构 | 实现特定功能的可复用单元，包含完整的执行流程、规范和模板，由 SKILL.md 作为入口文件 | 50 |
| **Phase** | 架构 | 工作流中的一个执行阶段，包含明确的输入、输出和执行步骤 | 35 |
| **Orchestrator** | 架构 | 编排器，协调多个组件执行的控制器，负责读取状态、选择动作、执行并更新状态 | 15 |
| **Action** | 架构 | Autonomous 模式中的独立执行单元，无固定顺序，由编排器动态选择 | 20 |
| **Sequential Mode** | 流程 | 顺序执行模式，阶段按数字前缀固定顺序线性执行，适合流水线式任务 | 12 |
| **Autonomous Mode** | 流程 | 自主执行模式，由编排器根据状态动态选择执行路径，适合交互式任务 | 10 |
| **State** | 数据 | 记录执行进度和上下文的状态对象，包含 status、current_action、completed_actions 等字段 | 25 |
| **Context Strategy** | 数据 | 上下文管理策略，分为 file（文件持久化）和 memory（内存临时）两种 | 8 |
| **skill-config.json** | 数据 | Skill 配置文件，包含名称、执行模式、阶段定义、工具列表等元数据 | 15 |
| **AskUserQuestion** | 工具 | 用户交互工具，用于收集用户输入和选择，支持单选和多选问题 | 10 |
| **Task** | 工具 | 启动子 Agent 的工具，用于执行独立任务并返回结果 | 8 |
| **Validation** | 流程 | 验证生成文件的完整性和质量，检查必需文件、内容结构和质量标准 | 12 |

---

## 执行流程

### Phase 0: Specification Study（强制前置）

**目标**: 阅读并内化设计规范，确保后续生成符合标准

**必读文档**:
- `../_shared/SKILL-DESIGN-SPEC.md` - 通用设计规范
- `templates/skill-md.md` - SKILL.md 入口文件模板
- `templates/sequential-phase.md` - Sequential Phase 模板
- `templates/autonomous-orchestrator.md` - Autonomous 编排器模板

**输出**: 内化规范要求，确保后续生成符合标准

---

### Phase 1: Requirements Discovery

**目标**: 收集新 Skill 的需求信息，生成配置文件

**关键步骤**:
1. **基本信息收集** - 使用 AskUserQuestion 询问 Skill 名称、用途类型
2. **执行模式选择** - Sequential（顺序）/ Autonomous（自主）/ Hybrid（混合）
3. **阶段/动作定义** - 根据模式定义执行单元
4. **工具和输出配置** - 选择特殊工具、输出格式
5. **生成配置文件** - 写入 `skill-config.json`

**输入**: 用户交互输入

**输出**: `skill-config.json`

---

### Phase 2: Structure Generation

**目标**: 根据配置创建 Skill 目录结构和入口文件

**关键步骤**:
1. **读取配置** - 加载 `skill-config.json`
2. **创建目录结构** - `phases/`, `specs/`, `templates/`, `scripts/`
3. **生成 SKILL.md** - 使用模板生成入口文件

**输入**: `skill-config.json`

**输出**: 
- 目录结构 `.claude/skills/{skill-name}/`
- `SKILL.md` 入口文件

---

### Phase 3: Phase Generation

**目标**: 根据执行模式生成 Phase 文件

**分支逻辑**:

| 执行模式 | 生成内容 |
|----------|----------|
| Sequential | `phases/01-*.md`, `02-*.md`, ... + `_orchestrator.md` + `workflow.json` |
| Autonomous | `orchestrator.md` + `state-schema.md` + `actions/*.md` |

**上下文策略支持**:
- `file`: 持久化到文件，可调试、可恢复
- `memory`: 仅在运行时保持，速度快

**输入**: `skill-config.json`, `SKILL.md`

**输出**: `phases/*.md`（或 `phases/actions/*.md`）

---

### Phase 4: Specs & Templates

**目标**: 生成规范文件和模板文件

**生成内容**:
- `specs/{skill-name}-requirements.md` - 领域规范
- `specs/quality-standards.md` - 质量标准
- `specs/action-catalog.md` - 动作目录（Autonomous 模式）
- `templates/agent-base.md` - Agent 模板

**输入**: 所有前序阶段产出

**输出**: `specs/*.md`, `templates/*.md`

---

### Phase 5: Validation & Documentation

**目标**: 验证完整性并生成使用说明

**关键步骤**:
1. **文件完整性检查** - 验证所有必需文件存在
2. **内容质量检查** - 检查文件结构和内容
3. **生成验证报告** - 输出 `validation-report.json`
4. **生成 README.md** - 生成使用说明

**输入**: 所有生成文件

**输出**: 
- `validation-report.json` - 验证报告
- `README.md` - 使用说明

---

## 数据流

### 数据产物

| 产物 | 生产者 | 消费者 | 说明 |
|------|--------|--------|------|
| `skill-config.json` | Phase 1 | Phase 2, 3, 4, 5 | 核心配置文件，驱动所有后续生成 |
| `SKILL.md` | Phase 2 | Phase 3, 5 | Skill 入口文件 |
| `phases/*.md` | Phase 3 | Phase 4, 5 | 执行阶段文件 |
| `specs/*.md` | Phase 4 | Phase 5 | 规范文档 |
| `templates/*.md` | Phase 4 | Phase 5 | 模板文件 |
| `validation-report.json` | Phase 5 | 用户 | 验证结果报告 |
| `README.md` | Phase 5 | 用户 | 使用说明文档 |

### 数据流转路径

| 阶段 | 输入 | 输出 | 流向 |
|------|------|------|------|
| Phase 0 | 规范文档 | 内化知识 | Phase 1 |
| Phase 1 | 用户输入 | skill-config.json | Phase 2 |
| Phase 2 | skill-config.json | 目录结构 + SKILL.md | Phase 3 |
| Phase 3 | skill-config.json + SKILL.md | phases/*.md | Phase 4 |
| Phase 4 | 所有前序产出 | specs/*.md + templates/*.md | Phase 5 |
| Phase 5 | 所有生成文件 | validation-report.json + README.md | 用户 |

---

## 设计思考

### 执行模式设计

**设计决策**: 支持 Sequential 和 Autonomous 两种执行模式

**权衡考虑**:
- Sequential 模式简单直观，适合流水线任务，但灵活性低
- Autonomous 模式灵活动态，适合交互式任务，但复杂度高
- 提供 Hybrid 模式以满足复杂场景

### 强制前置 Phase 0

**设计决策**: 所有执行必须先完成 Phase 0 规范阅读

**权衡考虑**:
- 确保生成质量符合标准
- 防止"跳过规范直接生成"导致的质量问题
- 增加了执行步骤，但保证了输出一致性

### 声明式编排

**设计决策**: Sequential 模式使用 `workflow.json` 声明式定义执行计划

**权衡考虑**:
- 声明式定义更清晰，易于理解和修改
- 支持条件执行和错误恢复
- 编排器和阶段文件分离，职责清晰

### 上下文策略

**设计决策**: 支持 `file`（文件）和 `memory`（内存）两种上下文策略

**权衡考虑**:
- 文件策略：持久化、可调试、可恢复，但有 IO 开销
- 内存策略：速度快、无 IO，但无法恢复、调试困难
- 默认使用文件策略，简单任务可选内存策略

### 模板驱动生成

**设计决策**: 使用模板文件驱动所有代码生成

**权衡考虑**:
- 模板易于维护和更新
- 生成结果一致性高
- 支持用户自定义模板扩展

---

## 使用示例

### 基本用法

```bash
# 使用触发词
用户: create skill

# 或中文触发
用户: 创建技能
```

### 带参数用法

```bash
# 指定 Skill 名称
用户: new skill api-docs-generator

# 指定执行模式
用户: create skill --mode sequential
```

### 完整交互示例

```
用户: create skill

Claude: 我将帮你创建一个新的 Skill。

[Phase 0] 首先让我阅读设计规范...

[Phase 1] 请回答以下问题：
- Skill 名称是什么？
- 主要用途是什么？（文档生成/代码分析/交互管理/数据处理）
- 选择执行模式？（Sequential/Autonomous/Hybrid）
...

[Phase 2] 正在创建目录结构...

[Phase 3] 正在生成 Phase 文件...

[Phase 4] 正在生成规范和模板...

[Phase 5] 验证完成！
路径: ~/.claude/skills/your-skill/
状态: PASS
```

---

*本文档由 skill-explainer 自动生成*
*生成时间: 2026-01-29*
*流程图请查看同目录下的 skill-generator-flowchart.md*
