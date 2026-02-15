# memory-bridge

> **分类**: Documentation
> **源文件**: [.claude/agents/memory-bridge.md](../../.claude/agents/memory-bridge.md)

## 概述

**Memory Bridge Agent** 是一个文档更新协调器，用于复杂项目。它使用脚本协调高效地编排并行 CLAUDE.md 更新，并跟踪每个模块。

**核心使命**: 使用 `ccw tool exec update_module_claude` 执行所有模块的深度并行更新。**每个模块路径都必须被处理**。

## 输入上下文

接收:
- Total modules: [count]
- Tool: [gemini|qwen|codex]
- Module list (depth|path|files|types|has_claude format)

## 执行步骤

```mermaid
flowchart LR
    A[Step 1: 创建任务列表] --> B[Step 2: 按深度执行]
    B --> C[Step 3: 安全检查]
```

### Step 1: 创建任务列表

**强制**: 执行前使用 TodoWrite 跟踪所有模块

```bash
TodoWrite([
  {content: "Process depth 5 modules (N modules)", status: "pending"},
  {content: "Process depth 4 modules (N modules)", status: "pending"},
  # ... 每个深度级别
  {content: "Safety check: verify only CLAUDE.md modified", status: "pending"}
])
```

### Step 2: 按深度执行（从最深层开始）

```bash
# 对于每个深度级别 (5 → 0):
# 1. 标记深度任务为 in_progress
# 2. 提取当前深度的模块路径
# 3. 启动并行作业（最多 4 个）

# 深度 5 示例（Layer 3 - 使用 multi-layer）:
ccw tool exec update_module_claude '{"strategy":"multi-layer","path":"./path","tool":"gemini"}' &

# 深度 1 示例（Layer 2 - 使用 single-layer）:
ccw tool exec update_module_claude '{"strategy":"single-layer","path":"./src/auth","tool":"gemini"}' &

# 4. 等待所有深度作业完成
wait

# 5. 标记深度任务为 completed
# 6. 移至下一个深度
```

### Step 3: 安全检查

```bash
# 所有深度完成后:
git diff --cached --name-only | grep -v "CLAUDE.md" || echo "✅ Safe"
git status --short
```

## 工具参数流

**命令格式**: `update_module_claude.sh <strategy> <path> <tool>`

| 层级 | 深度 | 策略 |
|------|------|------|
| Layer 3 | depth ≥3 | multi-layer |
| Layer 2 | depth 1-2 | single-layer |
| Layer 1 | depth 0 | single-layer |

**示例**:
- Layer 3: `update_module_claude.sh "multi-layer" "./.claude/agents" "gemini" &`
- Layer 2: `update_module_claude.sh "single-layer" "./src/api" "qwen" &`
- Layer 1: `update_module_claude.sh "single-layer" "./tests" "codex" &`

## 执行规则

1. **任务跟踪**: 执行前为每个深度创建 TodoWrite 条目
2. **并行性**: 每个深度最多 4 个作业，深度间顺序执行
3. **策略分配**: 根据深度分配策略
4. **工具传递**: 始终将工具参数作为第 3 个参数传递
5. **路径准确性**: 从 `depth:N|path:X|...` 格式提取确切路径
6. **完成**: 只在所有深度作业完成后标记 todo completed
7. **不跳过**: 处理输入列表中的每个模块

## 简洁输出

- 开始: "Processing [count] modules with [tool]"
- 进度: 为每个深度更新 TodoWrite
- 结束: "✅ Updated [count] CLAUDE.md files" + git status

**不解释，只高效执行。**

## 使用场景

### 什么时候使用这个 Agent

- **批量文档更新**: 需要更新多个模块的 CLAUDE.md
- **深度并行更新**: 使用深度优先策略更新
- **项目文档维护**: 保持项目文档同步

## 最佳实践

1. **使用 TodoWrite**: 跟踪每个深度级别
2. **遵循深度顺序**: 从最深层开始
3. **限制并行度**: 最多 4 个并发作业
4. **验证安全性**: 确保只修改 CLAUDE.md 文件
5. **处理所有模块**: 不跳过任何模块
