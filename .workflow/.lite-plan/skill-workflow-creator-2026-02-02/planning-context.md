# Planning Context: skill-workflow-creator

## Evidence Paths

### Exploration Files
- `.workflow/.lite-plan/skill-workflow-creator-2026-02-02/exploration-workflow-structure.json`
- `.workflow/.lite-plan/skill-workflow-creator-2026-02-02/exploration-schema-patterns.json`
- `.workflow/.lite-plan/skill-workflow-creator-2026-02-02/exploration-agent-integration.json`

### Key Reference Files
- `.claude/skills/_shared/SKILL-DESIGN-SPEC.md` - Skill structure specification
- `.claude/skills/skill-generator/SKILL.md` - Meta-skill reference
- `.claude/commands/workflow/lite-plan.md` - Complex workflow command example
- `ccw/src/tools/command-registry.ts` - Command discovery logic
- `ccw/src/tools/index.ts` - Tool registration pattern

## Synthesized Understanding

### Architecture Pattern
The codebase uses a three-tier workflow architecture:
1. **Slash Commands** (`.claude/commands/`) - Markdown with YAML frontmatter
2. **Skills** (`.claude/skills/`) - SKILL.md + phases/ + specs/ + templates/
3. **CLI Tools** (`ccw/src/tools/`) - TypeScript schema + handler pattern

### User Decisions
| Decision | Selection | Rationale |
|----------|-----------|-----------|
| Execution Mode | Sequential | Fixed phase order for predictable workflow creation |
| CLI Tools | Full Stack | Generate TypeScript CLI tools for programmatic access |
| Schema Location | Global | Store in `.claude/workflows/cli-templates/schemas/` for reusability |
| Agent Design | Full Design | Include behavior specification and prompt engineering |

### Key Patterns to Follow
1. **Skill Structure**: SKILL.md frontmatter (name, description, allowed-tools) + phases/NN-{action}.md
2. **Schema Design**: JSON Schema draft-07 with $schema, title, required, properties, _metadata
3. **Agent Definition**: YAML frontmatter (name, description, color) + markdown body with sections
4. **CLI Tool Pattern**: Export schema (ToolSchema) + handler function, register in index.ts

### Output Artifacts
The skill-workflow-creator will generate:
1. Skill directory structure (`.claude/skills/{name}/`)
2. Slash command files (`.claude/commands/{domain}/{name}.md`)
3. Agent definitions (`.claude/agents/{name}.md`)
4. JSON schemas (`.claude/workflows/cli-templates/schemas/{name}.json`)
5. CLI tool stubs (`ccw/src/tools/{name}.ts`)
