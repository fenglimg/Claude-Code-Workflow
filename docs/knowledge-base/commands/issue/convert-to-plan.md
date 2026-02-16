# /issue:convert-to-plan

---
id: CMD-issue-convert-to-plan
version: 1.0.0
status: active
---

> **Category**: Issue
> **Arguments**: `[--latest-lite-plan|--session <id>] [-y]`

---

## 概述

将规划产物（lite-plan、workflow session、markdown）转换为 Issue 格式。桥接轻量级规划和 Issue 工作流。

---

## 核心能力

### 输入来源

| 来源 | 参数 | 说明 |
|------|------|------|
| **Lite Plan** | `--latest-lite-plan` | 最新 lite-plan 产物 |
| **Session** | `--session <id>` | 指定会话 |
| **Markdown** | 文件路径 | markdown 规划文档 |

### 转换内容

- 任务分解 → Issue 任务
- 约束条件 → Issue 约束
- 验收标准 → Issue 验收

---

## 工作流程

```mermaid
graph LR
    A[加载源] --> B[解析结构]
    B --> C[转换格式]
    C --> D[生成 Issue]
```

---

## 使用场景

### 从 Lite Plan 转换

```bash
/issue:convert-to-plan --latest-lite-plan -y
```

### 从会话转换

```bash
/issue:convert-to-plan --session WFS-20260216-001
```

---

## 最佳实践

1. **轻量到 Issue**: 用 lite-plan 快速规划后转 Issue
2. **自动模式**: 使用 -y 跳过确认
3. **检查转换**: 验证任务完整性

---

## 相关文档

- [Issue Plan](plan.md)
- [Lite Plan](../workflow/lite-plan.md)

---

*本文档由 CCW 知识系统维护*
