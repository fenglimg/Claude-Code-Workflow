# 设计决策与架构约束

> **层级**: L1 — 全局决策 | **更新**: 2026-05-03

## 关键设计决策

### 决策 1: 配置驱动的三路路由

> **选择**: 工具类型由 `cli-tools.json` 的 `type` 字段决定（builtin / cli-wrapper / api-endpoint），运行时根据配置分发
> **替代方案**: 硬编码每种工具的调用方式
> **理由**: 新增后端只需配置，无需修改执行核心代码
> **代价**: 三路分发逻辑增加了 executor-core 复杂度；运行时字符串查找引入了隐式依赖

### 决策 2: Adapter 模式保持向后兼容

> **选择**: `toLegacyTool()` 将新的 `{ schema, handler }` 格式包装为旧的 `LegacyTool` 格式
> **替代方案**: 一次性全部迁移
> **理由**: 4 个遗留 JS 工具仍在使用，逐步迁移不阻塞功能
> **代价**: 两套格式共存增加了理解成本；4 个遗留工具迁移无明确时间线

### 决策 3: Lazy Import 命令加载

> **选择**: `invokeNamedExport()` 在命令调用时才 `import()`
> **替代方案**: 启动时全量加载
> **理由**: 保持 CLI 启动速度，18+ 命令只加载被调用的那一个
> **代价**: 首次调用有冷启动延迟；类型安全依赖约定（export 名必须匹配）

### 决策 4: GLOBAL ONLY 配置策略

> **选择**: 所有配置在 `~/.claude/`，不支持项目级 `.ccw/` 覆盖
> **替代方案**: 全局 + 项目级双层配置
> **理由**: 简化配置管理，避免优先级歧义
> **代价**: 无法为不同项目定制不同行为；多项目共享同一配置

### 决策 5: 三种编排引擎并存

> **选择**: Chain (状态机)、Flow (DAG)、Loop (迭代) 三种引擎独立维护
> **替代方案**: 统一为单一编排引擎
> **理由**: 三种引擎解决不同场景 — Chain 为渐进式内容交付优化，Flow 为复杂 DAG 优化，Loop 为重复执行优化
> **代价**: 能力重叠，维护负担 ×3；新用户需要理解三种引擎的区别

### 决策 6: Fire-and-Forget Dashboard 通知

> **选择**: `notifyDashboard()` 使用 `socket.unref()` 非阻塞发送，错误静默忽略
> **替代方案**: 可靠消息队列 + 重试
> **理由**: Dashboard 是可选组件，不应阻塞核心流程
> **代价**: Dashboard 不可用时通知静默丢失；无法追溯历史通知

### 决策 7: 双会话系统共存

> **选择**: `ccw session` 管理 .workflow/ 文件系统会话 + Native session 追踪 SQLite CLI 会话
> **替代方案**: 统一会话模型
> **理由**: 两种会话服务于不同目的（工作流编排 vs. CLI 执行历史）
> **代价**: 概念重叠，状态可能不一致；用户需要理解两套系统

### 决策 8: Sandbox 表达式评估

> **选择**: Loop 成功条件使用受限 Proxy + 白名单正则，而非 vm2/isolated-vm
> **替代方案**: 专用沙箱库
> **理由**: 轻量级需求，避免额外依赖
> **代价**: 安全边界不够硬；需要定期审查 bypass 可能性

### 决策 9: SQLite 多实例（非 WAL）

> **选择**: 各服务模块独立创建 better-sqlite3 实例
> **替代方案**: 单例 + WAL 模式
> **理由**: 模块独立性优先
> **代价**: 并发写入时可能出现锁竞争；WAL 模式未被评估

### 决策 10: Skills/Agents 双生态

> **选择**: Claude (.md) 和 Codex (.toml) 各维护独立的 Skills/Agents 定义
> **替代方案**: 统一格式
> **理由**: 两个 CLI 工具的格式约定不同，强行统一会增加适配层
> **代价**: 105 skills (54+51) + 50 agents (24+26) 需要双份维护

---

## 9 条架构约束

| # | 约束 | 来源 |
|---|------|------|
| 1 | native addon 需要 rebuild (better-sqlite3, node-pty)，`postinstall` 脚本处理失败不阻塞 | package.json |
| 2 | ToolSchema 字段 optional 优先，新增字段不能破坏已有消费者 | `types/tool.ts` |
| 3 | Skill 必须遵循 Completion Status Protocol（明确的完成/失败状态） | .claude/commands/ccw.md |
| 4 | HookTemplate 类型安全，TypeScript 编译时检查 | `core/hooks/hook-templates.ts` |
| 5 | CCW_ENABLE_SANDBOX 路径遍历防护，禁止访问项目目录外的文件 | `utils/path-validator.ts` |
| 6 | Queue 并发限制 maxConcurrent=2 | `queue-scheduler-service.ts` |
| 7 | Queue 状态机严格转换 (VALID_TRANSITIONS)，不允许跳过中间状态 | `queue-scheduler-service.ts` |
| 8 | 跨平台 agent 同步必须一致（Windows PTY vs Unix PTY） | `cli-executor-core.ts` |
| 9 | 产物位置必须遵循 `.workflow/` 约定（见 workflow session awareness） | CLAUDE.md |

---

## 已知架构风险

| 风险 | 严重度 | 描述 |
|------|--------|------|
| 隐式依赖断裂 | High | Skill/Chain/Agent 通过字符串名引用，改名运行时断裂，无编译时检查 |
| SQLite 锁竞争 | Medium | 多实例并发写入可能失败，WAL 模式未评估 |
| Silent failure | Medium | 多处捕获错误仅 console.error，调用方无感知 |
| 双会话冲突 | Medium | 两套会话系统状态可能不一致 |
| Windows spawn | Medium | shell:true + escapeWindowsArg() 增加复杂度 |
| Chain @ref 缺失 | Low | 链内 @path 引用缺失不报错，内容静默不完整 |
| 变量静默失败 | Low | {{variable}} 未解析保留原样，无错误提示 |
| 4 legacy JS 工具 | Low | 未迁移的遗留代码，TypeScript 类型覆盖不完整 |

---

## 未解决的架构问题

1. **三种编排引擎是否合并？** — Chains/Flows/Loops 能力重叠，是否统一为单一 DAG + 策略模式？
2. **是否引入项目级配置？** — GLOBAL ONLY 策略限制了多项目场景
3. **Dashboard 通知是否需要可靠队列？** — 当前 fire-and-forget 不可追溯
4. **双会话系统是否统一？** — 概念重叠导致用户困惑
5. **是否迁移到 WAL 模式？** — 解决 SQLite 并发写入竞争
6. **Sandbox 是否升级？** — Proxy 方案 vs vm2/isolated-vm 的安全边界
7. **是否统一 Skills/Agents 格式？** — 双生态维护成本高
