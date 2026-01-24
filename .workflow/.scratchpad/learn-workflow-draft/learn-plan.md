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
   └─ 如果不存在 → 自动创建 default profile

Phase 2: Knowledge Gap Analysis
   ├─ 加载 profile: {known_topics, experience_level}
   ├─ 目标所需技能推断（基于学习目标）
   └─ 生成差距报告：{missing_topics, weak_topics}

Phase 3: Plan Generation (Agent or Template)
   ├─ 决策：--no-agent flag?
   │  ├─ Yes → 使用静态模板生成
   │  └─ No → 调用 learn-planning-agent
   │     ├─ Task(tool="learn-planning-agent")
   │     ├─ 输入：目标 + profile + gap_analysis
   │     └─ 输出：知识点 DAG + 资源推荐
   └─ 验证输出：无循环依赖、前置条件合理

Phase 4: Session Creation
   ├─ 生成 session_id: LS-YYYYMMDD-NNN
   ├─ 创建目录：.workflow/learn/sessions/{session_id}/
   ├─ 写入文件：
   │  ├─ manifest.json（会话元数据）
   │  ├─ plan.json（学习计划）
   │  └─ progress.json（初始进度）
   └─ 更新 state.json（active_session_id）

Phase 5: User Confirmation
   ├─ 显示计划摘要
   │  ├─ 知识点数量
   │  ├─ 依赖关系概览
   │  ├─ 预估难度分布
   │  └─ 资源质量统计
   └─ AskUserQuestion: 确认开始学习？
      ├─ Yes → 返回 session_id，提示使用 /learn:execute
      └─ No → 保留会话，可稍后 resume
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
- Total: ${plan.knowledge_points.reduce((acc, kp) => acc + kp.resources.length, 0)}

**Dependencies**:
${plan.dependency_graph.edges.map(edge =>
  `  ${edge.from} → ${edge.to}`
).join('\n')}

Next: /learn:execute
`);

// Ask user confirmation
const answer = AskUserQuestion({
  questions: [{
    question: "Start learning this plan now?",
    header: "Confirm",
    multiSelect: false,
    options: [
      {label: "Yes", description: "Start with first knowledge point"},
      {label: "Later", description: "Plan saved, start anytime with /learn:execute"}
    ]
  }]
});

const userChoice = answer[Object.keys(answer)[0]];
if (userChoice === 'Yes') {
  console.log(`Ready! Use /learn:execute to begin learning.`);
} else {
  console.log(`Plan saved. Resume with: /learn:execute --session ${sessionId}`);
}
```

## Error Handling

| Error | Resolution |
|-------|------------|
| Profile not found | Auto-create default profile via `/learn:profile create` |
| Agent timeout | Fallback to template-based planning |
| Invalid session ID | Generate new session ID |
| Plan validation fails | Regenerate with agent or manual fix |
| Directory creation fails | Check `.workflow/learn/` permissions |

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

### Layer 0: Schema Validation
```javascript
// Load schema first
const schema = JSON.parse(
  Read('.claude/workflows/cli-templates/schemas/learn-plan-schema.json')
);

// Validate plan against schema
const validate = (plan, schema) => {
  // Check all required fields present
  // Validate enums, patterns, constraints
  return validationResult;
};
```

### Layer 1: Graph Validity
```javascript
// Check for circular dependencies
function detectCycle(knowledgePoints) {
  const visited = new Set();
  const recursionStack = new Set();

  function visit(kpId) {
    if (recursionStack.has(kpId)) return true; // Cycle
    if (visited.has(kpId)) return false;

    visited.add(kpId);
    recursionStack.add(kpId);

    const kp = knowledgePoints.find(k => k.id === kpId);
    for (const prereq of kp.prerequisites) {
      if (visit(prereq)) return true;
    }

    recursionStack.delete(kpId);
    return false;
  }

  return knowledgePoints.some(kp => visit(kp.id));
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

```javascript
// Check: Is goal too vague?
const goalKeywords = extractKeywords($ARGUMENTS);
if (goalKeywords.length < 2) {
  const clarification = AskUserQuestion({
    questions: [{
      question: "Your goal seems broad. Which area to focus?",
      header: "Clarify",
      options: [
        {label: "Theory", description: "Concepts and principles"},
        {label: "Practice", description: "Hands-on exercises"},
        {label: "Both", description: "Balanced theory + practice"}
      ]
    }]
  });

  // Refine goal based on answer
  $ARGUMENTS = refineGoal($ARGUMENTS, clarification);
}

// Check: Knowledge chain conflicts?
const conflicts = detectPrerequisiteConflicts(plan);
if (conflicts.length > 0 && !hasUserResolution) {
  // DO NOT auto-resolve - present to user
  const resolution = AskUserQuestion({
    questions: conflicts.map(c => ({
      question: `Conflict: ${c.description}`,
      header: "Conflict",
      options: c.resolutionOptions
    }))
  });
}
```

