# Fix Plan: CMD-053 (/workflow:session:start)

## P0 (Must)

1. Docs (`.claude/commands/workflow/session/start.md`)
   - Add `allowed-tools:` frontmatter (and optionally `group:`) so the command doc itself satisfies CCW P0 frontmatter gates.
   - Keep headings stable for evidence (e.g., `Overview`, `Mode 2: Auto Mode (Intelligent)`).

2. Evidence Gate
   - Run:
     - `node .codex/skills/slash-command-outliner/scripts/verify-evidence.js --file=.workflow/.cycle/cycle-auto-20260205T010617-slashcmdoutliner-codex.progress/llm/CMD-053/specs/outputs/gap-report.md`
     - `node .codex/skills/slash-command-outliner/scripts/verify-evidence.js --file=.workflow/.cycle/cycle-auto-20260205T010617-slashcmdoutliner-codex.progress/llm/CMD-053/specs/outputs/generated-slash-outline.md`

## P1 (Should)

1. Implementation (planned)
   - Prefer `ccw/src/tools/session-manager.ts` for session init/list/read/write to reduce bash dependencies and improve portability.
   - Ensure auto-mode emits the warning lines when multiple sessions exist and chooses the first deterministically.

## P2 (Optional)

1. Tests (planned)
   - Add focused unit tests around session slug generation, collision behavior, and mode selection (auto vs discovery vs force-new).

