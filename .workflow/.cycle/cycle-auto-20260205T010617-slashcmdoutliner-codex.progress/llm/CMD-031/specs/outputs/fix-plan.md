# Fix Plan: workflow:synthesis

## P0

1) Resolve invocation mapping (docs vs path)
   - Verify whether the intended invocation is `/workflow:synthesis` or `/workflow:brainstorm:synthesis`.
   - If nested invocations are supported, explicitly document the canonical invocation in `.claude/commands/workflow/brainstorm/synthesis.md` near the top (Overview or Quick Reference).

2) Decide how nested commands are discovered in tooling
   - If any automation uses `ccw/src/tools/command-registry.ts`, either:
     - extend it to support nested command names (planned change), or
     - document that it is for flat workflow commands only and must not be used for nested namespaces.

## P1

3) Tighten artifact list in the command doc
   - Ensure the doc explicitly lists reads/writes for:
     - `workflow-session.json`
     - role `analysis*.md`
     - `.process/context-package.json`

4) Consolidate AskUserQuestion limits
   - Place max-4-questions-per-call + multi-round guidance in a single section (Quick Reference or Question Guidelines).

