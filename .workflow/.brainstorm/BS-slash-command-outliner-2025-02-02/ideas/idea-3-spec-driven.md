# Deep Dive: 规范驱动的生成引擎

**Idea Score**: 8/10
**Created**: 2026-02-02T15:20+08:00
**Status**: Active - Selected for exploration

---

## 详述概念

"规范驱动的生成引擎"专注于严格遵循 CCW 规范文档（SKILL-DESIGN-SPEC.md 等）来保证生成输出的一致性和质量。

### 核心理念

1. **规范优先**: 所有生成规则源自权威规范文档
2. **验证驱动**: 生成前、生成中、生成后都有质量检查
3. **标准化输出**: 确保所有生成的文档符合统一格式
4. **持续合规**: 规范更新时生成引擎自动适配

### 工作流程

```
用户输入需求
         ↓
    [需求结构化]
         ↓
    [规范加载器]
    ↓
    SKILL-DESIGN-SPEC.md
    CLI-Tools-Usage.md
    相关参考文档
         ↓
    [约束提取器]
         ↓
    必填字段、可选字段、格式要求
         ↓
    [模板应用]
         ↓
    [实时验证器]
         ↓
    [质量门控]
         ↓
    完整输出包
```

---

## 实施要求

### Phase 1: 规范文档解析

**任务**: 解析 CCW 规范文档为可执行的规则

**关键规范文档**:
```json
{
  "specifications": {
    "SKILL_DESIGN_SPEC": {
      "path": ".claude/skills/_shared/SKILL-DESIGN-SPEC.md",
      "priority": "P0",
      "sections": {
        "directory_structure": "标准目录结构定义",
        "naming_conventions": "命名约定规范",
        "core_components": "核心组件定义",
        "skill_md_spec": "SKILL.md 入口规范",
        "phase_design": "Phase 阶段设计规范",
        "specs_design": "Specs 规范文件设计",
        "templates_design": "Templates 模板设计",
        "prompt_engineering": "Prompt 工程规范",
        "quality_control": "质量控制规范",
        "best_practices": "最佳实践清单"
      }
    },
    "CLI_TOOLS_USAGE": {
      "path": "~/.claude/workflows/cli-tools-usage.md",
      "priority": "P0",
      "sections": {
        "tool_selection": "CLI 工具选择规范",
        "prompt_template": "提示词模板规范",
        "execution_modes": "执行模式规范 (analysis/write/review)",
        "protocol_system": "协议系统定义"
      }
    },
    "COMMAND_SPEC": {
      "path": ".claude/skills/skill-generator/specs/cli-integration.md",
      "priority": "P1",
      "sections": {
        "frontmatter": "YAML frontmatter 规范",
        "execution_flow": "执行流程规范",
        "documentation": "文档编写规范"
      }
    }
  }
}
```

**解析器实现**:
```javascript
class SpecificationParser {
  constructor(specPaths) {
    this.specs = {};
    for (const path of specPaths) {
      this.specs[path] = this.parseSpecFile(path);
    }
  }

  parseSpecFile(path) {
    const content = Read(path);
    return {
      constraints: this.extractConstraints(content),
      templates: this.extractTemplates(content),
      patterns: this.extractPatterns(content),
      validation_rules: this.extractValidationRules(content)
    };
  }

  extractConstraints(content) {
    // 提取 MUST/SHOULD/REQUIREMENT 约束
    const constraints = {
      required: [],    // 必须包含的字段
      recommended: [],  // 推荐包含的字段
      forbidden: []      // 不允许的模式
    };

    // 解析规范中的约束定义
    const constraintMatches = content.matchAll(/MUST|SHOULD|REQUIRE|MUST NOT/g);
    // ... 提取逻辑

    return constraints;
  }
}
```

### Phase 2: 约束提取与应用

**任务**: 将规范约束应用到生成过程

**约束类型**:
```javascript
const constraintTypes = {
  // 必填约束 (100% 必须满足)
  required: {
    slash_command_frontmatter: ["name", "description", "argument-hint", "allowed-tools"],
    skill_md_sections: ["Architecture", "Execution Flow", "Reference Documents"],
    phase_md_sections: ["Objective", "Execution Steps", "Output", "Next Phase"],
    agent_system_prompt: ["ROLE", "TASK", "CONTEXT", "OUTPUT_FORMAT"]
  },

  // 推荐约束 (强烈建议满足)
  recommended: {
    documentation_language: "Chinese with technical terms",
    code_examples: "Include at least 3 examples per phase",
    error_handling: "Define error handling for all critical paths",
    validation_checklist: "Include quality checklist at phase end"
  },

  // 禁止约束 (绝不允许)
  forbidden: {
    hardcoded_values: "No hardcoded values in templates",
    circular_dependencies: "No circular phase dependencies",
    ambiguous_references: "No ambiguous file or section references"
  },

  // 格式约束
  format: {
    markdown_headers: "# ## ### max 3 levels",
    code_blocks: "Must specify language for all code blocks",
    mermaid_diagrams: "Use correct mermaid syntax",
    yaml_frontmatter: "Valid YAML with required fields"
  }
};
```

### Phase 3: 实时验证器

**任务**: 在生成过程中实时验证输出

**验证层次**:
```javascript
class RealTimeValidator {
  constructor(specs) {
    this.specs = specs;
    this.violations = [];
    this.warnings = [];
  }

  validateSlashCommand(output) {
    const checks = [];

    // 验证 frontmatter
    const frontmatter = this.parseYamlFrontmatter(output);
    checks.push(this.validateFrontmatter(frontmatter));

    // 验证必需章节
    checks.push(this.validateRequiredSections(output));

    // 验证格式规范
    checks.push(this.validateFormatting(output));

    return this.aggregateResults(checks);
  }

  validateFrontmatter(frontmatter) {
    const results = { passed: true, issues: [] };

    for (const field of this.specs.SKILL_DESIGN_SPEC.required.slash_command_frontmatter) {
      if (!frontmatter[field]) {
        results.passed = false;
        results.issues.push({
          level: "ERROR",
          field: field,
          message: `Missing required field: ${field}`,
          spec_ref: "SKILL-DESIGN-SPEC.md line 186-198"
        });
      }
    }

    // 验证 allowed-tools 有效性
    if (frontmatter['allowed-tools']) {
      const invalidTools = frontmatter['allowed-tools'].filter(tool =>
        !this.isValidTool(tool)
      );
      if (invalidTools.length > 0) {
        results.issues.push({
          level: "WARNING",
          field: "allowed-tools",
          message: `Invalid tools: ${invalidTools.join(', ')}`,
          suggestion: `Valid tools: ${this.getValidToolsList()}`
        });
      }
    }

    return results;
  }

  validateAgentPrompt(output) {
    const requiredSections = ['ROLE', 'TASK', 'CONTEXT', 'OUTPUT_FORMAT'];
    const results = { passed: true, issues: [] };

    for (const section of requiredSections) {
      if (!output.includes(`[${section}]`)) {
        results.passed = false;
        results.issues.push({
          level: "ERROR",
          section: section,
          message: `Missing required section: [${section}]`,
          spec_ref: "Prompt Engineering spec"
        });
      }
    }

    return results;
  }
}
```

### Phase 4: 质量门控系统

**任务**: 最终质量检查和评分

**质量门控定义**:
```javascript
const qualityGates = {
  completeness: {
    weight: 0.25,
    threshold: 80,
    checks: {
      frontmatter_completeness: 0.25,
      sections_completeness: 0.25,
      agent_files_completeness: 0.25,
      data_protocol_completeness: 0.25
    }
  },

  consistency: {
    weight: 0.25,
    threshold: 80,
    checks: {
      naming_convention: 0.3,
      format_consistency: 0.4,
      terminology_consistency: 0.3
    }
  },

  depth: {
    weight: 0.25,
    threshold: 80,
    checks: {
      phase_detail_level: 0.3,
      implementation_clarity: 0.4,
      error_handling_coverage: 0.3
    }
  },

  readability: {
    weight: 0.25,
    threshold: 80,
    checks: {
      language_clarity: 0.3,
      diagram_quality: 0.3,
      example_relevance: 0.4
    }
  }
};

function runQualityGate(output) {
  const scores = {};
  let totalScore = 0;

  for (const [dimension, gate] of Object.entries(qualityGates)) {
    let dimensionScore = 0;
    const issues = [];

    for (const [checkName, weight] of Object.entries(gate.checks)) {
      const result = executeCheck(checkName, output, gate);
      dimensionScore += result.score * weight;
      if (result.issues) {
        issues.push(...result.issues);
      }
    }

    const passed = dimensionScore >= gate.threshold;
    scores[dimension] = {
      score: Math.round(dimensionScore * 100),
      gate: passed ? 'pass' : (dimensionScore >= 60 ? 'review' : 'fail'),
      threshold: gate.threshold,
      issues: issues
    };

    totalScore += dimensionScore;
  }

  const overallScore = totalScore / 4;

  return {
    overall_score: Math.round(overallScore * 100),
    overall_gate: overallScore >= 80 ? 'pass' : (overallScore >= 60 ? 'review' : 'fail'),
    dimensions: scores,
    summary: generateQualitySummary(scores),
    actions: generateActionItems(scores)
  };
}
```

---

## 挑战与缓解

| 挑战 | 严重性 | 缓解策略 |
|--------|--------|----------|
| 规范文档更新同步 | Medium | 规范版本追踪 + 向后兼容策略 |
| 过度严格限制灵活性 | Medium | 推荐级别约束 + 扩展机制 |
| 验证规则误报 | Low | 用户确认机制 + 白名单 |
| 复杂需求的规范覆盖 | High | 分层规范体系 + 专家规则扩展 |

---

## MVP 定义

**最小可行产品 (MVP)** 应包含:

1. ✅ SKILL-DESIGN-SPEC.md 完整解析
2. ✅ 必填字段验证（Slash MD frontmatter）
3. ✅ 格式规范验证（Markdown, YAML, Mermaid）
4. ✅ 实时生成过程验证
5. ✅ 质量门控系统（4 维度）

**MVP 后续增强**:
- CLI-Tools-Usage.md 解析
- Agent System Prompt 验证
- Task JSON Schema 验证
- 自定义规则扩展
- 规范版本管理

---

## 成功标准

| 标准 | 验证方法 |
|------|----------|
| 生成输出 100% 符合规范 | 自动化规则验证 |
| 质量门控通过率 > 95% | 测试集验证 |
| 规范更新后生成质量不降低 | 版本回归测试 |
| 生成过程无 ERROR 级别违规 | 实时验证监控 |

---

## 推荐: 实施

**理由**:
1. 规范驱动确保输出一致性和质量
2. 质量门控是"即刻可用"的保障
3. 验证规则可复用和扩展
4. 与现有规范体系完美集成

**实施路径**:
1. 短期（1-2周）: 规范解析 + 基础验证规则
2. 中期（2-3周）: 实时验证器 + 质量门控
3. 长期（3-4周）: CLI 工具规范 + Task JSON 验证 + 版本管理

**后续跟进**:
1. 监控质量门控通过率
2. 收集验证规则误报案例
3. 优化规则权重和阈值
4. 支持自定义规则扩展

---

**状态**: 可以作为独立的子系统集成到其他生成方案
