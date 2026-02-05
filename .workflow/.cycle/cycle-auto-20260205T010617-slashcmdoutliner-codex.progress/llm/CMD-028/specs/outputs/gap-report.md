# Gap Report: workflow:artifacts

## Reference

- Selected reference: /workflow:synthesis (`.claude/commands/workflow/brainstorm/synthesis.md`)

## P0 Gaps (Must Fix)

- Evidence tables must be fully concrete (no placeholders) and pass `verify-evidence.js` for both the gap report and the generated slash outline.
- Keep allowed-tools aligned with the command surface: this command must not rely on `Task(*)`/`Edit(*)` patterns from `/workflow:synthesis` unless explicitly added to frontmatter.
- Ensure all artifacts are scoped under `.workflow/active/WFS-{topic}/.brainstorming/` and are listed consistently in Overview/Outputs.

## P1 Gaps (Should Fix)

- Mirror the oracle doc's phase naming and ordering in the outline to reduce drift (Phase 0..5 with Phase 4.5).
- Explicitly document AskUserQuestion batching rule (max 4 questions per call) in Execution Process and Error Handling.

## P2 Gaps (Optional)

- Add a short, stable session ID / topic-to-folder derivation rule (sanitization) to avoid invalid paths.

## Implementation Pointers (Evidence)

| Pointer | Status | Evidence | Verify | Notes |
|---|---|---|---|---|
| `.claude/commands/workflow/brainstorm/artifacts.md` | Existing | docs: `.claude/commands/workflow/brainstorm/artifacts.md` / `Overview` ; ts: `ccw/src/tools/command-registry.ts` / `join('.claude', 'commands', 'workflow')` | `Test-Path .claude/commands/workflow/brainstorm/artifacts.md` | command doc oracle + heading source |
| `ccw/src/tools/command-registry.ts` | Existing | docs: `.claude/commands/workflow/brainstorm/artifacts.md` / `Quick Reference` ; ts: `ccw/src/tools/command-registry.ts` / `join('.claude', 'commands', 'workflow')` | `Test-Path ccw/src/tools/command-registry.ts; rg \"join\\('\\.claude', 'commands', 'workflow'\\)\" ccw/src/tools/command-registry.ts` | proves .claude/commands workflow discovery |
| `ccw/src/tools/session-manager.ts` | Existing | docs: `.claude/commands/workflow/brainstorm/artifacts.md` / `Session Management` ; ts: `ccw/src/tools/session-manager.ts` / `const ACTIVE_BASE = '.workflow/active';` | `Test-Path ccw/src/tools/session-manager.ts; rg \"const ACTIVE_BASE = '.workflow/active';\" ccw/src/tools/session-manager.ts` | session folder lifecycle for .workflow/active |
| `.workflow/active/WFS-{topic}/.brainstorming/` | Planned | docs: `.claude/commands/workflow/brainstorm/artifacts.md` / `Session Management` ; ts: `ccw/src/tools/session-manager.ts` / `const ACTIVE_BASE = '.workflow/active';` | `Test-Path .workflow/active` | target session directory subtree |
| `.workflow/active/WFS-{topic}/.brainstorming/guidance-specification.md` | Planned | docs: `.claude/commands/workflow/brainstorm/artifacts.md` / `Output & Governance` ; ts: `ccw/src/tools/write-file.ts` / `name: 'write_file'` | `Test-Path ccw/src/tools/write-file.ts` | primary output artifact |
| `ccw/src/tools/ask-question.ts` | Existing | docs: `.claude/commands/workflow/brainstorm/artifacts.md` / `AskUserQuestion Pattern` ; ts: `ccw/src/tools/ask-question.ts` / `name: 'ask_question'` | `Test-Path ccw/src/tools/ask-question.ts; rg \"name: 'ask_question'\" ccw/src/tools/ask-question.ts` | interactive Q&A implementation anchor |

## Implementation Hints (Tooling/Server)

- Use `ccw/src/tools/session-manager.ts` semantics for `.workflow/active` pathing and safe directory creation before writes.
- Use `ccw/src/tools/command-registry.ts` conventions when validating command docs/frontmatter extraction.

## Proposed Fix Plan (Minimal)

1. Keep outline sections aligned to oracle headings (Auto Mode, Quick Reference, Task Tracking, Execution Phases, Question Guidelines, Output & Governance).
2. Ensure all evidence rows use real headings from `.claude/commands/workflow/brainstorm/artifacts.md` and literal TS anchors.
3. Keep planned pointers explicitly planned; add Verify steps for anything that is not present in repo.

