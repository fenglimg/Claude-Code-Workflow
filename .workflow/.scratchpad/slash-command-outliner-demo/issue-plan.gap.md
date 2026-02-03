# Gap Report: issue:plan

## Reference

- Reference file: `.claude/commands/issue/plan.md`

## P0 Gaps (Must Fix)

- None

## P1 Gaps (Should Fix)

- Missing reference H2 sections: `Auto Mode`, `Core Guidelines`, `Implementation`, `Plan Issues`, `Done: ${issues.length} issues → ${plannedCount} planned`, `Bash Compatibility`, `Quality Checklist`, `Related Commands`
- Extra H2 sections (not in reference): `Inputs`, `Outputs / Artifacts`, `Implementation Pointers`, `Examples`

## Implementation Hints (Tooling/Server)

- `ccw/src/commands/issue.ts`
- `ccw/src/tools/command-registry.ts`
- `ccw/src/tools/cli-executor.ts`
- `ccw/src/tools/codex-lens.ts`
- `ccw/src/commands/learn.ts`
- `ccw/src/commands/session-path-resolver.ts`
- `ccw/src/commands/session.ts`
- `ccw/src/tools/update-module-claude.js`
- `ccw/src/tools/command-registry.test.ts`
- `ccw/src/tools/session-manager.ts`
