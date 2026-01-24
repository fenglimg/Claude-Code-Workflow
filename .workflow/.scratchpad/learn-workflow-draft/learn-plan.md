---
name: plan
description: Generate personalized learning plans based on user profile and learning goals using AI-driven knowledge gap analysis
argument-hint: "\"<learning goal>\" [--profile=<profile-id>] [--no-agent]"
allowed-tools: TodoWrite(*), Task(*), SlashCommand(*), AskUserQuestion(*), Bash(*), Read(*), Write(*)
---

# Learn:Plan Command - 学习计划生成

## Quick Start

```bash
/learn:plan "Master React Server Components"
/learn:plan "Learn Rust for systems programming" --profile profile-dev
/learn:plan "Advanced TypeScript patterns" --no-agent
```

## Overview

`/learn:plan` 是 learn workflow 的核心入口，负责：
- 分析学习目标与用户当前技能水平的差距
- 生成结构化的知识点学习路径（DAG）
- 推荐高质量学习资源
- 创建独立的学习会话

**核心特性**：
- **AI 驱动**：使用 `learn-planning-agent` 智能分解知识点
- **依赖感知**：自动构建知识点的依赖关系图
- **个性化**：基于用户档案调整难度和资源
- **独立存储**：所有数据存储在 `.workflow/learn/sessions/`，与核心系统隔离

## Execution Process

```
Input Parsing:
   └─ 解析学习目标 + 可选参数

Phase 1: Profile Discovery & Validation
   ├─ 读取 .workflow/learn/state.json
   ├─ 验证 active_profile_id 存在
   ├─ 如果不存在 → 自动创建 default profile
   └─ Clarification Check: 目标是否过泛？
      └─ Yes → AskUserQuestion 澄清具体方向

Phase 2: Knowledge Gap Analysis
   ├─ 加载 profile: {known_topics, experience_level}
   ├─ 目标所需技能推断（基于学习目标）
   └─ 生成差距报告：{missing_topics, weak_topics}

Phase 3: Plan Generation (Agent or Template)
   ├─ 决策：--no-agent flag?
   │  ├─ Yes → 使用静态模板生成
   │  └─ No → 调用 learn-planning-agent
   │     ├─ Task(tool="learn-planning-agent", run_in_background=false)
   │     ├─ 输入：目标 + profile + gap_analysis
   │     ├─ MCP工具集成：ACE + Exa + smart_search
   │     └─ 输出：知识点 DAG + 资源推荐（schema-first）
   └─ 初步验证：基本结构完整性

Phase 4: Validation Gate (Multi-Layer QA)
   ├─ Layer 0: Schema Validation（阻断型）
   │  ├─ 加载 learn-plan-schema.json
   │  ├─ 验证必填字段、类型、枚举值
   │  └─ 验证约束：maxItems=15, minItems=1 for resources
   ├─ Layer 1: Graph Validity（阻断型）
   │  ├─ DAG循环检测（DFS-based）
   │  ├─ Prerequisites引用存在性检查
   │  └─ 生成拓扑排序（学习顺序建议）
   ├─ Layer 2: Profile→Plan Matching（告警型）
   │  ├─ 高熟练度topic (proficiency>=0.8) → 标记为optional
   │  ├─ 缺少基础prerequisites → 警告或补充基础KP
   │  └─ 生成 profile_fingerprint 防止不匹配
   └─ Layer 3: Resource Quality Scoring（告警型）
      ├─ 每个KP至少1个Gold-tier资源
      ├─ 资源质量评分（gold/silver/bronze）
      └─ 不满足 → 警告用户或降级继续

Phase 5: Session Creation
   ├─ 生成 session_id: LS-YYYYMMDD-NNN
   ├─ 创建目录：.workflow/learn/sessions/{session_id}/
   ├─ 写入文件：
   │  ├─ manifest.json（会话元数据）
   │  ├─ plan.json（学习计划，已验证）
   │  └─ progress.json（初始进度）
   └─ 更新 state.json（active_session_id）

Phase 6: User Confirmation
   ├─ 显示计划摘要
   │  ├─ 知识点数量 + 难度分布
   │  ├─ 依赖关系概览（拓扑顺序）
   │  ├─ 资源质量统计（Gold/Silver/Bronze）
   │  └─ 验证结果（通过/警告）
   └─ AskUserQuestion: 确认开始学习？
      ├─ Yes → 返回 session_id，提示使用 /learn:execute
      ├─ Review → 显示完整plan.json
      └─ Modify → 收集反馈，返回Phase 3重新生成
```

## Implementation

### Phase 1: Profile Discovery

**实现细节**：

```javascript
// Step 1: 读取全局状态
const statePath = `.workflow/learn/state.json`;
let state;

try {
  state = JSON.parse(Read(statePath));
} catch (e) {
  // 首次运行：初始化 state.json
  state = {
    active_profile_id: null,
    active_session_id: null,
    version: "1.0.0",
    _metadata: {
      last_updated: new Date().toISOString(),
      total_sessions_completed: 0
    }
  };
}

// Step 2: 检查 profile
const profileId = flags.profile || state.active_profile_id;

if (!profileId) {
  console.log('No profile found. Creating default profile...');
  SlashCommand('/learn:profile create');
  // 重新加载 state
  state = JSON.parse(Read(statePath));
}

// Step 3: 加载 profile
const profilePath = `.workflow/learn/profiles/${state.active_profile_id}.json`;
const profile = JSON.parse(Read(profilePath));

console.log(`Using profile: ${state.active_profile_id}`);
console.log(`Experience level: ${profile.experience_level}`);
console.log(`Known topics: ${profile.known_topics.map(t => t.topic_id).join(', ')}`);
```

### Phase 2: Knowledge Gap Analysis

**实现细节**：

```javascript
// 目标技能推断（简化版，实际由 agent 完成）
const goalKeywords = extractKeywords($ARGUMENTS);

const gapAnalysis = {
  missing_topics: [],      // 完全未掌握
  weak_topics: [],         // 掌握不足 (proficiency < 0.5)
  strong_topics: [],       // 掌握良好 (proficiency >= 0.5)
  related_experience: []   // 相关技能（可迁移）
};

// 分析 profile.known_topics
profile.known_topics.forEach(topic => {
  if (topic.proficiency < 0.3) {
    gapAnalysis.weak_topics.push(topic);
  } else if (topic.proficiency >= 0.5) {
    gapAnalysis.strong_topics.push(topic);
  }
});

console.log(`
## Knowledge Gap Analysis

Missing topics: ${gapAnalysis.missing_topics.length}
Weak topics: ${gapAnalysis.weak_topics.map(t => t.topic_id).join(', ')}
Strong foundation: ${gapAnalysis.strong_topics.map(t => t.topic_id).join(', ')}
`);
```

### Phase 3: Plan Generation

#### Option A: Agent-Driven Planning (默认)

```javascript
Task({
  subagent_type: "learn-planning-agent",
  run_in_background: false,
  description: "Generate learning plan with knowledge points",
  prompt: `
## Planning Task
Generate a structured learning plan for the following goal.

## Input Context
**Learning Goal**: ${goal}
**User Profile**:
- Experience level: ${profile.experience_level}
- Known topics: ${JSON.stringify(profile.known_topics)}
- Learning preferences: ${JSON.stringify(profile.learning_preferences)}

**Gap Analysis**:
- Missing topics: ${gapAnalysis.missing_topics.map(t => t.topic_id).join(', ')}
- Weak topics: ${gapAnalysis.weak_topics.map(t => t.topic_id).join(', ')}

## Planning Rules

1. **Knowledge Point Decomposition**:
   - Each knowledge point must be: specific, achievable, verifiable
   - ID format: KP-{number}
   - Prerequisites: Array of KP IDs (no circular dependencies)
   - Estimated effort: easy | medium | hard

2. **Resource Recommendation** (Quality Tiers):
   - **Gold**: Official documentation, authoritative books
   - **Silver**: High-quality blogs, interactive tutorials
   - **Bronze**: Community resources, video courses

3. **Assessment Types**:
   - practical_task: Build something
   - code_challenge: Solve a problem
   - multiple_choice: Knowledge test

4. **Dependency Graph**:
   - Build a DAG of knowledge points
   - Ensure logical learning progression

## Output Schema

Execute: cat .claude/workflows/cli-templates/schemas/learn-plan-schema.json

Generate complete plan.json following the schema above.

## Key Constraints
- NO time estimates (user requirement)
- Max 15 knowledge points per session
- Each KP must have at least 1 Gold-tier resource
- Dependencies must be acyclic

## Execution
1. Read schema file (cat command above)
2. Analyze goal + profile + gaps
3. Generate knowledge point DAG
4. Recommend high-quality resources for each KP
5. Write: ${sessionFolder}/plan.json
6. Return: Brief summary with KP count and difficulty distribution
`
});

// 等待 agent 完成
const plan = JSON.parse(Read(`${sessionFolder}/plan.json`));
```

#### Option B: Template-Based Planning (--no-agent)

```javascript
// 使用预定义模板生成简单计划
const templatePlan = {
  session_id: sessionId,
  learning_goal: goal,
  profile_id: state.active_profile_id,
  knowledge_points: [
    {
      id: "KP-1",
      title: `${goal} - Fundamentals`,
      description: `Core concepts and basics of ${goal}`,
      prerequisites: [],
      resources: [
        {
          type: "documentation",
          url: `https://example.com/docs/${goal.toLowerCase()}`,
          summary: "Official documentation",
          quality: "gold"
        }
      ],
      assessment: {
        type: "practical_task",
        description: `Build a simple project with ${goal}`,
        acceptance_criteria: ["Works correctly", "Code is clean"]
      },
      estimated_effort: "medium",
      status: "pending"
    },
    {
      id: "KP-2",
      title: `${goal} - Advanced Topics`,
      description: `Deep dive into advanced ${goal} concepts`,
      prerequisites: ["KP-1"],
      resources: [
        {
          type: "tutorial",
          url: `https://example.com/tutorials/${goal.toLowerCase()}-advanced`,
          summary: "Advanced tutorial",
          quality: "silver"
        }
      ],
      assessment: {
        type: "code_challenge",
        description: `Solve complex ${goal} challenge`,
        acceptance_criteria: ["Efficient solution", "Well-documented"]
      },
      estimated_effort: "hard",
      status: "pending"
    }
  ],
  dependency_graph: {
    nodes: ["KP-1", "KP-2"],
    edges: [{from: "KP-1", to: "KP-2"}]
  },
  _metadata: {
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    total_knowledge_points: 2,
    estimated_total_effort: "medium-hard",
    generation_method: "template"
  }
};

Write(`${sessionFolder}/plan.json`, JSON.stringify(templatePlan, null, 2));
```

### Phase 4: Session Creation

**实现细节**：

```javascript
// Session ID generation
const dateStr = new Date().toISOString().split('T')[0].replace(/-/g, '');
const sessionCounter = loadNextSessionCounter();
const sessionId = `LS-${dateStr}-${sessionCounter.toString().padStart(3, '0')}`;

// Create session directory
const sessionFolder = `.workflow/learn/sessions/${sessionId}`;
Bash(`mkdir -p ${sessionFolder}/interactions/notes`);

// Write manifest.json
const manifest = {
  session_id: sessionId,
  learning_goal: goal,
  profile_id: state.active_profile_id,
  status: "planned",
  created_at: new Date().toISOString(),
  _metadata: {
    generation_method: flags.noAgent ? "template" : "agent",
    agent_version: flags.noAgent ? null : "1.0.0"
  }
};
Write(`${sessionFolder}/manifest.json`, JSON.stringify(manifest, null, 2));

// Write progress.json (initial state)
const progress = {
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
};
Write(`${sessionFolder}/progress.json`, JSON.stringify(progress, null, 2));

// Update sessions index
const indexJsonPath = `.workflow/learn/sessions/index.json`;
let sessionsIndex;
try {
  sessionsIndex = JSON.parse(Read(indexJsonPath));
} catch (e) {
  sessionsIndex = { sessions: [] };
}
sessionsIndex.sessions.push({
  session_id: sessionId,
  learning_goal: goal,
  created_at: manifest.created_at,
  status: "planned"
});
Write(indexJsonPath, JSON.stringify(sessionsIndex, null, 2));

// Update global state
state.active_session_id = sessionId;
Write(statePath, JSON.stringify(state, null, 2));

console.log(`Session created: ${sessionId}`);
```

### Phase 5: User Confirmation

```javascript
// Display plan summary
const plan = JSON.parse(Read(`${sessionFolder}/plan.json`));

const easyCount = plan.knowledge_points.filter(kp => kp.estimated_effort === 'easy').length;
const mediumCount = plan.knowledge_points.filter(kp => kp.estimated_effort === 'medium').length;
const hardCount = plan.knowledge_points.filter(kp => kp.estimated_effort === 'hard').length;

const goldResources = plan.knowledge_points.reduce((acc, kp) =>
  acc + kp.resources.filter(r => r.quality === 'gold').length, 0);
const silverResources = plan.knowledge_points.reduce((acc, kp) =>
  acc + kp.resources.filter(r => r.quality === 'silver').length, 0);
const bronzeResources = plan.knowledge_points.reduce((acc, kp) =>
  acc + kp.resources.filter(r => r.quality === 'bronze').length, 0);

// Display validation results
const validationWarnings = [];
if (goldResources < plan.knowledge_points.length) {
  validationWarnings.push(`⚠️  ${plan.knowledge_points.length - goldResources} KPs lack Gold-tier resources`);
}

console.log(`
## Learning Plan Summary

**Goal**: ${goal}
**Session ID**: ${sessionId}

**Knowledge Points**: ${plan.knowledge_points.length}
- Easy: ${easyCount}
- Medium: ${mediumCount}
- Hard: ${hardCount}

**Resources**:
- Gold-tier: ${goldResources}
- Silver-tier: ${silverResources}
- Bronze-tier: ${bronzeResources}
- Total: ${goldResources + silverResources + bronzeResources}

**Dependencies**:
${plan.dependency_graph.edges.map(edge =>
  `  ${edge.from} → ${edge.to}`
).join('\n')}

**Validation**: ${validationWarnings.length === 0 ? '✅ All checks passed' : validationWarnings.join('\n')}

Next: /learn:execute
`);

// Ask user confirmation (规范化key-based访问)
const PLAN_CONFIRMATION_KEY = 'plan_action';

const answer = AskUserQuestion({
  questions: [{
    key: PLAN_CONFIRMATION_KEY,
    question: "What would you like to do with this plan?",
    header: "Plan Action",
    multiSelect: false,
    options: [
      {value: "accept", label: "Accept & Start", description: "Begin learning with first knowledge point"},
      {value: "review", label: "Review Details", description: "View full plan.json before deciding"},
      {value: "modify", label: "Request Changes", description: "Provide feedback to regenerate plan"},
      {value: "save", label: "Save for Later", description: "Plan saved, start anytime with /learn:execute"}
    ]
  }]
});

// 使用key-based访问（稳健方式）
const userChoice = answer[PLAN_CONFIRMATION_KEY];

switch (userChoice) {
  case 'accept':
    console.log(`✅ Plan accepted! Use /learn:execute to begin learning.`);
    break;
  case 'review':
    console.log('\n## Full Plan Details\n');
    console.log(JSON.stringify(plan, null, 2));
    // 递归调用确认
    break;
  case 'modify':
    const FEEDBACK_KEY = 'feedback_type';
    const feedback = AskUserQuestion({
      questions: [{
        key: FEEDBACK_KEY,
        question: "What would you like to change?",
        header: "Feedback",
        multiSelect: false,
        options: [
          {value: "practical", label: "More Practical", description: "Focus on hands-on exercises"},
          {value: "theoretical", label: "More Theory", description: "Add conceptual depth"},
          {value: "shorter", label: "Shorter Plan", description: "Reduce number of knowledge points"},
          {value: "custom", label: "Custom Request", description: "Provide specific feedback"}
        ]
      }]
    });
    // 返回Phase 3重新生成
    console.log(`Regenerating plan with feedback: ${feedback[FEEDBACK_KEY]}...`);
    break;
  case 'save':
    console.log(`Plan saved. Resume with: /learn:execute --session ${sessionId}`);
    break;
}
```

## Error Handling

| Error | Resolution |
|-------|------------|
| Profile not found | Auto-create default profile via `/learn:profile create` |
| Agent timeout | Fallback to template-based planning |
| Invalid session ID | Generate new session ID |
| Plan validation fails | Check validation layer (0-3), regenerate or manual fix |
| Directory creation fails | Check `.workflow/learn/` permissions |
| Schema validation fails | Review plan.json against learn-plan-schema.json |
| Circular dependencies | Use DAG validator to identify cycle, break dependency chain |
| MCP tools unavailable | Clarify degraded mode acceptance or cancel |

## P0 Fixes Applied (Multi-CLI Analysis)

Based on 3-round multi-CLI collaborative analysis (Gemini → Codex → Gemini), the following P0 blockers have been addressed:

### 1. Issue CLI Integration ✅

**Problem**: Original implementation used non-existent `--title/--body` flags
**Solution**: Use stdin JSON with heredoc (implemented in learn-execute.md)

```javascript
// ✅ Correct implementation (see learn-execute.md for full code)
const issueData = { title: "...", body: "...", labels: [...] };
const command = `ccw issue create <<'EOF'\n${JSON.stringify(issueData, null, 2)}\nEOF`;
```

### 2. Schema Files ✅

**Problem**: Referenced schema files did not exist
**Solution**: Created 3 P0 schema files in `schemas/` directory
- `learn-state.schema.json` - Global state definition
- `learn-profile.schema.json` - User profile definition  
- `learn-plan.schema.json` - Learning plan definition (with maxItems:15 constraint)

### 3. Validation Gate ✅

**Problem**: No validation mechanism for agent-generated plans
**Solution**: Implemented 4-layer QA gate (see Enhancement: Validation Gate section)
- Layer 0: Schema validation (阻断型)
- Layer 1: Graph validity (阻断型)
- Layer 2: Profile→Plan matching (告警型)
- Layer 3: Resource quality scoring (告警型)

### 4. AskUserQuestion Pattern ✅

**Problem**: Brittle `Object.values(answer)[0]` usage
**Solution**: Key-based access pattern (see Phase 5: User Confirmation)

```javascript
// ✅ Robust pattern
const KEY = 'action_key';
const answer = AskUserQuestion({ questions: [{ key: KEY, ... }] });
const choice = answer[KEY];
```

### 5. Clarification Blocking ✅

**Problem**: Agent made best-guess decisions on ambiguous input
**Solution**: Implemented clarification blocking mechanism (see Enhancement: Clarification Blocking)
- Goal clarity check (< 2 keywords → clarify)
- Knowledge chain conflict resolution (user decision required)
- MCP tool availability check (degraded mode confirmation)

## Quality Checklist

Before completing plan generation, verify:

- [ ] `plan.json` follows `learn-plan-schema.json`
- [ ] No circular dependencies in knowledge_points
- [ ] Each knowledge point has at least 1 Gold-tier resource
- [ ] Prerequisites are logically ordered
- [ ] Session files created: manifest.json, plan.json, progress.json
- [ ] Global state updated: state.json
- [ ] Sessions index updated: sessions/index.json
- [ ] User confirmation received

## Related Commands

**Prerequisite**:
- `/learn:profile create` - Create user profile before planning

**Follow-up**:
- `/learn:execute` - Start executing the learning plan
- `/learn:status` - View current progress
- `/learn:review` - Review completed session

## Session Folder Structure

```
.workflow/learn/sessions/LS-20250124-001/
├── manifest.json           # Session metadata
├── plan.json               # Learning plan (knowledge points DAG)
├── progress.json           # Progress tracking
└── interactions/           # Q&A history and notes
    ├── ask-*.md
    └── notes/
```

## Examples

### Example 1: Basic Usage

```bash
User: /learn:plan "Master React Server Components"

Output:
Using profile: profile-default
Experience level: intermediate
Known topics: react, typescript

## Knowledge Gap Analysis
Missing topics: 0
Weak topics: server-components
Strong foundation: react, hooks, nextjs

## Knowledge Point Generation...
Launching learn-planning-agent...

## Learning Plan Summary
**Goal**: Master React Server Components
**Session ID**: LS-20250124-001

**Knowledge Points**: 5
- Easy: 1
- Medium: 3
- Hard: 1

**Resources**:
- Gold-tier: 7
- Total: 15

Next: /learn:execute
```

### Example 2: With Custom Profile

```bash
User: /learn:plan "Learn Rust" --profile profile-systems

Output:
Using profile: profile-systems
Experience level: advanced
Known topics: cpp, systems-programming

## Knowledge Gap Analysis
Strong foundation: cpp, memory-management
Missing topics: rust, ownership, borrowing

[Plan generated...]
```

### Example 3: Template Mode (No Agent)

```bash
User: /learn:plan "Learn Docker basics" --no-agent

Output:
Generating plan from template...

## Learning Plan Summary
**Goal**: Learn Docker basics
**Session ID**: LS-20250124-002

**Knowledge Points**: 2 (template-based)
- KP-1: Docker basics (medium)
- KP-2: Docker compose (hard)

Note: Limited personalization. Remove --no-agent for AI-driven planning.
```

## Integration Points

- **Input**: User goal (text), profile (JSON)
- **Output**: Session directory with plan.json
- **Side Effects**: Updates state.json, sessions/index.json
- **Dependencies**: `/learn:profile` (for profile creation)
- **Consumed By**: `/learn:execute` (reads plan.json)



---

## Enhancement: MCP Tool Integration

### Tool Selection Strategy

Based on learning goal type, use different MCP tool combinations:

**A) Project/Code-Related Learning**:
```javascript
// Step 1: Discover codebase patterns
mcp__ace-tool__search_context(
  project_root_path="/path/to/project",
  query="auth middleware patterns + security"
)

// Step 2: Find exact implementations
smart_search(action="search", query="authentication.*middleware")

// Step 3: Get external authoritative docs
mcp__exa__get_code_context_exa(
  query="best practices authentication 2025",
  tokensNum=5000
)
```

**B) General Knowledge Learning**:
```javascript
// Prioritize official documentation
mcp__exa__get_code_context_exa(
  query="official TypeScript generics documentation",
  tokensNum=5000
)

// Check local cache/historical sessions
smart_search(
  action="search",
  path=".workflow/learn/sessions/**/plan.json",
  query="generics"
)
```

### Tool Composition (within learn-planning-agent)

**Execution Flow**:
1. **ACE**: Semantic search for codebase context
2. **Exa**: Fetch high-quality external resources
3. **Normalize**: Unify to topic_ids + deduplicate URLs
4. **Score**: gold/silver/bronze + enforce gold>=1 per KP
5. **Emit**: plan.json (schema-first)

**Fallback Chain**:
```
Gemini → Qwen → Codex → degraded (structure only, no resource links)
```

---

## Enhancement: Validation Gate (Phase 4)

基于3轮多CLI协作分析的P0阻断问题修复，完整实现4层QA验证机制。

### 实现准备

**文件结构**:
```
.workflow/.scratchpad/learn-workflow-draft/
├── schemas/
│   ├── learn-state.schema.json
│   ├── learn-profile.schema.json
│   └── learn-plan.schema.json
└── lib/
    ├── validator.js       # Schema validator
    └── dag-validator.js   # DAG validator
```

### Layer 0: Schema Validation（阻断型）

```javascript
// 加载schema文件
const SchemaValidator = require('./lib/validator');
const schemaValidator = new SchemaValidator('./schemas');

// 验证plan.json
const schemaResult = schemaValidator.validatePlan(plan);

if (!schemaResult.valid) {
  console.error('❌ Schema validation failed:');
  schemaResult.errors.forEach(err => console.error(`  - ${err}`));
  throw new Error('Plan schema validation failed');
}

console.log('✅ Schema validation passed');
```

**验证项**:
- 必填字段存在性（session_id, learning_goal, knowledge_points等）
- 字段类型正确性（string, number, array等）
- 枚举值合法性（quality: gold/silver/bronze）
- 约束条件（maxItems: 15, minItems: 1 for resources）
- 模式匹配（KP-ID格式：^KP-\d+$）

### Layer 1: Graph Validity（阻断型）

```javascript
// 加载DAG验证器
const DAGValidator = require('./lib/dag-validator');
const dagValidator = new DAGValidator();

// 验证依赖图
const dagResult = dagValidator.validate(plan.knowledge_points);

if (!dagResult.valid) {
  console.error('❌ Graph validation failed:');
  dagResult.errors.forEach(err => console.error(`  - ${err}`));
  throw new Error('Circular dependencies detected');
}

console.log('✅ Graph validation passed');
console.log(`   Suggested order: ${dagResult.order.join(' → ')}`);

// 保存学习顺序到metadata
plan._metadata.learning_order = dagResult.order;
```

**验证项**:
- 循环依赖检测（DFS算法）
- Prerequisites引用存在性
- 拓扑排序生成

### Layer 2: Profile→Plan Matching（告警型）

```javascript
// 检查高熟练度topic
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

if (optionalKPs > 0) {
  console.log(`ℹ️  Marked ${optionalKPs} KPs as optional (high proficiency)`);
}

// 生成profile fingerprint
plan._metadata.profile_fingerprint = {
  profile_id: profile.profile_id,
  known_topics_count: profile.known_topics.length,
  generated_at: new Date().toISOString()
};
```

**验证项**:
- 高熟练度topic标记为optional
- 缺少基础prerequisites警告
- Profile fingerprint生成

### Layer 3: Resource Quality Scoring（告警型）

```javascript
// 质量评分rubric
const qualityRubric = {
  gold: {
    threshold: 0.8,
    sources: ['official docs', 'typescriptlang.org', 'developer.mozilla.org', 'docs.rs'],
    description: 'Official documentation or authoritative sources'
  },
  silver: {
    threshold: 0.6,
    sources: ['blog', 'tutorial', 'course', 'egghead.io'],
    description: 'High-quality tutorials or blogs'
  },
  bronze: {
    threshold: 0.4,
    sources: ['stackoverflow', 'medium.com', 'dev.to'],
    description: 'Community resources or forums'
  }
};

// 检查每个KP的资源质量
let kpsWithoutGold = 0;
plan.knowledge_points.forEach(kp => {
  const hasGold = kp.resources.some(r => r.quality === 'gold');
  
  if (!hasGold) {
    kpsWithoutGold++;
    kp._warning = 'Lacks gold-tier resource';
  }
  
  // 添加质量评分metadata
  kp.resources.forEach(res => {
    res.quality_score = calculateQualityScore(res, qualityRubric);
    res.retrieved_at = new Date().toISOString();
  });
});

if (kpsWithoutGold > 0) {
  console.log(`⚠️  ${kpsWithoutGold} KPs lack gold-tier resources`);
  
  // 询问用户是否继续
  const QUALITY_KEY = 'quality_decision';
  const answer = AskUserQuestion({
    questions: [{
      key: QUALITY_KEY,
      question: `${kpsWithoutGold} knowledge points lack gold-tier resources. Continue?`,
      header: "Quality Warning",
      multiSelect: false,
      options: [
        {value: "continue", label: "Continue", description: "Accept degraded quality"},
        {value: "regenerate", label: "Regenerate", description: "Try different search terms"},
        {value: "cancel", label: "Cancel", description: "Review plan manually"}
      ]
    }]
  });
  
  const decision = answer[QUALITY_KEY];
  if (decision === 'regenerate') {
    return planGenerationPhase(); // 重试
  } else if (decision === 'cancel') {
    throw new Error('Plan generation cancelled by user');
  }
  // continue → 继续执行
}

console.log('✅ Resource quality check completed');
```

**验证项**:
- 每个KP至少1个Gold-tier资源
- 资源质量评分（0-1）
- 不满足时询问用户

### 完整验证流程示例

```javascript
function validatePlan(plan, profile) {
  console.log('\n🔍 Starting validation gate...\n');
  
  // Layer 0: Schema
  const schemaResult = schemaValidator.validatePlan(plan);
  if (!schemaResult.valid) {
    return { valid: false, layer: 0, errors: schemaResult.errors };
  }
  
  // Layer 1: Graph
  const dagResult = dagValidator.validate(plan.knowledge_points);
  if (!dagResult.valid) {
    return { valid: false, layer: 1, errors: dagResult.errors };
  }
  
  // Layer 2: Profile matching
  const profileWarnings = checkProfileMatch(plan, profile);
  
  // Layer 3: Resource quality
  const qualityWarnings = checkResourceQuality(plan);
  
  // 如果Layer 3有严重问题，询问用户
  if (qualityWarnings.critical > 0) {
    const decision = askUserDecision(qualityWarnings);
    if (decision === 'cancel') {
      return { valid: false, layer: 3, errors: ['Cancelled by user'] };
    }
  }
  
  return {
    valid: true,
    warnings: { profile: profileWarnings, quality: qualityWarnings },
    learning_order: dagResult.order
  };
}

// 使用
const validationResult = validatePlan(draftPlan, userProfile);

if (!validationResult.valid) {
  console.error(`❌ Validation failed at Layer ${validationResult.layer}`);
  // 处理错误或重新生成
} else {
  console.log('✅ All validation passed');
  if (validationResult.warnings) {
    console.log(`ℹ️  Warnings: ${JSON.stringify(validationResult.warnings)}`);
  }
  // 继续创建session
}
```

### Layer 2: Profile→Plan Matching
```javascript
// Check for high-proficiency topics being planned as basic
const highProficiencyTopics = profile.known_topics
  .filter(t => t.proficiency >= 0.8)
  .map(t => t.topic_id);

plan.knowledge_points.forEach(kp => {
  const kpTopics = extractTopics(kp.title, kp.description);
  const overlap = intersection(kpTopics, highProficiencyTopics);

  if (overlap.length > 0) {
    kp.status = 'optional';
    kp._note = 'Already proficient, marked optional';
  }
});

// Add fingerprint to detect profile/plan mismatch
plan._metadata.profile_fingerprint = generateFingerprint(profile);
```

### Layer 3: Resource Quality Scoring
```javascript
// Quality rubric
const qualityLevels = {
  gold: {
    threshold: 0.8,
    sources: ['official docs', 'standards', 'authors', 'reputed courses'],
    weight: 1.0
  },
  silver: {
    threshold: 0.6,
    sources: ['quality blogs', 'tutorials', 'books'],
    weight: 0.7
  },
  bronze: {
    threshold: 0.4,
    sources: ['forums', 'StackOverflow', 'snippets'],
    weight: 0.4
  }
};

// Score each resource
resources.forEach(res => {
  res.quality_score = calculateQuality(res);
  res.reasons = getQualityReasons(res);
  res.retrieved_at = new Date().toISOString();
  res.source_type = detectSourceType(res);
});

// Enforce: each KP must have at least 1 Gold resource
const kpsWithoutGold = plan.knowledge_points.filter(kp =>
  !kp.resources.some(r => r.quality === 'gold')
);

if (kpsWithoutGold.length > 0) {
  // Ask user: continue with degraded resources?
  const answer = AskUserQuestion({
    questions: [{
      question: `Some KPs lack Gold resources. Continue?`,
      header: "Quality Gate",
      options: [
        {label: "Continue", description: "Accept degraded quality"},
        {label: "Regenerate", description: "Try different search terms"}
      ]
    }]
  });
}
```

---

## Enhancement: Clarification Blocking

Following issue-queue-agent pattern, **block on ambiguity** instead of best-guess:

### Trigger Conditions

| Condition | Detection | Action |
|-----------|-----------|--------|
| **Goal too vague** | Keywords < 2 or generic terms | AskUserQuestion for focus area |
| **Profile missing** | No active_profile_id | Create default or clarify preferences |
| **Knowledge chain conflicts** | Prerequisites mismatch | Block and present options |
| **Resource unavailability** | MCP tools fail | Clarify degraded mode acceptance |

### Implementation

```javascript
// Phase 1: Check goal clarity
function checkGoalClarity(goal) {
  const keywords = extractKeywords(goal);
  const genericTerms = ['learn', 'study', 'understand', 'master'];
  const isGeneric = genericTerms.some(term => goal.toLowerCase().includes(term));
  
  if (keywords.length < 2 || isGeneric) {
    return { clear: false, reason: 'Goal too broad' };
  }
  
  return { clear: true };
}

const goalCheck = checkGoalClarity($ARGUMENTS);

if (!goalCheck.clear) {
  const FOCUS_KEY = 'focus_area';
  const clarification = AskUserQuestion({
    questions: [{
      key: FOCUS_KEY,
      question: "Your goal seems broad. Which area to focus?",
      header: "Clarify Goal",
      multiSelect: false,
      options: [
        {value: "theory", label: "Theory", description: "Concepts and principles"},
        {value: "practice", label: "Practice", description: "Hands-on exercises"},
        {value: "both", label: "Both", description: "Balanced theory + practice"},
        {value: "custom", label: "Custom", description: "Specify exact focus"}
      ]
    }]
  });
  
  // Refine goal based on answer
  const focusArea = clarification[FOCUS_KEY];
  $ARGUMENTS = refineGoal($ARGUMENTS, focusArea);
}

// Phase 3: Check knowledge chain conflicts
function detectPrerequisiteConflicts(plan, profile) {
  const conflicts = [];
  
  for (const kp of plan.knowledge_points) {
    for (const prereqId of kp.prerequisites) {
      const prereqKP = plan.knowledge_points.find(k => k.id === prereqId);
      
      // Check if prerequisite is marked as optional (user already knows it)
      if (prereqKP && prereqKP.status === 'optional') {
        conflicts.push({
          kp_id: kp.id,
          prereq_id: prereqId,
          description: `${kp.id} depends on ${prereqId}, but ${prereqId} is optional (user proficient)`,
          resolutionOptions: [
            {value: "keep_both", label: "Keep Both", description: "Include optional KP for completeness"},
            {value: "remove_prereq", label: "Remove Prerequisite", description: "Skip optional KP"},
            {value: "mark_optional", label: "Mark as Optional", description: "Make both optional"}
          ]
        });
      }
    }
  }
  
  return conflicts;
}

const conflicts = detectPrerequisiteConflicts(plan, profile);

if (conflicts.length > 0) {
  console.log(`⚠️  Detected ${conflicts.length} knowledge chain conflicts`);
  
  // DO NOT auto-resolve - present to user
  const CONFLICT_KEY = 'conflict_resolution';
  const resolutions = AskUserQuestion({
    questions: conflicts.map((c, idx) => ({
      key: `${CONFLICT_KEY}_${idx}`,
      question: `Conflict: ${c.description}`,
      header: `Conflict ${idx + 1}`,
      multiSelect: false,
      options: c.resolutionOptions
    }))
  });
  
  // Apply user decisions
  conflicts.forEach((c, idx) => {
    const decision = resolutions[`${CONFLICT_KEY}_${idx}`];
    applyConflictResolution(plan, c, decision);
  });
}

// Phase 4: Check MCP tool availability
function checkMCPToolsAvailability() {
  const tools = ['mcp__ace-tool__search_context', 'mcp__exa__get_code_context_exa'];
  const available = {};
  
  for (const tool of tools) {
    try {
      // Test tool availability
      available[tool] = true;
    } catch (e) {
      available[tool] = false;
    }
  }
  
  return available;
}

const mcpAvailability = checkMCPToolsAvailability();
const unavailableTools = Object.entries(mcpAvailability)
  .filter(([_, available]) => !available)
  .map(([tool, _]) => tool);

if (unavailableTools.length > 0) {
  console.log(`⚠️  MCP tools unavailable: ${unavailableTools.join(', ')}`);
  
  const DEGRADED_KEY = 'degraded_mode';
  const answer = AskUserQuestion({
    questions: [{
      key: DEGRADED_KEY,
      question: "Some MCP tools are unavailable. Resource quality may be degraded. Continue?",
      header: "Tool Availability",
      multiSelect: false,
      options: [
        {value: "continue", label: "Continue", description: "Use fallback resources"},
        {value: "cancel", label: "Cancel", description: "Wait for tools to be available"}
      ]
    }]
  });
  
  if (answer[DEGRADED_KEY] === 'cancel') {
    throw new Error('Plan generation cancelled: MCP tools unavailable');
  }
  
  // Mark plan as degraded
  plan._metadata.degraded_mode = true;
  plan._metadata.unavailable_tools = unavailableTools;
}
```

### Clarification vs Auto-Resolution

**Block (Clarification Required)**:
- Goal ambiguity (< 2 keywords)
- Knowledge chain conflicts (prerequisites mismatch)
- Critical resource unavailability (all MCP tools fail)
- Schema validation failures

**Auto-Resolve (No Blocking)**:
- Minor resource quality issues (some KPs lack gold)
- Profile-plan mismatches (mark as optional)
- Non-critical warnings (topological order suggestions)

### Best Practices

1. **Limit clarification rounds**: Max 2 rounds per phase to avoid user fatigue
2. **Provide context**: Always explain WHY clarification is needed
3. **Offer defaults**: Include "Continue with defaults" option when possible
4. **Batch questions**: Group related clarifications in single AskUserQuestion call
5. **Track confidence**: Mark low-confidence decisions for future refinement

