# Gap Report: learn:profile

## Reference

- Reference file: `.claude/commands/learn/profile.md`

## P0 Gaps (Must Fix)

- None

## P1 Gaps (Should Fix)

- Missing reference H2 sections: `Quick Start`, `Execution Phase Diagram (Code-Level)`, `Reality Check (Matches Current Backend)`, `Example Scenario (Topic V0 + Seed/Full Pack)`, `Implementation`
- Extra H2 sections (not in reference): `Overview`, `Usage`, `Inputs`, `Outputs / Artifacts`, `Implementation Pointers`, `Error Handling`, `Examples`

## Implementation Hints (Tooling/Server)

- `ccw/src/commands/learn.ts`
- `ccw/src/tools/command-registry.ts`
- `ccw/src/tools/cli-executor.ts`
- `ccw/src/commands/learn-background.ts`
- `ccw/src/commands/learn-questions.ts`
- `ccw/src/commands/install.ts`
- `ccw/src/commands/learn-adaptive.ts`
- `ccw/src/core/routes/codexlens/config-handlers.ts`
- `ccw/src/core/routes/codexlens/semantic-handlers.ts`
- `ccw/src/learn/background-parser.ts`
