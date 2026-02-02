# Phase 3: Phase Decomposition

> Transform parsed workflow steps into formal phase definitions with clear objectives, inputs, outputs, and tool dependencies.

---

## When to Use

| Context | Usage |
|---------|-------|
| Phase 3 Entry | Execute after Phase 2 (Workflow Document Input) completes |
| Input | `workflow-document.json` + `workflow-config.json` |
| Output | `phase-decomposition.json` with complete phase definitions |

---

## Objective

Analyze the workflow document and decompose it into discrete, executable phases following the lite-plan 5-phase pattern as a baseline template. Each phase must have clear boundaries, dependencies, and measurable outputs.

---

## Reference Pattern: lite-plan 5-Phase Structure

The lite-plan workflow provides the canonical phase structure for CCW workflows:

```
Phase 1: Analysis        -> Understand the problem/task
Phase 2: Clarification   -> Gather missing information
Phase 3: Planning        -> Create execution plan
Phase 4: Confirmation    -> User approval checkpoint
Phase 5: Execution       -> Execute the plan
```

**Adaptation Rules**:
- Simple workflows (2-3 phases): Merge Analysis + Clarification, skip Confirmation
- Standard workflows (4-5 phases): Follow lite-plan pattern
- Complex workflows (6+ phases): Expand Planning/Execution into sub-phases

---

## Phase Decomposition Algorithm

### Step 1: Analyze Workflow Type

```javascript
function determinePhasePattern(config, document) {
  const workflowType = config.type;  // planning | fix | analysis | generation
  const stepCount = document.steps.length;
  const complexity = config.execution.mode;

  // Select base pattern
  const patterns = {
    planning: ['Analysis', 'Decomposition', 'Planning', 'Confirmation', 'Output'],
    fix: ['Diagnosis', 'Analysis', 'Fix Planning', 'Confirmation', 'Execution', 'Validation'],
    analysis: ['Collection', 'Analysis', 'Synthesis', 'Report'],
    generation: ['Input', 'Template Selection', 'Generation', 'Validation', 'Output']
  };

  return patterns[workflowType] || patterns.planning;
}
```

### Step 2: Map Steps to Phases

```javascript
function mapStepsToPhases(steps, basePattern) {
  const phases = [];
  const stepsPerPhase = Math.ceil(steps.length / basePattern.length);

  basePattern.forEach((phaseName, index) => {
    const startIdx = index * stepsPerPhase;
    const endIdx = Math.min(startIdx + stepsPerPhase, steps.length);
    const phaseSteps = steps.slice(startIdx, endIdx);

    phases.push({
      number: index + 1,
      name: phaseName,
      steps: phaseSteps,
      stepRange: [startIdx, endIdx - 1]
    });
  });

  return phases;
}
```

### Step 3: Define Phase Boundaries

```javascript
function definePhaseDetails(phase, config, document) {
  return {
    id: `P${phase.number}`,
    name: phase.name,
    displayName: `Phase ${phase.number}: ${phase.name}`,

    // Objective: What this phase accomplishes
    objective: generateObjective(phase, config),

    // Input: What this phase receives
    input: {
      required: determineRequiredInputs(phase, document),
      optional: determineOptionalInputs(phase, document),
      fromPreviousPhase: phase.number > 1 ? `P${phase.number - 1}` : null
    },

    // Output: What this phase produces
    output: {
      artifacts: determineOutputArtifacts(phase, config),
      format: determineOutputFormat(phase, config),
      passToNextPhase: phase.number < totalPhases
    },

    // Tools: What tools this phase requires
    tools: {
      required: determineRequiredTools(phase, config),
      optional: determineOptionalTools(phase, config)
    },

    // Execution: How this phase runs
    execution: {
      steps: phase.steps.map(s => s.description),
      estimatedDuration: estimateDuration(phase),
      canRunParallel: determineParallelism(phase),
      requiresUserInput: requiresUserInput(phase)
    },

    // Dependencies
    dependencies: {
      phases: phase.number > 1 ? [`P${phase.number - 1}`] : [],
      external: determineExternalDependencies(phase)
    },

    // Validation
    validation: {
      successCriteria: generateSuccessCriteria(phase),
      qualityGate: determineQualityGate(phase)
    }
  };
}
```

---

## Phase Definition Schema

Each phase in `phase-decomposition.json` follows this structure:

```json
{
  "id": "P1",
  "name": "Analysis",
  "displayName": "Phase 1: Analysis",
  "objective": "Understand the task requirements and gather initial context",
  "input": {
    "required": ["user_input", "workflow_config"],
    "optional": ["existing_context"],
    "fromPreviousPhase": null
  },
  "output": {
    "artifacts": ["analysis-result.json"],
    "format": "json",
    "passToNextPhase": true
  },
  "tools": {
    "required": ["Read", "Bash"],
    "optional": ["Task"]
  },
  "execution": {
    "steps": [
      "Parse user input",
      "Identify key requirements",
      "Scan relevant codebase areas",
      "Generate analysis summary"
    ],
    "estimatedDuration": "2-5 min",
    "canRunParallel": false,
    "requiresUserInput": false
  },
  "dependencies": {
    "phases": [],
    "external": []
  },
  "validation": {
    "successCriteria": [
      "All requirements identified",
      "Relevant files located",
      "Analysis summary generated"
    ],
    "qualityGate": "pass"
  }
}
```

---

## Execution Flow

```
+-----------------------------------------------------------------------------+
|                    Phase 3: Phase Decomposition                              |
|                                                                              |
|  +------------------+                                                        |
|  | Load Inputs      |                                                        |
|  | - workflow-config|                                                        |
|  | - workflow-doc   |                                                        |
|  +--------+---------+                                                        |
|           |                                                                  |
|           v                                                                  |
|  +--------+---------+                                                        |
|  | Determine        |                                                        |
|  | Workflow Type    |                                                        |
|  +--------+---------+                                                        |
|           |                                                                  |
|           v                                                                  |
|  +--------+---------+     +------------------+                               |
|  | Select Base      |---->| Pattern Library  |                               |
|  | Phase Pattern    |     | (5 patterns)     |                               |
|  +--------+---------+     +------------------+                               |
|           |                                                                  |
|           v                                                                  |
|  +--------+---------+                                                        |
|  | Map Document     |                                                        |
|  | Steps to Phases  |                                                        |
|  +--------+---------+                                                        |
|           |                                                                  |
|           v                                                                  |
|  +--------+---------+                                                        |
|  | For Each Phase:  |                                                        |
|  | - Define objective|                                                       |
|  | - Identify I/O   |                                                        |
|  | - Assign tools   |                                                        |
|  | - Set validation |                                                        |
|  +--------+---------+                                                        |
|           |                                                                  |
|           v                                                                  |
|  +--------+---------+                                                        |
|  | Validate         |                                                        |
|  | Dependencies     |                                                        |
|  +--------+---------+                                                        |
|           |                                                                  |
|           v                                                                  |
|  +------------------+                                                        |
|  | phase-decomp     |                                                        |
|  |     .json        |                                                        |
|  +------------------+                                                        |
+-----------------------------------------------------------------------------+
```

---

## Implementation Protocol

```javascript
async function decomposePhases(workDir) {
  console.log('## Phase 3: Phase Decomposition\n');

  // Step 1: Load inputs
  const config = JSON.parse(Read(`${workDir}/workflow-config.json`));
  const document = JSON.parse(Read(`${workDir}/workflow-document.json`));

  console.log(`Workflow: ${config.name} (${config.type})`);
  console.log(`Steps: ${document.steps.length}`);
  console.log(`Target phases: ${config.execution.phaseCount}`);

  // Step 2: Determine base pattern
  const basePattern = determinePhasePattern(config, document);
  console.log(`Base pattern: ${basePattern.join(' -> ')}`);

  // Step 3: Map steps to phases
  const mappedPhases = mapStepsToPhases(document.steps, basePattern);

  // Step 4: Define each phase in detail
  const phases = mappedPhases.map((phase, index) => {
    const totalPhases = mappedPhases.length;
    return definePhaseDetails(phase, config, document, totalPhases);
  });

  // Step 5: Validate phase dependencies
  const dependencyIssues = validatePhaseDependencies(phases);
  if (dependencyIssues.length > 0) {
    console.log('### Dependency Issues\n');
    dependencyIssues.forEach(issue => console.log(`- ${issue}`));
    phases = resolveDependencyIssues(phases, dependencyIssues);
  }

  // Step 6: Generate phase decomposition output
  const decomposition = {
    workflowName: config.name,
    workflowType: config.type,
    totalPhases: phases.length,
    executionMode: config.execution.mode,
    phases: phases,
    dependencies: generateDependencyGraph(phases),
    metadata: {
      generatedAt: new Date().toISOString(),
      sourceConfig: 'workflow-config.json',
      sourceDocument: 'workflow-document.json',
      basePattern: basePattern
    }
  };

  // Step 7: Write output
  const outputPath = `${workDir}/phase-decomposition.json`;
  Write(outputPath, JSON.stringify(decomposition, null, 2));

  // Step 8: Display summary
  console.log(`
### Phase Decomposition Complete

**Phases Generated**: ${phases.length}
**Execution Mode**: ${config.execution.mode}

| Phase | Name | Steps | Tools |
|-------|------|-------|-------|
${phases.map(p => `| ${p.id} | ${p.name} | ${p.execution.steps.length} | ${p.tools.required.join(', ')} |`).join('\n')}

**Output**: ${outputPath}
`);

  return decomposition;
}
```

---

## Helper Functions

### Generate Phase Objective

```javascript
function generateObjective(phase, config) {
  const objectives = {
    Analysis: `Analyze ${config.name} requirements and gather context`,
    Clarification: `Clarify ambiguous requirements through user interaction`,
    Planning: `Create detailed execution plan for ${config.name}`,
    Confirmation: `Present plan to user and collect approval`,
    Execution: `Execute the approved plan`,
    Diagnosis: `Identify root cause of the issue`,
    Fix: `Implement the fix based on diagnosis`,
    Validation: `Verify the fix resolves the issue`,
    Collection: `Collect relevant data for analysis`,
    Synthesis: `Synthesize findings into coherent insights`,
    Report: `Generate final report with recommendations`,
    Input: `Collect and validate user input`,
    Generation: `Generate artifacts based on templates`,
    Output: `Produce final deliverables`
  };

  return objectives[phase.name] || `Execute ${phase.name} phase for ${config.name}`;
}
```

### Determine Required Tools

```javascript
function determineRequiredTools(phase, config) {
  const phaseTools = {
    Analysis: ['Read', 'Bash', 'Grep'],
    Clarification: ['AskUserQuestion'],
    Planning: ['Read', 'Write'],
    Confirmation: ['AskUserQuestion'],
    Execution: ['Task', 'Write', 'Bash'],
    Diagnosis: ['Read', 'Bash', 'Grep'],
    Fix: ['Write', 'Edit'],
    Validation: ['Bash', 'Read'],
    Collection: ['Read', 'Bash', 'Glob'],
    Synthesis: ['Read'],
    Report: ['Write'],
    Input: ['AskUserQuestion', 'Read'],
    Generation: ['Write', 'Task'],
    Output: ['Write']
  };

  const baseTools = phaseTools[phase.name] || ['Read', 'Write'];

  // Add workflow-specific tools
  if (config.tools?.required) {
    return [...new Set([...baseTools, ...config.tools.required])];
  }

  return baseTools;
}
```

### Estimate Phase Duration

```javascript
function estimateDuration(phase) {
  const baseDurations = {
    Analysis: '2-5 min',
    Clarification: '1-3 min',
    Planning: '3-8 min',
    Confirmation: '1-2 min',
    Execution: '5-15 min',
    Diagnosis: '3-10 min',
    Fix: '5-20 min',
    Validation: '2-5 min',
    Collection: '2-5 min',
    Synthesis: '3-8 min',
    Report: '2-5 min',
    Input: '1-3 min',
    Generation: '3-10 min',
    Output: '1-3 min'
  };

  return baseDurations[phase.name] || '2-5 min';
}
```

### Generate Success Criteria

```javascript
function generateSuccessCriteria(phase) {
  const criteria = {
    Analysis: [
      'All requirements identified and documented',
      'Relevant codebase areas scanned',
      'Analysis summary generated'
    ],
    Clarification: [
      'All ambiguous requirements clarified',
      'User responses captured',
      'Clarification context updated'
    ],
    Planning: [
      'Execution plan generated',
      'Tasks defined with clear scope',
      'Dependencies mapped'
    ],
    Confirmation: [
      'Plan presented to user',
      'User approval obtained',
      'Execution parameters confirmed'
    ],
    Execution: [
      'All tasks executed successfully',
      'Artifacts generated',
      'No blocking errors'
    ],
    Diagnosis: [
      'Root cause identified',
      'Affected files located',
      'Fix strategy determined'
    ],
    Fix: [
      'Fix implemented correctly',
      'Code changes applied',
      'No new errors introduced'
    ],
    Validation: [
      'Fix verified working',
      'Tests pass',
      'No regressions detected'
    ],
    Collection: [
      'All relevant data collected',
      'Data sources documented',
      'Collection complete'
    ],
    Synthesis: [
      'Findings synthesized',
      'Patterns identified',
      'Insights documented'
    ],
    Report: [
      'Report generated',
      'All sections complete',
      'Recommendations included'
    ],
    Input: [
      'User input collected',
      'Input validated',
      'Input stored for processing'
    ],
    Generation: [
      'Artifacts generated',
      'Templates applied correctly',
      'Output validated'
    ],
    Output: [
      'Final deliverables produced',
      'Output files written',
      'Summary provided'
    ]
  };

  return criteria[phase.name] || ['Phase completed successfully'];
}
```

### Validate Phase Dependencies

```javascript
function validatePhaseDependencies(phases) {
  const issues = [];

  phases.forEach((phase, index) => {
    // Check sequential dependencies
    if (index > 0) {
      const prevPhase = phases[index - 1];

      // Verify output -> input alignment
      if (prevPhase.output.passToNextPhase) {
        const prevOutputs = prevPhase.output.artifacts;
        const currInputs = phase.input.required;

        // Check if any previous output is used as current input
        const hasConnection = prevOutputs.some(out =>
          currInputs.some(inp => inp.includes(out.replace('.json', '')))
        );

        if (!hasConnection && phase.input.fromPreviousPhase) {
          issues.push(`Phase ${phase.id} expects input from ${prevPhase.id} but no artifact connection found`);
        }
      }
    }

    // Check tool availability
    phase.tools.required.forEach(tool => {
      const validTools = ['Read', 'Write', 'Edit', 'Bash', 'Glob', 'Grep', 'Task', 'AskUserQuestion', 'SlashCommand'];
      if (!validTools.includes(tool)) {
        issues.push(`Phase ${phase.id} requires unknown tool: ${tool}`);
      }
    });

    // Check for circular dependencies
    if (phase.dependencies.phases.includes(phase.id)) {
      issues.push(`Phase ${phase.id} has circular dependency on itself`);
    }
  });

  return issues;
}
```

### Generate Dependency Graph

```javascript
function generateDependencyGraph(phases) {
  const graph = {
    nodes: phases.map(p => ({
      id: p.id,
      name: p.name,
      type: 'phase'
    })),
    edges: []
  };

  phases.forEach((phase, index) => {
    if (index > 0) {
      graph.edges.push({
        from: phases[index - 1].id,
        to: phase.id,
        type: 'sequential'
      });
    }

    // Add explicit dependencies
    phase.dependencies.phases.forEach(depId => {
      if (depId !== phases[index - 1]?.id) {
        graph.edges.push({
          from: depId,
          to: phase.id,
          type: 'explicit'
        });
      }
    });
  });

  return graph;
}
```

---

## Output Schema: phase-decomposition.json

```json
{
  "$schema": "phase-decomposition.schema.json",
  "workflowName": "string",
  "workflowType": "planning | fix | analysis | generation",
  "totalPhases": "number",
  "executionMode": "sequential | autonomous | hybrid",
  "phases": [
    {
      "id": "string (P1, P2, ...)",
      "name": "string",
      "displayName": "string",
      "objective": "string",
      "input": {
        "required": ["string"],
        "optional": ["string"],
        "fromPreviousPhase": "string | null"
      },
      "output": {
        "artifacts": ["string"],
        "format": "json | markdown | code | mixed",
        "passToNextPhase": "boolean"
      },
      "tools": {
        "required": ["string"],
        "optional": ["string"]
      },
      "execution": {
        "steps": ["string"],
        "estimatedDuration": "string",
        "canRunParallel": "boolean",
        "requiresUserInput": "boolean"
      },
      "dependencies": {
        "phases": ["string"],
        "external": ["string"]
      },
      "validation": {
        "successCriteria": ["string"],
        "qualityGate": "pass | review | fail"
      }
    }
  ],
  "dependencies": {
    "nodes": [{ "id": "string", "name": "string", "type": "string" }],
    "edges": [{ "from": "string", "to": "string", "type": "string" }]
  },
  "metadata": {
    "generatedAt": "ISO 8601 timestamp",
    "sourceConfig": "string",
    "sourceDocument": "string",
    "basePattern": ["string"]
  }
}
```

---

## Validation Checklist

### Phase Definition Quality

- [ ] Each phase has a clear, measurable objective
- [ ] Input/output for each phase is explicitly defined
- [ ] Tool requirements are appropriate for phase actions
- [ ] Execution steps are actionable and specific
- [ ] Success criteria are verifiable

### Dependency Validation

- [ ] No circular dependencies exist
- [ ] Sequential phases have proper data flow
- [ ] External dependencies are documented
- [ ] All referenced tools are valid

### Completeness Check

- [ ] All document steps are mapped to phases
- [ ] No orphan steps exist
- [ ] Phase count matches configuration
- [ ] Execution mode is consistent

---

## Error Handling

| Error | Resolution |
|-------|------------|
| Steps don't map cleanly to phases | Adjust phase boundaries or merge steps |
| Missing tool for phase action | Add required tool or modify action |
| Circular dependency detected | Restructure phase order |
| Phase too large (>10 steps) | Split into sub-phases |
| Phase too small (<2 steps) | Merge with adjacent phase |
| Incompatible execution mode | Adjust phase parallelism settings |

---

## Output Example

```json
{
  "workflowName": "code-review",
  "workflowType": "analysis",
  "totalPhases": 4,
  "executionMode": "sequential",
  "phases": [
    {
      "id": "P1",
      "name": "Collection",
      "displayName": "Phase 1: Collection",
      "objective": "Collect code files and context for review",
      "input": {
        "required": ["code_path", "review_scope"],
        "optional": ["previous_reviews"],
        "fromPreviousPhase": null
      },
      "output": {
        "artifacts": ["collection-result.json"],
        "format": "json",
        "passToNextPhase": true
      },
      "tools": {
        "required": ["Read", "Bash", "Glob"],
        "optional": ["Grep"]
      },
      "execution": {
        "steps": [
          "Parse code path input",
          "Scan directory structure",
          "Identify files for review",
          "Collect file metadata"
        ],
        "estimatedDuration": "2-5 min",
        "canRunParallel": false,
        "requiresUserInput": false
      },
      "dependencies": {
        "phases": [],
        "external": []
      },
      "validation": {
        "successCriteria": [
          "All target files identified",
          "File metadata collected",
          "Collection summary generated"
        ],
        "qualityGate": "pass"
      }
    },
    {
      "id": "P2",
      "name": "Analysis",
      "displayName": "Phase 2: Analysis",
      "objective": "Analyze collected code for issues and patterns",
      "input": {
        "required": ["collection-result.json"],
        "optional": ["coding_standards"],
        "fromPreviousPhase": "P1"
      },
      "output": {
        "artifacts": ["analysis-result.json"],
        "format": "json",
        "passToNextPhase": true
      },
      "tools": {
        "required": ["Read", "Task"],
        "optional": ["Bash"]
      },
      "execution": {
        "steps": [
          "Load collected files",
          "Apply analysis rules",
          "Identify code issues",
          "Detect patterns"
        ],
        "estimatedDuration": "3-8 min",
        "canRunParallel": true,
        "requiresUserInput": false
      },
      "dependencies": {
        "phases": ["P1"],
        "external": []
      },
      "validation": {
        "successCriteria": [
          "All files analyzed",
          "Issues categorized",
          "Patterns documented"
        ],
        "qualityGate": "pass"
      }
    },
    {
      "id": "P3",
      "name": "Synthesis",
      "displayName": "Phase 3: Synthesis",
      "objective": "Synthesize analysis findings into coherent insights",
      "input": {
        "required": ["analysis-result.json"],
        "optional": [],
        "fromPreviousPhase": "P2"
      },
      "output": {
        "artifacts": ["synthesis-result.json"],
        "format": "json",
        "passToNextPhase": true
      },
      "tools": {
        "required": ["Read"],
        "optional": ["Task"]
      },
      "execution": {
        "steps": [
          "Aggregate analysis results",
          "Prioritize issues",
          "Generate recommendations",
          "Create summary"
        ],
        "estimatedDuration": "3-8 min",
        "canRunParallel": false,
        "requiresUserInput": false
      },
      "dependencies": {
        "phases": ["P2"],
        "external": []
      },
      "validation": {
        "successCriteria": [
          "Findings synthesized",
          "Priorities assigned",
          "Recommendations generated"
        ],
        "qualityGate": "pass"
      }
    },
    {
      "id": "P4",
      "name": "Report",
      "displayName": "Phase 4: Report",
      "objective": "Generate final code review report",
      "input": {
        "required": ["synthesis-result.json"],
        "optional": ["report_template"],
        "fromPreviousPhase": "P3"
      },
      "output": {
        "artifacts": ["review-report.md"],
        "format": "markdown",
        "passToNextPhase": false
      },
      "tools": {
        "required": ["Write"],
        "optional": []
      },
      "execution": {
        "steps": [
          "Load synthesis results",
          "Apply report template",
          "Generate report sections",
          "Write final report"
        ],
        "estimatedDuration": "2-5 min",
        "canRunParallel": false,
        "requiresUserInput": false
      },
      "dependencies": {
        "phases": ["P3"],
        "external": []
      },
      "validation": {
        "successCriteria": [
          "Report generated",
          "All sections complete",
          "Recommendations included"
        ],
        "qualityGate": "pass"
      }
    }
  ],
  "dependencies": {
    "nodes": [
      { "id": "P1", "name": "Collection", "type": "phase" },
      { "id": "P2", "name": "Analysis", "type": "phase" },
      { "id": "P3", "name": "Synthesis", "type": "phase" },
      { "id": "P4", "name": "Report", "type": "phase" }
    ],
    "edges": [
      { "from": "P1", "to": "P2", "type": "sequential" },
      { "from": "P2", "to": "P3", "type": "sequential" },
      { "from": "P3", "to": "P4", "type": "sequential" }
    ]
  },
  "metadata": {
    "generatedAt": "2026-02-02T16:00:00.000Z",
    "sourceConfig": "workflow-config.json",
    "sourceDocument": "workflow-document.json",
    "basePattern": ["Collection", "Analysis", "Synthesis", "Report"]
  }
}
```

---

## Next Phase

After Phase 3 completes, proceed to **Phase 4: Similar Flow Analysis** with:
- Input: `phase-decomposition.json` + `workflow-config.json`
- Action: Analyze existing workflows for patterns and conventions
- Output: `similarity-report.json`

---

*Phase Version: 1.0*
*Based on: lite-plan 5-phase structure, lite-fix diagnosis pattern*
