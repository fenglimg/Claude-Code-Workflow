# CCW 开发者指南

> 深入理解架构、调试技巧、最佳实践

---

## 架构深入

### 核心执行链

```
cli.ts (Commander.js)
    │
    ▼
commands/cli.ts
    │
    ▼
cli-executor-core.ts
    │
    ▼
child_process.spawn()
    │
    ▼
External CLI (gemini/codex/claude)
```

### 关键设计决策

| 决策 | 选择 | 原因 |
|------|------|------|
| 状态管理 | JSON 文件 | 人类可读、Git 友好 |
| 对话历史 | SQLite | 查询性能 |
| 技能结构 | Phase-based | 清晰执行顺序 |
| 语言 | TypeScript | 前后端统一 |

详见: [设计决策](../deep-dive/architecture/design-decisions.md)

---

## 调试技巧

### 1. 启用详细日志

```bash
DEBUG=ccw:* ccw cli -p "..." --tool gemini
```

### 2. 检查会话状态

```bash
ccw session list
ccw session read <session-id>
```

### 3. 查看 CLI 历史

```bash
ccw cli history --tool gemini
```

### 4. 手动恢复会话

```bash
ccw cli -p "继续" --resume <session-id>
```

---

## 性能优化

### CLI 执行优化

- 使用 `--cd` 限制扫描范围
- 使用 `--includeDirs` 精确包含目录
- 避免在 `CONTEXT` 中使用 `@**/*`

### Agent 执行优化

- 简单任务用 Agent 直接执行
- 复杂任务委托 CLI 工具
- 使用 `run_in_background: true` 并行执行

---

## 最佳实践

### 技能编写

1. **清晰的 Phase 顺序**: 使用数字前缀 (01-xxx, 02-xxx)
2. **明确的输入输出**: 每个 Phase 定义 expected output
3. **错误处理**: 使用 fail/skip/retry 策略

### 代理配置

1. **单一职责**: 每个代理专注一个领域
2. **工具白名单**: 使用 `allowed-tools` 限制权限
3. **继承复用**: 使用 `extends` 继承父代理

### CLI 使用

1. **明确 PURPOSE**: 说明目标、动机、成功标准
2. **具体 TASK**: 列出具体步骤
3. **约束 CONSTRAINTS**: 定义范围和限制

---

## 常见问题

### Q: CLI 执行超时怎么办？

A: 使用 `--resume` 恢复会话，或使用 `--id` 设置固定 ID 便于恢复。

### Q: 如何查看代理执行日志？

A: 查看 `.workflow/.execution/{session-id}/execution-events.md`。

### Q: 技能阶段执行顺序如何控制？

A: 使用数字前缀: `01-xxx.md`, `02-xxx.md`, `02.5-xxx.md`。

---

## 相关资源

- [CLI 执行深度文档](../deep-dive/implementation/cli-execution.md)
- [技能阶段系统](../deep-dive/implementation/skill-phases.md)
- [代理生命周期](../deep-dive/implementation/agent-lifecycle.md)

---

*开发者指南 - CCW Knowledge Base*
