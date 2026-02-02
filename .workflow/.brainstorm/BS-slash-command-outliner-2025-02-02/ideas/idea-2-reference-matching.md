# Deep Dive: 智能参考匹配系统

**Idea Score**: 8.5/10
**Created**: 2026-02-02T15:20+08:00
**Status**: Active - Selected for exploration

---

## 详述概念

"智能参考匹配系统"专注于从现有 CCW 代码库中智能识别最相似的工作流模式，提取其架构并适配新需求。

### 核心理念

1. **语义理解**: 深入理解用户需求的工作流类型、复杂度和目标
2. **多维匹配**: 从功能、架构、数据流多个维度进行相似性评估
3. **智能提取**: 从匹配的参考命令中提取可复用的架构模式
4. **渐进适配**: 从最相似的模式开始，逐步适配到用户特定需求

### 工作流程

```
用户输入自然语言需求
         ↓
    [需求结构化]
         ↓
    [意图识别引擎]
         ↓
    工作流类型分类
         ↓
    [ACE-tool 语义搜索]
         ↓
    候选命令集合 (Top 5)
         ↓
    [多维相似度评分]
    功能相似性 (40%)
    架构相似性 (30%)
    数据流相似性 (20%)
    阶段复杂度 (10%)
         ↓
    最优参考命令选择
         ↓
    [架构模式提取]
         ↓
    [差异化分析]
         ↓
    最终方案生成
```

---

## 实施要求

### Phase 1: 意图识别与分类

**任务**: 理解用户需求的工作流类型

**分类体系**:
```json
{
  "workflow_types": {
    "analysis": {
      "keywords": ["分析", "探索", "诊断", "理解", "investigate", "explore"],
      "patterns": ["multi-phase", "interactive", "documentation-heavy"]
    },
    "planning": {
      "keywords": ["规划", "设计", "分解", "任务", "plan", "breakdown"],
      "patterns": ["5-phase", "task-generation", "conflict-resolution"]
    },
    "execution": {
      "keywords": ["执行", "实现", "部署", "运行", "execute", "implement"],
      "patterns": ["multi-model", "agent-coordination", "progress-tracking"]
    },
    "brainstorm": {
      "keywords": ["创意", "脑暴", "讨论", "发散", "收敛", "brainstorm"],
      "patterns": ["diverge-converge", "multi-perspective", "collaborative"]
    },
    "issue": {
      "keywords": ["问题", "缺陷", "修复", "bug", "issue", "fix"],
      "patterns": ["tracking", "prioritization", "resolution"]
    },
    "learn": {
      "keywords": ["学习", "教程", "指导", "学习", "learn", "tutorial"],
      "patterns": ["profile-based", "milestone", "progress-tracking"]
    }
  }
}
```

**NLP 处理**:
```javascript
function classifyUserRequirement(requirement) {
  const text = requirement.toLowerCase();
  const scores = {};

  for (const [type, data] of Object.entries(workflow_types)) {
    const keywordMatch = data.keywords.some(k => text.includes(k));
    const patternMatch = analyzePatternSimilarity(text, data.patterns);
    scores[type] = keywordMatch ? 0.7 : 0.3 + patternMatch * 0.7;
  }

  return Object.entries(scores)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 2)  // Top 2 types
    .map(([type]) => type);
}
```

### Phase 2: ACE-tool 智能搜索

**任务**: 执行多轮搜索获取最相关的参考命令

**搜索策略**:
```javascript
async function searchReferenceCommands(requirement, types) {
  const searchQueries = [];

  // Query 1: 直接关键词搜索
  searchQueries.push({
    query: `${requirement} slash command workflow CCW`,
    context: "Direct keyword search"
  });

  // Query 2: 类型增强搜索
  for (const type of types) {
    searchQueries.push({
      query: `${workflow_types[type].keywords[0]} workflow ${type}`,
      context: `Type-specific search: ${type}`
    });
  }

  // Query 3: 阶段模式搜索
  searchQueries.push({
    query: `workflow phases ${types[0]} multi-step execution`,
    context: "Phase pattern search"
  });

  // 执行所有搜索
  const allResults = [];
  for (const q of searchQueries) {
    const results = await mcp__ace-tool__search_context({
      project_root_path: "/path/to/ccw",
      query: q.query
    });
    allResults.push({
      context: q.context,
      results: results.code_sections
    });
  }

  // 聚合和去重
  return aggregateAndDeduplicate(allResults);
}
```

### Phase 3: 多维相似度评分

**任务**: 综合评估候选命令的相似性

**评分算法**:
```javascript
function calculateSimilarityScore(userRequirement, referenceCommand) {
  const scores = {
    functional: 0,      // 功能相似性 (40%)
    architectural: 0,    // 架构相似性 (30%)
    dataflow: 0,          // 数据流相似性 (20%)
    complexity: 0         // 复杂度匹配 (10%)
  };

  // 功能相似性分析
  scores.functional = analyzeFunctionalSimilarity(
    userRequirement.intent,
    referenceCommand.description
  );

  // 架构相似性分析
  scores.architectural = analyzeArchitecturalSimilarity(
    extractPhases(userRequirement),
    extractPhases(referenceCommand)
  );

  // 数据流相似性分析
  scores.dataflow = analyzeDataFlowSimilarity(
    extractInputs(userRequirement),
    extractOutputs(referenceCommand)
  );

  // 复杂度匹配
  scores.complexity = 1 - Math.abs(
    estimateComplexity(userRequirement) -
    estimateComplexity(referenceCommand)
  );

  // 加权总分
  const totalScore =
    scores.functional * 0.4 +
    scores.architectural * 0.3 +
    scores.dataflow * 0.2 +
    scores.complexity * 0.1;

  return {
    total_score: Math.round(totalScore * 100),
    breakdown: scores,
    matching_reasons: generateMatchingReasons(scores)
  };
}
```

### Phase 4: 架构模式提取

**任务**: 从参考命令提取可复用的架构模式

**提取模板**:
```json
{
  "command_pattern": {
    "name": "workflow:plan",
    "pattern_type": "planning",
    "phase_structure": [
      {
        "order": 1,
        "name": "Session Discovery",
        "input": "structured description",
        "output": "session_id",
        "key_operations": ["create_or_find_session", "parse_metadata"]
      },
      {
        "order": 2,
        "name": "Context Gathering",
        "input": "session_id + description",
        "output": "context_package",
        "key_operations": ["codebase_analysis", "integration_detection"]
      }
      // ... 其他阶段
    ],
    "data_flow_patterns": [
      {
        "from": "Phase 1",
        "to": "Phase 2",
        "data_type": "session_id"
      },
      {
        "from": "Phase 2",
        "to": "Phase 4",
        "data_type": "context_package"
      }
    ],
    "quality_patterns": [
      "5-phase-structure",
      "auto-continue-workflow",
      "conflict-detection-gate",
      "task-attachment-collapse"
    ]
  }
}
```

### Phase 5: 差异化分析与适配

**任务**: 识别用户需求与参考模式的差异，生成适配方案

**差异分析**:
```javascript
function analyzeDifferences(userRequirement, referencePattern) {
  const differences = {
    additions: [],      // 用户需要的额外功能
    modifications: [],   // 需要修改的模式
    removals: [],       // 不需要的模式部分
    complexity_delta: 0 // 复杂度变化
  };

  // 比较阶段
  const requiredPhases = extractRequiredPhases(userRequirement);
  const referencePhases = referencePattern.phase_structure;

  for (const phase of requiredPhases) {
    const matchingRef = referencePhases.find(p => p.name === phase.name);
    if (!matchingRef) {
      differences.additions.push({
        type: "new_phase",
        phase: phase
      });
    } else {
      const mods = comparePhases(phase, matchingRef);
      differences.modifications.push(...mods);
    }
  }

  // 检查不需要的阶段
  for (const refPhase of referencePhases) {
    if (!requiredPhases.find(p => p.name === refPhase.name)) {
      differences.removals.push({
        type: "remove_phase",
        phase: refPhase
      });
    }
  }

  return differences;
}
```

---

## 挑战与缓解

| 挑战 | 严重性 | 缓解策略 |
|--------|--------|----------|
| NLP 意图识别准确性 | High | 多模型验证 + 用户确认机制 |
| 相似度评分主观性 | Medium | 可调节权重 + 用户反馈学习 |
| 复杂需求的模式组合 | High | 模式组合算法 + 专家规则 |
| 参考命令质量不均 | Medium | 参考命令质量评分 + 排序优化 |

---

## MVP 定义

**最小可行产品 (MVP)** 应包含:

1. ✅ 基本的意图识别和分类
2. ✅ ACE-tool 单轮搜索集成
3. ✅ 简单的相似度评分（功能维度）
4. ✅ 单一参考命令的架构提取
5. ✅ 基础的 Slash MD 生成

**MVP 后续增强**:
- 多轮搜索策略
- 多维相似度评分系统
- 模式组合生成
- 复杂需求处理
- 差异化自动适配

---

## 成功标准

| 标准 | 验证方法 |
|------|----------|
| 意图识别准确率 > 85% | 标注测试集验证 |
| 参考命令匹配相关性 > 75% | 专家评估 + A/B 测试 |
| 提取的架构模式可用性 > 90% | 自动化验证测试 |
| 生成方案质量门控通过 | 质量检查自动化 |
| 端到端时间 < 3 分钟 | 性能基准测试 |

---

## 推荐: 调研阶段

**理由**:
1. 智能匹配是创新点，需要充分调研
2. ACE-tool 的能力和边界需要验证
3. 相似度评分算法是核心，需要多方案比较
4. 当前技术栈支持程度需要评估

**实施路径**:
1. 短期（1-2周）: 意图识别 + ACE-tool 基础集成
2. 中期（2-4周）: 多维评分系统 + 架构提取
3. 长期（4-8周）: 差异化适配 + 模式组合

**后续跟进**:
1. 收集 ACE-tool 性能和准确性数据
2. 对比不同相似度算法的效果
3. 验证提取的架构模式质量
4. 优化搜索策略和提示词

---

**状态**: 等待调研结果后决定是否实施
