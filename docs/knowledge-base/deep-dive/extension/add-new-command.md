# 添加新命令指南

> 创建自定义 CCW 命令的完整指南

---

## 概述

CCW 命令是用户与系统交互的入口点。本指南将带你创建第一个自定义命令。

---

## 1. 命令文件位置

```
.claude/commands/
├── ccw.md              # 主编排命令
├── workflow/           # 工作流命令目录
│   ├── plan.md
│   └── execute.md
└── my-command.md       # 自定义命令
```

---

## 2. 命令文件结构

### 基本模板

```markdown
---
name: my-command
description: |
  命令描述。
  Examples:
  - Context: 使用场景
    Usage: /my-command "参数"
invoker: user
---

# My Command

## Overview
命令功能描述。

## Usage
```bash
/my-command [options] <argument>
```

## Options
| 选项 | 说明 |
|------|------|
| `--option1` | 选项 1 说明 |
| `--option2` | 选项 2 说明 |

## Implementation
1. 步骤 1
2. 步骤 2
3. 步骤 3
```

---

## 3. 参数解析模式

### 位置参数
```markdown
## Usage
/my-command <arg1> <arg2>

## Arguments
| 参数 | 说明 |
|------|------|
| `arg1` | 第一个参数 |
| `arg2` | 第二个参数 |
```

### 选项参数
```markdown
## Options
| 选项 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `--mode` | string | default | 执行模式 |
| `--yes` | boolean | false | 自动确认 |
| `--count` | number | 1 | 重复次数 |
```

### 解析示例
```markdown
## Implementation

### Parse Arguments
```javascript
const args = parseArgs(userInput);
const mode = args['--mode'] || 'default';
const autoConfirm = args['--yes'] || false;
const count = parseInt(args['--count']) || 1;
```
```

---

## 4. 与 Skill 的集成

### 调用技能
```markdown
## Implementation

1. 解析参数
2. 调用技能:
   ```bash
   /workflow:plan "${task_description}"
   ```
3. 返回结果
```

### 委托给代理
```markdown
## Implementation

1. 解析参数
2. 启动代理:
   ```javascript
   Task({
     subagent_type: "code-developer",
     prompt: buildPrompt(args),
     run_in_background: false
   })
   ```
```

---

## 5. 完整示例: 翻译命令

### 命令文件
```markdown
---
name: translate
description: |
  翻译文本到目标语言。
  Examples:
  - Context: 需要翻译文本
    Usage: /translate "Hello" --to zh
invoker: user
---

# Translate Command

## Overview
将文本翻译到指定语言。

## Usage
```bash
/translate <text> --to <language>
```

## Options
| 选项 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `--to` | string | 是 | 目标语言 (zh/en/ja) |
| `--from` | string | 否 | 源语言 (自动检测) |

## Implementation

### 1. Parse Arguments
- 提取文本内容
- 解析 `--to` 目标语言
- 可选: 解析 `--from` 源语言

### 2. Validate
- 确认文本非空
- 确认目标语言有效

### 3. Execute Translation
- 调用翻译代理或 CLI:
  ```bash
  ccw cli -p "Translate '${text}' to ${language}" --tool gemini --mode analysis
  ```

### 4. Output Result
- 显示翻译结果
```

---

## 6. 命令注册

### 自动发现
命令文件放入 `.claude/commands/` 目录后自动注册，无需手动配置。

### 命名规范
- **文件名**: `my-command.md` → 调用: `/my-command`
- **目录结构**: `workflow/plan.md` → 调用: `/workflow:plan`
- **分隔符**: 目录层级用 `:` 分隔

---

## 7. 测试命令

```bash
# 测试基本调用
/my-command "test"

# 测试选项
/my-command "test" --option value

# 测试错误处理
/my-command ""  # 应返回错误
```

---

## 8. 最佳实践

1. **清晰的描述**: description 包含触发示例
2. **参数验证**: 验证必填参数
3. **错误处理**: 提供有意义的错误信息
4. **复用技能**: 复杂逻辑委托给技能

---

## 相关资源

- [技能阶段系统](../implementation/skill-phases.md) - 技能详解
- [添加新技能](add-new-skill.md) - 技能扩展
- [添加新代理](add-new-agent.md) - 代理扩展

---

*添加新命令指南 - CCW Deep Dive*
