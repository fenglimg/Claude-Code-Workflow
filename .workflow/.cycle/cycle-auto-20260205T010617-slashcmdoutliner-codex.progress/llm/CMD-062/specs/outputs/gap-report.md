# Gap Report: workflow:tools:task-generate-tdd

## Reference

- Selected reference: /workflow:tools:task-generate-agent (`.claude/commands/workflow/tools/task-generate-agent.md`)

## P0 Gaps (Must Fix)

- Command frontmatter completeness: ensure `allowed-tools` is explicitly declared and matches actual behavior (interactive config + agent invocation + filesystem IO).
- Artifact path consistency: command text references a user-home template path; repo contains `.claude/workflows/cli-templates/prompts/workflow-impl-plan-template.txt` (align doc pointers to a verifiable path).
- Deterministic evidence: all implementation pointers in the command doc and supporting notes must be labeled `Existing` vs `Planned` with dual-source evidence (docs + TS).

## P1 Gaps (Should Fix)

- Auto mode defaults: document the exact defaults used when `-y|--yes` is set (what is skipped; what configuration is assumed).
- Validation checklist: make the “<= 18 tasks” limit and TDD-cycle structure validation explicit as a step (and document what is considered invalid).

## P2 Gaps (Optional)

- Add a small validator snippet / example to help humans quickly sanity-check the first generated task structure.
- Cross-link upstream/downstream command chain entrypoints (tdd-plan -> task-generate-tdd -> tdd-verify -> execute).

## Implementation Pointers (Evidence)

| Pointer | Status | Evidence | Verify | Notes |
|---|---|---|---|---|
| `.claude/commands/workflow/tools/task-generate-tdd.md` | Existing | docs: `.claude/commands/workflow/tools/task-generate-tdd.md` / `Core Philosophy` ; ts: `ccw/src/tools/command-registry.ts` / `Auto-detect ~/.claude/commands/workflow directory` | `Test-Path .claude/commands/workflow/tools/task-generate-tdd.md` | Source-of-truth command behavior; should be updated to include allowed-tools + verifiable pointers |
| `.claude/commands/workflow/tools/task-generate-agent.md` | Existing | docs: `.claude/commands/workflow/tools/task-generate-agent.md` / `Document Generation Lifecycle` ; ts: `ccw/src/tools/command-registry.ts` / `Auto-detect ~/.claude/commands/workflow directory` | `Test-Path .claude/commands/workflow/tools/task-generate-agent.md` | Closest reference for two-phase planning-doc generation via action-planning-agent |
| `.claude/workflows/cli-templates/prompts/workflow-impl-plan-template.txt` | Existing | docs: `.claude/commands/workflow/tools/task-generate-tdd.md` / `IMPL_PLAN.md (TDD Variant)` ; ts: `ccw/src/tools/session-manager.ts` / `plan: '{base}/IMPL_PLAN.md',` | `Test-Path .claude/workflows/cli-templates/prompts/workflow-impl-plan-template.txt` | Verifiable IMPL_PLAN.md template path present in repo |
| `ccw/src/tools/session-manager.ts` | Existing | docs: `.claude/commands/workflow/tools/task-generate-tdd.md` / `SESSION PATHS` ; ts: `ccw/src/tools/session-manager.ts` / `const ACTIVE_BASE = '.workflow/active';` | `Test-Path ccw/src/tools/session-manager.ts` | Canonical session-root + artifact path mapping used by tooling |
| `ccw/src/core/session-scanner.ts` | Existing | docs: `.claude/commands/workflow/tools/task-generate-tdd.md` / `Validation Rules` ; ts: `ccw/src/core/session-scanner.ts` / `glob('IMPL-*.json', { cwd: taskDir, absolute: false })` | `Test-Path ccw/src/core/session-scanner.ts` | Discovers `IMPL-*.json` tasks in `.task/` for session tooling |
| `.workflow/active/{session-id}/.task/IMPL-*.json` | Planned | docs: `.claude/commands/workflow/tools/task-generate-tdd.md` / `1. TDD Task JSON Files (.task/IMPL-*.json)` ; ts: `ccw/src/core/session-scanner.ts` / `glob('IMPL-*.json', { cwd: taskDir, absolute: false })` | `Test-Path .workflow/active` | Output artifact path pattern (created when the command runs for a session) |

## Implementation Hints (Tooling/Server)

- Command discovery and UI exposure rely on `.claude/commands/**.md` scanning (registry patterns exist in `ccw/src/tools/command-registry.ts`).
- Session artifact conventions are codified in `ccw/src/tools/session-manager.ts` and file-type mapping in `ccw/src/commands/session-path-resolver.ts`.

## Proposed Fix Plan (Minimal)

1. Docs: Add `allowed-tools` to `.claude/commands/workflow/tools/task-generate-tdd.md` frontmatter (match actual behavior and keep tool surface minimal).
2. Docs: Replace non-verifiable template pointer(s) with repo-verifiable path `.claude/workflows/cli-templates/prompts/workflow-impl-plan-template.txt` (or add a Verify step if a user-home path is intentionally supported).
3. Docs: Make auto mode defaults explicit (what config is assumed when `-y|--yes` is passed).
4. Docs: Add a short validation checklist section (task-count limit, required TDD phases, quantification requirements).
5. Regression: Run the evidence verifier after edits to ensure pointers remain dual-source and verifiable.

