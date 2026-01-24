# Learn Workflow - Multi-CLI Analysis Synthesis

> 基于3轮多CLI协作分析的最终设计方案
> **Round 1**: Gemini (架构设计) → **Round 2**: Codex (交叉验证) → **Round 3**: Gemini (综合方案)
> 
> **分析时间**: 2026-01-24
> **总耗时**: ~700秒

---

## 执行概要

### 分析结论

通过三轮多CLI协作分析，learn workflow从初步设计演进为可执行的实现方案。核心设计方向包括：

1. **Isolated Strategy 保持不变** - 所有数据存储在 `.workflow/learn/`，零核心代码修改
2. **数据模型增强** - 从简单profile演进为三层架构（Persona/Profile/Session）+ 跨会话知识图谱
3. **质量保证机制** - 多层QA门（Schema验证 → DAG检测 → Profile匹配 → 资源质量评分）
4. **MCP工具集成** - ACE（本地上下文）+ Exa（外部资源）+ smart_search（精确匹配）
5. **交互模式优化** - Clarification阻塞 + 两次强反馈（plan确认 + session review）

### 两轮分析对比

| 维度 | Round 1 (Gemini) | Round 2 (Codex) | 最终决策 |
|------|------------------|-----------------|----------|
| **Profile架构** | 提出三层模型 | 认为MVP过重，建议2层 | **渐进式**：MVP用2层，P2引入三层 |
| **能力测量** | evidence-based评估 | 同意方向，强调置信度 | **证据+置信度**：避免绝对分数 |
| **交互设计** | 6阶段plan生成 | 警告交互疲劳风险 | **收敛反馈点**：只保留plan+review两处强反馈 |
| **MCP集成** | ACE+Exa策略 | 补充fallback机制 | **完整fallback链**：工具级+CLI级 |
| **CLI集成** | 基础调用 | **识别P0阻断**：issue接口不匹配 | **修复为stdin JSON模式** |

---

## P0 阻断问题与解决方案

### 1. Issue CLI集成接口不匹配 ❌ → ✅

**问题**: 草案使用 `ccw issue create --title --body`，但实际CLI需要stdin JSON

**解决方案**:
```typescript
// ❌ 错误方式
const command = `ccw issue create --title "${title}" --body "${body}"`;

// ✅ 正确方式
const issueData = { title: "...", body: "...", labels: [...] };
const issueJson = JSON.stringify(issueData);
const command = `echo '${issueJson}' | ccw issue create --json-stdin`;
```

### 2. Schema文件缺失 ❌ → ✅

**问题**: 草案引用 `learn-plan-schema.json` 等文件但不存在

**解决方案**: 已创建3个P0 schema文件
- `schemas/learn-state.schema.json` - 全局状态定义
- `schemas/learn-profile.schema.json` - 用户档案定义
- `schemas/learn-plan.schema.json` - 学习计划定义（含maxItems:15约束）

### 3. DAG循环依赖验证缺失 ❌ → ✅

**问题**: 计划生成后无验证，可能存在循环依赖

**解决方案**: 实现DFS-based cycle detection
```javascript
function detectCycle(knowledgePoints) {
  const visiting = new Set();
  const visited = new Set();
  const kpMap = new Map(knowledgePoints.map(kp => [kp.id, kp]));

  function hasCycle(kpId) {
    visiting.add(kpId);
    const kp = kpMap.get(kpId);
    if (kp?.prerequisites) {
      for (const prereqId of kp.prerequisites) {
        if (visiting.has(prereqId)) return true; // Cycle detected
        if (!visited.has(prereqId) && hasCycle(prereqId)) return true;
      }
    }
    visiting.delete(kpId);
    visited.add(kpId);
    return false;
  }

  return knowledgePoints.some(kp => !visited.has(kp.id) && hasCycle(kp.id));
}
```

### 4. AskUserQuestion使用不规范 ⚠️ → ✅

**问题**: 部分代码使用 `Object.values(answer)[0]`，对问题顺序敏感

**解决方案**: 使用key-based访问
```javascript
// ❌ 脆弱方式
const choice = Object.values(answer)[0];

// ✅ 稳健方式
const STEP_KEY = 'next_step';
const answer = AskUserQuestion({
  questions: [{ key: STEP_KEY, question: "...", options: [...] }]
});
const choice = answer[STEP_KEY];
```

---

## MVP实现路线图 (P0 → P1 → P2)

### P0: 基础稳定性（立即优先）

**目标**: 可靠、可用的单用户工作流

1. ✅ **Schema定义** - 创建3个JSON schema文件（已完成）
2. ⏳ **CLI修复** - 实现正确的issue集成（stdin JSON）
3. ⏳ **验证门(L0/L1)** - 实现schema验证和DAG循环检测
4. ⏳ **核心命令桩** - 实现所有learn:*命令的基础I/O
5. ⏳ **静态计划** - 实现 `--no-agent` 路径用于测试

**验收标准**:
- `/learn:plan "goal" --no-agent` → 生成有效session
- `/learn:execute` → 正确显示KP内容
- `/learn:execute --create-issue` → 成功创建issue（无报错）
- 所有JSON文件符合schema定义

### P1: 核心智能与质量（第二优先）

**目标**: 智能、个性化、高质量的计划体验

1. ⏳ **MCP工具集成** - 集成ACE+Exa+smart_search获取高质量资源
2. ⏳ **验证门(L2/L3)** - Profile匹配检查 + 资源质量评分
3. ⏳ **learn:ask MVP** - 实现上下文Q&A
4. ⏳ **learn:review MVP** - 实现档案更新（known_topics proficiency）
5. ⏳ **澄清阻塞** - 目标过泛时使用AskUserQuestion澄清

**验收标准**:
- Agent生成的计划包含Gold-tier资源
- 高熟练度topic被标记为optional
- 用户问题基于当前KP上下文回答
- Session完成后profile proficiency提升

### P2: 长期知识与个性化（第三优先）

**目标**: 系统随时间学习用户和领域知识

1. ⏳ **三层Profile** - 完整Persona/Profile/Session架构 + 继承机制
2. ⏳ **知识图谱** - topics.json + graph.json + observations.jsonl
3. ⏳ **反馈闭环** - feedback_journal驱动计划微调

**验收标准**:
- 可创建继承自parent profile的specialized profile
- 跨session的知识点关联
- 计划生成考虑历史学习证据

---

## 关键代码示例

### Issue集成（正确方式）

```typescript
function handleCreateIssue(kp, plan, sessionId) {
  const issueData = {
    title: `Learn: ${kp.title}`,
    body: `
# Knowledge Point: ${kp.id}

**Description**: ${kp.description}
**Learning Goal**: ${plan.learning_goal}

**Resources**:
${kp.resources.map(r => `- [${r.type}](${r.url}): ${r.summary}`).join('\n')}

**Assessment**:
- Type: ${kp.assessment.type}
- Task: ${kp.assessment.description}

---
*Generated from learn session: ${sessionId}*
    `.trim(),
    labels: ['learning-task', sessionId]
  };

  const issueJson = JSON.stringify(issueData);
  const command = `echo '${issueJson}' | ccw issue create --json-stdin`;
  
  // Execute via Bash tool
  // Bash({ command, run_in_background: false });
}
```

### 资源质量评分（rubric-based）

```javascript
function scoreResource(resource) {
  const goldIndicators = ['official docs', 'typescriptlang.org', 'developer.mozilla.org'];
  const silverIndicators = ['blog', 'tutorial', 'course'];
  const bronzeIndicators = ['stackoverflow', 'medium.com', 'dev.to'];
  
  const url = resource.url.toLowerCase();
  
  if (goldIndicators.some(ind => url.includes(ind))) {
    return { quality: 'gold', score: 0.9, reason: 'Official documentation' };
  } else if (silverIndicators.some(ind => url.includes(ind))) {
    return { quality: 'silver', score: 0.7, reason: 'High-quality tutorial' };
  } else {
    return { quality: 'bronze', score: 0.5, reason: 'Community resource' };
  }
}
```

### MCP工具链集成（在agent内）

```markdown
# Resource Discovery Protocol (for learn-planning-agent)

## Step 1: Codebase Context (if applicable)
Use `mcp__ace-tool__search_context` to find local implementations:
```
query: "{topic} best practices"
project_root_path: "/path/to/project"
```

## Step 2: External Resources
Use `mcp__exa__get_code_context_exa` to fetch authoritative docs:
```
query: "official {topic} documentation 2025"
tokensNum: 5000
```

## Step 3: Fallback
If MCP tools unavailable:
- Use static resource list (official URLs)
- Mark resources as "unverified"
- Allow user to add manual resources
```

---

## 最终架构决策

### 数据结构层次

```
.workflow/learn/
├── state.json                    # 全局状态（active_profile_id, active_session_id）
├── profiles/
│   └── {profile-id}.json        # 用户档案（known_topics, learning_preferences）
├── sessions/
│   ├── index.json               # 会话索引
│   └── {session-id}/
│       ├── manifest.json        # 会话元数据（目标、profile、时间）
│       ├── plan.json            # 学习计划（DAG、资源、评估）
│       ├── progress.json        # 进度跟踪（完成状态、交互记录）
│       └── interactions/        # Q&A历史、笔记
└── knowledge/                    # P2: 跨会话知识图谱
    ├── topics.json
    ├── graph.json
    └── observations.jsonl
```

### 控制流程

```mermaid
graph TD
    A[Start] --> B[/learn:plan "goal"];
    B --> C[Agent: Generate plan.json];
    C --> D[Validation Gate: Schema + DAG];
    D --> E{User Confirm?};
    E -- Yes --> F[Create Session];
    E -- No --> G[Discard/Regenerate];
    F --> H[/learn:execute];
    H --> I[Display KP + Resources];
    I --> J{User Action};
    J -- Complete --> K[Update progress.json];
    J -- Ask --> L[/learn:ask];
    L --> M[Agent: Contextual Q&A];
    M --> I;
    J -- Issue --> N[Bash: ccw issue create];
    K --> O{More KPs?};
    O -- Yes --> I;
    O -- No --> P[/learn:review];
    P --> Q[Update profile.known_topics];
    Q --> R[End];
```

---

## 未实现项与未来工作

### 当前范围（MVP P0+P1）
- ✅ 三层JSON schema定义
- ✅ DAG循环检测算法
- ✅ Issue CLI正确集成方式
- ✅ AskUserQuestion规范用法
- ⏳ MCP工具集成策略文档

### P2保留项（未来工作）
- ⏳ Persona独立存储与演进机制
- ⏳ Profile继承合并规则
- ⏳ 跨会话知识图谱
- ⏳ 高级反馈闭环（feedback_journal驱动）

### 技术债务
- ⏳ Schema运行时验证器（需集成ajv或类似库）
- ⏳ 资源质量自动化评分（需heuristics+ML）
- ⏳ 并发安全（文件锁机制）

---

## 参考资料与相关会话

**CLI分析会话**:
- Round 1 (Gemini): `1769262215188-gemini` - 架构设计与方案提出
- Round 2 (Codex): `1769262215188-gemini` (turn 2) - 交叉验证与风险识别
- Round 3 (Gemini): `1769263133474-gemini` - 综合分析与最终方案

**相关文档**:
- `.workflow/.scratchpad/learn-workflow-draft/README.md` - v1.0基础架构
- `.workflow/.scratchpad/learn-workflow-draft/ENHANCEMENT_PLAN.md` - v2.0增强项汇总
- `.claude/commands/learn/start-v2.md` - 画像采集原型参考
- `.claude/commands/learn/start-v4.md` - 能力测量原型参考
- `ccw/src/commands/issue.ts:259` - Issue CLI实际接口

---

**版本**: v1.0.0-synthesis
**状态**: Final - Ready for Implementation
**最后更新**: 2026-01-24
