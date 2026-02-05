# Gap Report: workflow:clean

## Reference

- Selected reference: /workflow:clean (`.claude/commands/workflow/clean.md`)

## P0 Gaps (Must Fix)

- None detected for the outline artifacts: frontmatter/core sections present, and evidence tables are provided for key pointers.

## P1 Gaps (Should Fix)

- Align the generated outline more tightly with the oracle's detailed sections:
  - Include the cleanup-manifest schema fields + reporting sections (without pasting large blocks).
  - Ensure platform-specific staleness checks (Linux/Mac vs Windows PowerShell via bash) are captured as explicit steps.
- Normalize command doc metadata:
  - If the repo expects `group: workflow` everywhere, confirm whether `.claude/commands/workflow/clean.md` should add it (several workflow commands include `group`).

## P2 Gaps (Optional)

- Add a small safety policy appendix (risk levels; what is never deleted automatically) to reduce accidental data loss.

## Implementation Pointers (Evidence)

| Pointer | Status | Evidence | Verify | Notes |
|---|---|---|---|---|
| `.claude/commands/workflow/clean.md` | Existing | docs: `.claude/commands/workflow/clean.md` / `Overview` ; ts: `ccw/src/tools/command-registry.ts` / `const relativePath = join('.claude', 'commands', 'workflow');` | `Test-Path .claude/commands/workflow/clean.md` | canonical slash command doc (oracle) |
| `.codex/prompts/clean.md` | Existing | docs: `.claude/commands/workflow/clean.md` / `Implementation` ; ts: `ccw/src/tools/command-registry.ts` / `public getCommand(commandName: string): CommandMetadata | null {` | `Test-Path .codex/prompts/clean.md` | prompt text for discovery + cleanup flow |
| `ccw/src/tools/command-registry.ts` | Existing | docs: `.claude/commands/workflow/clean.md` / `Usage` ; ts: `ccw/src/tools/command-registry.ts` / `export class CommandRegistry {` | `Test-Path ccw/src/tools/command-registry.ts` | parses `.claude/commands/**` and makes commands discoverable |
| `ccw/src/tools/native-session-discovery.ts` | Existing | docs: `.claude/commands/workflow/clean.md` / `Phase 2: Drift Discovery` ; ts: `ccw/src/tools/native-session-discovery.ts` / `// Claude Code stores session files directly in project folder (not in 'sessions' subdirectory)` | `Test-Path ccw/src/tools/native-session-discovery.ts` | session discovery signal sources |
| `ccw/src/tools/detect-changed-modules.ts` | Existing | docs: `.claude/commands/workflow/clean.md` / `Phase 1: Mainline Detection` ; ts: `ccw/src/tools/detect-changed-modules.ts` / `name: 'detect_changed_modules',` | `Test-Path ccw/src/tools/detect-changed-modules.ts` | git/mtime scanning utility applicable to mainline detection |
| `.workflow/.clean/clean-<YYYY-MM-DD>/cleanup-manifest.json` | Planned | docs: `.claude/commands/workflow/clean.md` / `Output Format` ; ts: `ccw/src/tools/command-registry.ts` / `const filePath = join(this.commandDir, `${normalized}.md`);` | `rg \"cleanup-manifest.json\" .claude/commands/workflow/clean.md` | per-run manifest to drive confirmation + execution |

## Implementation Hints (Tooling/Server)

- Prefer reusing existing tooling entrypoints over inventing new ones:
  - command registry parsing for `.claude/commands/**`
  - existing session discovery helpers for locating tool sessions
  - existing change detection tool for mainline signals

## Proposed Fix Plan (Minimal)

1. Expand the outline's Phase 2 deliverable: document a compact, stable `cleanup-manifest.json` schema + report sections.
2. Add explicit platform notes for staleness checks (mtime) and safe delete behavior.
3. Verify whether `group: workflow` is required in `.claude/commands/workflow/clean.md`; if yes, add it and re-run any command registry/UI tests.

