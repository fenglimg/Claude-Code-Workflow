# Learn Workflow Design Summary

> 基于 Workflow/Issue 工作流模式的学习工作流完整设计
> 版本: v2.1.0 | 状态: Design Complete

## 设计成果

### 1. 核心文档

| 文档 | 路径 | 说明 |
|------|------|------|
| **实现指南** | `.workflow/.develop/DEV-learn-workflow-design-2026-01-24/LEARN_WORKFLOW_IMPLEMENTATION.md` | 完整实现指南，包含所有工作流设计 |
| **进度文件** | `.workflow/.develop/DEV-learn-workflow-design-2026-01-24/progress.md` | 设计过程记录和探索结果 |
| **Agent 规格** | `.claude/agents/learn-planning-agent.md` | learn-planning-agent 完整规格 |

---

## 2. Learn-Profile 工作流

### 实现位置

```
.claude/commands/learn/profile.md
```

### 核心功能

| 命令 | 功能 | 实现参考 |
|------|------|----------|
| `/learn:profile create` | 创建新档案（交互式评估） | brainstorm artifacts AskUserQuestion 模式 |
| `/learn:profile update` | 更新当前档案 | state.json 读写模式 |
| `/learn:profile select` | 选择激活档案 | workflow session 选择模式 |
| `/learn:profile show` | 显示当前档案 | 简单 JSON 格式化输出 |

### 核心设计

```javascript
// Evidence-Based Assessment
1. Conceptual Checks - 多选题验证基础概念
2. Micro-Challenges - 代码片段任务验证
3. Proficiency Calculation - 基于 evidence 加权计算
4. Confidence Scoring - 避免单次失误误判

// State Management
state.json: { active_profile_id, active_session_id }
profiles/{id}.json: 用户档案数据
```

### Schema

```json
// .workflow/.scratchpad/learn-workflow-draft/schemas/learn-profile.schema.json
{
  "profile_id": "string",
  "experience_level": "beginner|intermediate|advanced|expert",
  "known_topics": [{
    "topic_id": "string",
    "proficiency": 0.0-1.0,
    "last_updated": "ISO8601",
    "evidence": ["string"]
  }],
  "learning_preferences": {
    "style": "practical|theoretical|visual",
    "preferred_sources": ["string"]
  }
}
```

---

## 3. Learn-Plan 工作流

### 实现位置

```
.claude/commands/learn/plan.md
.claude/agents/learn-planning-agent.md
```

### 核心功能

```bash
/learn:plan "Master React Server Components"
/learn:plan "Learn Rust" --profile profile-dev
/learn:plan "Advanced TypeScript" --no-agent
```

### 执行流程

```
Phase 1: Profile Discovery & Validation
   └─ 读取 state.json，验证 active_profile_id

Phase 2: Knowledge Gap Analysis
   └─ 分析 profile.known_topics vs 目标所需技能

Phase 3: Plan Generation (Agent or Template)
   ├─ --no-agent: 模板模式（快速生成）
   └─ 默认: learn-planning-agent（MCP 工具集成）

Phase 4: Validation Gate (4-Layer QA)
   ├─ Layer 0: Schema Validation (阻断型)
   ├─ Layer 1: Graph Validity (阻断型 - DAG 检测)
   ├─ Layer 2: Profile→Plan Matching (告警型 - 高熟练度标记为可选)
   └─ Layer 3: Resource Quality (告警型 - Gold 资源检查)

Phase 5: Session Creation & State Update
   └─ 创建 session 文件夹 + 更新 state.json
```

### Schema

```json
// .workflow/.scratchpad/learn-workflow-draft/schemas/learn-plan.schema.json
{
  "session_id": "string",
  "learning_goal": "string",
  "profile_id": "string",
  "knowledge_points": [{
    "id": "KP-\\d+",
    "title": "string",
    "prerequisites": ["KP-ID"],
    "resources": [{
      "type": "documentation|tutorial|video|book|blog",
      "url": "URI",
      "quality": "gold|silver|bronze"
    }],
    "assessment": {
      "type": "practical_task|code_challenge|multiple_choice",
      "acceptance_criteria": ["string"]
    },
    "status": "pending|in_progress|completed|skipped|optional"
  }],
  "dependency_graph": {
    "nodes": ["KP-ID"],
    "edges": [{"from": "KP-ID", "to": "KP-ID"}]
  }
}
```

---

## 4. MCP 工具集成

### 工具选择策略（参考 issue-plan-agent）

```javascript
// Step 1: ACE Semantic Search
mcp__ace-tool__search_context({
  project_root_path: "/path",
  query: `${goal} implementation patterns`
})

// Step 2: Exa Code Context
mcp__exa__get_code_context_exa({
  query: `official ${goal} documentation`,
  tokensNum: 5000
})

// Step 3: Smart Search (本地缓存)
mcp__ccw-tools__smart_search({
  action: "search",
  query: goal,
  path: ".workflow/learn/sessions/**/plan.json"
})

// Step 4: Normalize & Score
const resources = [...ace, ...exa, ...local]
  .filter(unique)
  .map(res => ({
    ...res,
    quality: scoreQuality(res),  // gold/silver/bronze
    quality_score: calculateScore(res),
    retrieved_at: new Date().toISOString()
  }));
```

### Fallback 链

```
Gemini → Qwen → Codex → degraded (template mode)
```

---

## 5. 关键实现模式（参考 Workflow/Issue）

### AskUserQuestion 规范化模式

```javascript
// ✅ 正确（key-based 访问）
const KEY = 'question_key';
const answer = AskUserQuestion({
  questions: [{
    key: KEY,
    question: "问题文本",
    header: "短标签",
    multiSelect: false,
    options: [
      { label: "选项1", description: "说明" }
    ]
  }]
});
const choice = answer[KEY];

// ❌ 错误（脆弱）
const answer = AskUserQuestion({ questions: [...] });
const choice = Object.values(answer)[0];
```

### Agent 执行模式

```javascript
// Agent 模式（同步等待）
Task({
  subagent_type: "learn-planning-agent",
  run_in_background: false,  // 同步等待结果
  description: "Generate learning plan",
  prompt: `...`
});

// CLI 模式（异步执行）
Bash({
  command: `ccw cli -p "..." --tool gemini --mode write`,
  run_in_background: true
});
```

### State 管理模式

```javascript
// 原子写入（temp → rename）
const tempPath = `${path}.tmp`;
Write(tempPath, content);
Bash(`mv "${tempPath}" "${path}"`);

// 读取状态
const state = JSON.parse(Read('.workflow/learn/state.json'));
state.active_profile_id = profileId;
Write('.workflow/learn/state.json', JSON.stringify(state, null, 2));
```

---

## 6. 实现优先级

### Phase 1 (P0) - 核心功能

- [x] Schema files (3 个 JSON schema)
- [x] Learn-profile: create/show 基本功能
- [x] Learn-plan: 模板模式（--no-agent）
- [x] Session creation & state management
- [x] Documentation complete

### Phase 2 (P1) - Agent 模式

- [x] learn-planning-agent 规格
- [ ] MCP 工具集成实现
- [ ] 4-Layer Validation Gate 实现
- [ ] /learn:plan agent 模式

### Phase 3 (P2) - 增强功能

- [ ] /learn:execute 执行模式
- [ ] /learn:ask 问答模式
- [ ] /learn:review 复习模式
- [ ] 跨会话知识图谱

---

## 7. 参考文档（实现位置）

| 参考文档 | 路径 | 关键模式 |
|----------|------|----------|
| Issue Plan | `.claude/commands/issue/plan.md` | Batch processing, agent delegation |
| Issue Plan Agent | `.claude/agents/issue-plan-agent.md` | Closed-loop explore + plan |
| Action Planning Agent | `.claude/agents/action-planning-agent.md` | Session-based context loading |
| Brainstorm Artifacts | `.claude/commands/workflow/brainstorm/artifacts.md` | AskUserQuestion multi-round pattern |
| Workflow Architecture | `.claude/workflows/workflow-architecture.md` | JSON-only data model |

---

## 8. 文件结构

```
.workflow/learn/
├── state.json                      # 全局状态
├── profiles/                       # 用户档案
│   ├── profile-{id}.json
│   └── index.json
└── sessions/                       # 学习会话
    ├── LS-20250124-001/
    │   ├── manifest.json
    │   ├── plan.json               # ← learn-planning-agent 生成
    │   ├── progress.json
    │   └── interactions/
    └── index.json

.claude/
├── commands/learn/
│   ├── profile.md                  # ← Learn-Profile 实现
│   └── plan.md                     # ← Learn-Plan 实现
└── agents/
    └── learn-planning-agent.md     # ← Agent 规格（已完成）

.workflow/.scratchpad/learn-workflow-draft/
└── schemas/
    ├── learn-profile.schema.json   # ← Profile Schema
    ├── learn-plan.schema.json      # ← Plan Schema
    └── learn-state.schema.json     # ← State Schema
```

---

## 9. 验证检查清单

### Learn-Profile

- [ ] `profile.json` 遵循 learn-profile.schema.json
- [ ] Evidence-based assessment（conceptual checks + micro-challenges）
- [ ] AskUserQuestion 使用 key-based 模式
- [ ] State.json 原子更新
- [ ] Proficiency 范围 0.0-1.0

### Learn-Plan

- [ ] `plan.json` 遵循 learn-plan.schema.json
- [ ] Max 15 knowledge points
- [ ] Each KP has ≥1 Gold-tier resource
- [ ] DAG 无循环依赖
- [ ] 4-Layer Validation Gate 执行
- [ ] MCP 工具正确集成

### Agent

- [ ] MCP 工具按优先级使用（ACE → Exa → Smart Search）
- [ ] 资源质量评分（gold/silver/bronze）
- [ ] Fallback 链正确实现
- [ ] Schema validation 执行
- [ ] DAG validation 执行

---

**设计完成日期**: 2026-01-24
**设计文档位置**: `.workflow/.develop/DEV-learn-workflow-design-2026-01-24/`
**下一步**: 开始实现 Phase 1 (P0) 核心功能
