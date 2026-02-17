# 添加新技能指南

> 创建自定义 CCW 技能的完整指南

---

## 概述

CCW 技能是多阶段工作流的定义。本指南将带你创建第一个自定义技能。

---

## 1. 目录结构创建

```bash
# 创建技能目录
mkdir -p .claude/skills/my-skill/{phases,specs,templates,scripts}
```

### 目录结构
```
my-skill/
├── SKILL.md           # 入口：元数据 + 执行流程
├── phases/            # 阶段定义
│   ├── 01-init.md
│   ├── 02-execute.md
│   └── 03-complete.md
├── specs/             # 规范文件
│   └── constraints.md
├── templates/         # 模板
│   └── output.md
└── scripts/           # 辅助脚本
    └── validate.sh
```

---

## 2. SKILL.md 入口文件

### 最小可行模板

```markdown
---
name: my-skill
description: |
  简短的技能描述。
  Examples:
  - Context: 需要执行某个任务
    Usage: /my-skill "任务描述"
invoker: user
---

# My Skill

## Overview
简要描述技能功能和用途。

## Quick Start
```bash
/my-skill "执行任务"
```

## Workflow
```
Phase 1: 初始化 → Phase 2: 执行 → Phase 3: 完成
```

## Implementation

### Phase 1: 初始化
- 解析输入
- 初始化会话

### Phase 2: 执行
- 执行核心逻辑

### Phase 3: 完成
- 生成输出
- 清理资源
```

### 元数据字段

| 字段 | 必填 | 说明 |
|------|------|------|
| `name` | 是 | 技能唯一标识，用于 `/name` 调用 |
| `description` | 是 | 描述 + 触发示例 |
| `invoker` | 否 | `user` 或 `agent` |

---

## 3. Phase 阶段定义

### Phase 文件模板

```markdown
# Phase 1: 初始化

## Objective
本阶段目标。

## Prerequisites
- 前置条件 1
- 前置条件 2

## Workflow Steps
1. 步骤 1
2. 步骤 2
3. 步骤 3

## Success Criteria
- [ ] 成功标准 1
- [ ] 成功标准 2

## Variables Set
- `var1`: 值
- `var2`: 值
```

### 命名规范
- **数字前缀**: `01-`, `02-`, `03-` 控制执行顺序
- **子阶段**: `02.5-` 插入中间步骤
- **描述性名称**: `01-context-gathering.md`

---

## 4. specs/ 规范文件

### 约束定义示例

```markdown
# Constraints

## Input Validation
- 输入必须包含任务描述
- 任务描述长度 > 10 字符

## Output Format
- 输出必须是 Markdown 格式
- 必须包含 Summary 章节

## Error Handling
- 网络错误 → retry_once
- 文件错误 → fail
```

---

## 5. templates/ 模板

### 输出模板示例

```markdown
# Output Template

## Summary
{{summary}}

## Details
{{details}}

## Next Steps
{{next_steps}}
```

### 变量引用
- `{{variable}}` - Template 占位符
- `[variable_name]` - 引用 pre_analysis 输出

---

## 6. 完整示例: Hello Skill

### SKILL.md
```markdown
---
name: hello
description: |
  简单的问候技能。
  Examples:
  - Context: 想要打招呼
    Usage: /hello "World"
---

# Hello Skill

## Overview
向用户打招呼的简单技能。

## Quick Start
```bash
/hello "World"
```

## Implementation

### Phase 1: Parse Input
- 提取名字参数
- 验证输入

### Phase 2: Generate Greeting
- 生成问候语
- 输出结果
```

### phases/01-parse.md
```markdown
# Phase 1: Parse Input

## Objective
解析输入参数。

## Workflow Steps
1. 提取名字参数
2. 验证名字非空
3. 设置变量

## Success Criteria
- [ ] 名字已提取
- [ ] 名字非空

## Variables Set
- `name`: 用户名
```

### phases/02-greet.md
```markdown
# Phase 2: Generate Greeting

## Objective
生成问候语并输出。

## Prerequisites
- `name` 已设置

## Workflow Steps
1. 构建问候语
2. 输出到用户

## Success Criteria
- [ ] 问候语已输出
```

---

## 7. 测试技能

```bash
# 调用技能
/hello "CCW"

# 预期输出
Hello, CCW!
```

---

## 8. 最佳实践

1. **清晰的 Phase 顺序**: 使用数字前缀
2. **明确的输入输出**: 每个 Phase 定义 Success Criteria
3. **错误处理**: 使用 fail/skip/retry 策略
4. **复用模板**: 使用 templates/ 存储可复用模板

---

## 相关资源

- [技能阶段系统](../implementation/skill-phases.md) - Phase 设计详解
- [心智模型](../architecture/mental-model.md) - 核心抽象
- [添加新命令](add-new-command.md) - 命令扩展

---

*添加新技能指南 - CCW Deep Dive*
