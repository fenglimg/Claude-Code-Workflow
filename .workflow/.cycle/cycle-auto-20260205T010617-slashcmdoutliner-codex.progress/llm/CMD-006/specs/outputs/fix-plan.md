# Fix Plan: /cli:cli-init (CMD-006)

## Scope: Docs (.claude/commands)

1. Standardize `settings.json` examples in `.claude/commands/cli/cli-init.md`:
   - Pick one `contextfilename` format (string vs array) and apply consistently for both tools.
2. Add a short, deterministic preview output contract:
   - Include detected technologies
   - List planned writes (paths)
   - Indicate whether backups would be created (without creating them)

## Scope: Tooling/Server (ccw/src) (Optional)

1. Consider a small reusable tool for ignore-rule generation (base + tech-specific blocks) to reduce per-command duplication.
2. If added, document the tool usage in the slash command and include evidence pointers + regression snapshot update.

