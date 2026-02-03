# Gap Report: workflow:analyze-with-file

## Reference

- Reference file: `.claude/commands/workflow/analyze-with-file.md`

## P0 Gaps (Must Fix)

- None

## P1 Gaps (Should Fix)

- Missing reference H2 sections: `Auto Mode`, `Implementation`, `User Context`, `Discussion Timeline`, `Current Understanding`, `Analysis Context`, `MANDATORY FIRST STEPS`, `Exploration Focus`, `Output`, `Discussion Round ${roundNumber}`, `Conclusions (${timestamp})`, `Current Understanding (Final)`, `Session Statistics`, `Session Folder Structure`, `Discussion Document Template`, `Conclusions (2025-01-25 11:00)`, `Iteration Flow`, `CLI Integration Points`, `Consolidation Rules`, `Usage Recommendations`
- Extra H2 sections (not in reference): `Inputs`, `Outputs / Artifacts`, `Implementation Pointers`, `Examples`

## Implementation Hints (Tooling/Server)

- `ccw/src/commands/workflow.ts`
- `ccw/src/tools/command-registry.ts`
- `ccw/src/tools/cli-executor.ts`
- `ccw/src/commands/issue.ts`
- `ccw/src/tools/session-manager.ts`
- `ccw/src/commands/install.ts`
- `ccw/src/commands/session-path-resolver.ts`
- `ccw/src/tools/generate-module-docs.ts`
- `ccw/src/tools/template-discovery.ts`
- `ccw/src/commands/session.ts`
