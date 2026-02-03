# Spec Input (Schema + Rules)

The spec is the only “source input” for outline generation. It must be **minimal** and **non-leaky**.

## Minimal JSON Schema (informal)

```json
{
  "command": {
    "group": "workflow|issue|learn|cli|other",
    "name": "kebab-case",
    "description": "one sentence",
    "argument_hint": "[--flag] \"args\"",
    "allowed_tools": ["Read(*)", "Write(*)"]
  },
  "intent": {
    "type": "analyze|plan|execute|brainstorm|manage|utility",
    "interaction": "single-shot|iterative|loop",
    "primary_user_value": "what this command accomplishes"
  },
  "artifacts": {
    "reads": ["path/1", "path/2"],
    "writes": ["path/3", "path/4"]
  },
  "constraints": {
    "max_rounds": 0,
    "time_budget_seconds": 0,
    "must_not": ["no network", "no destructive ops without explicit user request"]
  },
  "acceptance": {
    "p0": ["frontmatter valid", "allowed-tools correct", "core sections present"]
  }
}
```

## No-Leakage Rule

If validating against an existing command, do **not** copy the full command markdown into the spec. The oracle is used only for **gap-report**.

