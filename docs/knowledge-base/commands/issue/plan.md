# /issue:plan

---
id: CMD-issue-plan
version: 1.0.0
status: active
---

> **Category**: Issue
> **Arguments**: `[--all-pending] [--issue <id>] [--force]`

---

## 概述

为 Issue 生成可执行的解决方案计划。使用 issue-plan-agent 进行代码库探索和方案生成，产出结构化的任务分解。

---

## 核心能力

### 规划模式

| 模式 | 参数 | 说明 |
|------|------|------|
| **全部待处理** | `--all-pending` | 规划所有待处理 Issue |
| **单个规划** | `--issue <id>` | 规划指定 Issue |
| **强制重新规划** | `--force` | 覆盖现有方案 |

### 产出物

- `solution.json` - 解决方案定义
- `tasks/*.json` - 任务分解文件
- `exploration-context.json` - 探索上下文

---

## 工作流程

```mermaid
graph LR
    A[加载 Issue] --> B[代码探索]
    B --> C[方案生成]
    C --> D[任务分解]
    D --> E[验证方案]
```

---

## 使用场景

### 规划所有待处理 Issue

```bash
/issue:plan --all-pending
```

### 规划单个 Issue

```bash
/issue:plan --issue ISS-20260216-001
```

### 强制重新规划

```bash
/issue:plan --issue ISS-xxx --force
```

---

## 最佳实践

1. **批量规划**: 使用 `--all-pending` 提高效率
2. **验证后执行**: 规划后检查方案质量
3. **避免过度规划**: 只规划即将执行的 Issue

---

## 相关文档

- [Issue Discover](discover.md)
- [Issue Queue](queue.md)
- [Issue Execute](execute.md)

---

*本文档由 CCW 知识系统维护*
