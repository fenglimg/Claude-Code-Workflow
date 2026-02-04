# Gap Report: learn:profile

## Reference

- Reference file: `.claude/commands/learn/profile.md`

## P0 Gaps (Must Fix)

- None

## P1 Gaps (Should Fix)

- Extra H2 sections (not in reference): `Overview`, `Usage`, `Arguments / Flags`, `Core Data Model：Topic V0（扁平化 + Hash）`, `UX Hard Constraints（P0）`, `Cycle-4 Interval Assessment（核心算法）`, `Outputs / Artifacts`, `Error Handling`

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
