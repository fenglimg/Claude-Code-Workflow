# Learn Workflow Implementation Guide

> 基于 Workflow/Issue 工作流实现模式的学习工作流设计
> 版本: v2.1.0
> 状态: Implementation Ready

## 架构概览

### 核心设计原则

1. **Schema-First** - 所有数据结构严格遵循 JSON Schema
2. **Agent 模式** - 学习计划生成使用专用 agent（参考 issue-plan-agent）
3. **Closed-Loop** - learn-profile 和 learn-plan 形成闭环
4. **MCP 集成** - 使用 ACE/Exa 进行资源发现和验证

### 工作流关系图

```
┌─────────────────┐
│  /learn:profile │  ← 用户画像管理
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   /learn:plan   │  ← 学习计划生成（learn-planning-agent）
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ /learn:execute  │  ← 计划执行
└─────────────────┘
```

---

## 1. Learn-Profile 工作流

### 1.1 命令规范

```bash
/learn:profile create                    # 创建新档案（交互式评估）
/learn:profile update                    # 更新当前档案
/learn:profile select profile-advanced   # 选择激活档案
/learn:profile show                      # 显示当前档案
/learn:profile create --no-assessment    # 跳过评估
```

### 1.2 执行流程（参考 brainstorm artifacts 模式）

```javascript
// 实现位置: .claude/commands/learn/profile.md

// Phase 1: Basic Information Collection
const basicInfo = AskUserQuestion({
  questions: [
    {
      key: 'goal_type',
      question: "What is your primary learning goal?",
      header: "Goal Type",
      multiSelect: false,
      options: [
        { value: "project", label: "Build Projects" },
        { value: "skill", label: "Master Skills" },
        { value: "role", label: "Career Role" },
        { value: "exploration", label: "Explore & Discover" }
      ]
    },
    {
      key: 'experience_level',
      question: "What is your overall programming experience?",
      header: "Experience",
      multiSelect: false,
      options: [
        { value: "beginner", label: "Beginner (< 1 year)" },
        { value: "intermediate", label: "Intermediate (1-3 years)" },
        { value: "advanced", label: "Advanced (3-5 years)" },
        { value: "expert", label: "Expert (5+ years)" }
      ]
    }
  ]
});

// Phase 2: Evidence-Based Assessment (unless --no-assessment)
// 使用 multi-round AskUserQuestion 进行技能评估

// Phase 3: Profile Creation & State Update
const profile = {
  profile_id: `profile-${Date.now()}`,
  experience_level: basicInfo.experience_level,
  known_topics: assessedTopics,
  learning_preferences: {
    style: basicInfo.learning_style,
    preferred_sources: basicInfo.preferred_sources
  },
  feedback_journal: [],
  _metadata: {
    created_at: new Date().toISOString(),
    version: "1.0.0"
  }
};

// 写入文件（参考 workflow session 管理）
Write(`.workflow/learn/profiles/${profile.profile_id}.json`, JSON.stringify(profile, null, 2));

// 更新全局状态
const state = JSON.parse(Read('.workflow/learn/state.json') || '{}');
state.active_profile_id = profile.profile_id;
Write('.workflow/learn/state.json', JSON.stringify(state, null, 2));
```

### 1.3 Schema 遵循

```json
// Schema: .workflow/.scratchpad/learn-workflow-draft/schemas/learn-profile.schema.json
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
  },
  "feedback_journal": [{
    "date": "ISO8601",
    "session_id": "string",
    "rating": 1-5
  }]
}
```

---

## 2. Learn-Plan 工作流

### 2.1 命令规范

```bash
/learn:plan "Master React Server Components"
/learn:plan "Learn Rust" --profile profile-dev
/learn:plan "Advanced TypeScript" --no-agent
```

### 2.2 执行流程（参考 issue:plan 模式）

```javascript
// 实现位置: .claude/commands/learn/plan.md

// Phase 1: Profile Discovery & Validation
const state = JSON.parse(Read('.workflow/learn/state.json'));
const profileId = flags.profile || state.active_profile_id;

if (!profileId) {
  console.log('No profile found. Creating default profile...');
  SlashCommand('/learn:profile create');
  // Reload state
}

// Phase 2: Knowledge Gap Analysis
const profile = JSON.parse(Read(`.workflow/learn/profiles/${state.active_profile_id}.json`));
const gapAnalysis = analyzeGaps(profile, goal);

// Phase 3: Plan Generation (Agent or Template)
if (flags.noAgent) {
  // Template mode
  const plan = generateTemplatePlan(goal, profile);
} else {
  // Agent mode - 参考 issue-plan-agent
  Task({
    subagent_type: "learn-planning-agent",
    run_in_background: false,
    description: "Generate learning plan with knowledge points",
    prompt: `
## Task: Generate Learning Plan

**Learning Goal**: ${goal}
**User Profile**: ${JSON.stringify(profile)}
**Gap Analysis**: ${JSON.stringify(gapAnalysis)}

## MCP Tools to Use
1. mcp__ace-tool__search_context - Search codebase for patterns
2. mcp__exa__get_code_context_exa - Get external resources
3. mcp__ccw-tools__smart_search - Local cache search

## Output Schema
Execute: cat .workflow/.scratchpad/learn-workflow-draft/schemas/learn-plan.schema.json

## Constraints
- Max 15 knowledge points
- Each KP must have ≥1 Gold-tier resource
- No circular dependencies in DAG
- NO time estimates

## Execution
1. Use MCP tools to discover resources
2. Generate knowledge points DAG
3. Score resources (gold/silver/bronze)
4. Write: ${sessionFolder}/plan.json
`
  });
}

// Phase 4: Validation Gate (4-Layer QA)
// 参考 learn-plan.md 的 Validation Gate 部分

// Phase 5: Session Creation & State Update
const sessionId = `LS-${new Date().toISOString().split('T')[0].replace(/-/g, '')}-${counter}`;
const sessionFolder = `.workflow/learn/sessions/${sessionId}`;

Bash(`mkdir -p ${sessionFolder}/interactions/notes`);

Write(`${sessionFolder}/plan.json`, JSON.stringify(plan, null, 2));
Write(`${sessionFolder}/manifest.json`, JSON.stringify({
  session_id: sessionId,
  learning_goal: goal,
  profile_id: profile.profile_id,
  status: "planned",
  created_at: new Date().toISOString()
}, null, 2));

Write(`${sessionFolder}/progress.json`, JSON.stringify({
  session_id: sessionId,
  current_knowledge_point_id: null,
  completed_knowledge_points: [],
  in_progress_knowledge_points: [],
  knowledge_point_progress: {},
  overall_metrics: {
    total_time_spent_minutes: 0,
    resources_consumed: 0,
    questions_asked: 0
  },
  _metadata: {
    last_updated: new Date().toISOString()
  }
}, null, 2));

// Update global state
state.active_session_id = sessionId;
Write('.workflow/learn/state.json', JSON.stringify(state, null, 2));
```

### 2.3 Schema 遵循

```json
// Schema: .workflow/.scratchpad/learn-workflow-draft/schemas/learn-plan.schema.json
{
  "session_id": "string",
  "learning_goal": "string",
  "profile_id": "string",
  "knowledge_points": [{
    "id": "KP-\\d+",
    "title": "string",
    "description": "string",
    "prerequisites": ["KP-ID"],
    "topic_refs": ["topic-id"],
    "resources": [{
      "type": "documentation|tutorial|video|book|blog",
      "url": "URI",
      "summary": "string",
      "quality": "gold|silver|bronze"
    }],
    "assessment": {
      "type": "practical_task|code_challenge|multiple_choice",
      "description": "string",
      "acceptance_criteria": ["string"]
    },
    "status": "pending|in_progress|completed|skipped|optional"
  }],
  "dependency_graph": {
    "nodes": ["KP-ID"],
    "edges": [{"from": "KP-ID", "to": "KP-ID"}]
  },
  "_metadata": {}
}
```

---

## 3. Learn-Planning-Agent 规格

### 3.1 Agent 定义

```markdown
---
name: learn-planning-agent
description: |
  Learning plan generation agent combining MCP tool discovery and knowledge graph construction.
  Generates personalized learning plans with DAG-structured knowledge points.
color: blue
---

## Overview

**Agent Role**: Transform learning goals + user profiles into executable learning plans with knowledge point DAGs.

**Core Capabilities**:
- MCP tool integration (ACE, Exa, smart_search)
- Knowledge point decomposition with dependencies
- Resource quality scoring (gold/silver/bronze)
- DAG construction and validation
- Profile→Plan matching analysis

## Execution Flow

### Phase 1: Context Loading
1. Read user profile
2. Analyze gap analysis
3. Load learning preferences

### Phase 2: Resource Discovery (MCP Tools)
```javascript
// A) Code-related learning goals
mcp__ace-tool__search_context(
  project_root_path="/path",
  query="${goal} implementation patterns"
)

mcp__exa__get_code_context_exa(
  query="official ${goal} documentation 2025",
  tokensNum=5000
)

// B) General knowledge learning
mcp__exa__get_code_context_exa(
  query="${goal} best practices tutorial",
  tokensNum=5000
)

mcp__ccw-tools__smart_search(
  action="search",
  path=".workflow/learn/sessions/**/plan.json",
  query="${goal}"
)
```

### Phase 3: Knowledge Point Generation
1. Decompose goal into 5-15 knowledge points
2. Build prerequisite relationships (DAG)
3. Assign difficulty levels (easy/medium/hard)

### Phase 4: Resource Scoring
- Gold: Official docs, standards, authoritative sources
- Silver: Quality blogs, tutorials
- Bronze: Community resources, forums
- **Constraint**: Each KP must have ≥1 Gold resource

### Phase 5: Validation & Output
1. Schema validation
2. DAG cycle detection
3. Profile→Plan matching
4. Write plan.json

## Input/Output

**Input**:
```javascript
{
  learning_goal: string,
  profile: Profile,
  gap_analysis: GapAnalysis,
  session_folder: string
}
```

**Output**:
- `plan.json` following learn-plan.schema.json
- Validation report
```

### 3.2 实现位置

```
.claude/agents/learn-planning-agent.md
```

---

## 4. MCP 工具集成模式

### 4.1 工具选择策略

```javascript
// 参考 issue-plan-agent 的 MCP 工具使用模式

// Step 1: ACE Semantic Search (代码相关)
const aceResults = mcp__ace-tool__search_context({
  project_root_path: "/path/to/project",
  query: `${goal} patterns and implementation`
});

// Step 2: Exa Code Context (外部资源)
const exaResults = mcp__exa__get_code_context_exa({
  query: `official ${goal} documentation tutorial`,
  tokensNum: 5000
});

// Step 3: Smart Search (本地缓存)
const localResults = mcp__ccw-tools__smart_search({
  action:search",
  query: goal,
  path: ".workflow/learn/sessions/**/plan.json"
});

// Step 4: Normalize & Deduplicate
const uniqueResources = normalizeResources([
  ...aceResults,
  ...exaResults,
  ...localResults
]);

// Step 5: Score Resources
const scoredResources = uniqueResources.map(res => ({
  ...res,
  quality: scoreResource(res),
  quality_score: calculateQualityScore(res),
  retrieved_at: new Date().toISOString()
}));
```

### 4.2 Fallback 链

```javascript
// 参考 CLI 工具配置
const CLI_TOOLS = {
  primary: "gemini",
  fallback: ["qwen", "codex"],
  degraded: "template-mode"
};

// 如果 MCP 工具失败
if (!mcpAvailable) {
  console.log('⚠️  MCP tools unavailable. Using degraded mode.');
  // Ask user for confirmation
  const answer = AskUserQuestion({
    questions: [{
      question: "MCP tools unavailable. Continue with template mode?",
      header: "Tool Availability",
      multiSelect: false,
      options: [
        { value: "continue", label: "Continue", description: "Use fallback resources" },
        { value: "cancel", label: "Cancel", description: "Wait for tools" }
      ]
    }]
  });

  if (answer.continue === 'cancel') {
    throw new Error('Cancelled by user');
  }

  // 使用模板模式
  return generateTemplatePlan(goal, profile);
}
```

---

## 5. 状态管理

### 5.1 目录结构

```
.workflow/learn/
├── state.json                      # 全局状态（active_profile_id, active_session_id）
├── profiles/                       # 用户档案
│   ├── profile-{id}.json
│   └── index.json
├── sessions/                       # 学习会话
│   ├── LS-20250124-001/
│   │   ├── manifest.json
│   │   ├── plan.json
│   │   ├── progress.json
│   │   └── interactions/
│   │       ├── ask-*.md
│   │       └── notes/
│   └── index.json
└── knowledge/                      # 跨会话知识图谱（P2 阶段）
    ├── topics.json
    ├── graph.json
    └── observations.jsonl
```

### 5.2 State.json Schema

```json
{
  "active_profile_id": "profile-1737734400000",
  "active_session_id": "LS-20250124-001",
  "version": "1.0.0",
  "_metadata": {
    "last_updated": "2025-01-24T10:00:00Z",
    "total_sessions_completed": 5
  }
}
```

---

## 6. 验证门（Validation Gate）

### 6.1 4层 QA 机制

```javascript
// Layer 0: Schema Validation (阻断型)
function validateSchema(plan) {
  const schema = JSON.parse(Read('.workflow/.scratchpad/learn-workflow-draft/schemas/learn-plan.schema.json'));
  // Use Ajv or similar validator
  return validate(plan, schema);
}

// Layer 1: Graph Validity (阻断型)
function validateDAG(plan) {
  const visited = new Set();
  const recursionStack = new Set();

  function hasCycle(nodeId) {
    if (recursionStack.has(nodeId)) return true;
    if (visited.has(nodeId)) return false;

    visited.add(nodeId);
    recursionStack.add(nodeId);

    const node = plan.knowledge_points.find(kp => kp.id === nodeId);
    for (const prereq of node.prerequisites) {
      if (hasCycle(prereq)) return true;
    }

    recursionStack.delete(nodeId);
    return false;
  }

  for (const node of plan.dependency_graph.nodes) {
    if (hasCycle(node)) return { valid: false, error: 'Cycle detected' };
  }

  return { valid: true };
}

// Layer 2: Profile→Plan Matching (告警型)
function checkProfileMatch(plan, profile) {
  const highProficiencyTopics = profile.known_topics
    .filter(t => t.proficiency >= 0.8)
    .map(t => t.topic_id);

  let optionalKPs = 0;
  plan.knowledge_points.forEach(kp => {
    const kpTopics = kp.topic_refs || [];
    const overlap = kpTopics.filter(t => highProficiencyTopics.includes(t));

    if (overlap.length > 0) {
      kp.status = 'optional';
      kp._note = `Already proficient in: ${overlap.join(', ')}`;
      optionalKPs++;
    }
  });

  return { warnings: optionalKPs > 0 ? [`${optionalKPs} KPs marked optional`] : [] };
}

// Layer 3: Resource Quality (告警型)
function checkResourceQuality(plan) {
  const kpsWithoutGold = plan.knowledge_points.filter(kp =>
    !kp.resources.some(r => r.quality === 'gold')
  );

  if (kpsWithoutGold.length > 0) {
    return {
      warnings: [`${kpsWithoutGold.length} KPs lack gold-tier resources`],
      critical: kpsWithoutGold.length > plan.knowledge_points.length / 2
    };
  }

  return { warnings: [] };
}
```

---

## 7. 关键实现要点

### 7.1 AskUserQuestion 模式（规范化）

```javascript
// ✅ 正确模式（参考 brainstorm artifacts）
const KEY = 'question_key';
const answer = AskUserQuestion({
  questions: [{
    key: KEY,
    question: "问题文本",
    header: "短标签",
    multiSelect: false,
    options: [
      { label: "选项1", description: "说明" },
      { label: "选项2", description: "说明" }
    ]
  }]
});
const choice = answer[KEY];  // key-based 访问

// ❌ 错误模式
const answer = AskUserQuestion({ questions: [...] });
const choice = Object.values(answer)[0];  // 脆弱
```

### 7.2 SlashCommand 调用模式

```javascript
// 同步执行（阻塞）
SlashCommand('/learn:profile create');

// 带参数
SlashCommand(`/learn:plan "${goal}" --profile ${profileId}`);
```

### 7.3 Agent 模式（参考 issue-plan-agent）

```javascript
// Agent 执行（同步等待结果）
Task({
  subagent_type: "learn-planning-agent",
  run_in_background: false,  // 同步等待
  description: "Generate learning plan",
  prompt: `...`
});

// Agent 写入文件后读取
const plan = JSON.parse(Read(`${sessionFolder}/plan.json`));
```

---

## 8. 实现优先级

### Phase 1 (P0 - 核心功能)
- ✅ Schema files (learn-profile.schema.json, learn-plan.schema.json, learn-state.schema.json)
- ✅ /learn:profile create/show 基本功能
- ✅ /learn:plan 模板模式（--no-agent）
- ✅ Session creation & state management

### Phase 2 (P1 - Agent 模式)
- ✅ learn-planning-agent 实现
- ✅ MCP 工具集成（ACE, Exa, smart_search）
- ✅ Validation Gate (4-layer QA)
- ✅ /learn:plan agent 模式

### Phase 3 (P2 - 增强功能)
- ✅ 跨会话知识图谱（topics.json, graph.json）
- ✅ /learn:execute 执行模式
- ✅ /learn:ask 问答模式
- ✅ /learn:review 复习模式

---

## 9. 参考文档

- **Issue Plan 实现**: `.claude/commands/issue/plan.md`
- **Issue Plan Agent**: `.claude/agents/issue-plan-agent.md`
- **Workflow Session 管理**: `.claude/workflows/workflow-architecture.md`
- **AskUserQuestion 模式**: `.claude/commands/workflow/brainstorm/artifacts.md`
- **MCP 工具使用**: `cli-tools-usage.md`

---

**版本**: v2.1.0
**状态**: Implementation Ready
**最后更新**: 2026-01-24
