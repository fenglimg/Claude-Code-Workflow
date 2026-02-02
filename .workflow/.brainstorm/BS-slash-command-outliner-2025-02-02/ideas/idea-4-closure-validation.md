# Deep Dive: 闭环验证系统

**Idea Score**: 7.5/10
**Created**: 2026-02-02T15:20+08:00
**Status**: Active - Selected for exploration

---

## 详述概念

"闭环验证系统"专注于自动检测生成方案中是否存在逻辑断点、依赖缺失或执行路径不完整的问题，确保方案"即刻可用"。

### 核心理念

1. **完整性验证**: 检查所有 Phase 是否有明确的输入和输出
2. **依赖追踪**: 验证所有 depends_on 引用都指向实际存在的组件
3. **执行路径验证**: 确保从起点到终点的完整调用链
4. **数据流检查**: 验证所有数据传递格式正确且完整
5. **交叉引用验证**: 检查文档间的相互引用是否有效

### 工作流程

```
生成输出
         ↓
    [解析器]
         ↓
    结构化表示（AST）
         ↓
    [完整性检查器]
         ↓
    [依赖图分析器]
         ↓
    [执行路径追踪器]
         ↓
    [数据流验证器]
         ↓
    [交叉引用解析器]
         ↓
    验证报告 + 修复建议
```

---

## 实施要求

### Phase 1: 文档解析器

**任务**: 解析 Slash MD、Agent MD、Task JSON 为结构化 AST

**解析规则**:
```javascript
class DocumentParser {
  parseSlashCommand(md) {
    return {
      frontmatter: this.parseFrontmatter(md),
      sections: this.extractSections(md),
      phases: this.extractPhases(md),
      execution_flow: this.parseExecutionFlow(md)
    };
  }

  parseAgentMD(md) {
    return {
      sections: this.extractSections(md),
      system_prompt: this.extractSystemPrompt(md),
      tool_references: this.extractToolReferences(md)
    };
  }

  parseTaskJSON(json) {
    const data = JSON.parse(json);
    return {
      id: data.id,
      meta: data.meta,
      context: data.context,
      flow_control: data.flow_control,
      execution_config: data.execution_config,
      dependencies: this.extractDependencies(data)
    };
  }
}
```

### Phase 2: 完整性检查器

**任务**: 验证所有必需组件都存在

**检查规则**:
```javascript
class CompletenessChecker {
  checkSlashCommand(ast) {
    const errors = [];
    const warnings = [];

    // 检查 frontmatter
    const requiredFrontmatterFields = ['name', 'description', 'argument-hint'];
    for (const field of requiredFrontmatterFields) {
      if (!ast.frontmatter[field]) {
        errors.push({
          level: 'ERROR',
          code: 'MISSING_FRONTMATTER_FIELD',
          location: 'frontmatter',
          message: `Missing required frontmatter field: ${field}`
        });
      }
    }

    // 检查必需章节
    const requiredSections = ['Overview', 'Usage', 'Execution Process'];
    for (const section of requiredSections) {
      if (!ast.sections.includes(section)) {
        errors.push({
          level: 'ERROR',
          code: 'MISSING_SECTION',
          location: 'sections',
          message: `Missing required section: ${section}`
        });
      }
    }

    return { errors, warnings };
  }

  checkTaskJSON(ast) {
    const errors = [];
    const requiredFields = ['id', 'meta', 'context', 'flow_control', 'execution_config'];
    for (const field of requiredFields) {
      if (!ast[field]) {
        errors.push({
          level: 'ERROR',
          code: 'MISSING_TASK_FIELD',
          location: field,
          message: `Missing required task field: ${field}`
        });
      }
    }

    return { errors, warnings: [] };
  }
}
```

### Phase 3: 依赖图分析器

**任务**: 构建依赖图并检查是否有孤立节点或循环依赖

**依赖图构建**:
```javascript
class DependencyGraphAnalyzer {
  buildDependencyGraph(taskFiles, phaseDocuments) {
    const nodes = new Map();
    const edges = new Set();

    // 从 Task JSON 中提取依赖
    for (const taskFile of taskFiles) {
      const ast = this.parseTaskJSON(taskFile);
      nodes.set(ast.id, {
        type: 'task',
        file: taskFile,
        inputs: ast.context?.inputs || [],
        outputs: this.extractOutputs(ast.flow_control)
      });

      if (ast.meta?.depends_on) {
        for (const dep of ast.meta.depends_on) {
          edges.add({
            from: dep,
            to: ast.id,
            type: 'dependency'
          });
        }
      }
    }

    // 从 Phase 文档中提取数据流
    for (const phaseDoc of phaseDocuments) {
      const ast = this.parsePhaseDocument(phaseDoc);
      const phaseId = ast.phase_id;

      for (const flow of ast.data_flow || []) {
        if (flow.from && flow.to) {
          nodes.set(flow.from, nodes.get(flow.from) || { type: 'data' });
          nodes.set(flow.to, nodes.get(flow.to) || { type: 'data' });
          edges.add({
            from: flow.from,
            to: flow.to,
            type: 'data_flow'
          });
        }
      }
    }

    return { nodes, edges };
  }

  analyzeForIssues(graph) {
    const issues = [];

    // 检查孤立节点
    for (const [id, node] of graph.nodes) {
      const hasIncoming = graph.edges.some(e => e.to === id);
      const hasOutgoing = graph.edges.some(e => e.from === id);

      if (node.type === 'task' && !hasIncoming) {
        issues.push({
          level: 'ERROR',
          code: 'ORPHANED_NODE',
          node_id: id,
          message: `Task ${id} has no incoming dependencies, execution may start without context`
        });
      }

      if (node.type === 'task' && !hasOutgoing) {
        issues.push({
          level: 'WARNING',
          code: 'DEAD_END_NODE',
          node_id: id,
          message: `Task ${id} has no outputs, workflow may not continue after this`
        });
      }
    }

    // 检查循环依赖
    const cycle = this.detectCycle(graph.edges);
    if (cycle) {
      issues.push({
        level: 'ERROR',
        code: 'CYCLIC_DEPENDENCY',
        cycle: cycle,
        message: `Circular dependency detected: ${cycle.join(' → ')}`
      });
    }

    return issues;
  }
}
```

### Phase 4: 执行路径追踪器

**任务**: 验证从起点到终点的完整执行路径

**路径追踪算法**:
```javascript
class ExecutionPathTracer {
  traceExecutionPath(startPoint, documents) {
    const path = [];
    const visited = new Set();
    const queue = [startPoint];

    while (queue.length > 0) {
      const current = queue.shift();

      if (visited.has(current)) {
        continue; // 避免循环
      }

      visited.add(current);
      path.push(current);

      // 查找后续节点
      const nextNodes = this.findNextNodes(current, documents);
      for (const next of nextNodes) {
        if (!visited.has(next.id)) {
          queue.push(next.id);
        }
      }
    }

    return path;
  }

  validatePathCompleteness(path, documents) {
    const issues = [];

    // 检查路径是否形成完整链
    for (let i = 0; i < path.length - 1; i++) {
      const current = path[i];
      const next = path[i + 1];

      // 验证连接
      const isValidConnection = this.validateConnection(current, next, documents);
      if (!isValidConnection) {
        issues.push({
          level: 'ERROR',
          code: 'BROKEN_CONNECTION',
          from: current,
          to: next,
          message: `Broken execution path between ${current} and ${next}`
        });
      }
    }

    // 检查最终节点是否是有效的终点
    const lastNode = path[path.length - 1];
    if (!this.isValidEndpoint(lastNode, documents)) {
      issues.push({
        level: 'ERROR',
        code: 'INVALID_ENDPOInt',
        node: lastNode,
        message: `Execution path ends at invalid endpoint: ${lastNode}`
      });
    }

    return issues;
  }
}
```

### Phase 5: 数据流验证器

**任务**: 验证数据传递格式和完整性

**数据流检查**:
```javascript
class DataFlowValidator {
  validateDataFlows(graph) {
    const issues = [];

    for (const edge of graph.edges) {
      if (edge.type !== 'data_flow') continue;

      const fromNode = graph.nodes.get(edge.from);
      const toNode = graph.nodes.get(edge.to);

      if (!fromNode || !toNode) {
        issues.push({
          level: 'ERROR',
          code: 'MISSING_DATA_NODE',
          edge: `${edge.from} → ${edge.to}`,
          message: `Data flow references missing node: ${edge.from} or ${edge.to}`
        });
        continue;
      }

      // 检查数据类型兼容性
      if (!this.isTypeCompatible(fromNode, toNode)) {
        issues.push({
          level: 'ERROR',
          code: 'TYPE_MISMATCH',
          edge: `${edge.from} → ${edge.to}`,
          message: `Type mismatch between ${fromNode.type}(${edge.from}) and ${toNode.type}(${edge.to})`
        });
      }

      // 检查数据完整性
      const requiredFields = this.getRequiredFields(toNode);
      const providedFields = this.getProvidedFields(fromNode);

      const missingFields = requiredFields.filter(f => !providedFields.includes(f));
      if (missingFields.length > 0) {
        issues.push({
          level: 'WARNING',
          code: 'MISSING_DATA_FIELDS',
          edge: `${edge.from} → ${edge.to}`,
          message: `Missing data fields: ${missingFields.join(', ')}`,
          missing_fields: missingFields
        });
      }
    }

    return issues;
  }
}
```

### Phase 6: 交叉引用解析器

**任务**: 验证文档间的相互引用

**交叉引用检查**:
```javascript
class CrossReferenceValidator {
  validateCrossReferences(documents) {
    const issues = [];
    const referenceMap = new Map();

    // 构建引用映射
    for (const doc of documents) {
      const refs = this.extractReferences(doc);
      for (const ref of refs) {
        if (!referenceMap.has(ref.target)) {
          referenceMap.set(ref.target, []);
        }
        referenceMap.get(ref.target).push({
          source: doc.id,
          type: ref.type,
          location: ref.location
        });
      }
    }

    // 验证所有引用都有目标
    for (const [target, sources] of referenceMap) {
      const targetExists = documents.some(d => d.id === target);

      if (!targetExists) {
        for (const source of sources) {
          issues.push({
            level: 'ERROR',
            code: 'BROKEN_REFERENCE',
            source: source.source,
            target: target,
            message: `Reference to non-existent target: ${target}`
          });
        }
      }
    }

    return issues;
  }

  extractReferences(doc) {
    const refs = [];

    // 提取文档内部引用
    const refPatterns = [
      { regex: /\[([^\]]+)\]\(/?\.claude\/([^)]+)\)/g, type: 'file' },
      { regex: /See: (?:\[([^\]]+)\]\s+)?(?:([a-z-]+-\d+\.md)/g, type: 'phase' },
      { regex: /\.\.task\/([IMPL-][^\.]+\.json)/g, type: 'task' }
    ];

    for (const pattern of refPatterns) {
      let match;
      while ((match = pattern.regex.exec(doc.content)) !== null) {
        refs.push({
          type: pattern.type,
          target: match[1] || match[2],
          location: { line: this.getLineNumber(doc.content, match.index) }
        });
      }
    }

    return refs;
  }
}
```

---

## 挑战与缓解

| 挑战 | 严重性 | 缓解策略 |
|--------|--------|----------|
| AST 解析准确性 | High | 支持多格式解析 + 错误恢复 |
| 动态依赖检测 | Medium | 图算法优化 + 缓存机制 |
| 复杂数据流建模 | High | 类型系统 + 模式库 |
| 性能开销 | Medium | 增量验证 + 并行检查 |
| 误报控制 | Low | 可配置阈值 + 白名单 |

---

## MVP 定义

**最小可行产品 (MVP)** 应包含:

1. ✅ 基础文档解析器（Slash MD, Agent MD）
2. ✅ Task JSON 解析器
3. ✅ 依赖图构建器
4. ✅ 孤立节点检测
5. ✅ 循环依赖检测
6. ✅ 基础执行路径验证
7. ✅ 生成验证报告

**MVP 后续增强**:
- 完整的数据流类型系统
- 复杂的交叉引用解析
- 自动修复建议生成
- 可视化依赖图展示
- 性能优化和增量验证

---

## 成功标准

| 标准 | 验证方法 |
|------|----------|
| 孤立节点检测率 100% | 已知孤立节点测试集 |
| 循环依赖检测准确率 > 95% | 循环依赖测试集 |
| 执行路径完整性验证 > 90% | 多路径测试用例 |
| 验证误报率 < 5% | 正常案例测试集 |
| 端到端验证时间 < 5 秒 | 性能基准测试 |

---

## 推荐: 作为独立验证模块

**理由**:
1. 闭环验证是基础质量保障，适合独立模块
2. 可作为任何生成方案的通用验证器
3. 不依赖于特定生成策略
4. 可以独立迭代优化

**实施路径**:
1. 短期（1-2周）: 基础解析器 + 依赖图
2. 中期（2-4周）: 路径追踪 + 数据流验证
3. 长期（4-6周）: 交叉引用 + 可视化 + 优化

**后续跟进**:
1. 建立测试用例库覆盖常见问题
2. 监控验证误报和漏报率
3. 持续优化检查算法性能
4. 集成到主生成流程作为可选步骤

---

**状态**: 可以作为独立模块，也可以集成到主生成器中
