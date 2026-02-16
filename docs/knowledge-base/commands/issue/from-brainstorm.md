# /issue:from-brainstorm

---
id: CMD-issue-from-brainstorm
version: 1.0.0
status: active
---

> **Category**: Issue
> **Arguments**: `SESSION=<session-id> [--auto]`

---

## 概述

将头脑风暴会话的想法转换为带可执行解决方案的 Issue。从 brainstorm 产物中提取关键想法，生成结构化的 Issue 定义和任务分解。

---

## 核心能力

### 转换流程

1. 加载 brainstorm 会话产物
2. 提取关键想法和方案
3. 生成 Issue 定义
4. 创建可执行解决方案

### 产物来源

- `.workflow/.brainstorm/{session-id}/brainstorm.md`
- `.workflow/.brainstorm/{session-id}/analysis/`

---

## 工作流程

```mermaid
graph LR
    A[加载会话] --> B[提取想法]
    B --> C[生成 Issue]
    C --> D[创建方案]
```

---

## 使用场景

### 从最新头脑风暴创建

```bash
/issue:from-brainstorm SESSION=BS-20260216-001
```

### 自动模式

```bash
/issue:from-brainstorm SESSION=BS-xxx --auto
```

---

## 最佳实践

1. **头脑风暴后立即转换**: 保持上下文新鲜
2. **选择最佳想法**: 不是所有想法都需要转为 Issue
3. **细化方案**: 转换后检查方案质量

---

## 相关文档

- [Brainstorm](../workflow/brainstorm-with-file.md)
- [Issue New](new.md)
- [Issue Plan](plan.md)

---

*本文档由 CCW 知识系统维护*
