# Quality Standards Specification

> Defines the quality dimensions, validation rules, and acceptance criteria for Claude Code Workflow components.

---

## When to Use

| Phase | Usage | Section |
|-------|-------|---------|
| Phase 2: Component Generation | Apply quality standards during generation | [Quality Dimensions](#quality-dimensions) |
| Phase 3: Integration | Validate component integration | [Integration Quality](#integration-quality) |
| Phase 4: Validation | Execute quality gates | [Quality Gates](#quality-gates) |
| Phase 4: Validation | Classify and resolve issues | [Issue Classification](#issue-classification) |

---

## Quality Dimensions

### Overview

| Dimension | Weight | Focus Area |
|-----------|--------|------------|
| Completeness | 25% | All required elements present |
| Consistency | 25% | Uniform patterns and conventions |
| Depth | 25% | Sufficient detail and examples |
| Readability | 25% | Clear structure and language |

### 1. Completeness (25%)

**Definition**: All required sections, fields, and elements are present with substantive content.

**Scoring Criteria**:

| Score | Criteria |
|-------|----------|
| 100% | All required elements present with full content |
| 75% | All required elements present, some with minimal content |
| 50% | Most required elements present |
| 25% | Some required elements missing |
| 0% | Critical elements missing |

**Checklist by Component**:

**Commands**:
- [ ] Front matter complete (name, description, argument-hint, allowed-tools)
- [ ] Overview section with purpose and capabilities
- [ ] Usage section with examples
- [ ] Output artifacts table
- [ ] Execution process flowchart
- [ ] Implementation details for each phase
- [ ] Error handling table

**Agents**:
- [ ] Front matter complete (name, description, color)
- [ ] Role statement
- [ ] Core capabilities list
- [ ] Execution workflow diagram
- [ ] Phase implementation details
- [ ] Key reminders (ALWAYS/NEVER)

**Schemas**:
- [ ] $schema reference
- [ ] Title and description
- [ ] Required fields array
- [ ] All properties defined with types
- [ ] _metadata object

### 2. Consistency (25%)

**Definition**: Uniform application of patterns, conventions, and terminology.

**Scoring Criteria**:

| Score | Criteria |
|-------|----------|
| 100% | All patterns consistently applied |
| 75% | Minor inconsistencies in non-critical areas |
| 50% | Some pattern deviations |
| 25% | Significant inconsistencies |
| 0% | No consistent patterns |

**Consistency Rules**:

**Naming**:
- [ ] File names follow conventions (lowercase, hyphenated)
- [ ] Field names match schema patterns
- [ ] Variable names consistent across components
- [ ] Terminology uniform (e.g., "task" vs "step")

**Structure**:
- [ ] Section ordering consistent
- [ ] Code block formatting uniform
- [ ] Table formatting consistent
- [ ] Indentation consistent

**Patterns**:
- [ ] Error handling follows standard pattern
- [ ] CLI invocation follows template
- [ ] Agent prompts follow structure
- [ ] Schema patterns reused appropriately

### 3. Depth (25%)

**Definition**: Sufficient detail, examples, and explanations for practical use.

**Scoring Criteria**:

| Score | Criteria |
|-------|----------|
| 100% | Comprehensive detail with multiple examples |
| 75% | Good detail with examples |
| 50% | Basic detail, limited examples |
| 25% | Minimal detail |
| 0% | Insufficient for practical use |

**Depth Requirements**:

**Commands**:
- [ ] 2+ usage examples
- [ ] Code examples for each phase
- [ ] Error scenarios documented
- [ ] Edge cases addressed

**Agents**:
- [ ] Detailed phase implementation
- [ ] Code snippets for key functions
- [ ] Fallback strategies documented
- [ ] Output format examples

**Schemas**:
- [ ] All properties have descriptions
- [ ] Constraints documented (min/max, patterns)
- [ ] Example values provided
- [ ] Nested structures fully defined

### 4. Readability (25%)

**Definition**: Clear structure, concise language, and easy navigation.

**Scoring Criteria**:

| Score | Criteria |
|-------|----------|
| 100% | Excellent structure, clear language |
| 75% | Good structure, mostly clear |
| 50% | Adequate structure, some unclear sections |
| 25% | Poor structure or unclear language |
| 0% | Difficult to understand |

**Readability Rules**:

**Structure**:
- [ ] Logical section ordering
- [ ] Clear hierarchy (H1 > H2 > H3)
- [ ] Table of contents for long documents
- [ ] Consistent section formatting

**Language**:
- [ ] Concise descriptions (no redundancy)
- [ ] Technical terms defined
- [ ] Active voice preferred
- [ ] ASCII-only characters (no emojis)

**Navigation**:
- [ ] Cross-references accurate
- [ ] Links functional
- [ ] Code blocks labeled
- [ ] Tables properly formatted

---

## Quality Gates

### Gate Definitions

| Gate | Threshold | Action |
|------|-----------|--------|
| Pass | >= 80% | Continue execution |
| Review | 60-79% | Process warnings, then continue |
| Fail | < 60% | Must fix before proceeding |

### Gate Implementation

```javascript
const QUALITY_GATES = {
  pass: { threshold: 80, action: "Continue execution" },
  review: { threshold: 60, action: "Process warnings, then continue" },
  fail: { threshold: 0, action: "Must fix before proceeding" }
}

function evaluateQuality(scores) {
  const overall = (
    scores.completeness * 0.25 +
    scores.consistency * 0.25 +
    scores.depth * 0.25 +
    scores.readability * 0.25
  )
  
  if (overall >= 80) return { gate: 'pass', score: overall }
  if (overall >= 60) return { gate: 'review', score: overall }
  return { gate: 'fail', score: overall }
}
```

### Gate Actions

**Pass (>= 80%)**:
- Log success
- Add quality metadata
- Continue to next phase

**Review (60-79%)**:
- Log warnings
- Attempt auto-fix for minor issues
- Continue with warnings documented

**Fail (< 60%)**:
- Log errors
- Block progression
- Require manual intervention or regeneration

---

## Issue Classification

### Severity Levels

| Level | Prefix | Meaning | Action |
|-------|--------|---------|--------|
| Error | E | Blocking issue | Must fix |
| Warning | W | Quality impact | Should fix |
| Info | I | Improvement opportunity | Optional fix |

### Error Types (Must Fix)

| Code | Description | Example |
|------|-------------|---------|
| E001 | Missing required field | Front matter missing `name` |
| E002 | Invalid field value | Enum value not in allowed list |
| E003 | Schema violation | Required property missing |
| E004 | Circular dependency | Task depends on itself |
| E005 | Invalid reference | Schema path does not exist |
| E006 | Type mismatch | String where array expected |

### Warning Types (Should Fix)

| Code | Description | Example |
|------|-------------|---------|
| W001 | Vague description | "Works correctly" instead of quantified |
| W002 | Missing example | No usage examples provided |
| W003 | Inconsistent naming | Mixed case in field names |
| W004 | Incomplete section | Section present but minimal content |
| W005 | Missing error handling | No fallback defined |
| W006 | Oversized task | Task scope > 60 minutes |

### Info Types (Optional Fix)

| Code | Description | Example |
|------|-------------|---------|
| I001 | Could add more examples | Only 1 example, could have 2+ |
| I002 | Could improve description | Description could be clearer |
| I003 | Could add cross-reference | Related component not linked |
| I004 | Could optimize structure | Section could be reorganized |

---

## Validation Functions

### Command Validation

```javascript
function validateCommand(commandContent) {
  const issues = []
  
  // E001: Check front matter
  if (!commandContent.includes('---\nname:')) {
    issues.push({ code: 'E001', message: 'Missing front matter' })
  }
  
  // E001: Check required sections
  const requiredSections = ['## Overview', '## Usage', '## Execution Process']
  requiredSections.forEach(section => {
    if (!commandContent.includes(section)) {
      issues.push({ code: 'E001', message: `Missing section: ${section}` })
    }
  })
  
  // W002: Check for examples
  if (!commandContent.includes('```bash')) {
    issues.push({ code: 'W002', message: 'No bash examples found' })
  }
  
  return issues
}
```

### Agent Validation

```javascript
function validateAgent(agentContent) {
  const issues = []
  
  // E001: Check front matter
  const frontMatterMatch = /---\nname: (.+)\ndescription:/.exec(agentContent)
  if (!frontMatterMatch) {
    issues.push({ code: 'E001', message: 'Invalid front matter format' })
  }
  
  // E001: Check required sections
  if (!agentContent.includes('## Core Capabilities')) {
    issues.push({ code: 'E001', message: 'Missing Core Capabilities section' })
  }
  
  // W001: Check for ALWAYS/NEVER
  if (!agentContent.includes('**ALWAYS**:')) {
    issues.push({ code: 'W004', message: 'Missing ALWAYS section' })
  }
  if (!agentContent.includes('**NEVER**:')) {
    issues.push({ code: 'W004', message: 'Missing NEVER section' })
  }
  
  return issues
}
```

### Schema Validation

```javascript
function validateSchema(schemaContent) {
  const issues = []
  
  try {
    const schema = JSON.parse(schemaContent)
    
    // E001: Check required root fields
    if (!schema.$schema) {
      issues.push({ code: 'E001', message: 'Missing $schema field' })
    }
    if (!schema.title) {
      issues.push({ code: 'E001', message: 'Missing title field' })
    }
    if (!schema.required || !Array.isArray(schema.required)) {
      issues.push({ code: 'E001', message: 'Missing or invalid required array' })
    }
    
    // W001: Check property descriptions
    if (schema.properties) {
      Object.entries(schema.properties).forEach(([key, value]) => {
        if (!value.description) {
          issues.push({ code: 'W001', message: `Property ${key} missing description` })
        }
      })
    }
    
  } catch (e) {
    issues.push({ code: 'E003', message: `Invalid JSON: ${e.message}` })
  }
  
  return issues
}
```

### Task Validation

```javascript
function validateTask(task) {
  const issues = []
  
  // E002: Check task ID format
  if (!/^T\d+$/.test(task.id)) {
    issues.push({ code: 'E002', message: `Invalid task ID: ${task.id}` })
  }
  
  // E001: Check required fields
  if (!task.title?.trim()) {
    issues.push({ code: 'E001', message: 'Missing task title' })
  }
  if (!task.scope?.trim()) {
    issues.push({ code: 'E001', message: 'Missing task scope' })
  }
  
  // E002: Check action enum
  const validActions = ['Create', 'Update', 'Implement', 'Refactor', 'Add', 'Delete', 'Configure', 'Test', 'Fix']
  if (!validActions.includes(task.action)) {
    issues.push({ code: 'E002', message: `Invalid action: ${task.action}` })
  }
  
  // W001: Check acceptance criteria quality
  if (task.acceptance?.some(a => /works correctly|good performance/i.test(a))) {
    issues.push({ code: 'W001', message: 'Vague acceptance criteria detected' })
  }
  
  // W006: Check implementation steps
  if (!task.implementation || task.implementation.length < 2) {
    issues.push({ code: 'W004', message: 'Need 2+ implementation steps' })
  }
  
  // E004: Check for circular dependencies
  if (task.depends_on?.includes(task.id)) {
    issues.push({ code: 'E004', message: 'Task depends on itself' })
  }
  
  return { valid: !issues.some(i => i.code.startsWith('E')), issues }
}
```

---

## Integration Quality

### Cross-Component Validation

```javascript
function validateIntegration(components) {
  const issues = []
  
  // Check command -> agent references
  components.commands.forEach(cmd => {
    const agentRefs = cmd.content.match(/subagent_type="([^"]+)"/g) || []
    agentRefs.forEach(ref => {
      const agentName = ref.match(/"([^"]+)"/)[1]
      if (!components.agents.find(a => a.name === agentName)) {
        issues.push({ code: 'E005', message: `Command references non-existent agent: ${agentName}` })
      }
    })
  })
  
  // Check agent -> schema references
  components.agents.forEach(agent => {
    const schemaRefs = agent.content.match(/schemas\/([^"]+\.json)/g) || []
    schemaRefs.forEach(ref => {
      const schemaName = ref.replace('schemas/', '')
      if (!components.schemas.find(s => s.name === schemaName)) {
        issues.push({ code: 'E005', message: `Agent references non-existent schema: ${schemaName}` })
      }
    })
  })
  
  return issues
}
```

### Dependency Validation

```javascript
function validateDependencies(tasks) {
  const issues = []
  const taskIds = new Set(tasks.map(t => t.id))
  
  tasks.forEach(task => {
    (task.depends_on || []).forEach(depId => {
      // Check dependency exists
      if (!taskIds.has(depId)) {
        issues.push({ code: 'E005', message: `Task ${task.id} depends on non-existent task: ${depId}` })
      }
    })
  })
  
  // Check for circular dependencies
  function hasCycle(taskId, visited = new Set(), path = new Set()) {
    if (path.has(taskId)) return true
    if (visited.has(taskId)) return false
    
    visited.add(taskId)
    path.add(taskId)
    
    const task = tasks.find(t => t.id === taskId)
    for (const depId of (task?.depends_on || [])) {
      if (hasCycle(depId, visited, path)) return true
    }
    
    path.delete(taskId)
    return false
  }
  
  tasks.forEach(task => {
    if (hasCycle(task.id)) {
      issues.push({ code: 'E004', message: `Circular dependency detected involving task: ${task.id}` })
    }
  })
  
  return issues
}
```

---

## Auto-Fix Strategies

### Fixable Issues

| Issue Code | Auto-Fix Strategy |
|------------|-------------------|
| W001 | Replace vague criteria with quantified version |
| W004 | Expand to minimum required content |
| W006 | Split oversized task into subtasks |

### Auto-Fix Implementation

```javascript
function autoFix(issues, content) {
  let fixed = content
  const fixLog = []
  
  issues.forEach(issue => {
    switch (issue.code) {
      case 'W001':
        // Replace vague acceptance criteria
        fixed = fixed.replace(
          /works correctly/gi,
          'All unit tests pass with 100% success rate'
        )
        fixed = fixed.replace(
          /good performance/gi,
          'Response time < 200ms at p95'
        )
        fixLog.push({ code: 'W001', action: 'Replaced vague criteria' })
        break
        
      case 'W004':
        // Add minimum implementation steps
        if (issue.message.includes('implementation steps')) {
          // Expand to 4-step template
          fixLog.push({ code: 'W004', action: 'Expanded implementation steps' })
        }
        break
    }
  })
  
  return { content: fixed, fixLog }
}
```

---

## Quality Report Format

### Report Structure

```markdown
# Quality Report

## Summary
- **Overall Score**: {score}%
- **Gate Status**: {pass|review|fail}
- **Errors**: {count}
- **Warnings**: {count}
- **Info**: {count}

## Dimension Scores
| Dimension | Score | Status |
|-----------|-------|--------|
| Completeness | {score}% | {status} |
| Consistency | {score}% | {status} |
| Depth | {score}% | {status} |
| Readability | {score}% | {status} |

## Issues

### Errors (Must Fix)
- [{code}] {message} - {location}

### Warnings (Should Fix)
- [{code}] {message} - {location}

### Info (Optional)
- [{code}] {message} - {location}

## Auto-Fix Applied
- {fix description}

## Recommendations
- {recommendation}
```

---

## Validation Checklist

### Pre-Generation Checklist

- [ ] **Requirements clear**: All requirements understood
- [ ] **Patterns identified**: Existing patterns analyzed
- [ ] **Dependencies mapped**: Component dependencies known
- [ ] **Constraints documented**: Limitations understood

### Post-Generation Checklist

- [ ] **Completeness verified**: All required elements present
- [ ] **Consistency checked**: Patterns uniformly applied
- [ ] **Depth adequate**: Sufficient detail and examples
- [ ] **Readability confirmed**: Clear structure and language
- [ ] **Integration validated**: Cross-references correct
- [ ] **Quality gate passed**: Score >= 80%

---

*Specification Version: 1.0*
*Based on: SKILL-DESIGN-SPEC.md, quality-standards patterns*
