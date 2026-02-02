# Phase 2: Workflow Document Input

> Parse and structure user-provided workflow documentation, supporting both direct text descriptions and Markdown file input.

---

## When to Use

| Context | Usage |
|---------|-------|
| Phase 2 Entry | Execute after Phase 1 (Requirements Collection) completes |
| Input | User's workflow document (text description or .md file path) |
| Output | `workflow-document.json` with parsed workflow structure |

---

## Objective

Accept and parse user-provided workflow documentation in multiple formats, extracting key steps, phases, and requirements into a structured format for subsequent artifact generation.

---

## Input Modes

### Mode 1: Direct Text Description

User provides workflow description directly in the conversation.

```javascript
// Detection: Input does not end with .md and is not a valid file path
const isTextInput = !input.trim().endsWith('.md') && !fs.existsSync(input.trim());

if (isTextInput) {
  const rawDescription = input;
  const parsed = parseTextDescription(rawDescription);
}
```

**Example Input**:
```
Create a workflow that:
1. Collects user requirements through questions
2. Analyzes existing codebase for patterns
3. Generates implementation plan
4. Produces code artifacts
5. Validates output quality
```

### Mode 2: Markdown File Input

User provides path to a Markdown file containing workflow documentation.

```javascript
// Detection: Input ends with .md or is a valid file path
const isFileInput = input.trim().endsWith('.md') || fs.existsSync(input.trim());

if (isFileInput) {
  const filePath = input.trim();
  const fileContent = Read(filePath);
  const parsed = parseMarkdownDocument(fileContent);
}
```

**Example Input**:
```
/workflow:workflow-creator docs/my-workflow-spec.md
```

---

## Input Detection Logic

```javascript
async function detectInputMode(input) {
  const trimmed = input.trim();
  
  // Check for file path indicators
  const isFilePath = (
    trimmed.endsWith('.md') ||
    trimmed.startsWith('./') ||
    trimmed.startsWith('../') ||
    trimmed.startsWith('/') ||
    /^[A-Za-z]:\\/.test(trimmed) ||  // Windows absolute path
    /^[A-Za-z]:\//.test(trimmed)     // Windows path with forward slash
  );
  
  if (isFilePath) {
    // Verify file exists
    const exists = await Bash(`test -f "${trimmed}" && echo "EXISTS" || echo "NOT_FOUND"`);
    if (exists.includes('EXISTS')) {
      return { mode: 'file', path: trimmed };
    } else {
      // File not found - ask for clarification
      return { mode: 'clarify', reason: 'file_not_found', path: trimmed };
    }
  }
  
  // Default to text description
  return { mode: 'text', content: trimmed };
}
```

---

## Parsing Strategies

### Text Description Parser

Extracts structured information from natural language descriptions.

```javascript
function parseTextDescription(text) {
  const result = {
    rawInput: text,
    inputFormat: 'text',
    steps: [],
    phases: [],
    requirements: [],
    constraints: [],
    metadata: {
      parsedAt: new Date().toISOString(),
      confidence: 'high'
    }
  };
  
  // Step 1: Extract numbered steps (1. 2. 3. or - bullet points)
  const numberedPattern = /^\s*(\d+)[.)]\s*(.+)$/gm;
  const bulletPattern = /^\s*[-*]\s*(.+)$/gm;
  
  let match;
  while ((match = numberedPattern.exec(text)) !== null) {
    result.steps.push({
      index: parseInt(match[1]),
      description: match[2].trim(),
      type: 'numbered'
    });
  }
  
  // If no numbered steps, try bullet points
  if (result.steps.length === 0) {
    let index = 1;
    while ((match = bulletPattern.exec(text)) !== null) {
      result.steps.push({
        index: index++,
        description: match[1].trim(),
        type: 'bullet'
      });
    }
  }
  
  // Step 2: Extract phase indicators
  const phasePattern = /phase\s*(\d+)[:\s]*(.+)/gi;
  while ((match = phasePattern.exec(text)) !== null) {
    result.phases.push({
      number: parseInt(match[1]),
      name: match[2].trim()
    });
  }
  
  // Step 3: Extract requirements (keywords: must, should, require, need)
  const requirementPattern = /(must|should|require|need)[s]?\s+(.+?)(?:\.|$)/gi;
  while ((match = requirementPattern.exec(text)) !== null) {
    result.requirements.push({
      type: match[1].toLowerCase(),
      description: match[2].trim()
    });
  }
  
  // Step 4: Extract constraints (keywords: cannot, must not, avoid, limit)
  const constraintPattern = /(cannot|must not|avoid|limit)[s]?\s+(.+?)(?:\.|$)/gi;
  while ((match = constraintPattern.exec(text)) !== null) {
    result.constraints.push({
      type: match[1].toLowerCase(),
      description: match[2].trim()
    });
  }
  
  // Step 5: Assess parsing confidence
  result.metadata.confidence = assessConfidence(result);
  
  return result;
}

function assessConfidence(parsed) {
  const hasSteps = parsed.steps.length > 0;
  const hasMultipleSteps = parsed.steps.length >= 3;
  const hasPhases = parsed.phases.length > 0;
  
  if (hasMultipleSteps && hasPhases) return 'high';
  if (hasMultipleSteps || hasPhases) return 'medium';
  if (hasSteps) return 'low';
  return 'very_low';
}
```

### Markdown Document Parser

Extracts structured information from Markdown-formatted documents.

```javascript
function parseMarkdownDocument(content) {
  const result = {
    rawInput: content,
    inputFormat: 'markdown',
    title: null,
    sections: [],
    steps: [],
    phases: [],
    requirements: [],
    constraints: [],
    codeBlocks: [],
    metadata: {
      parsedAt: new Date().toISOString(),
      confidence: 'high'
    }
  };
  
  // Step 1: Extract title (first H1)
  const titleMatch = content.match(/^#\s+(.+)$/m);
  if (titleMatch) {
    result.title = titleMatch[1].trim();
  }
  
  // Step 2: Extract sections (H2 headers)
  const sectionPattern = /^##\s+(.+)$/gm;
  const sections = [];
  let match;
  while ((match = sectionPattern.exec(content)) !== null) {
    sections.push({
      name: match[1].trim(),
      startIndex: match.index
    });
  }
  
  // Extract section content
  for (let i = 0; i < sections.length; i++) {
    const start = sections[i].startIndex;
    const end = sections[i + 1]?.startIndex || content.length;
    const sectionContent = content.substring(start, end);
    
    result.sections.push({
      name: sections[i].name,
      content: sectionContent.trim()
    });
  }
  
  // Step 3: Extract steps from sections
  result.sections.forEach(section => {
    const sectionSteps = extractStepsFromSection(section);
    result.steps.push(...sectionSteps);
  });
  
  // Step 4: Extract code blocks
  const codeBlockPattern = /```(\w*)\n([\s\S]*?)```/g;
  while ((match = codeBlockPattern.exec(content)) !== null) {
    result.codeBlocks.push({
      language: match[1] || 'text',
      content: match[2].trim()
    });
  }
  
  // Step 5: Infer phases from sections
  result.phases = inferPhasesFromSections(result.sections);
  
  // Step 6: Extract requirements and constraints
  result.requirements = extractRequirements(content);
  result.constraints = extractConstraints(content);
  
  return result;
}

function extractStepsFromSection(section) {
  const steps = [];
  const numberedPattern = /^\s*(\d+)[.)]\s*(.+)$/gm;
  const bulletPattern = /^\s*[-*]\s*(.+)$/gm;
  
  let match;
  while ((match = numberedPattern.exec(section.content)) !== null) {
    steps.push({
      index: parseInt(match[1]),
      description: match[2].trim(),
      section: section.name,
      type: 'numbered'
    });
  }
  
  if (steps.length === 0) {
    let index = 1;
    while ((match = bulletPattern.exec(section.content)) !== null) {
      steps.push({
        index: index++,
        description: match[1].trim(),
        section: section.name,
        type: 'bullet'
      });
    }
  }
  
  return steps;
}

function inferPhasesFromSections(sections) {
  const phaseKeywords = ['phase', 'step', 'stage', 'part'];
  const phases = [];
  
  sections.forEach((section, index) => {
    const lowerName = section.name.toLowerCase();
    const isPhase = phaseKeywords.some(kw => lowerName.includes(kw));
    
    if (isPhase) {
      phases.push({
        number: phases.length + 1,
        name: section.name,
        sectionIndex: index
      });
    }
  });
  
  // If no explicit phases, treat major sections as phases
  if (phases.length === 0 && sections.length >= 2) {
    sections.forEach((section, index) => {
      phases.push({
        number: index + 1,
        name: section.name,
        sectionIndex: index,
        inferred: true
      });
    });
  }
  
  return phases;
}

function extractRequirements(content) {
  const requirements = [];
  const pattern = /(must|should|require|need)[s]?\s+(.+?)(?:\.|$)/gi;
  let match;
  
  while ((match = pattern.exec(content)) !== null) {
    requirements.push({
      type: match[1].toLowerCase(),
      description: match[2].trim()
    });
  }
  
  return requirements;
}

function extractConstraints(content) {
  const constraints = [];
  const pattern = /(cannot|must not|avoid|limit|do not)[s]?\s+(.+?)(?:\.|$)/gi;
  let match;
  
  while ((match = pattern.exec(content)) !== null) {
    constraints.push({
      type: match[1].toLowerCase(),
      description: match[2].trim()
    });
  }
  
  return constraints;
}
```

---

## Clarification Protocol

When parsing confidence is low or input is ambiguous, use multi-round clarification.

### Clarification Triggers

```javascript
function needsClarification(parsed) {
  return (
    parsed.metadata.confidence === 'low' ||
    parsed.metadata.confidence === 'very_low' ||
    parsed.steps.length === 0 ||
    parsed.steps.length > 15  // Too many steps may need grouping
  );
}
```

### Clarification Questions

```javascript
async function clarifyWorkflowDocument(parsed, workDir) {
  const clarifications = [];
  
  // Clarification 1: No steps detected
  if (parsed.steps.length === 0) {
    const response = await AskUserQuestion({
      questions: [{
        question: "I couldn't detect clear workflow steps from your input. Could you provide the steps in a numbered format?\n\nExample:\n1. First step\n2. Second step\n3. Third step",
        header: "Steps",
        options: [
          { label: "Provide Steps", description: "I will provide numbered steps" },
          { label: "Use Sections", description: "Treat document sections as steps" },
          { label: "Single Phase", description: "This is a single-phase workflow" }
        ]
      }]
    });
    clarifications.push({ type: 'steps', response });
  }
  
  // Clarification 2: Too many steps (may need grouping)
  if (parsed.steps.length > 10) {
    const response = await AskUserQuestion({
      questions: [{
        question: `Detected ${parsed.steps.length} steps. Should these be grouped into phases?`,
        header: "Grouping",
        options: [
          { label: "Auto-group", description: "Automatically group related steps into phases" },
          { label: "Keep All", description: "Keep all steps as individual workflow steps" },
          { label: "Manual Group", description: "I will specify phase groupings" }
        ]
      }]
    });
    clarifications.push({ type: 'grouping', response });
  }
  
  // Clarification 3: Ambiguous phase boundaries
  if (parsed.phases.length === 0 && parsed.steps.length > 3) {
    const response = await AskUserQuestion({
      questions: [{
        question: "No explicit phases detected. How should the workflow be structured?",
        header: "Structure",
        options: [
          { label: "Sequential", description: "Execute steps in order (Phase 1 -> Phase 2 -> ...)" },
          { label: "Parallel", description: "Some steps can run in parallel" },
          { label: "Conditional", description: "Steps have conditional branching" }
        ]
      }]
    });
    clarifications.push({ type: 'structure', response });
  }
  
  // Clarification 4: Missing input/output specification
  if (!parsed.requirements.some(r => r.description.toLowerCase().includes('input')) &&
      !parsed.requirements.some(r => r.description.toLowerCase().includes('output'))) {
    const response = await AskUserQuestion({
      questions: [{
        question: "What are the primary inputs and outputs for this workflow?",
        header: "I/O",
        options: [
          { label: "Specify", description: "I will specify inputs and outputs" },
          { label: "Infer", description: "Infer from step descriptions" },
          { label: "None", description: "No specific I/O requirements" }
        ]
      }]
    });
    clarifications.push({ type: 'io', response });
  }
  
  return clarifications;
}
```

---

## Execution Flow

```
+-----------------------------------------------------------------------------+
|                    Phase 2: Workflow Document Input                          |
|                                                                              |
|  +------------------+                                                        |
|  | Detect Input Mode|                                                        |
|  +--------+---------+                                                        |
|           |                                                                  |
|           v                                                                  |
|  +--------+---------+     +------------------+                               |
|  | Mode = 'text'?   |---->| Parse Text       |                               |
|  +--------+---------+     | Description      |                               |
|           |               +--------+---------+                               |
|           | No                     |                                         |
|           v                        |                                         |
|  +--------+---------+              |                                         |
|  | Mode = 'file'?   |---->+--------+---------+                               |
|  +--------+---------+     | Read & Parse     |                               |
|           |               | Markdown File    |                               |
|           | No            +--------+---------+                               |
|           v                        |                                         |
|  +--------+---------+              |                                         |
|  | Mode = 'clarify'?|              |                                         |
|  +--------+---------+              |                                         |
|           |                        |                                         |
|           v                        v                                         |
|  +------------------+     +------------------+                               |
|  | Ask for Valid    |     | Assess Parsing   |                               |
|  | Input            |     | Confidence       |                               |
|  +------------------+     +--------+---------+                               |
|                                    |                                         |
|                                    v                                         |
|                           +--------+---------+                               |
|                           | Needs            |                               |
|                           | Clarification?   |                               |
|                           +--------+---------+                               |
|                                    |                                         |
|                    +---------------+---------------+                         |
|                    | Yes                           | No                      |
|                    v                               v                         |
|           +--------+---------+            +--------+---------+               |
|           | Multi-Round      |            | Generate         |               |
|           | Clarification    |            | workflow-document|               |
|           +--------+---------+            | .json            |               |
|                    |                      +--------+---------+               |
|                    v                               |                         |
|           +--------+---------+                     |                         |
|           | Merge Responses  |                     |                         |
|           | with Parsed Data |                     |                         |
|           +--------+---------+                     |                         |
|                    |                               |                         |
|                    +---------------+---------------+                         |
|                                    |                                         |
|                                    v                                         |
|                           +------------------+                               |
|                           | workflow-document|                               |
|                           |     .json        |                               |
|                           +------------------+                               |
+-----------------------------------------------------------------------------+
```

---

## Output Schema: workflow-document.json

```json
{
  "$schema": "workflow-document.schema.json",
  "rawInput": "string (original user input)",
  "inputFormat": "text | markdown",
  "title": "string | null (extracted title)",
  "steps": [
    {
      "index": "number",
      "description": "string",
      "section": "string | null",
      "type": "numbered | bullet"
    }
  ],
  "phases": [
    {
      "number": "number",
      "name": "string",
      "sectionIndex": "number | null",
      "inferred": "boolean"
    }
  ],
  "requirements": [
    {
      "type": "must | should | require | need",
      "description": "string"
    }
  ],
  "constraints": [
    {
      "type": "cannot | must not | avoid | limit",
      "description": "string"
    }
  ],
  "sections": [
    {
      "name": "string",
      "content": "string"
    }
  ],
  "codeBlocks": [
    {
      "language": "string",
      "content": "string"
    }
  ],
  "clarifications": [
    {
      "type": "steps | grouping | structure | io",
      "question": "string",
      "response": "string"
    }
  ],
  "metadata": {
    "parsedAt": "ISO 8601 timestamp",
    "confidence": "high | medium | low | very_low",
    "inputPath": "string | null (if file input)",
    "clarificationRounds": "number"
  }
}
```

---

## Implementation Protocol

```javascript
async function processWorkflowDocument(input, workDir, config) {
  console.log('## Phase 2: Workflow Document Input\n');
  
  // Step 1: Detect input mode
  const inputMode = await detectInputMode(input);
  console.log(`Input mode: ${inputMode.mode}`);
  
  let parsed;
  
  // Step 2: Parse based on mode
  if (inputMode.mode === 'text') {
    console.log('Parsing text description...');
    parsed = parseTextDescription(inputMode.content);
    
  } else if (inputMode.mode === 'file') {
    console.log(`Reading file: ${inputMode.path}`);
    const fileContent = Read(inputMode.path);
    parsed = parseMarkdownDocument(fileContent);
    parsed.metadata.inputPath = inputMode.path;
    
  } else if (inputMode.mode === 'clarify') {
    // File not found - ask for valid input
    const response = await AskUserQuestion({
      questions: [{
        question: `File not found: ${inputMode.path}\n\nPlease provide a valid file path or enter the workflow description directly.`,
        header: "Input",
        options: [
          { label: "Enter Path", description: "I will provide a correct file path" },
          { label: "Enter Text", description: "I will describe the workflow in text" }
        ]
      }]
    });
    
    // Recursive call with new input
    // (In practice, wait for user's next message)
    return { status: 'awaiting_input', reason: inputMode.reason };
  }
  
  // Step 3: Display parsing results
  console.log(`
### Parsing Results

- **Steps detected**: ${parsed.steps.length}
- **Phases detected**: ${parsed.phases.length}
- **Requirements**: ${parsed.requirements.length}
- **Constraints**: ${parsed.constraints.length}
- **Confidence**: ${parsed.metadata.confidence}
`);
  
  // Step 4: Clarification if needed
  if (needsClarification(parsed)) {
    console.log('### Clarification Required\n');
    const clarifications = await clarifyWorkflowDocument(parsed, workDir);
    parsed.clarifications = clarifications;
    parsed.metadata.clarificationRounds = clarifications.length;
    
    // Merge clarification responses into parsed data
    parsed = mergeClarifications(parsed, clarifications);
  } else {
    parsed.clarifications = [];
    parsed.metadata.clarificationRounds = 0;
  }
  
  // Step 5: Write output
  const outputPath = `${workDir}/workflow-document.json`;
  Write(outputPath, JSON.stringify(parsed, null, 2));
  
  console.log(`
### Phase 2 Complete

Output: ${outputPath}
Steps: ${parsed.steps.length}
Phases: ${parsed.phases.length}
Confidence: ${parsed.metadata.confidence}
`);
  
  return parsed;
}

function mergeClarifications(parsed, clarifications) {
  clarifications.forEach(clarification => {
    switch (clarification.type) {
      case 'steps':
        if (clarification.response === 'Use Sections') {
          // Convert sections to steps
          parsed.steps = parsed.sections.map((section, index) => ({
            index: index + 1,
            description: section.name,
            section: null,
            type: 'inferred'
          }));
        }
        break;
        
      case 'grouping':
        if (clarification.response === 'Auto-group') {
          // Group steps into phases (3-4 steps per phase)
          const stepsPerPhase = 3;
          parsed.phases = [];
          for (let i = 0; i < parsed.steps.length; i += stepsPerPhase) {
            parsed.phases.push({
              number: parsed.phases.length + 1,
              name: `Phase ${parsed.phases.length + 1}`,
              stepRange: [i, Math.min(i + stepsPerPhase - 1, parsed.steps.length - 1)],
              inferred: true
            });
          }
        }
        break;
        
      case 'structure':
        parsed.executionMode = clarification.response.toLowerCase();
        break;
        
      case 'io':
        if (clarification.response === 'Infer') {
          // Infer I/O from step descriptions
          parsed.inferredIO = {
            inputs: inferInputs(parsed.steps),
            outputs: inferOutputs(parsed.steps)
          };
        }
        break;
    }
  });
  
  // Recalculate confidence after clarifications
  parsed.metadata.confidence = assessConfidence(parsed);
  
  return parsed;
}

function inferInputs(steps) {
  const inputKeywords = ['receive', 'accept', 'input', 'read', 'load', 'get', 'collect'];
  return steps
    .filter(step => inputKeywords.some(kw => step.description.toLowerCase().includes(kw)))
    .map(step => step.description);
}

function inferOutputs(steps) {
  const outputKeywords = ['generate', 'create', 'output', 'write', 'produce', 'return', 'emit'];
  return steps
    .filter(step => outputKeywords.some(kw => step.description.toLowerCase().includes(kw)))
    .map(step => step.description);
}
```

---

## Validation Checklist

### Required Fields

- [ ] `rawInput`: Original user input preserved
- [ ] `inputFormat`: Correctly identified as 'text' or 'markdown'
- [ ] `steps`: At least 1 step extracted (or clarification obtained)
- [ ] `metadata.parsedAt`: Valid ISO 8601 timestamp
- [ ] `metadata.confidence`: Valid confidence level

### Quality Checks

- [ ] Steps are in logical order
- [ ] Phase boundaries are sensible
- [ ] Requirements are actionable
- [ ] Constraints are specific
- [ ] Clarifications resolved ambiguities

---

## Error Handling

| Error | Resolution |
|-------|------------|
| File not found | Prompt for valid path or text input |
| Empty input | Request workflow description |
| No steps detected | Multi-round clarification |
| Parsing failure | Fall back to raw text storage |
| Encoding issues | Attempt UTF-8 and fallback encodings |

---

## Integration with Phase 1

Phase 2 receives `workflow-config.json` from Phase 1 and uses it to:

1. **Validate alignment**: Ensure document matches declared workflow type
2. **Enrich parsing**: Use workflow type hints for better step detection
3. **Cross-reference**: Link document sections to declared phases

```javascript
async function integrateWithPhase1(workDir) {
  const configPath = `${workDir}/workflow-config.json`;
  const config = JSON.parse(Read(configPath));
  
  // Use config to guide parsing
  const parsingHints = {
    expectedPhaseCount: config.execution.phaseCount,
    workflowType: config.type,
    expectedTools: config.tools.required
  };
  
  return parsingHints;
}
```

---

## Output Example

```json
{
  "rawInput": "Create a workflow that:\n1. Collects user requirements\n2. Analyzes codebase\n3. Generates plan\n4. Produces artifacts\n5. Validates output",
  "inputFormat": "text",
  "title": null,
  "steps": [
    { "index": 1, "description": "Collects user requirements", "section": null, "type": "numbered" },
    { "index": 2, "description": "Analyzes codebase", "section": null, "type": "numbered" },
    { "index": 3, "description": "Generates plan", "section": null, "type": "numbered" },
    { "index": 4, "description": "Produces artifacts", "section": null, "type": "numbered" },
    { "index": 5, "description": "Validates output", "section": null, "type": "numbered" }
  ],
  "phases": [
    { "number": 1, "name": "Phase 1", "stepRange": [0, 1], "inferred": true },
    { "number": 2, "name": "Phase 2", "stepRange": [2, 3], "inferred": true },
    { "number": 3, "name": "Phase 3", "stepRange": [4, 4], "inferred": true }
  ],
  "requirements": [],
  "constraints": [],
  "sections": [],
  "codeBlocks": [],
  "clarifications": [
    {
      "type": "grouping",
      "question": "Detected 5 steps. Should these be grouped into phases?",
      "response": "Auto-group"
    }
  ],
  "metadata": {
    "parsedAt": "2026-02-02T15:30:00.000Z",
    "confidence": "medium",
    "inputPath": null,
    "clarificationRounds": 1
  }
}
```

---

## Next Phase

After Phase 2 completes, proceed to **Phase 3: Phase Decomposition** with:
- Input: `workflow-document.json` + `workflow-config.json`
- Action: Transform parsed steps into formal phase definitions
- Output: `phase-breakdown.json`

---

*Phase Version: 1.0*
*Based on: lite-plan Phase 1 Task Analysis pattern*
