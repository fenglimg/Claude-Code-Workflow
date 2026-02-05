# Gap Report: workflow:plan-verify

## Reference

- Selected reference: /workflow:plan-verify (`.claude/commands/workflow/plan-verify.md`)

## P0 Gaps (Must Fix)

- None detected: core sections are present; artifacts are consistent with CCW session conventions; evidence tables label pointers Existing/Planned with dual-source evidence.

## P1 Gaps (Should Fix)

- Next-step orchestration: the oracle command includes an interactive next-step selection and chaining, but this outline keeps step 6 as a printed recommendation to stay within the declared tool surface.
- Session resolution: oracle uses Bash `find/ls` patterns; consider aligning with the TS session-manager/active-session discovery conventions when implementing automation wrappers.

## P2 Gaps (Optional)

- Optional flags: the oracle contains additional automation patterns (e.g., auto-continue) that are not required by the requirement doc.

## Implementation Pointers (Evidence)

| Pointer | Status | Evidence | Verify | Notes |
|---|---|---|---|---|
| `.claude/commands/workflow/plan-verify.md` | Existing | docs: .claude/commands/workflow/plan-verify.md / Operating Constraints ; ts: ccw/src/tools/command-registry.ts / // Read command file | `Test-Path .claude/commands/workflow/plan-verify.md` | Source of truth for command behavior and read-only constraints |
| `ccw/src/tools/command-registry.ts` | Existing | docs: .claude/commands/workflow/plan-verify.md / User Input ; ts: ccw/src/tools/command-registry.ts / const normalized = commandName.startsWith('/workflow:') | `Test-Path ccw/src/tools/command-registry.ts` | Command lookup for `.claude/commands/**.md` |
| `ccw/src/tools/session-manager.ts` | Existing | docs: .claude/commands/workflow/plan-verify.md / Execution Steps ; ts: ccw/src/tools/session-manager.ts / task: '{base}/.task/{task_id}.json', | `Test-Path ccw/src/tools/session-manager.ts` | Canonical mapping for session artifacts consumed/produced by this command |
| `ccw/src/commands/loop.ts` | Existing | docs: .claude/commands/workflow/plan-verify.md / Execution Steps ; ts: ccw/src/commands/loop.ts / const workflowDir = join(cwd, '.workflow', 'active'); | `Test-Path ccw/src/commands/loop.ts` | Active session detection patterns under `.workflow/active/` |
| `.workflow/active/WFS-{session}/.process/PLAN_VERIFICATION.md` | Planned | docs: .claude/commands/workflow/plan-verify.md / Goal ; ts: ccw/src/tools/session-manager.ts / process: '{base}/.process/{filename}', | `Test-Path .workflow/active/WFS-<session>/.process/PLAN_VERIFICATION.md` | Only file this command should write |
| `.workflow/active/WFS-{session}/IMPL_PLAN.md` | Planned | docs: .claude/commands/workflow/plan-verify.md / Execution Steps ; ts: ccw/src/tools/session-manager.ts / plan: '{base}/IMPL_PLAN.md', | `Test-Path .workflow/active/WFS-<session>/IMPL_PLAN.md` | Input produced by `/workflow:plan` |

## Implementation Hints (Tooling/Server)

- Prefer the repository's canonical session routing conventions (PATH_ROUTES) when deriving paths, especially `.process/`, `.task/`, and `IMPL_PLAN.md`.
- Keep the command strictly read-only for inputs: any remediation should be suggested in the report, not applied automatically.

## Proposed Fix Plan (Minimal)

See `fix-plan.md`.

