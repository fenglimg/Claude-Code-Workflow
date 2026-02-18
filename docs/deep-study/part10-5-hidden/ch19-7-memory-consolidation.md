# Chapter 19.7: Memory Consolidation Pipeline

> **定位**: 全局记忆聚合的编排系统
> **核心文件**: `ccw/src/core/memory-consolidation-pipeline.ts`
> **设计目标**: 将 Phase 1 的 per-session 记忆提取聚合为全局 MEMORY.md

## 19.7.1 架构概述

Memory Consolidation Pipeline 是 CCW 记忆系统的 Phase 2 组件，负责：

1. **锁管理**: 通过租约锁确保全局唯一执行
2. **物化输出**: 将 DB 中的 Stage1 输出转换为磁盘文件
3. **Agent 编排**: 调用 CLI Agent 生成 MEMORY.md
4. **心跳续期**: 在 Agent 执行期间保持租约有效

```
┌───────────────────────────────────────────────────────────────┐
│                Memory Consolidation Pipeline                   │
│                                                                │
│  ┌──────────┐    ┌──────────────┐    ┌──────────────────┐    │
│  │   Lock   │───►│ Materialize  │───►│   CLI Agent      │    │
│  │ (Lease)  │    │   Outputs    │    │   (Gemini)       │    │
│  └──────────┘    └──────────────┘    └────────┬─────────┘    │
│       ▲                                        │               │
│       │            ┌──────────────┐            │               │
│       └────────────│   Heartbeat  │◄───────────┘               │
│                    │    Timer     │                            │
│                    └──────────────┘                            │
└───────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌───────────────────────────────────────────────────────────────┐
│  {project}/.ccw/memory/                                        │
│  ├── rollout_summaries/              # Phase 1 会话摘要        │
│  │   ├── thread-abc123.md                                       │
│  │   └── thread-def456.md                                       │
│  ├── raw_memories.md                 # 原始记忆汇总            │
│  └── MEMORY.md                       # 聚合后的全局记忆        │
└───────────────────────────────────────────────────────────────┘
```

## 19.7.2 Pipeline 流程

### 19.7.2.1 完整流程

```typescript
async runConsolidation(): Promise<ConsolidationStatus> {
  // Step 1: 检查输入数量
  const inputCount = this.store.countStage1Outputs();
  if (inputCount === 0) {
    return { status: 'idle', ... };
  }

  // Step 2: 获取全局锁
  const claim = this.claimGlobalLock();
  if (!claim.claimed) {
    return { status: 'running', ... };
  }

  try {
    // Step 3: 物化 Phase 1 输出到磁盘
    const matResult = this.materializeSummaries();
    const rawMemoriesSize = this.materializeRawMemories();

    // Step 4: 运行聚合 Agent (带心跳)
    const agentSuccess = await this.runConsolidationAgent(token);

    // Step 5: 验证 Phase 1 完整性
    if (!this.verifyPhase1Integrity(expectedSummaryCount)) {
      // 标记失败
    }

    // Step 6: 检查 MEMORY.md 是否生成
    const memoryMdExists = existsSync(join(this.memoryHome, 'MEMORY.md'));

    // Step 7: 标记成功
    this.scheduler.markSucceeded(JOB_KIND, JOB_KEY, token, watermark);
    return { status: 'completed', ... };
  } catch (err) {
    this.scheduler.markFailed(JOB_KIND, JOB_KEY, token, errorMessage);
    return { status: 'error', ... };
  }
}
```

### 19.7.2.2 流程图

```
         ┌─────────────────┐
         │   Check Inputs  │
         │  (Stage1 count) │
         └────────┬────────┘
                  │
                  ▼ count > 0
         ┌─────────────────┐
         │   Claim Lock    │
         │ (Job Scheduler) │
         └────────┬────────┘
                  │
                  ▼ claimed
         ┌─────────────────┐
         │   Materialize   │
         │    Summaries    │──────► rollout_summaries/*.md
         └────────┬────────┘
                  │
                  ▼
         ┌─────────────────┐
         │   Materialize   │
         │  Raw Memories   │──────► raw_memories.md
         └────────┬────────┘
                  │
                  ▼
         ┌─────────────────┐
         │    Run Agent    │◄──── Heartbeat Timer
         │   (with lease)  │      (renew every interval)
         └────────┬────────┘
                  │
                  ▼ success
         ┌─────────────────┐
         │    Verify       │
         │   Integrity     │
         └────────┬────────┘
                  │
                  ▼ valid
         ┌─────────────────┐
         │   Mark Done     │
         │ (MEMORY.md)     │
         └─────────────────┘
```

## 19.7.3 物化函数

### 19.7.3.1 syncRolloutSummaries

将 Stage1 输出中的 rollout_summary 写入独立 Markdown 文件：

```typescript
export function syncRolloutSummaries(
  memoryHome: string,
  outputs: Stage1Output[]
): MaterializationResult {
  const summariesDir = join(memoryHome, 'rollout_summaries');
  
  for (const output of outputs) {
    const filename = `${sanitizeFilename(output.thread_id)}.md`;
    const content = [
      `# Session: ${output.thread_id}`,
      `> Generated: ${new Date(output.generated_at * 1000).toISOString()}`,
      `> Source updated: ${new Date(output.source_updated_at * 1000).toISOString()}`,
      '',
      output.rollout_summary,
    ].join('\n');
    writeFileSync(filePath, content, 'utf-8');
  }

  // 清理孤立项文件 (DB 中不存在的)
  // ...
}
```

**输出格式**:
```markdown
# Session: thread-abc123
> Generated: 2026-02-18T08:45:00.000Z
> Source updated: 2026-02-18T08:30:00.000Z

[rollout_summary content...]
```

### 19.7.3.2 rebuildRawMemories

将最近的 raw_memory 条目合并为单个文件：

```typescript
export function rebuildRawMemories(
  memoryHome: string,
  outputs: Stage1Output[],
  maxCount: number  // MAX_RAW_MEMORIES_FOR_GLOBAL
): number {
  const sorted = [...outputs]
    .sort((a, b) => b.generated_at - a.generated_at)
    .slice(0, maxCount);

  const sections: string[] = [];
  for (const output of sorted) {
    sections.push(
      `## Thread: ${output.thread_id}`,
      `> Generated: ${new Date(output.generated_at * 1000).toISOString()}`,
      '',
      output.raw_memory,
      '',
      '---',
      '',
    );
  }

  writeFileSync(join(memoryHome, 'raw_memories.md'), sections.join('\n'), 'utf-8');
}
```

**输出格式**:
```markdown
## Thread: thread-abc123
> Generated: 2026-02-18T08:45:00.000Z

[raw_memory content...]

---

## Thread: thread-def456
> Generated: 2026-02-18T07:30:00.000Z

[raw_memory content...]

---
```

## 19.7.4 租约锁机制

### 19.7.4.1 锁获取

```typescript
claimGlobalLock(): ClaimResult {
  return this.scheduler.claimJob(
    JOB_KIND,      // 'memory_consolidate_global'
    JOB_KEY,       // 'global'
    MAX_CONCURRENT // 1
  );
}
```

**ClaimResult 定义**:
```typescript
interface ClaimResult {
  claimed: boolean;
  ownership_token?: string;
  reason?: 'already_running' | 'max_concurrent' | 'error';
}
```

### 19.7.4.2 心跳续期

在 Agent 执行期间，定时器自动续期租约：

```typescript
async runConsolidationAgent(token: string): Promise<boolean> {
  const heartbeatMs = HEARTBEAT_INTERVAL_SECONDS * 1000;
  
  const heartbeatTimer = setInterval(() => {
    const renewed = this.scheduler.heartbeat(JOB_KIND, JOB_KEY, token);
    if (!renewed) {
      // 租约丢失，停止心跳
      clearInterval(heartbeatTimer);
    }
  }, heartbeatMs);

  try {
    const result = await executeCliTool({
      tool: this.cliTool,
      prompt: fullPrompt,
      mode: 'write',
      cd: this.memoryHome,
      category: 'internal',
    });
    return result.success;
  } finally {
    clearInterval(heartbeatTimer);
  }
}
```

## 19.7.5 Phase 1 与 Phase 2 的协作

```
┌───────────────────────────────────────────────────────────────┐
│                        Phase 1                                 │
│  (Per-Session Extraction)                                      │
│                                                                │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐        │
│  │ Session A   │    │ Session B   │    │ Session C   │        │
│  │ Extraction  │    │ Extraction  │    │ Extraction  │        │
│  └──────┬──────┘    └──────┬──────┘    └──────┬──────┘        │
│         │                  │                  │                │
│         ▼                  ▼                  ▼                │
│  ┌─────────────────────────────────────────────────────┐      │
│  │              stage1_outputs DB Table                 │      │
│  │  - thread_id                                         │      │
│  │  - rollout_summary                                   │      │
│  │  - raw_memory                                        │      │
│  │  - generated_at                                      │      │
│  └──────────────────────────┬──────────────────────────┘      │
└─────────────────────────────┼─────────────────────────────────┘
                              │
                              ▼
┌───────────────────────────────────────────────────────────────┐
│                        Phase 2                                 │
│  (Global Consolidation)                                        │
│                                                                │
│  ┌─────────────────────────────────────────────────────┐      │
│  │          MemoryConsolidationPipeline                 │      │
│  │                                                      │      │
│  │  1. Read from stage1_outputs                         │      │
│  │  2. Materialize to disk                              │      │
│  │  3. Run CLI Agent                                    │      │
│  │  4. Generate MEMORY.md                               │      │
│  └──────────────────────────┬──────────────────────────┘      │
│                              │                                 │
│                              ▼                                 │
│  ┌─────────────────────────────────────────────────────┐      │
│  │                    MEMORY.md                         │      │
│  │  - Project overview                                  │      │
│  │  - Key decisions                                     │      │
│  │  - Active patterns                                   │      │
│  │  - Technical context                                 │      │
│  └─────────────────────────────────────────────────────┘      │
└───────────────────────────────────────────────────────────────┘
```

## 19.7.6 配置常量

```typescript
// memory-v2-config.ts
export const HEARTBEAT_INTERVAL_SECONDS = 30;  // 心跳间隔
export const MAX_RAW_MEMORIES_FOR_GLOBAL = 50; // 最大原始记忆条数

// memory-consolidation-pipeline.ts
const JOB_KIND = 'memory_consolidate_global';
const JOB_KEY = 'global';
const MAX_CONCURRENT = 1;
const AGENT_TIMEOUT_MS = 300_000;  // 5 分钟超时
const DEFAULT_CLI_TOOL = 'gemini';
```

## 19.7.7 状态接口

```typescript
interface ConsolidationStatus {
  status: 'idle' | 'running' | 'completed' | 'error';
  lastRun?: number;
  memoryMdExists: boolean;
  inputCount: number;
  lastError?: string;
}

interface MaterializationResult {
  summariesWritten: number;
  summariesPruned: number;
  rawMemoriesSize: number;
}
```

## 19.7.8 Agent Prompt 构建

Consolidation Agent 使用专用 Prompt 模板：

```typescript
// memory-consolidation-prompts.ts
export const CONSOLIDATION_SYSTEM_PROMPT = `...`;

export function buildConsolidationPrompt(
  summaryCount: number,
  hasExistingMemoryMd: boolean
): string {
  // 构建用户 Prompt
}
```

Prompt 核心要求:
1. 阅读 `rollout_summaries/` 目录中的所有会话摘要
2. 阅读 `raw_memories.md` 中的原始记忆
3. 如果存在 `MEMORY.md`，基于其内容更新
4. 输出新的 `MEMORY.md`，包含项目概览、关键决策、活跃模式等

## 19.7.9 完整性验证

Pipeline 在 Agent 完成后验证 Phase 1 文件完整性：

```typescript
verifyPhase1Integrity(expectedSummaryCount: number): boolean {
  const summariesDir = join(this.memoryHome, 'rollout_summaries');
  const currentCount = readdirSync(summariesDir)
    .filter(f => f.endsWith('.md'))
    .length;
  return currentCount === expectedSummaryCount;
}
```

如果 Agent 意外修改了 Phase 1 文件，Pipeline 会标记失败。

## 19.7.10 设计决策

1. **全局锁**: 确保同一时间只有一个全局聚合运行
2. **心跳续期**: 防止长时间 Agent 执行导致租约过期
3. **物化优先**: 先将 DB 数据写入磁盘，便于 Agent 读取
4. **完整性验证**: 防止 Agent 意外修改 Phase 1 输出
5. **超时保护**: 5 分钟超时防止无限等待

---

*下一章: [Chapter 19.8: Session Clustering Service](./ch19-8-session-clustering.md)*
