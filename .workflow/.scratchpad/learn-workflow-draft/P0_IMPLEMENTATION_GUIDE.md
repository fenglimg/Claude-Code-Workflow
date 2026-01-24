# Learn Workflow - P0 Implementation Guide

> MVP实现指南：从零到可用的learn workflow
> **目标**: 实现可靠、可用的单用户学习工作流
> **优先级**: P0（阻断性问题必须解决）

---

## P0 任务清单

### ✅ 已完成
- [x] 创建JSON schema文件（learn-state, learn-profile, learn-plan）
- [x] 识别CLI集成问题（issue create接口）
- [x] 设计DAG循环检测算法
- [x] 规范AskUserQuestion使用模式

### ⏳ 待实现
- [ ] 修复issue CLI集成（stdin JSON模式）
- [ ] 实现schema验证器
- [ ] 实现DAG循环检测
- [ ] 实现核心命令桩（plan, execute, review）
- [ ] 实现静态计划生成（--no-agent模式）

---

## 实现步骤

### Step 1: 修复Issue CLI集成

**文件**: `.workflow/.scratchpad/learn-workflow-draft/learn-execute.md:535`

**当前问题**:
```javascript
// ❌ 错误实现
Bash(`ccw issue create --title "${kp.title}" --body "${kp.description}"`)
```

**修复方案**:
```javascript
// ✅ 正确实现
function createIssueFromKP(kp, plan, sessionId) {
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

**Acceptance Criteria**:
${kp.assessment.acceptance_criteria.map(c => `- ${c}`).join('\n')}

---
*Generated from learn session: ${sessionId}*
*Knowledge Point ID: ${kp.id}*
    `.trim(),
    labels: ['learning-task', sessionId, kp.id]
  };

  // 方法1: 使用echo + pipe
  const issueJson = JSON.stringify(issueData).replace(/'/g, "\\'");
  const command = `echo '${issueJson}' | ccw issue create --json-stdin`;
  
  // 方法2: 使用heredoc（更安全，避免转义问题）
  const heredocCommand = `ccw issue create --json-stdin <<'EOF'
${JSON.stringify(issueData, null, 2)}
EOF`;

  // 执行命令
  const result = Bash({ 
    command: heredocCommand, 
    description: `Create issue for KP ${kp.id}`,
    run_in_background: false 
  });

  if (result.exitCode === 0) {
    console.log(`✅ Issue created successfully`);
    return true;
  } else {
    console.error(`❌ Failed to create issue: ${result.stderr}`);
    return false;
  }
}
```

**测试验证**:
```bash
# 手动测试issue创建
echo '{"title":"Test Learn Issue","body":"Test body","labels":["test"]}' | ccw issue create --json-stdin
```

---

### Step 2: 实现Schema验证器

**文件**: 新建 `.workflow/.scratchpad/learn-workflow-draft/lib/validator.js`

**实现**:
```javascript
/**
 * Schema Validator for Learn Workflow
 * Uses JSON Schema Draft-07 for validation
 */

const fs = require('fs');
const path = require('path');

class SchemaValidator {
  constructor(schemaDir = './schemas') {
    this.schemaDir = schemaDir;
    this.schemas = {};
    this.loadSchemas();
  }

  loadSchemas() {
    const schemaFiles = ['learn-state', 'learn-profile', 'learn-plan'];
    
    for (const schemaName of schemaFiles) {
      const schemaPath = path.join(this.schemaDir, `${schemaName}.schema.json`);
      try {
        const schemaContent = fs.readFileSync(schemaPath, 'utf8');
        this.schemas[schemaName] = JSON.parse(schemaContent);
      } catch (error) {
        console.error(`Failed to load schema ${schemaName}:`, error.message);
      }
    }
  }

  /**
   * Validate data against a schema
   * @param {string} schemaName - Name of the schema (e.g., 'learn-plan')
   * @param {object} data - Data to validate
   * @returns {object} - { valid: boolean, errors: array }
   */
  validate(schemaName, data) {
    const schema = this.schemas[schemaName];
    if (!schema) {
      return { valid: false, errors: [`Schema ${schemaName} not found`] };
    }

    const errors = [];

    // Basic validation (P0 - required fields only)
    if (schema.required) {
      for (const field of schema.required) {
        if (!(field in data)) {
          errors.push(`Missing required field: ${field}`);
        }
      }
    }

    // Type validation
    for (const [key, value] of Object.entries(data)) {
      const propSchema = schema.properties?.[key];
      if (propSchema) {
        const typeError = this.validateType(key, value, propSchema);
        if (typeError) errors.push(typeError);
      }
    }

    return { valid: errors.length === 0, errors };
  }

  validateType(key, value, propSchema) {
    const expectedType = Array.isArray(propSchema.type) 
      ? propSchema.type 
      : [propSchema.type];
    
    const actualType = Array.isArray(value) ? 'array' 
      : value === null ? 'null' 
      : typeof value;

    if (!expectedType.includes(actualType)) {
      return `Field '${key}' has type '${actualType}', expected '${expectedType.join(' or ')}'`;
    }

    // Enum validation
    if (propSchema.enum && !propSchema.enum.includes(value)) {
      return `Field '${key}' value '${value}' not in allowed values: ${propSchema.enum.join(', ')}`;
    }

    // Pattern validation (for strings)
    if (propSchema.pattern && typeof value === 'string') {
      const regex = new RegExp(propSchema.pattern);
      if (!regex.test(value)) {
        return `Field '${key}' value '${value}' does not match pattern: ${propSchema.pattern}`;
      }
    }

    // Array validation
    if (actualType === 'array') {
      if (propSchema.maxItems && value.length > propSchema.maxItems) {
        return `Field '${key}' has ${value.length} items, max allowed: ${propSchema.maxItems}`;
      }
      if (propSchema.minItems && value.length < propSchema.minItems) {
        return `Field '${key}' has ${value.length} items, min required: ${propSchema.minItems}`;
      }
    }

    return null;
  }

  /**
   * Validate a plan.json file
   * Includes custom validations beyond schema
   */
  validatePlan(plan) {
    // Schema validation first
    const schemaResult = this.validate('learn-plan', plan);
    if (!schemaResult.valid) {
      return schemaResult;
    }

    const errors = [];

    // Custom validation: Check each KP has at least one gold resource
    for (const kp of plan.knowledge_points) {
      const hasGold = kp.resources.some(r => r.quality === 'gold');
      if (!hasGold) {
        errors.push(`Knowledge point ${kp.id} lacks a gold-tier resource`);
      }
    }

    // Custom validation: Check prerequisites reference existing KPs
    const kpIds = new Set(plan.knowledge_points.map(kp => kp.id));
    for (const kp of plan.knowledge_points) {
      for (const prereqId of kp.prerequisites) {
        if (!kpIds.has(prereqId)) {
          errors.push(`Knowledge point ${kp.id} references non-existent prerequisite: ${prereqId}`);
        }
      }
    }

    return { valid: errors.length === 0, errors };
  }
}

module.exports = SchemaValidator;
```

**使用示例**:
```javascript
const SchemaValidator = require('./lib/validator');
const validator = new SchemaValidator('./schemas');

// Validate a plan
const plan = JSON.parse(Read('.workflow/learn/sessions/LS-001/plan.json'));
const result = validator.validatePlan(plan);

if (!result.valid) {
  console.error('Plan validation failed:');
  result.errors.forEach(err => console.error(`  - ${err}`));
  throw new Error('Invalid plan');
}
```

---

### Step 3: 实现DAG循环检测

**文件**: 新建 `.workflow/.scratchpad/learn-workflow-draft/lib/dag-validator.js`

**实现**:
```javascript
/**
 * DAG Validator for Knowledge Point Dependencies
 * Detects cycles and validates topological ordering
 */

class DAGValidator {
  /**
   * Detect cycles in knowledge point dependencies
   * @param {Array} knowledgePoints - Array of KP objects with prerequisites
   * @returns {object} - { hasCycle: boolean, cyclePath: array }
   */
  detectCycle(knowledgePoints) {
    const visiting = new Set();
    const visited = new Set();
    const kpMap = new Map(knowledgePoints.map(kp => [kp.id, kp]));
    let cyclePath = [];

    const dfs = (kpId, path = []) => {
      if (visiting.has(kpId)) {
        // Cycle detected - extract the cycle path
        const cycleStart = path.indexOf(kpId);
        cyclePath = path.slice(cycleStart).concat(kpId);
        return true;
      }

      if (visited.has(kpId)) {
        return false;
      }

      visiting.add(kpId);
      path.push(kpId);

      const kp = kpMap.get(kpId);
      if (kp?.prerequisites) {
        for (const prereqId of kp.prerequisites) {
          if (dfs(prereqId, [...path])) {
            return true;
          }
        }
      }

      visiting.delete(kpId);
      visited.add(kpId);
      return false;
    };

    for (const kp of knowledgePoints) {
      if (!visited.has(kp.id)) {
        if (dfs(kp.id)) {
          return { hasCycle: true, cyclePath };
        }
      }
    }

    return { hasCycle: false, cyclePath: [] };
  }

  /**
   * Generate topological order of knowledge points
   * @param {Array} knowledgePoints - Array of KP objects
   * @returns {Array} - Ordered array of KP IDs (or null if cycle exists)
   */
  topologicalSort(knowledgePoints) {
    const cycleCheck = this.detectCycle(knowledgePoints);
    if (cycleCheck.hasCycle) {
      return null; // Cannot sort if cycle exists
    }

    const inDegree = new Map();
    const adjList = new Map();
    
    // Initialize
    for (const kp of knowledgePoints) {
      inDegree.set(kp.id, 0);
      adjList.set(kp.id, []);
    }

    // Build graph
    for (const kp of knowledgePoints) {
      for (const prereqId of kp.prerequisites) {
        adjList.get(prereqId).push(kp.id);
        inDegree.set(kp.id, inDegree.get(kp.id) + 1);
      }
    }

    // Kahn's algorithm
    const queue = [];
    const result = [];

    // Start with nodes that have no prerequisites
    for (const [kpId, degree] of inDegree.entries()) {
      if (degree === 0) {
        queue.push(kpId);
      }
    }

    while (queue.length > 0) {
      const current = queue.shift();
      result.push(current);

      for (const neighbor of adjList.get(current)) {
        inDegree.set(neighbor, inDegree.get(neighbor) - 1);
        if (inDegree.get(neighbor) === 0) {
          queue.push(neighbor);
        }
      }
    }

    return result.length === knowledgePoints.length ? result : null;
  }

  /**
   * Validate the dependency graph
   * @param {Array} knowledgePoints - Array of KP objects
   * @returns {object} - { valid: boolean, errors: array, order: array }
   */
  validate(knowledgePoints) {
    const errors = [];

    // Check for cycles
    const cycleCheck = this.detectCycle(knowledgePoints);
    if (cycleCheck.hasCycle) {
      errors.push(`Circular dependency detected: ${cycleCheck.cyclePath.join(' → ')}`);
      return { valid: false, errors, order: null };
    }

    // Generate topological order
    const order = this.topologicalSort(knowledgePoints);
    if (!order) {
      errors.push('Failed to generate topological order');
      return { valid: false, errors, order: null };
    }

    return { valid: true, errors: [], order };
  }
}

module.exports = DAGValidator;
```

**使用示例**:
```javascript
const DAGValidator = require('./lib/dag-validator');
const validator = new DAGValidator();

const knowledgePoints = [
  { id: 'KP-1', prerequisites: [] },
  { id: 'KP-2', prerequisites: ['KP-1'] },
  { id: 'KP-3', prerequisites: ['KP-1', 'KP-2'] }
];

const result = validator.validate(knowledgePoints);

if (!result.valid) {
  console.error('DAG validation failed:');
  result.errors.forEach(err => console.error(`  - ${err}`));
} else {
  console.log('Suggested learning order:', result.order.join(' → '));
}
```

---

### Step 4: 实现核心命令桩

**文件**: `.claude/commands/learn/plan.md` (更新)

**基础实现框架**:
```javascript
// /learn:plan command implementation

// Phase 1: Profile Discovery
const statePath = '.workflow/learn/state.json';
let state;

try {
  state = JSON.parse(Read(statePath));
} catch (e) {
  // First run - initialize
  state = {
    active_profile_id: null,
    active_session_id: null,
    version: '1.0.0',
    _metadata: { last_updated: new Date().toISOString() }
  };
  Write(statePath, JSON.stringify(state, null, 2));
}

// Check profile exists
if (!state.active_profile_id) {
  console.log('No profile found. Creating default profile...');
  // TODO: Call /learn:profile create
  throw new Error('Profile required. Run /learn:profile create first.');
}

// Phase 2: Load profile
const profilePath = `.workflow/learn/profiles/${state.active_profile_id}.json`;
const profile = JSON.parse(Read(profilePath));

// Phase 3: Generate plan (static mode for P0)
const goal = $ARGUMENTS; // User's learning goal
const sessionId = generateSessionId(); // LS-YYYYMMDD-NNN

const staticPlan = {
  session_id: sessionId,
  learning_goal: goal,
  profile_id: state.active_profile_id,
  knowledge_points: [
    {
      id: 'KP-1',
      title: `${goal} - Fundamentals`,
      description: `Core concepts and basics of ${goal}`,
      prerequisites: [],
      topic_refs: [],
      resources: [
        {
          type: 'documentation',
          url: 'https://example.com/docs',
          summary: 'Official documentation',
          quality: 'gold'
        }
      ],
      assessment: {
        type: 'practical_task',
        description: `Build a simple project with ${goal}`,
        acceptance_criteria: ['Works correctly', 'Code is clean']
      },
      status: 'pending'
    }
  ],
  dependency_graph: {
    nodes: ['KP-1'],
    edges: []
  },
  _metadata: {
    created_at: new Date().toISOString(),
    generation_method: 'static'
  }
};

// Phase 4: Validate plan
const SchemaValidator = require('./lib/validator');
const DAGValidator = require('./lib/dag-validator');

const schemaValidator = new SchemaValidator('./schemas');
const dagValidator = new DAGValidator();

const schemaResult = schemaValidator.validatePlan(staticPlan);
if (!schemaResult.valid) {
  console.error('Plan validation failed:');
  schemaResult.errors.forEach(err => console.error(`  - ${err}`));
  throw new Error('Invalid plan generated');
}

const dagResult = dagValidator.validate(staticPlan.knowledge_points);
if (!dagResult.valid) {
  console.error('DAG validation failed:');
  dagResult.errors.forEach(err => console.error(`  - ${err}`));
  throw new Error('Circular dependencies detected');
}

// Phase 5: Create session
const sessionDir = `.workflow/learn/sessions/${sessionId}`;
Bash(`mkdir -p ${sessionDir}/interactions/notes`);

Write(`${sessionDir}/plan.json`, JSON.stringify(staticPlan, null, 2));
Write(`${sessionDir}/manifest.json`, JSON.stringify({
  session_id: sessionId,
  learning_goal: goal,
  profile_id: state.active_profile_id,
  status: 'planned',
  created_at: new Date().toISOString()
}, null, 2));

Write(`${sessionDir}/progress.json`, JSON.stringify({
  session_id: sessionId,
  current_knowledge_point_id: null,
  completed_knowledge_points: [],
  in_progress_knowledge_points: [],
  knowledge_point_progress: {},
  overall_metrics: {
    total_time_spent_minutes: 0,
    resources_consumed: 0,
    questions_asked: 0
  }
}, null, 2));

// Update state
state.active_session_id = sessionId;
Write(statePath, JSON.stringify(state, null, 2));

// Phase 6: User confirmation
console.log(`
## Learning Plan Created

**Session ID**: ${sessionId}
**Goal**: ${goal}
**Knowledge Points**: ${staticPlan.knowledge_points.length}

Next: /learn:execute
`);
```

---

### Step 5: 实现静态计划生成

**目标**: 支持 `--no-agent` 模式，用于测试和快速原型

**实现**: 见Step 4中的staticPlan生成逻辑

**测试**:
```bash
# 测试静态计划生成
/learn:plan "Learn TypeScript basics" --no-agent

# 验证生成的文件
ls .workflow/learn/sessions/LS-*/
cat .workflow/learn/sessions/LS-*/plan.json
```

---

## 验收标准

### P0完成标准

1. **Schema验证通过**
   ```bash
   # 所有JSON文件符合schema
   node lib/validator.js .workflow/learn/state.json
   node lib/validator.js .workflow/learn/profiles/profile-default.json
   node lib/validator.js .workflow/learn/sessions/LS-001/plan.json
   ```

2. **DAG验证通过**
   ```bash
   # 无循环依赖
   node lib/dag-validator.js .workflow/learn/sessions/LS-001/plan.json
   ```

3. **Issue创建成功**
   ```bash
   # 执行 /learn:execute --create-issue 不报错
   # 验证issue已创建
   ccw issue list | grep "Learn:"
   ```

4. **端到端流程**
   ```bash
   # 完整流程测试
   /learn:profile create
   /learn:plan "Learn React hooks" --no-agent
   /learn:execute
   /learn:execute --complete
   /learn:review
   ```

---

## 下一步（P1）

完成P0后，进入P1阶段：
1. 集成MCP工具（ACE + Exa）
2. 实现agent-driven计划生成
3. 实现learn:ask命令
4. 实现learn:review的profile更新逻辑
5. 添加clarification阻塞机制

---

**版本**: v1.0.0-p0-guide
**状态**: Implementation Guide
**最后更新**: 2026-01-24
