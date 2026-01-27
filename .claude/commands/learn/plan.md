---
name: plan
description: Generate personalized learning plans based on user profile and learning goals using AI-driven knowledge gap analysis
argument-hint: "\"<learning goal>\" [--profile=<profile-id>] [--no-agent] [--skip-assessment]"
allowed-tools: TodoWrite(*), Task(*), SlashCommand(*), AskUserQuestion(*), Bash(*), Read(*), Write(*)
---

# Learn:Plan Command - 学习计划生成

## Quick Start

```bash
/learn:plan "Master React Server Components"
/learn:plan "Learn Rust for systems programming" --profile profile-dev
/learn:plan "Advanced TypeScript patterns" --no-agent
/learn:plan "Master React Server Components" --skip-assessment
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
   │  ├─ 加载 `.claude/workflows/cli-templates/schemas/learn-plan.schema.json`
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
  Write(statePath, JSON.stringify(state, null, 2));
}

// Step 2: 检查 profile
const profileId = flags.profile || state.active_profile_id;

if (!profileId) {
  console.log('No profile found. Creating default profile...');

  try {
    SlashCommand('/learn:profile create');
    // 重新加载 state
    state = JSON.parse(Read(statePath));
  } catch (e) {
    console.error('❌ Profile creation failed:', e.message);
    throw new Error('Cannot proceed without a valid profile. Please create a profile manually with /learn:profile create');
  }
}

// Step 3: 加载 profile
const profilePath = `.workflow/learn/profiles/${state.active_profile_id}.json`;
let profile;

try {
  profile = JSON.parse(Read(profilePath));
} catch (e) {
  console.error('❌ Failed to load profile:', e.message);
  throw new Error(`Profile not found or corrupted: ${state.active_profile_id}. Please select a valid profile.`);
}

console.log(`Using profile: ${state.active_profile_id}`);
console.log(`Experience level: ${profile.experience_level}`);
console.log(`Known topics: ${profile.known_topics.map(t => t.topic_id).join(', ')}`);

// Step 4: Profile Update Check (Simplified)
// Only trigger when the profile is empty (no known topics). Avoid time-based heuristics and keyword guessing.
const { Logger } = await import('./_internal/logger.js');
const logger = new Logger(state.active_session_id || 'LS-PREPLAN');

const hasKnownTopics = Array.isArray(profile.known_topics) && profile.known_topics.length > 0;
if (!hasKnownTopics) {
  logger.warn('Empty profile detected; offering goal-oriented update', { profile_id: state.active_profile_id });

  const UPDATE_CONFIRM_KEY = 'profile_update_confirm';
  const updateConfirmAnswer = AskUserQuestion({
    questions: [{
      key: UPDATE_CONFIRM_KEY,
      question: "Your profile has no known topics yet. Update it for this learning goal now?",
      header: "Profile Update",
      multiSelect: false,
      options: [
        { value: "yes", label: "Yes, Update", description: "Run goal-oriented profile update" },
        { value: "no", label: "Skip", description: "Continue with current profile" }
      ]
    }]
  });

  if (updateConfirmAnswer[UPDATE_CONFIRM_KEY] === 'yes') {
    console.log('\n## Updating Profile for Learning Goal\n');
    try {
      SlashCommand(`/learn:profile update --goal "${$ARGUMENTS}"`);
      profile = JSON.parse(Read(profilePath));
      console.log('\n✅ Profile updated successfully');
      console.log(`New topics count: ${profile.known_topics.length}`);
    } catch (e) {
      console.warn('⚠️  Profile update failed, continuing with existing profile:', e.message);
    }
  }
}

console.log('');
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
  related_experience: [],  // 相关技能（可迁移）
  recommended_focus: []    // 推荐聚焦方向（可操作建议）
};

// Transferable skill map (very small, illustrative; the agent performs the real inference)
const relatedSkills = {
  react: [{ topic_id: 'vue', score: 0.7 }, { topic_id: 'angular', score: 0.6 }, { topic_id: 'svelte', score: 0.55 }],
  typescript: [{ topic_id: 'javascript', score: 0.8 }],
  python: [{ topic_id: 'ruby', score: 0.5 }, { topic_id: 'javascript', score: 0.45 }]
};

const knownIds = new Set((profile.known_topics || []).map(t => t.topic_id));

// 分析 profile.known_topics
profile.known_topics.forEach(topic => {
  if (topic.proficiency < 0.3) {
    gapAnalysis.weak_topics.push(topic);
  } else if (topic.proficiency >= 0.5) {
    gapAnalysis.strong_topics.push(topic);
  }
});

// Naive missing topic inference from keywords (agent will do better)
for (const kw of goalKeywords) {
  const topic_id = String(kw).toLowerCase();
  if (!knownIds.has(topic_id)) gapAnalysis.missing_topics.push({ topic_id });
}

// Related experience: infer transferable skills from strong foundations
for (const t of gapAnalysis.strong_topics) {
  const mapped = relatedSkills[String(t.topic_id).toLowerCase()] || [];
  for (const rel of mapped) {
    if (!knownIds.has(rel.topic_id) && !gapAnalysis.missing_topics.some(m => m.topic_id === rel.topic_id)) {
      gapAnalysis.related_experience.push({ from: t.topic_id, to: rel.topic_id, transferability_score: rel.score });
    }
  }
}

// Recommended focus: prioritize missing topics with no strong transfer path
gapAnalysis.recommended_focus = gapAnalysis.missing_topics
  .filter(m => !gapAnalysis.related_experience.some(r => r.to === m.topic_id))
  .slice(0, 5)
  .map(m => ({ topic_id: m.topic_id, reason: 'Missing core topic for goal (no strong transfer signal found)' }));

console.log(`
## Knowledge Gap Analysis

Missing topics: ${gapAnalysis.missing_topics.length}
Weak topics: ${gapAnalysis.weak_topics.map(t => t.topic_id).join(', ')}
Strong foundation: ${gapAnalysis.strong_topics.map(t => t.topic_id).join(', ')}
Related experience: ${gapAnalysis.related_experience.map(r => `${r.from}→${r.to} (${r.transferability_score})`).join(', ')}
Recommended focus: ${gapAnalysis.recommended_focus.map(r => r.topic_id).join(', ')}
`);
```

### Phase 3: Plan Generation

**Initialize session folder (used by both agent/template paths)**:

```javascript
// Session ID generation
const dateStr = new Date().toISOString().split('T')[0].replace(/-/g, '');
const sessionCounter = loadNextSessionCounter();
const sessionId = `LS-${dateStr}-${sessionCounter.toString().padStart(3, '0')}`;

// Create session directory early so plan generation can write draft output
const sessionFolder = `.workflow/learn/sessions/${sessionId}`;
Bash(`mkdir -p ${sessionFolder}/interactions/notes`);
```

**Phase 1.5: JIT Assessment Triggers (Progressive Profiling)**:

> JIT Assessment removed to avoid interrupting the `/learn:plan` flow.  
> Ref: `.workflow/.analysis/ANL-learn-plan-optimization-2026-01-27/implementation-plan.md` Phase 2.1  
> Future: move to `/learn:execute` as on-demand preflight checks before each knowledge point.

#### Option A: Agent-Driven Planning (默认)

```javascript
// Real LLM agent invocation via ccw cli (with retry + fallback)
const { safeExecJson } = await import('./_internal/error-handler.js');
const { callBashJsonWithRetry } = await import('./_internal/agent-caller.js');
const { Logger } = await import('./_internal/logger.js');
// Note: safeExecJson uses lastJsonObjectFromText internally for robust parsing of noisy CLI output.

const agentTemplate = Bash('cat .claude/agents/learn-planning-agent.md');
const logger = new Logger(sessionId);

const agentContext = {
  goal,
  profile,
  gap_analysis: gapAnalysis,
  constraints: {
    max_knowledge_points: 15,
    no_time_estimates: true
  }
};

const cliPrompt = `${agentTemplate}\n\nINPUT_CONTEXT_JSON:\n${JSON.stringify(agentContext, null, 2)}\n\nIMPORTANT: Output ONLY a single JSON object (no markdown, no code fences).`;
const escapedPrompt = cliPrompt.replace(/'/g, "'\\''");

let planDraft = null;
let lastError = null;

if (!flags.noAgent) {
  try {
    const cliCommand = `ccw cli -p '${escapedPrompt}' --tool gemini --mode write --cd .`;
    const res = await callBashJsonWithRetry({
      command: cliCommand,
      description: 'learn-planning-agent via ccw cli',
      max_attempts: 3,
      timeout_ms: 600000,
      backoff_ms: 2000
    });
    planDraft = res.json;
    logger.info('Agent plan generated', { method: 'ccw-cli', attempts_used: res.attempts_used });
  } catch (e) {
    lastError = e;
    console.warn('⚠️ learn-planning-agent generation failed:', e?.message || e);
  }
}

// Fallback to template generation if agent unavailable/failed
if (!planDraft) {
  console.warn('⚠️ Agent generation failed. Falling back to template plan.', lastError?.message || lastError);
  planDraft = {
    session_id: sessionId,
    learning_goal: goal,
    profile_id: state.active_profile_id,
    knowledge_points: [
      {
        id: "KP-1",
        title: `${goal} - Fundamentals`,
        description: `Core concepts and basics of ${goal}`,
        prerequisites: [],
        topic_refs: [],
        resources: [{ type: "documentation", url: "https://example.com", summary: "Official documentation", quality: "gold" }],
        assessment: { type: "practical_task", description: `Build a simple project with ${goal}`, acceptance_criteria: ["Works correctly", "Code is clean"] },
        status: "pending"
      }
    ],
    dependency_graph: { nodes: ["KP-1"], edges: [] },
    _metadata: { created_at: new Date().toISOString(), generation_method: "template-fallback" }
  };
}

// Write draft and run validation gates (schema → DAG → profile warnings)
const draftPlanPath = `${sessionFolder}/plan.tmp.json`;
Write(draftPlanPath, JSON.stringify(planDraft, null, 2));
const validation = safeExecJson(
  `node .claude/commands/learn/_internal/learn-plan-validator.js ${draftPlanPath} --profile ${profilePath}`,
  'learn-plan-validator'
);

if (!validation.ok) {
  if (!validation.layer0?.ok) {
    console.error('❌ Plan schema validation failed:', validation.layer0?.errors);
    throw new Error('Plan generation failed schema validation. Please regenerate or fix agent output.');
  }
  if (!validation.layer1?.ok) {
    console.error('❌ Plan dependency graph validation failed:', validation.layer1?.errors);
    throw new Error('Plan generation produced a cyclic/invalid dependency graph. Please regenerate with acyclic prerequisites.');
  }
}

// Promote draft to final plan.json only after schema validation passes
Bash(`mv ${draftPlanPath} ${sessionFolder}/plan.json`);
let plan = JSON.parse(Read(`${sessionFolder}/plan.json`));
logger.info('Plan validated and written', { session_id: sessionId, plan_path: `${sessionFolder}/plan.json` });

// Layer 2: Profile→Plan matching (warning-only)
for (const w of validation.layer2?.warnings ?? []) {
  if (w.type === 'high_proficiency_topic' && w.knowledge_point_id) {
    const kp = plan.knowledge_points?.find(k => k.id === w.knowledge_point_id);
    if (kp && kp.status === 'pending') {
      kp.status = 'optional';
      kp._note = w.message;
    }
  }
}

// Store profile fingerprint to detect later mismatch between plan + profile
plan._metadata = plan._metadata || {};
plan._metadata.profile_fingerprint = validation.layer2?.profile_fingerprint ?? null;
Write(`${sessionFolder}/plan.json`, JSON.stringify(plan, null, 2));
```

#### Option B: Template-Based Planning (--no-agent)

```javascript
// 使用预定义模板生成简单计划
const { safeExecJson } = await import('./_internal/error-handler.js');

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
      topic_refs: [],
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
      status: "pending"
    },
    {
      id: "KP-2",
      title: `${goal} - Advanced Topics`,
      description: `Deep dive into advanced ${goal} concepts`,
      prerequisites: ["KP-1"],
      topic_refs: [],
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

// Layer 0: Schema Validation (blocking) before writing final plan.json
const draftPlanPath = `${sessionFolder}/plan.tmp.json`;
Write(draftPlanPath, JSON.stringify(templatePlan, null, 2));
const validation = safeExecJson(
  `node .claude/commands/learn/_internal/learn-plan-validator.js ${draftPlanPath} --profile ${profilePath}`,
  'learn-plan-validator'
);
if (!validation.ok) {
  if (!validation.layer0?.ok) {
    console.error('❌ Plan schema validation failed:', validation.layer0?.errors);
    throw new Error('Template plan failed schema validation. Please fix the template output.');
  }
  if (!validation.layer1?.ok) {
    console.error('❌ Plan dependency graph validation failed:', validation.layer1?.errors);
    throw new Error('Template plan produced a cyclic/invalid dependency graph. Fix prerequisites/edges to be acyclic.');
  }
}

Bash(`mv ${draftPlanPath} ${sessionFolder}/plan.json`);

// Layer 2: Profile→Plan matching (warning-only)
let plan = JSON.parse(Read(`${sessionFolder}/plan.json`));
for (const w of validation.layer2?.warnings ?? []) {
  if (w.type === 'high_proficiency_topic' && w.knowledge_point_id) {
    const kp = plan.knowledge_points?.find(k => k.id === w.knowledge_point_id);
    if (kp && kp.status === 'pending') {
      kp.status = 'optional';
      kp._note = w.message;
    }
  }
}
plan._metadata = plan._metadata || {};
plan._metadata.profile_fingerprint = validation.layer2?.profile_fingerprint ?? null;
Write(`${sessionFolder}/plan.json`, JSON.stringify(plan, null, 2));
```

### Phase 4: Session Creation

**实现细节**：

```javascript
// Note: sessionId/sessionFolder already created in Phase 3

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
const { Logger } = await import('./_internal/logger.js');
const logger = new Logger(sessionId);

// Display plan summary
const plan = JSON.parse(Read(`${sessionFolder}/plan.json`));

const easyCount = plan.knowledge_points.filter(kp => kp.estimated_effort === 'easy').length;
const mediumCount = plan.knowledge_points.filter(kp => kp.estimated_effort === 'medium').length;
const hardCount = plan.knowledge_points.filter(kp => kp.estimated_effort === 'hard').length;

const totalResources = plan.knowledge_points.reduce((acc, kp) => acc + (kp.resources?.length ?? 0), 0);

// Simple learning path visualization (topological levels) for user comprehension
const nodes = (plan.dependency_graph?.nodes?.length ? plan.dependency_graph.nodes : plan.knowledge_points.map(kp => kp.id)) || [];
const edges = plan.dependency_graph?.edges || [];

const incoming = new Map(nodes.map(n => [n, 0]));
const outgoing = new Map(nodes.map(n => [n, []]));
for (const e of edges) {
  if (!incoming.has(e.to)) incoming.set(e.to, 0);
  if (!outgoing.has(e.from)) outgoing.set(e.from, []);
  incoming.set(e.to, (incoming.get(e.to) || 0) + 1);
  outgoing.get(e.from).push(e.to);
}

// Kahn topological order + derived "depth"
const queue = nodes.filter(n => (incoming.get(n) || 0) === 0);
const topo = [];
const depth = new Map(nodes.map(n => [n, 0]));
while (queue.length > 0) {
  const cur = queue.shift();
  topo.push(cur);
  const nexts = outgoing.get(cur) || [];
  for (const nxt of nexts) {
    depth.set(nxt, Math.max(depth.get(nxt) || 0, (depth.get(cur) || 0) + 1));
    incoming.set(nxt, (incoming.get(nxt) || 0) - 1);
    if ((incoming.get(nxt) || 0) === 0) queue.push(nxt);
  }
}

const levels = {};
for (const id of topo) {
  const d = depth.get(id) || 0;
  levels[d] = levels[d] || [];
  levels[d].push(id);
}
const learningPath = Object.keys(levels)
  .map(k => Number(k))
  .sort((a, b) => a - b)
  .map((lvl) => `  Level ${lvl}: ${levels[lvl].join(', ')}`)
  .join('\\n');

console.log(`
## Learning Plan Summary

**Goal**: ${goal}
**Session ID**: ${sessionId}

**Knowledge Points**: ${plan.knowledge_points.length}
- Easy: ${easyCount}
- Medium: ${mediumCount}
- Hard: ${hardCount}

**Resources**:
- Total: ${totalResources}

**Dependencies**:
${plan.dependency_graph.edges.map(edge =>
  `  ${edge.from} → ${edge.to}`
).join('\n')}

**Learning Path**:
${learningPath}

**Validation**: ✅ Schema + DAG checks passed (see validation gate output)

Next: /learn:execute
`);

// Ask user confirmation (规范化key-based访问)
const PLAN_CONFIRMATION_KEY = 'plan_action';

const answer = AskUserQuestion({
  questions: [{
    key: PLAN_CONFIRMATION_KEY,
    question: "Accept this plan and start learning?",
    header: "Plan Action",
    multiSelect: false,
    options: [
      { value: "accept", label: "Accept", description: "Start learning with /learn:execute" },
      { value: "reject", label: "Reject", description: "Regenerate plan" }
    ]
  }]
});

// 使用key-based访问（稳健方式）
const userChoice = answer[PLAN_CONFIRMATION_KEY];

if (userChoice === 'accept') {
  logger.info('Plan accepted by user', { session_id: sessionId });
  console.log(`✅ Plan accepted! Use /learn:execute to begin learning.`);
} else {
  logger.info('Plan rejected by user; regenerate requested', { session_id: sessionId });
  console.log('↩️ Plan rejected. Regenerating plan...');
  // Return to Phase 3 for regeneration (agent/template path).
}
```

## Error Handling

| Error | Resolution |
|-------|------------|
| Profile not found | Auto-create default profile via `/learn:profile create` |
| Agent timeout | Fallback to template-based planning |
| Invalid session ID | Generate new session ID |
| Plan validation fails | Check validation layer (0-2), regenerate or manual fix |
| Directory creation fails | Check `.workflow/learn/` permissions |
| Schema validation fails | Review plan.json against learn-plan.schema.json |
| Circular dependencies | Use DAG validator to identify cycle, break dependency chain |
| MCP tools unavailable | Clarify degraded mode acceptance or cancel |

## P0 Fixes Applied (Multi-CLI Analysis)

Based on 3-round multi-CLI collaborative analysis (Gemini → Codex → Gemini), following P0 blockers have been addressed:

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
**Solution**: Implemented 3-layer QA gate (schema → DAG → profile warnings)
- Layer 0: Schema validation (阻断型)
- Layer 1: Graph validity (阻断型)
- Layer 2: Profile→Plan matching (告警型)

### 4. AskUserQuestion Pattern ✅

**Problem**: Brittle `Object.values(answer)[0]` usage
**Solution**: Key-based access pattern (see Phase 5: User Confirmation)

```javascript
// ✅ Robust pattern
const KEY = 'action_key';
const answer = AskUserQuestion({ questions: [{ key: KEY, ... }] });
const choice = answer[KEY];
```

## Quality Checklist

Before completing plan generation, verify:

- [ ] `plan.json` follows `learn-plan.schema.json`
- [ ] No circular dependencies in knowledge_points
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

### (Reserved) Layer 3: Resource Quality Scoring（告警型）

Layer 3 scoring is not implemented in the MVP docs/runtime. Current validation behavior:
- Layer 0: Schema validation (blocking)
- Layer 1: DAG validity (blocking)
- Layer 2: Profile→Plan matching (warning-only)

If you need resource quality enforcement (e.g. “each KP has 1 gold resource”), implement it as a separate validator step and document the UX explicitly.

**版本**: v1.0.0-mvp
**状态**: MVP Ready - P0 Fixes Applied
**最后更新**: 2026-01-24
