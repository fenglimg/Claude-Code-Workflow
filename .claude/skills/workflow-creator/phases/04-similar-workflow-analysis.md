# Phase 4: Similar Workflow Analysis

> Analyze existing workflows to identify similar patterns, extract reusable components, and provide reference recommendations for artifact generation.

---

## When to Use

| Context | Usage |
|---------|-------|
| Phase 4 Entry | Execute after Phase 3 (Phase Decomposition) completes |
| Input | `phase-decomposition.json` + `workflow-config.json` |
| Output | `similarity-analysis.json` with similar workflows, patterns, and recommendations |

---

## Objective

Use semantic search (ACE-tool MCP) to analyze the codebase for existing workflows that share similar purposes, structures, or patterns. For each phase in the new workflow, identify if similar implementations exist that can serve as references. Mark phases as 'new' if no similar patterns are found.

---

## Search Strategy

### Primary Tool: ACE Semantic Search

```javascript
// ACE-tool provides semantic code search across the codebase
mcp__ace-tool__search_context({
  project_root_path: projectRoot,
  query: "workflow implementation pattern for {phase_objective}"
})
```

### Fallback Chain

1. **ACE semantic search** (primary) - Best for understanding intent and finding similar implementations
2. **smart_search** (fallback) - Keyword-based search for specific patterns
3. **Glob + Grep** (last resort) - File pattern matching for structural discovery

---

## Similarity Analysis Algorithm

### Step 1: Extract Search Queries from Phases

```javascript
function generateSearchQueries(phases, config) {
  const queries = [];

  // Workflow-level query
  queries.push({
    level: 'workflow',
    query: `${config.type} workflow ${config.name} implementation`,
    purpose: 'Find similar workflows by type and purpose'
  });

  // Phase-level queries
  phases.forEach(phase => {
    queries.push({
      level: 'phase',
      phaseId: phase.id,
      query: `${phase.name} phase ${phase.objective}`,
      purpose: `Find similar ${phase.name} implementations`
    });

    // Tool-specific queries
    if (phase.tools.required.length > 0) {
      queries.push({
        level: 'tool-pattern',
        phaseId: phase.id,
        query: `${phase.tools.required.join(' ')} usage pattern ${phase.name}`,
        purpose: 'Find tool usage patterns'
      });
    }
  });

  return queries;
}
```

### Step 2: Execute Semantic Search

```javascript
async function executeSemanticSearch(queries, projectRoot) {
  const results = [];

  for (const query of queries) {
    try {
      // Primary: ACE semantic search
      const aceResult = await mcp__ace-tool__search_context({
        project_root_path: projectRoot,
        query: query.query
      });

      results.push({
        query: query,
        source: 'ace',
        matches: parseAceResults(aceResult),
        success: true
      });
    } catch (error) {
      // Fallback: smart_search
      try {
        const smartResult = await mcp__ccw-tools__smart_search({
          action: 'search',
          query: extractKeywords(query.query),
          mode: 'fuzzy',
          path: projectRoot
        });

        results.push({
          query: query,
          source: 'smart_search',
          matches: parseSmartSearchResults(smartResult),
          success: true
        });
      } catch (fallbackError) {
        results.push({
          query: query,
          source: 'none',
          matches: [],
          success: false,
          error: fallbackError.message
        });
      }
    }
  }

  return results;
}
```

### Step 3: Calculate Similarity Scores

```javascript
function calculateSimilarityScore(searchResult, targetPhase) {
  let score = 0;
  const factors = [];

  // Factor 1: Semantic relevance (0-0.4)
  const semanticScore = searchResult.relevanceScore || 0;
  score += semanticScore * 0.4;
  factors.push({ name: 'semantic', value: semanticScore, weight: 0.4 });

  // Factor 2: Structural match (0-0.3)
  const structuralScore = calculateStructuralMatch(searchResult, targetPhase);
  score += structuralScore * 0.3;
  factors.push({ name: 'structural', value: structuralScore, weight: 0.3 });

  // Factor 3: Tool overlap (0-0.2)
  const toolScore = calculateToolOverlap(searchResult.tools, targetPhase.tools.required);
  score += toolScore * 0.2;
  factors.push({ name: 'tool_overlap', value: toolScore, weight: 0.2 });

  // Factor 4: Pattern match (0-0.1)
  const patternScore = calculatePatternMatch(searchResult, targetPhase);
  score += patternScore * 0.1;
  factors.push({ name: 'pattern', value: patternScore, weight: 0.1 });

  return {
    totalScore: Math.min(1.0, Math.max(0, score)),
    factors: factors,
    confidence: determineConfidence(factors)
  };
}

function calculateStructuralMatch(result, phase) {
  // Compare input/output structure
  const inputMatch = compareIO(result.input, phase.input);
  const outputMatch = compareIO(result.output, phase.output);
  return (inputMatch + outputMatch) / 2;
}

function calculateToolOverlap(resultTools, phaseTools) {
  if (!resultTools || !phaseTools || phaseTools.length === 0) return 0;
  const overlap = resultTools.filter(t => phaseTools.includes(t)).length;
  return overlap / phaseTools.length;
}

function calculatePatternMatch(result, phase) {
  // Check for common patterns: analysis, generation, validation, etc.
  const patterns = ['analysis', 'generation', 'validation', 'collection', 'synthesis'];
  const phasePattern = patterns.find(p => phase.name.toLowerCase().includes(p));
  const resultPattern = patterns.find(p => result.name?.toLowerCase().includes(p));
  return phasePattern && phasePattern === resultPattern ? 1.0 : 0;
}

function determineConfidence(factors) {
  const avgScore = factors.reduce((sum, f) => sum + f.value, 0) / factors.length;
  if (avgScore >= 0.7) return 'high';
  if (avgScore >= 0.4) return 'medium';
  return 'low';
}
```

### Step 4: Classify Phases

```javascript
function classifyPhase(phaseId, searchResults, threshold = 0.5) {
  const phaseResults = searchResults.filter(r => r.query.phaseId === phaseId);

  if (phaseResults.length === 0) {
    return {
      classification: 'new',
      reason: 'No search results found',
      similarWorkflows: [],
      recommendations: ['Design from scratch based on phase requirements']
    };
  }

  // Find best matches
  const scoredMatches = phaseResults
    .flatMap(r => r.matches)
    .map(match => ({
      ...match,
      similarity: calculateSimilarityScore(match, getPhaseById(phaseId))
    }))
    .sort((a, b) => b.similarity.totalScore - a.similarity.totalScore);

  const bestMatch = scoredMatches[0];

  if (!bestMatch || bestMatch.similarity.totalScore < threshold) {
    return {
      classification: 'new',
      reason: `Best match score (${bestMatch?.similarity.totalScore.toFixed(2) || 0}) below threshold (${threshold})`,
      similarWorkflows: scoredMatches.slice(0, 3).map(m => ({
        path: m.path,
        score: m.similarity.totalScore,
        partialMatch: true
      })),
      recommendations: generateNewPhaseRecommendations(phaseId)
    };
  }

  return {
    classification: 'similar',
    reason: `Found similar implementation with score ${bestMatch.similarity.totalScore.toFixed(2)}`,
    similarWorkflows: scoredMatches.slice(0, 5).map(m => ({
      path: m.path,
      name: m.name,
      score: m.similarity.totalScore,
      confidence: m.similarity.confidence,
      factors: m.similarity.factors
    })),
    recommendations: generateReferenceRecommendations(bestMatch, phaseId)
  };
}
```

---

## Execution Flow

```
+-----------------------------------------------------------------------------+
|                    Phase 4: Similar Workflow Analysis                        |
|                                                                              |
|  +------------------+                                                        |
|  | Load Inputs      |                                                        |
|  | - phase-decomp   |                                                        |
|  | - workflow-config|                                                        |
|  +--------+---------+                                                        |
|           |                                                                  |
|           v                                                                  |
|  +--------+---------+                                                        |
|  | Generate Search  |                                                        |
|  | Queries          |                                                        |
|  | - Workflow level |                                                        |
|  | - Phase level    |                                                        |
|  | - Tool patterns  |                                                        |
|  +--------+---------+                                                        |
|           |                                                                  |
|           v                                                                  |
|  +--------+---------+     +------------------+                               |
|  | Execute ACE      |---->| mcp__ace-tool__  |                               |
|  | Semantic Search  |     | search_context   |                               |
|  +--------+---------+     +------------------+                               |
|           |                                                                  |
|           | (fallback if ACE fails)                                          |
|           v                                                                  |
|  +--------+---------+     +------------------+                               |
|  | Execute          |---->| smart_search     |                               |
|  | Fallback Search  |     | (fuzzy mode)     |                               |
|  +--------+---------+     +------------------+                               |
|           |                                                                  |
|           v                                                                  |
|  +--------+---------+                                                        |
|  | Calculate        |                                                        |
|  | Similarity Scores|                                                        |
|  | - Semantic       |                                                        |
|  | - Structural     |                                                        |
|  | - Tool overlap   |                                                        |
|  | - Pattern match  |                                                        |
|  +--------+---------+                                                        |
|           |                                                                  |
|           v                                                                  |
|  +--------+---------+                                                        |
|  | Classify Phases  |                                                        |
|  | - 'similar' if   |                                                        |
|  |   score >= 0.5   |                                                        |
|  | - 'new' if       |                                                        |
|  |   score < 0.5    |                                                        |
|  +--------+---------+                                                        |
|           |                                                                  |
|           v                                                                  |
|  +--------+---------+                                                        |
|  | Extract Patterns |                                                        |
|  | & Generate       |                                                        |
|  | Recommendations  |                                                        |
|  +--------+---------+                                                        |
|           |                                                                  |
|           v                                                                  |
|  +------------------+                                                        |
|  | similarity-      |                                                        |
|  | analysis.json    |                                                        |
|  +------------------+                                                        |
+-----------------------------------------------------------------------------+
```

---

## Implementation Protocol

```javascript
async function analyzeSimilarWorkflows(workDir) {
  console.log('## Phase 4: Similar Workflow Analysis\n');

  // Step 1: Load inputs
  const decomposition = JSON.parse(Read(`${workDir}/phase-decomposition.json`));
  const config = JSON.parse(Read(`${workDir}/workflow-config.json`));
  const projectRoot = process.cwd();

  console.log(`Analyzing workflow: ${config.name}`);
  console.log(`Phases to analyze: ${decomposition.phases.length}`);

  // Step 2: Generate search queries
  const queries = generateSearchQueries(decomposition.phases, config);
  console.log(`Generated ${queries.length} search queries`);

  // Step 3: Execute semantic search
  console.log('\n### Executing Semantic Search\n');
  const searchResults = await executeSemanticSearch(queries, projectRoot);

  const successCount = searchResults.filter(r => r.success).length;
  console.log(`Search completed: ${successCount}/${queries.length} successful`);

  // Step 4: Analyze each phase
  console.log('\n### Phase-by-Phase Analysis\n');
  const phaseAnalysis = [];

  for (const phase of decomposition.phases) {
    console.log(`Analyzing ${phase.id}: ${phase.name}...`);

    const analysis = classifyPhase(phase.id, searchResults);
    phaseAnalysis.push({
      phaseId: phase.id,
      phaseName: phase.name,
      ...analysis
    });

    const icon = analysis.classification === 'similar' ? '[REF]' : '[NEW]';
    console.log(`  ${icon} ${analysis.reason}`);

    if (analysis.similarWorkflows.length > 0) {
      console.log(`  Top match: ${analysis.similarWorkflows[0].path} (${analysis.similarWorkflows[0].score.toFixed(2)})`);
    }
  }

  // Step 5: Extract reusable patterns
  console.log('\n### Extracting Reusable Patterns\n');
  const patterns = extractReusablePatterns(searchResults, decomposition);
  console.log(`Found ${patterns.length} reusable patterns`);

  // Step 6: Generate workflow-level recommendations
  const workflowRecommendations = generateWorkflowRecommendations(
    phaseAnalysis,
    patterns,
    config
  );

  // Step 7: Assemble output
  const analysis = {
    workflowName: config.name,
    workflowType: config.type,
    analysisTimestamp: new Date().toISOString(),
    summary: {
      totalPhases: decomposition.phases.length,
      similarPhases: phaseAnalysis.filter(p => p.classification === 'similar').length,
      newPhases: phaseAnalysis.filter(p => p.classification === 'new').length,
      overallSimilarity: calculateOverallSimilarity(phaseAnalysis)
    },
    phaseAnalysis: phaseAnalysis,
    reusablePatterns: patterns,
    recommendations: workflowRecommendations,
    searchMetadata: {
      queriesExecuted: queries.length,
      successfulSearches: successCount,
      primaryTool: 'mcp__ace-tool__search_context',
      fallbackUsed: searchResults.some(r => r.source === 'smart_search')
    }
  };

  // Step 8: Write output
  const outputPath = `${workDir}/similarity-analysis.json`;
  Write(outputPath, JSON.stringify(analysis, null, 2));

  // Step 9: Display summary
  console.log(`
### Similarity Analysis Complete

**Summary**:
- Total Phases: ${analysis.summary.totalPhases}
- Similar Phases: ${analysis.summary.similarPhases} (have references)
- New Phases: ${analysis.summary.newPhases} (design from scratch)
- Overall Similarity: ${(analysis.summary.overallSimilarity * 100).toFixed(1)}%

**Phase Classification**:
${phaseAnalysis.map(p => `| ${p.phaseId} | ${p.phaseName} | ${p.classification.toUpperCase()} | ${p.similarWorkflows[0]?.score.toFixed(2) || 'N/A'} |`).join('\n')}

**Reusable Patterns Found**: ${patterns.length}
${patterns.slice(0, 3).map(p => `- ${p.name}: ${p.description}`).join('\n')}

**Output**: ${outputPath}
`);

  return analysis;
}
```

---

## Helper Functions

### Extract Reusable Patterns

```javascript
function extractReusablePatterns(searchResults, decomposition) {
  const patterns = [];
  const seenPatterns = new Set();

  // Extract patterns from high-scoring matches
  searchResults
    .flatMap(r => r.matches)
    .filter(m => m.similarity?.totalScore >= 0.6)
    .forEach(match => {
      // Command pattern
      if (match.path?.includes('/commands/') && !seenPatterns.has(`cmd:${match.name}`)) {
        patterns.push({
          type: 'command',
          name: match.name,
          path: match.path,
          description: `Command structure from ${match.name}`,
          applicableTo: ['artifact-generation'],
          snippet: match.snippet
        });
        seenPatterns.add(`cmd:${match.name}`);
      }

      // Agent pattern
      if (match.path?.includes('/agents/') && !seenPatterns.has(`agent:${match.name}`)) {
        patterns.push({
          type: 'agent',
          name: match.name,
          path: match.path,
          description: `Agent structure from ${match.name}`,
          applicableTo: ['artifact-generation'],
          snippet: match.snippet
        });
        seenPatterns.add(`agent:${match.name}`);
      }

      // Phase pattern
      if (match.path?.includes('/phases/') && !seenPatterns.has(`phase:${match.name}`)) {
        patterns.push({
          type: 'phase',
          name: match.name,
          path: match.path,
          description: `Phase implementation from ${match.name}`,
          applicableTo: decomposition.phases
            .filter(p => p.name.toLowerCase().includes(match.name?.toLowerCase()))
            .map(p => p.id),
          snippet: match.snippet
        });
        seenPatterns.add(`phase:${match.name}`);
      }
    });

  return patterns;
}
```

### Generate Recommendations

```javascript
function generateNewPhaseRecommendations(phaseId) {
  const phase = getPhaseById(phaseId);
  const recommendations = [];

  recommendations.push(`Design ${phase.name} phase from scratch`);
  recommendations.push(`Define clear input/output contracts`);
  recommendations.push(`Implement validation for phase outputs`);

  // Tool-specific recommendations
  if (phase.tools.required.includes('Task')) {
    recommendations.push('Consider using Task tool for complex sub-operations');
  }
  if (phase.tools.required.includes('AskUserQuestion')) {
    recommendations.push('Design user interaction flow with clear prompts');
  }

  return recommendations;
}

function generateReferenceRecommendations(match, phaseId) {
  const recommendations = [];

  recommendations.push(`Reference implementation: ${match.path}`);
  recommendations.push(`Adapt ${match.name} pattern for ${phaseId}`);

  if (match.similarity.factors.find(f => f.name === 'structural')?.value >= 0.7) {
    recommendations.push('Reuse input/output structure from reference');
  }

  if (match.similarity.factors.find(f => f.name === 'tool_overlap')?.value >= 0.8) {
    recommendations.push('Follow tool usage patterns from reference');
  }

  return recommendations;
}

function generateWorkflowRecommendations(phaseAnalysis, patterns, config) {
  const recommendations = {
    general: [],
    perPhase: {},
    patterns: []
  };

  // General recommendations based on similarity
  const similarCount = phaseAnalysis.filter(p => p.classification === 'similar').length;
  const totalCount = phaseAnalysis.length;
  const similarityRatio = similarCount / totalCount;

  if (similarityRatio >= 0.7) {
    recommendations.general.push('High similarity to existing workflows - consider extending existing workflow instead');
  } else if (similarityRatio >= 0.4) {
    recommendations.general.push('Moderate similarity - leverage existing patterns where applicable');
  } else {
    recommendations.general.push('Low similarity - this is a novel workflow, design carefully');
  }

  // Per-phase recommendations
  phaseAnalysis.forEach(analysis => {
    recommendations.perPhase[analysis.phaseId] = analysis.recommendations;
  });

  // Pattern recommendations
  patterns.forEach(pattern => {
    recommendations.patterns.push({
      pattern: pattern.name,
      recommendation: `Use ${pattern.type} pattern from ${pattern.path}`,
      applicableTo: pattern.applicableTo
    });
  });

  return recommendations;
}

function calculateOverallSimilarity(phaseAnalysis) {
  if (phaseAnalysis.length === 0) return 0;

  const scores = phaseAnalysis.map(p => {
    if (p.classification === 'new') return 0;
    return p.similarWorkflows[0]?.score || 0;
  });

  return scores.reduce((sum, s) => sum + s, 0) / scores.length;
}
```

---

## Output Schema: similarity-analysis.json

```json
{
  "$schema": "similarity-analysis.schema.json",
  "workflowName": "string",
  "workflowType": "planning | fix | analysis | generation",
  "analysisTimestamp": "ISO 8601 timestamp",
  "summary": {
    "totalPhases": "number",
    "similarPhases": "number",
    "newPhases": "number",
    "overallSimilarity": "number (0-1)"
  },
  "phaseAnalysis": [
    {
      "phaseId": "string (P1, P2, ...)",
      "phaseName": "string",
      "classification": "similar | new",
      "reason": "string",
      "similarWorkflows": [
        {
          "path": "string",
          "name": "string",
          "score": "number (0-1)",
          "confidence": "high | medium | low",
          "factors": [
            {
              "name": "semantic | structural | tool_overlap | pattern",
              "value": "number (0-1)",
              "weight": "number (0-1)"
            }
          ]
        }
      ],
      "recommendations": ["string"]
    }
  ],
  "reusablePatterns": [
    {
      "type": "command | agent | phase | schema",
      "name": "string",
      "path": "string",
      "description": "string",
      "applicableTo": ["string"],
      "snippet": "string (optional)"
    }
  ],
  "recommendations": {
    "general": ["string"],
    "perPhase": {
      "P1": ["string"],
      "P2": ["string"]
    },
    "patterns": [
      {
        "pattern": "string",
        "recommendation": "string",
        "applicableTo": ["string"]
      }
    ]
  },
  "searchMetadata": {
    "queriesExecuted": "number",
    "successfulSearches": "number",
    "primaryTool": "string",
    "fallbackUsed": "boolean"
  }
}
```

---

## Validation Checklist

### Search Quality

- [ ] ACE semantic search executed for each phase
- [ ] Fallback to smart_search when ACE fails
- [ ] All phases have at least one search attempt
- [ ] Search queries are specific and relevant

### Similarity Scoring

- [ ] Scores are in valid range (0-1)
- [ ] Multi-factor scoring applied (semantic, structural, tool, pattern)
- [ ] Confidence levels assigned correctly
- [ ] Threshold (0.5) applied consistently

### Classification Accuracy

- [ ] Each phase classified as 'similar' or 'new'
- [ ] Classification reason is clear and actionable
- [ ] Similar phases have valid reference paths
- [ ] New phases have design recommendations

### Recommendations Quality

- [ ] Recommendations are actionable
- [ ] Reference paths are valid and accessible
- [ ] Pattern recommendations are relevant
- [ ] Per-phase recommendations are specific

---

## Error Handling

| Error | Resolution |
|-------|------------|
| ACE search fails | Fall back to smart_search with keyword extraction |
| No matches found | Mark phase as 'new' with design recommendations |
| Invalid similarity score | Clamp to [0, 1] range |
| Missing phase in decomposition | Skip analysis, log warning |
| Search timeout | Return partial results, mark incomplete |

---

## Output Example

```json
{
  "workflowName": "doc-generator",
  "workflowType": "generation",
  "analysisTimestamp": "2026-02-02T16:00:00.000Z",
  "summary": {
    "totalPhases": 4,
    "similarPhases": 2,
    "newPhases": 2,
    "overallSimilarity": 0.58
  },
  "phaseAnalysis": [
    {
      "phaseId": "P1",
      "phaseName": "Input",
      "classification": "similar",
      "reason": "Found similar implementation with score 0.72",
      "similarWorkflows": [
        {
          "path": ".claude/skills/workflow-creator/phases/01-requirements-collection.md",
          "name": "requirements-collection",
          "score": 0.72,
          "confidence": "high",
          "factors": [
            { "name": "semantic", "value": 0.8, "weight": 0.4 },
            { "name": "structural", "value": 0.7, "weight": 0.3 },
            { "name": "tool_overlap", "value": 0.6, "weight": 0.2 },
            { "name": "pattern", "value": 0.5, "weight": 0.1 }
          ]
        }
      ],
      "recommendations": [
        "Reference implementation: .claude/skills/workflow-creator/phases/01-requirements-collection.md",
        "Adapt requirements-collection pattern for P1",
        "Reuse input/output structure from reference"
      ]
    },
    {
      "phaseId": "P2",
      "phaseName": "Analysis",
      "classification": "similar",
      "reason": "Found similar implementation with score 0.65",
      "similarWorkflows": [
        {
          "path": ".claude/agents/cli-explore-agent.md",
          "name": "cli-explore-agent",
          "score": 0.65,
          "confidence": "medium",
          "factors": [
            { "name": "semantic", "value": 0.7, "weight": 0.4 },
            { "name": "structural", "value": 0.6, "weight": 0.3 },
            { "name": "tool_overlap", "value": 0.5, "weight": 0.2 },
            { "name": "pattern", "value": 1.0, "weight": 0.1 }
          ]
        }
      ],
      "recommendations": [
        "Reference implementation: .claude/agents/cli-explore-agent.md",
        "Adapt cli-explore-agent pattern for P2",
        "Follow tool usage patterns from reference"
      ]
    },
    {
      "phaseId": "P3",
      "phaseName": "Generation",
      "classification": "new",
      "reason": "Best match score (0.35) below threshold (0.5)",
      "similarWorkflows": [
        {
          "path": ".claude/skills/skill-generator/phases/03-phase-generation.md",
          "score": 0.35,
          "partialMatch": true
        }
      ],
      "recommendations": [
        "Design Generation phase from scratch",
        "Define clear input/output contracts",
        "Implement validation for phase outputs",
        "Consider using Task tool for complex sub-operations"
      ]
    },
    {
      "phaseId": "P4",
      "phaseName": "Output",
      "classification": "new",
      "reason": "Best match score (0.28) below threshold (0.5)",
      "similarWorkflows": [],
      "recommendations": [
        "Design Output phase from scratch",
        "Define clear input/output contracts",
        "Implement validation for phase outputs"
      ]
    }
  ],
  "reusablePatterns": [
    {
      "type": "phase",
      "name": "requirements-collection",
      "path": ".claude/skills/workflow-creator/phases/01-requirements-collection.md",
      "description": "Phase implementation from requirements-collection",
      "applicableTo": ["P1"],
      "snippet": "async function collectRequirements(workDir) { ... }"
    },
    {
      "type": "agent",
      "name": "cli-explore-agent",
      "path": ".claude/agents/cli-explore-agent.md",
      "description": "Agent structure from cli-explore-agent",
      "applicableTo": ["artifact-generation"],
      "snippet": "## 4-Phase Execution Workflow..."
    }
  ],
  "recommendations": {
    "general": [
      "Moderate similarity - leverage existing patterns where applicable"
    ],
    "perPhase": {
      "P1": ["Reference implementation: .claude/skills/workflow-creator/phases/01-requirements-collection.md"],
      "P2": ["Reference implementation: .claude/agents/cli-explore-agent.md"],
      "P3": ["Design Generation phase from scratch"],
      "P4": ["Design Output phase from scratch"]
    },
    "patterns": [
      {
        "pattern": "requirements-collection",
        "recommendation": "Use phase pattern from .claude/skills/workflow-creator/phases/01-requirements-collection.md",
        "applicableTo": ["P1"]
      }
    ]
  },
  "searchMetadata": {
    "queriesExecuted": 12,
    "successfulSearches": 11,
    "primaryTool": "mcp__ace-tool__search_context",
    "fallbackUsed": false
  }
}
```

---

## Next Phase

After Phase 4 completes, proceed to **Phase 5: Artifact Generation** with:
- Input: `similarity-analysis.json` + `phase-decomposition.json` + `workflow-config.json`
- Action: Generate slash command, agent definition, and workflow.json
- Output: Generated artifact files in `.claude/commands/` and `.claude/agents/`

---

*Phase Version: 1.0*
*Based on: cli-explore-agent semantic analysis pattern, ACE-tool MCP integration*
