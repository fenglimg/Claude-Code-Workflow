# Gap Report: other:codex-coordinator

## Reference

- Selected reference: /ccw-coordinator (`.claude/commands/ccw-coordinator.md`)

## P0 Gaps (Must Fix)

- Frontmatter parity: `.claude/commands/codex-coordinator.md` currently lacks `allowed-tools`; add it (and keep `argument-hint`) so tool surface is explicit and enforceable.
- Invocation reality: pick a single execution surface for Codex prompts (e.g. `ccw cli -p ... --tool codex`) and ensure the coordinator’s command-format section and examples match that surface.
- State contract: define the session directory + state schema precisely (including status values and resume rules) and ensure every referenced artifact is either created by the command or already exists.
- Atomic unit enforcement: make skip/retry/abort rules explicit so execution never produces partial Minimum Execution Units unless user overrides.
- Evidence discipline (deep mode): every key pointer used by the command must be labeled Existing vs Planned and must include dual-source evidence (docs + TS).

## P1 Gaps (Should Fix)

- Discovery algorithm: specify how `.codex/prompts/*.md` are enumerated, categorized (planning/execution/testing/etc.), and mapped into recommendation candidates.
- Recommendation output format: standardize the pipeline rendering (unit markers, per-step args, expected artifacts) and include a concise rationale per step in `--verbose`.
- Resume UX: add a minimal “how to resume + where to find state/logs” section that mirrors CCW coordinator patterns.

## P2 Gaps (Optional)

- Hook integration: document how to use `ccw hook parse-status`/session-context (or equivalent) to surface coordinator progress in dashboards.
- Alternative chains: provide 1-2 alternative chains when multiple Minimum Execution Units fit equally well.

## Implementation Pointers (Evidence)

| Pointer | Status | Evidence | Verify | Notes |
|---|---|---|---|---|
| `.claude/commands/codex-coordinator.md` | Existing | docs: .claude/commands/codex-coordinator.md / Codex Coordinator Command ; ts: ccw/src/commands/cli.ts / ccw cli -p | Test-Path .claude/commands/codex-coordinator.md | Oracle doc; needs explicit `allowed-tools` to satisfy P0 frontmatter gate |
| `.claude/commands/ccw-coordinator.md` | Existing | docs: .claude/commands/ccw-coordinator.md / CCW Coordinator Command ; ts: ccw/src/tools/command-registry.ts / export class CommandRegistry | Test-Path .claude/commands/ccw-coordinator.md | Reference for minimum execution units + confirmation + sequential execution + persisted state patterns |
| `ccw/src/commands/cli.ts` | Existing | docs: .claude/commands/codex-coordinator.md / Command Invocation Format ; ts: ccw/src/commands/cli.ts / --tool codex | Test-Path ccw/src/commands/cli.ts | Execution surface for running Codex via CLI (tool selection + prompt execution) |
| `ccw/src/commands/workflow.ts` | Existing | docs: .claude/commands/codex-coordinator.md / Available Codex Commands (Discovery) ; ts: ccw/src/commands/workflow.ts / .codex/prompts | Test-Path ccw/src/commands/workflow.ts | Establishes that `.codex/prompts` is a first-class workflow source (install/list/sync) |
| `.workflow/.codex-coordinator/<session-id>/state.json` | Planned | docs: .claude/commands/codex-coordinator.md / State File Structure ; ts: ccw/src/commands/hook.ts / .workflow/.ccw/ccw-123/status.json | rg "State File Structure" .claude/commands/codex-coordinator.md | New persisted coordinator state; align with existing `.workflow/.../*.json` conventions |
| `ccw/src/commands/hook.ts` | Existing | docs: .claude/commands/ccw-coordinator.md / CLI Execution Model ; ts: ccw/src/commands/hook.ts / ccw hook parse-status --path | Test-Path ccw/src/commands/hook.ts | Reuse hook patterns for progress reporting/resume support |
| `ccw/src/tools/codex-prompt-registry.ts` | Planned | docs: .claude/commands/codex-coordinator.md / Available Codex Commands (Discovery) ; ts: ccw/src/tools/command-registry.ts / private findCommandDir(): string | Test-Path ccw/src/tools/codex-prompt-registry.ts | Optional: build a prompt registry similar to CommandRegistry to make discovery deterministic |

## Implementation Hints (Tooling/Server)

- Prefer `ccw cli -p "..." --tool codex` as the execution primitive; it already documents Codex usage and supports tool selection in `ccw/src/commands/cli.ts`.
- Treat `.codex/prompts` as the discoverable command set; `ccw/src/commands/workflow.ts` already models it as an installable workflow source.
- For state/reporting, align file naming and status vocabulary with existing `.workflow/...` JSON conventions and hook utilities in `ccw/src/commands/hook.ts`.

## Proposed Fix Plan (Minimal)

1. Update `.claude/commands/codex-coordinator.md` frontmatter to include `allowed-tools` and ensure core sections explicitly reference the coordinator’s state artifacts.
2. Decide and document a single invocation surface for running Codex prompts (CLI-based), and update examples accordingly.
3. Define `state.json` schema + status values and write/resume rules; ensure every write/read path is documented and consistent.
4. Implement/describe atomic unit enforcement for skip/retry/abort so partial execution cannot occur accidentally.
5. Add/maintain evidence tables for key pointers and ensure they pass the deterministic evidence gate.
