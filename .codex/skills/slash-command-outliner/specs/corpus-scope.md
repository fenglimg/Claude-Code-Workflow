# Corpus Scope (All Commands + Tooling)

## Slash Command Corpus (Must Cover 100%)

- `.claude/commands/**/*.md`
  - exclude: `node_modules/`
  - exclude: `_disabled/`

## Server/Tooling Capability Corpus (Must Be Referenced in Gap Analysis)

These are not “slash command targets”, but are required to detect hidden dependencies:

- `ccw/src/server/routes/**/*`
- `ccw/src/mcp-server/**/*`
- `ccw/src/tools/**/*`
- `ccw/src/commands/**/*`

