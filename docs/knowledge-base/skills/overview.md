# CCW Skills Reference

## Skills Overview

Skills are reusable workflow patterns stored in `.claude/skills/`. Each skill defines phases, actions, and templates for specific tasks.

## Available Skills

### Brainstorm
**Path**: `.claude/skills/brainstorm/`

Multi-role brainstorming for complex problems.

**Phases**:
1. Problem analysis
2. Role assignment
3. Parallel perspective generation
4. Synthesis and planning

### Project Analyze
**Path**: `.claude/skills/project-analyze/`

Comprehensive project analysis.

**Phases**:
1. Requirements discovery
2. Project exploration
3. Deep analysis
4. Consolidation
5. Report generation
6. Iterative refinement

### Review Code
**Path**: `.claude/skills/review-code/`

Code review with quality gates.

**Phases**:
- Quick scan
- Deep review
- Report generation
- Complete

**Dimensions**:
- Architecture
- Correctness
- Performance
- Security
- Readability
- Testing

### Skill Tuning
**Path**: `.claude/skills/skill-tuning/`

Diagnose and fix skill issues.

**Phases**:
- Init
- Context diagnosis
- Agent diagnosis
- Dataflow diagnosis
- Token consumption diagnosis
- Fix proposal
- Apply fix
- Verify

### Software Manual
**Path**: `.claude/skills/software-manual/`

Generate software documentation.

**Phases**:
1. Requirements discovery
2. Project exploration
3. API extraction
4. Parallel analysis
5. Screenshot capture
6. HTML assembly
7. Iterative refinement

### Copyright Docs
**Path**: `.claude/skills/copyright-docs/`

Generate copyright documentation.

**Phases**:
1. Metadata collection
2. Project exploration
3. Deep analysis
4. Consolidation
5. Document assembly
6. Compliance refinement

### Issue Manage
**Path**: `.claude/skills/issue-manage/`

Issue lifecycle management.

### Spec Generator
**Path**: `.claude/skills/spec-generator/`

Specification document generation.

### Team Lifecycle
**Path**: `.claude/skills/team-lifecycle/`

Team collaboration session management.

**Roles**:
- coordinator
- analyst
- planner
- writer
- discussant
- reviewer
- executor
- tester

### Team Command Designer
**Path**: `.claude/skills/team-command-designer/`

Design custom team commands.

### Team Skill Designer
**Path**: `.claude/skills/team-skill-designer/`

Design custom team skills.

### Memory Capture
**Path**: `.claude/skills/memory-capture/`

Capture and store context memory.

### Memory Manage
**Path**: `.claude/skills/memory-manage/`

Manage memory store.

## Skill Structure

Each skill follows this structure:

```
skill-name/
├── SKILL.md           # Main skill definition
├── phases/            # Phase definitions
│   ├── 01-phase.md
│   ├── 02-phase.md
│   └── ...
├── specs/             # Specifications
│   ├── quality-standards.md
│   └── ...
└── templates/         # Output templates
    └── ...
```

## Skill Phases

Phases are executed sequentially or in parallel based on dependencies:

```markdown
## Phase 1: Discovery
**Actions**:
- action-collect-context
- action-analyze-requirements

## Phase 2: Analysis
**Actions**:
- action-deep-review
- action-generate-report
```

## State Management

Skills use state schemas for tracking progress:

```json
{
  "phase": "analysis",
  "status": "in_progress",
  "artifacts": ["report.md"],
  "next_actions": ["action-generate-report"]
}
```

## Creating Custom Skills

1. Create directory in `.claude/skills/`
2. Add `SKILL.md` with phases and actions
3. Define state schema in `specs/state-schema.md`
4. Add templates in `templates/`
5. Register in skill index

## Best Practices

- Keep phases focused and atomic
- Use clear action names
- Define quality gates for each phase
- Provide templates for consistent output
- Include examples in specifications
