# Gap Report: workflow:lite-plan

## Reference

- Selected reference: /workflow:lite-plan (`.claude/commands/workflow/lite-plan.md`)

## P0 Gaps (Must Fix)

- None (core sections + frontmatter present; evidence tables included for key pointers).

## P1 Gaps (Should Fix)

- Consider adding a short “Session Folder Structure” subsection to the outline’s Outputs/Artifacts section that explicitly maps each artifact to `.workflow/.lite-plan/{session-id}/` (to match the oracle’s dedicated section).
- Ensure the outline’s “Auto Mode Defaults” list stays consistent with the oracle when defaults evolve (keep in sync with `/workflow:lite-plan` doc).

## P2 Gaps (Optional)

- Add one example showing file-input mode: `/workflow:lite-plan path/to/task.md`.
- Add an explicit note that Phase 3 is “planning only” (no code execution) to reduce misuse risk.

## Implementation Pointers (Evidence)

You MUST provide an evidence table for all key implementation pointers mentioned in the outlines.

| Pointer | Status | Evidence | Verify | Notes |
|---|---|---|---|---|
| `.claude/commands/workflow/lite-plan.md` | Existing | docs: `.claude/commands/workflow/lite-plan.md` / `Workflow Lite-Plan Command (/workflow:lite-plan)` ; ts: `ccw/src/tools/command-registry.ts` / `public getCommand(commandName: string): CommandMetadata | null {` | `Test-Path .claude/commands/workflow/lite-plan.md` | Oracle command doc and expected structure/headings. |
| `.claude/commands/workflow/lite-execute.md` | Existing | docs: `.claude/commands/workflow/lite-execute.md` / `Workflow Lite-Execute Command (/workflow:lite-execute)` ; ts: `ccw/src/tools/command-registry.ts` / `const normalized = commandName.startsWith('/workflow:')` | `Test-Path .claude/commands/workflow/lite-execute.md` | Handoff target command; must stay compatible with produced execution context. |
| `ccw/src/tools/command-registry.ts` | Existing | docs: `.claude/commands/workflow/lite-plan.md` / `Usage` ; ts: `ccw/src/tools/command-registry.ts` / `const normalized = commandName.startsWith('/workflow:')` | `Test-Path ccw/src/tools/command-registry.ts` | Registry reads command docs + allowed-tools/argument-hint metadata. |
| `ccw/src/tools/session-manager.ts` | Existing | docs: `.claude/commands/workflow/lite-plan.md` / `Output Artifacts` ; ts: `ccw/src/tools/session-manager.ts` / `const LITE_PLAN_BASE = '.workflow/.lite-plan';` | `Test-Path ccw/src/tools/session-manager.ts` | Session storage base + content types for lite artifacts. |
| `ccw/src/commands/session-path-resolver.ts` | Existing | docs: `.claude/commands/workflow/lite-plan.md` / `Output Artifacts` ; ts: `ccw/src/commands/session-path-resolver.ts` / `'plan.json': 'lite-plan'` | `Test-Path ccw/src/commands/session-path-resolver.ts` | Filename→content_type mapping used by tooling/session APIs. |
| `ccw/src/core/lite-scanner.ts` | Existing | docs: `.claude/commands/workflow/lite-plan.md` / `Session Folder Structure` ; ts: `ccw/src/core/lite-scanner.ts` / `if (type === 'lite-plan') {` | `Test-Path ccw/src/core/lite-scanner.ts` | Scans lite-plan sessions for dashboards/status. |
| `ccw/src/core/services/flow-executor.ts` | Existing | docs: `.claude/commands/workflow/lite-plan.md` / `Execution Process` ; ts: `ccw/src/core/services/flow-executor.ts` / `private async runSlashCommand(node: FlowNode): Promise<NodeResult> {` | `Test-Path ccw/src/core/services/flow-executor.ts` | Slash-command execution plumbing (tooling integration). |

## Implementation Hints (Tooling/Server)

- Session file routing and storage are already modeled as “lite” content types; keep lite-plan artifacts aligned with:
  - `ccw/src/tools/session-manager.ts` (base dirs + supported content types)
  - `ccw/src/commands/session-path-resolver.ts` (filename mappings)
  - `ccw/src/core/lite-scanner.ts` (scanning logic for `.lite-plan`)

## Proposed Fix Plan (Minimal)

- Make the outline’s artifact path conventions explicit (session id, filenames) and keep them consistent with session tooling.
- Add one file-input example and a “planning-only” safety note.
- Verify (and adjust if needed) that all referenced lite artifacts are supported by the session tooling content-type mapping.

