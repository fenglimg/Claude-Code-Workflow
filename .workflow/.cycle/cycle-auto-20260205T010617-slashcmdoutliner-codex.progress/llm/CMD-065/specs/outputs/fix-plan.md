# Fix Plan: workflow:tools:test-context-gather (Minimal)

1) P0 (docs/agent): Update `.codex/agents/test-context-search-agent.md` to replace `mcp__ccw-tools__codex_lens(...)` usage with currently-supported tooling (`mcp__ccw-tools__smart_search` and/or `codex_lens_lsp`). Add a brief note on the chosen replacement in the agent’s Tool Arsenal section.

2) P1 (docs/command): Normalize output path examples in `.claude/commands/workflow/tools/test-context-gather.md` to consistently use `.workflow/active/{test_session_id}/.process/test-context-package.json` (and keep the curly-brace placeholders consistent across sections).

3) P1 (docs/command): Make the detection-first “valid package” decision deterministic by listing a small required-key checklist (e.g. `metadata`, `source_context`, `assets`) under the command doc’s `Quality Validation` section.

