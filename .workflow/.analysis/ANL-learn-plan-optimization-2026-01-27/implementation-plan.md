# learn:plan 渐进式优化实施方案

**Session**: ANL-learn-plan-optimization-2026-01-27
**Created**: 2026-01-27T14:48:00+08:00
**Strategy**: 渐进式优化（4 Phases）

---

## Phase 1: 代码质量优化（立即执行）

**目标**: 减少100行代码，提升可维护性
**风险**: 低
**预估工作量**: 2-3小时

### 1.1 提取重复函数

**问题**: `lastJsonObjectFromText` 函数重复3次（lines 281, 423, 606）

**实施步骤**:

1. 在 `.claude/commands/learn/_internal/` 创建 `json-parser.js`:

```javascript
/**
 * Parse JSON from command output (tolerates noisy output)
 * @param {string} text - Raw command output
 * @returns {object} Parsed JSON object
 * @throws {Error} If no valid JSON found
 */
function lastJsonObjectFromText(text) {
  const raw = String(text ?? '').trim();
  if (!raw) throw new Error('Empty command output');

  // Prefer parsing the last JSON-looking line
  const lines = raw.split('\n').map(l => l.trim()).filter(Boolean);
  for (let i = lines.length - 1; i >= 0; i--) {
    try {
      return JSON.parse(lines[i]);
    } catch {
      // keep scanning
    }
  }

  // Fallback: code-fenced JSON blocks (LLM outputs)
  const m = raw.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (m) return JSON.parse(m[1].trim());

  throw new Error('Failed to parse JSON from command output');
}

module.exports = { lastJsonObjectFromText };
```

2. 在 `plan.md` 中替换所有3处定义:

```javascript
// 在文件顶部添加
const { lastJsonObjectFromText } = require('./_internal/json-parser');

// 删除 lines 281-300, 423-437, 606-620 的重复定义
// 直接使用导入的函数
```

**预期收益**: 减少60行代码

### 1.2 统一错误处理模式

**问题**: 错误处理不统一（try-catch vs 直接调用）

**实施步骤**:

1. 创建 `.claude/commands/learn/_internal/error-handler.js`:

```javascript
/**
 * Safe file read with error handling
 * @param {string} path - File path
 * @param {object} defaultValue - Default value if file not found
 * @returns {object} Parsed JSON or default value
 */
function safeReadJson(path, defaultValue = null) {
  try {
    const content = Read(path);
    return JSON.parse(content);
  } catch (e) {
    if (defaultValue !== null) {
      return defaultValue;
    }
    throw new Error(`Failed to read ${path}: ${e.message}`);
  }
}

/**
 * Safe command execution with JSON parsing
 * @param {string} command - Command to execute
 * @param {string} description - Error description
 * @returns {object} Parsed JSON result
 */
function safeExecJson(command, description) {
  try {
    const output = Bash(command);
    return lastJsonObjectFromText(output);
  } catch (e) {
    throw new Error(`${description} failed: ${e.message}`);
  }
}

module.exports = { safeReadJson, safeExecJson };
```

2. 在 `plan.md` 中统一使用:

```javascript
const { safeReadJson, safeExecJson } = require('./_internal/error-handler');

// 替换所有 try-catch 读取
// Before:
try {
  state = JSON.parse(Read(statePath));
} catch (e) {
  state = { active_profile_id: null, ... };
}

// After:
state = safeReadJson(statePath, { active_profile_id: null, ... });

// 替换所有命令执行
// Before:
const validation = lastJsonObjectFromText(Bash(`node ...`));

// After:
const validation = safeExecJson(`node ...`, 'Validation');
```

**预期收益**: 减少30行代码，提升可读性

### 1.3 添加日志记录机制

**问题**: 缺少日志，难以调试

**实施步骤**:

1. 创建 `.claude/commands/learn/_internal/logger.js`:

```javascript
/**
 * Simple logger for learn workflow
 */
class Logger {
  constructor(sessionId) {
    this.sessionId = sessionId;
    this.logFile = `.workflow/learn/sessions/${sessionId}/execution.log`;
  }

  log(level, message, data = null) {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      level,
      session_id: this.sessionId,
      message,
      data
    };

    // Console output
    const prefix = {
      'info': 'ℹ️',
      'warn': '⚠️',
      'error': '❌',
      'debug': '🔍'
    }[level] || '';

    console.log(`${prefix} ${message}`);

    // File output (append)
    try {
      const existing = Read(this.logFile) || '';
      Write(this.logFile, existing + JSON.stringify(logEntry) + '\n');
    } catch (e) {
      // Ignore log write failures
    }
  }

  info(message, data) { this.log('info', message, data); }
  warn(message, data) { this.log('warn', message, data); }
  error(message, data) { this.log('error', message, data); }
  debug(message, data) { this.log('debug', message, data); }
}

module.exports = { Logger };
```

2. 在 `plan.md` 中使用:

```javascript
const { Logger } = require('./_internal/logger');

// 在 session 创建后初始化
const logger = new Logger(sessionId);

// 在关键步骤添加日志
logger.info('Profile loaded', { profile_id: profile.profile_id });
logger.info('Starting plan generation', { goal });
logger.warn('Agent generation failed, using template', { error: lastError });
logger.info('Plan validated successfully', { validation_result });
```

**预期收益**: 增加20行代码，但大幅提升可调试性

### 1.4 移除未使用代码

**问题**: 文档中有大量未实现的代码示例

**实施步骤**:

1. 移除 lines 1242-1294 的 Clarification Blocking 示例（未实现）
2. 移除 lines 1111-1179 的 Layer 3 验证示例（未实现）
3. 清理注释和过时的 TODO

**预期收益**: 减少130行文档代码

### Phase 1 总结

**代码变更**:
- 新增文件: `json-parser.js`, `error-handler.js`, `logger.js`
- 修改文件: `plan.md`
- 删除: 重复代码和未实现示例

**代码量变化**:
- 减少: 220行（重复代码60 + 统一处理30 + 未使用130）
- 增加: 120行（新工具函数100 + 日志20）
- 净减少: 100行

**测试验证**:
- 运行 `/learn:plan "Test goal"` 确保功能正常
- 检查 `execution.log` 确认日志记录
- 验证错误处理（故意触发错误）

---

## Phase 2: 流程简化（短期执行）

**目标**: 减少200行代码，改善用户体验
**风险**: 中
**预估工作量**: 4-6小时

### 2.1 移除 JIT Assessment

**问题**: 142行代码，打断用户流程

**实施步骤**:

1. 在 `plan.md` 中注释掉 lines 273-414 的 JIT Assessment 代码:

```javascript
// JIT Assessment 已移除，将在 learn:execute 中按需评估
// 原因：打断用户流程，复杂度高（142行）
// 参考：ANL-learn-plan-optimization-2026-01-27

// 如果需要恢复，参考 git history
```

2. 在 `learn-execute.md` 中添加 JIT Assessment 触发点（未来实现）:

```javascript
// Phase 2: Knowledge Point Execution
// 在开始学习某个 KP 前，检查 confidence
if (kp.confidence < 0.6) {
  // 触发 JIT Assessment（简化版）
  const confidence = askUserConfidence(kp.topic_refs);
  updateProfile(kp.topic_refs, confidence);
}
```

**预期收益**: 减少142行代码，改善用户体验

### 2.2 简化 Profile Update Check

**问题**: 63行代码，逻辑复杂

**实施步骤**:

1. 简化 lines 158-220 的 Profile Update Check:

```javascript
// Before: 63 lines with 30-day check and tech keyword matching

// After: 简化版（15 lines）
if (!profile.known_topics || profile.known_topics.length === 0) {
  logger.warn('Profile is empty, consider updating');

  const UPDATE_KEY = 'profile_update';
  const answer = AskUserQuestion({
    questions: [{
      key: UPDATE_KEY,
      question: "Your profile is empty. Update now?",
      header: "Profile Update",
      multiSelect: false,
      options: [
        {value: "yes", label: "Yes", description: "Update profile for this goal"},
        {value: "no", label: "Skip", description: "Continue with empty profile"}
      ]
    }]
  });

  if (answer[UPDATE_KEY] === 'yes') {
    SlashCommand(`/learn:profile update --goal "${$ARGUMENTS}"`);
    profile = safeReadJson(profilePath);
  }
}
```

**预期收益**: 减少48行代码

### 2.3 移除 Layer 3 验证文档

**问题**: 未实现，但有68行文档

**实施步骤**:

1. 删除 lines 1111-1179 的 Layer 3 Resource Quality Scoring 文档
2. 在 Phase 4 文档中添加注释:

```markdown
## Phase 4: Validation Gate

**当前实现**: 3层验证
- Layer 0: Schema Validation（阻断型）
- Layer 1: Graph Validity（阻断型）
- Layer 2: Profile→Plan Matching（告警型）

**已移除**: Layer 3 Resource Quality Scoring
- 原因：未实现，且可能过于严格
- 参考：ANL-learn-plan-optimization-2026-01-27
```

**预期收益**: 减少68行文档

### 2.4 简化 User Confirmation

**问题**: 4个选项，逻辑复杂

**实施步骤**:

1. 简化 lines 764-817 的 User Confirmation:

```javascript
// Before: 4 options (accept, review, modify, save)

// After: 2 options
const CONFIRM_KEY = 'confirm_plan';
const answer = AskUserQuestion({
  questions: [{
    key: CONFIRM_KEY,
    question: "Accept this learning plan?",
    header: "Confirmation",
    multiSelect: false,
    options: [
      {value: "accept", label: "Accept", description: "Start learning with /learn:execute"},
      {value: "reject", label: "Reject", description: "Regenerate plan"}
    ]
  }]
});

if (answer[CONFIRM_KEY] === 'reject') {
  logger.info('Plan rejected, regenerating...');
  // 返回 Phase 3 重新生成
  return planGenerationPhase();
}

logger.info('Plan accepted', { session_id: sessionId });
console.log(`✅ Plan accepted! Use /learn:execute to begin.`);
```

**预期收益**: 减少40行代码，简化用户决策

### Phase 2 总结

**代码变更**:
- 修改文件: `plan.md`, `learn-execute.md`（添加 TODO）
- 删除: JIT Assessment, 复杂的 Profile Update Check, Layer 3 文档

**代码量变化**:
- 减少: 298行（JIT 142 + Profile Check 48 + Layer 3 68 + Confirmation 40）
- 增加: 15行（简化的 Profile Check）
- 净减少: 283行（超出预期）

**测试验证**:
- 运行 `/learn:plan "Test goal"` 确保流程流畅
- 验证 Profile Update Check 只在空 profile 时触发
- 验证 User Confirmation 只有2个选项

---

## Phase 3: Agent 调用优化（中期执行）

**目标**: 改进可靠性，重构100行代码
**风险**: 高
**预估工作量**: 6-8小时

### 3.1 评估 Task tool vs ccw cli

**决策矩阵**:

| 维度 | Task tool | ccw cli | 推荐 |
|------|-----------|---------|------|
| 错误处理 | ✅ 内置 | ❌ 手动 | Task tool |
| 重试机制 | ✅ 自动 | ❌ 手动 | Task tool |
| JSON 解析 | ✅ 自动 | ❌ 正则 | Task tool |
| 工具切换 | ❌ 固定 | ✅ 灵活 | ccw cli |
| 依赖性 | ❌ Claude Code | ✅ 独立 | ccw cli |

**推荐方案**: 混合使用

```javascript
// 优先使用 Task tool（更可靠）
// 失败后回退到 ccw cli（更灵活）
```

### 3.2 实施混合 Agent 调用

**实施步骤**:

1. 创建 `.claude/commands/learn/_internal/agent-caller.js`:

```javascript
const { Logger } = require('./logger');
const { lastJsonObjectFromText } = require('./json-parser');

/**
 * Call learn-planning-agent with fallback
 * @param {object} context - Agent context (goal, profile, gap_analysis)
 * @param {Logger} logger - Logger instance
 * @returns {object} Generated plan
 */
async function callPlanningAgent(context, logger) {
  // Method 1: Task tool (preferred)
  try {
    logger.info('Calling learn-planning-agent via Task tool');

    const result = Task({
      subagent_type: "learn-planning-agent",
      run_in_background: false,
      description: "Generate learning plan",
      prompt: `
## Agent Context

${JSON.stringify(context, null, 2)}

## Instructions

Generate a learning plan following learn-plan.schema.json.
Output ONLY a single JSON object (no markdown, no code fences).
      `
    });

    const plan = JSON.parse(result);
    logger.info('Task tool succeeded', { kp_count: plan.knowledge_points.length });
    return plan;

  } catch (e) {
    logger.warn('Task tool failed, trying ccw cli', { error: e.message });
  }

  // Method 2: ccw cli (fallback)
  try {
    logger.info('Calling learn-planning-agent via ccw cli');

    const agentTemplate = Read('.claude/agents/learn-planning-agent.md');
    const cliPrompt = `${agentTemplate}\n\nINPUT_CONTEXT_JSON:\n${JSON.stringify(context, null, 2)}`;
    const escapedPrompt = cliPrompt.replace(/'/g, "'\\''");

    // 动态重试（3-5次，根据错误类型）
    let lastError = null;
    for (let attempt = 1; attempt <= 5; attempt++) {
      try {
        const raw = Bash(`ccw cli -p '${escapedPrompt}' --tool gemini --mode write --cd .`);
        const plan = lastJsonObjectFromText(raw);

        logger.info('ccw cli succeeded', {
          attempt,
          kp_count: plan.knowledge_points.length
        });
        return plan;

      } catch (e) {
        lastError = e;
        logger.warn(`ccw cli attempt ${attempt} failed`, { error: e.message });

        // 根据错误类型决定是否继续重试
        if (e.message.includes('timeout') && attempt < 5) {
          const backoff = Math.pow(2, attempt);
          logger.info(`Retrying after ${backoff}s backoff`);
          Bash(`sleep ${backoff}`);
        } else if (attempt >= 3) {
          break; // 其他错误，3次后停止
        }
      }
    }

    throw lastError;

  } catch (e) {
    logger.error('All agent methods failed', { error: e.message });
    throw new Error(`Agent generation failed: ${e.message}`);
  }
}

module.exports = { callPlanningAgent };
```

2. 在 `plan.md` 中使用:

```javascript
const { callPlanningAgent } = require('./_internal/agent-caller');

// 替换 lines 419-498 的 Agent 调用代码
const agentContext = {
  goal,
  profile,
  gap_analysis: gapAnalysis,
  constraints: {
    max_knowledge_points: 15,
    require_gold_resource_per_kp: true,
    no_time_estimates: true
  }
};

let planDraft;
if (!flags.noAgent) {
  planDraft = await callPlanningAgent(agentContext, logger);
} else {
  // 简化的模板生成（保留作为 --no-agent 选项）
  planDraft = generateTemplatePlan(goal, profile);
}
```

**预期收益**: 重构80行代码，提升可靠性

### 3.3 添加超时控制

**实施步骤**:

1. 在 `agent-caller.js` 中添加超时:

```javascript
// 在 Bash 调用中添加超时
const raw = Bash(`timeout 120 ccw cli -p '${escapedPrompt}' ...`);
// 或使用 Bash tool 的 timeout 参数
const raw = Bash({
  command: `ccw cli -p '${escapedPrompt}' ...`,
  timeout: 120000 // 2 minutes
});
```

**预期收益**: 防止无限等待

### Phase 3 总结

**代码变更**:
- 新增文件: `agent-caller.js`
- 修改文件: `plan.md`
- 删除: 旧的 Agent 调用代码

**代码量变化**:
- 减少: 80行（旧 Agent 调用）
- 增加: 100行（新 agent-caller.js）
- 净增加: 20行（但可靠性大幅提升）

**测试验证**:
- 测试 Task tool 调用（正常情况）
- 测试 ccw cli 回退（Task tool 失败）
- 测试超时控制（模拟慢响应）
- 测试动态重试（不同错误类型）

---

## Phase 4: Profile 个性化增强（长期执行）

**目标**: 增强 Agent 的 Profile-aware 能力
**风险**: 中
**预估工作量**: 8-12小时

### 4.1 增强 Agent 提示词

**实施步骤**:

1. 修改 `.claude/agents/learn-planning-agent.md`:

```markdown
## Profile-Aware Planning Instructions

You are generating a personalized learning plan based on the user's profile.

### Profile Analysis

**Known Topics**: ${profile.known_topics.map(t => `${t.topic_id} (proficiency: ${t.proficiency})`).join(', ')}
**Experience Level**: ${profile.experience_level}
**Learning Goal**: ${goal}

### Personalization Rules

1. **Skip High-Proficiency Topics**:
   - If a topic has proficiency >= 0.8, mark the KP as "optional"
   - Add note: "You already know this well"

2. **Adjust Difficulty**:
   - For beginners (experience_level: beginner): Focus on fundamentals, more easy KPs
   - For intermediate: Balance theory and practice
   - For advanced: Focus on advanced topics, more hard KPs

3. **Build on Existing Knowledge**:
   - Identify related topics the user already knows
   - Use them as prerequisites or references
   - Example: If user knows React, use it as foundation for Next.js

4. **Resource Recommendation**:
   - Prioritize resources matching user's experience level
   - For beginners: Tutorials, guided courses
   - For advanced: Documentation, research papers

### Output Requirements

Generate a JSON plan with:
- Knowledge points tailored to user's level
- Prerequisites based on known topics
- Resources matching experience level
- Difficulty distribution appropriate for user
```

**预期收益**: 更个性化的计划

### 4.2 改进 Gap Analysis

**实施步骤**:

1. 在 `plan.md` 中增强 Gap Analysis:

```javascript
// 当前简化版（lines 225-256）
// 改进为更详细的分析

function analyzeGap(goal, profile) {
  const goalKeywords = extractKeywords(goal);
  const knownTopics = profile.known_topics.map(t => t.topic_id.toLowerCase());

  const analysis = {
    missing_topics: [],
    weak_topics: [],
    strong_topics: [],
    related_experience: [],
    recommended_focus: []
  };

  // 分析缺失的 topic
  goalKeywords.forEach(keyword => {
    if (!knownTopics.includes(keyword.toLowerCase())) {
      analysis.missing_topics.push(keyword);
    }
  });

  // 分析已知 topic 的熟练度
  profile.known_topics.forEach(topic => {
    if (topic.proficiency < 0.3) {
      analysis.weak_topics.push(topic);
    } else if (topic.proficiency >= 0.7) {
      analysis.strong_topics.push(topic);
    }
  });

  // 识别相关经验（可迁移技能）
  const relatedSkills = {
    'react': ['vue', 'angular', 'svelte'],
    'python': ['ruby', 'javascript'],
    'typescript': ['javascript', 'flow']
  };

  goalKeywords.forEach(keyword => {
    const related = relatedSkills[keyword.toLowerCase()] || [];
    related.forEach(skill => {
      if (knownTopics.includes(skill)) {
        analysis.related_experience.push({
          goal_topic: keyword,
          known_topic: skill,
          transferability: 0.7
        });
      }
    });
  });

  // 推荐学习重点
  if (analysis.missing_topics.length > 5) {
    analysis.recommended_focus.push('Start with fundamentals');
  }
  if (analysis.weak_topics.length > 0) {
    analysis.recommended_focus.push('Strengthen weak areas first');
  }

  return analysis;
}
```

**预期收益**: 更准确的差距分析

### 4.3 优化个性化推荐算法

**实施步骤**:

1. 在 Agent 中添加资源评分逻辑:

```javascript
// 在 learn-planning-agent.md 中添加

### Resource Scoring Algorithm

For each resource, calculate a personalization score:

score = base_quality * experience_match * topic_relevance

Where:
- base_quality: gold=1.0, silver=0.7, bronze=0.5
- experience_match:
  - beginner: tutorials=1.0, docs=0.5, papers=0.2
  - intermediate: tutorials=0.7, docs=1.0, papers=0.5
  - advanced: tutorials=0.3, docs=0.8, papers=1.0
- topic_relevance: 1.0 if exact match, 0.7 if related

Recommend top 3-5 resources per KP, sorted by score.
```

**预期收益**: 更相关的资源推荐

### 4.4 添加学习路径可视化

**实施步骤**:

1. 在 `plan.md` 的 User Confirmation 中添加可视化:

```javascript
// 在显示计划摘要时，添加 DAG 可视化
console.log(`
## Learning Path Visualization

${generateDagVisualization(plan.dependency_graph)}

**Suggested Order**: ${validation.learning_order.join(' → ')}
`);

function generateDagVisualization(dag) {
  // 简单的 ASCII 可视化
  const { nodes, edges } = dag;
  const levels = topologicalSort(nodes, edges);

  let viz = '';
  levels.forEach((level, i) => {
    viz += `Level ${i + 1}: ${level.join(', ')}\n`;
    if (i < levels.length - 1) {
      viz += '  ↓\n';
    }
  });

  return viz;
}
```

**预期收益**: 更直观的学习路径

### Phase 4 总结

**代码变更**:
- 修改文件: `learn-planning-agent.md`, `plan.md`
- 新增: Gap Analysis 增强，资源评分算法，路径可视化

**代码量变化**:
- 增加: 150行（新功能）
- 净增加: 150行（功能拓展）

**测试验证**:
- 测试不同 experience_level 的个性化
- 验证 Gap Analysis 的准确性
- 检查资源推荐的相关性
- 验证学习路径可视化

---

## 总体实施计划

### 时间线

| Phase | 工作量 | 风险 | 优先级 | 建议时间 |
|-------|--------|------|--------|----------|
| Phase 1 | 2-3h | 低 | 高 | 立即 |
| Phase 2 | 4-6h | 中 | 高 | 1周内 |
| Phase 3 | 6-8h | 高 | 中 | 2周内 |
| Phase 4 | 8-12h | 中 | 中 | 1月内 |

**总工作量**: 20-29小时

### 依赖关系

```
Phase 1 (代码质量)
  ↓
Phase 2 (流程简化) ← 依赖 Phase 1 的工具函数
  ↓
Phase 3 (Agent 优化) ← 依赖 Phase 1 的 logger
  ↓
Phase 4 (功能拓展) ← 依赖 Phase 2 的简化流程
```

### 验证检查点

**Phase 1 完成后**:
- [ ] 所有重复函数已提取
- [ ] 错误处理统一
- [ ] 日志记录正常
- [ ] 测试通过

**Phase 2 完成后**:
- [ ] JIT Assessment 已移除
- [ ] Profile Update Check 简化
- [ ] User Confirmation 简化
- [ ] 用户体验改善

**Phase 3 完成后**:
- [ ] Task tool 调用正常
- [ ] ccw cli 回退正常
- [ ] 超时控制有效
- [ ] 可靠性提升

**Phase 4 完成后**:
- [ ] Profile-aware 提示词生效
- [ ] Gap Analysis 准确
- [ ] 资源推荐相关
- [ ] 路径可视化清晰

### 回滚计划

如果某个 Phase 出现问题：

1. **Phase 1**: 恢复原始代码（git revert）
2. **Phase 2**: 恢复 JIT Assessment 和复杂验证
3. **Phase 3**: 回退到 ccw cli only
4. **Phase 4**: 移除新增功能

### 成功指标

**代码质量**:
- 代码行数减少 ~300 lines (32%)
- 重复代码消除 100%
- 测试覆盖率 > 80%

**用户体验**:
- 用户交互次数减少 50%（从6个问题 → 2-3个）
- 计划生成时间 < 2分钟
- 错误率 < 5%

**可维护性**:
- 函数复杂度降低 30%
- 日志覆盖率 100%
- 文档更新及时

---

## 下一步行动

**立即执行**:
1. 创建 Phase 1 的实施 Issue
2. 开始代码质量优化
3. 完成后创建 PR 并测试

**后续规划**:
1. Phase 1 完成后，评估效果
2. 根据反馈调整 Phase 2-4 计划
3. 逐步推进，确保质量

**需要决策**:
- 是否立即开始 Phase 1？
- 是否需要更详细的实施指导？
- 是否需要创建 Issue 和 PR 模板？
