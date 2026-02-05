# Fix Plan: workflow:tdd-verify

## P0 (Must)

1) Run evidence gate:
   - `node .codex/skills/slash-command-outliner/scripts/verify-evidence.js --file=.workflow/.cycle/cycle-auto-20260205T010617-slashcmdoutliner-codex.progress/llm/CMD-055/specs/outputs/generated-slash-outline.md`
   - `node .codex/skills/slash-command-outliner/scripts/verify-evidence.js --file=.workflow/.cycle/cycle-auto-20260205T010617-slashcmdoutliner-codex.progress/llm/CMD-055/specs/outputs/gap-report.md`
2) If any evidence row fails, downgrade to `Planned` and add a concrete `Verify` step; do not claim `Existing` without a verifiable repo path and anchors.

## P1 (Should)

3) Keep Phase 2 "task chain validation" description synchronized with the actual task JSON conventions (IDs, depends_on, meta fields) used in `.workflow/active/WFS-*/.task/*.json`.
4) Prefer CCW tooling for session conventions when evolving automation:
   - session base paths and lifecycle: `ccw/src/tools/session-manager.ts`
   - command discovery: `ccw/src/tools/command-registry.ts`

## P2 (Optional)

5) Add a short, prominent read-only contract block (no task/code modification; report-only writes) near the top of the command doc for faster operator confidence.

