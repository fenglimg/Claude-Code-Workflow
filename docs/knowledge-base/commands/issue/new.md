# /issue:new

---
id: CMD-issue-new
version: 1.0.0
status: active
---

> **Category**: Issue
> **Arguments**: `[--from <github-url|text>] [--type <bug|feature|refactor>]`

---

## 概述

从 GitHub URL 或文本描述创建结构化 Issue。自动提取关键信息，生成标准格式的 Issue 定义。

---

## 核心能力

### 输入来源

| 来源 | 格式 | 说明 |
|------|------|------|
| **GitHub URL** | `--from https://github.com/...` | 从 Issue 页面提取 |
| **文本描述** | `--from "description"` | 从自然语言创建 |
| **交互输入** | 无参数 | 通过问答创建 |

### Issue 类型

- `bug` - Bug 修复
- `feature` - 新功能
- `refactor` - 重构
- `test` - 测试相关
- `docs` - 文档

---

## 工作流程

```mermaid
graph LR
    A[解析输入] --> B[提取信息]
    B --> C[结构化]
    C --> D[生成 Issue]
```

---

## 使用场景

### 从 GitHub 创建

```bash
/issue:new --from https://github.com/owner/repo/issues/123
```

### 从文本创建

```bash
/issue:new --from "Fix memory leak in WebSocket handler" --type bug
```

### 交互式创建

```bash
/issue:new
```

---

## 最佳实践

1. **使用 GitHub 导入**: 保持 Issue 追溯性
2. **明确类型**: 帮助后续分类
3. **详细描述**: 包含复现步骤或预期行为

---

## 相关文档

- [Issue Discover](discover.md)
- [Issue Plan](plan.md)

---

*本文档由 CCW 知识系统维护*
