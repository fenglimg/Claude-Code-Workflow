# Fix Plan: workflow:gather (CMD-060)

## P0 (Must)

1. [docs] Allowed-tools reconciliation
   - Option A: add `Write(*)` to frontmatter if the orchestrator writes artifacts directly.
   - Option B: keep allowed-tools as-is and ensure all writes happen inside Task subagents (or via an existing tool like `session_manager`), with the orchestrator only reading + dispatching.
2. [docs] Canonicalize artifact paths
   - Use `.workflow/active/<session_id>/.process/...` consistently (match CCW session tooling).
3. [docs|ts] Registry discovery decision
   - If CCW registry-based discovery is required: update `ccw/src/tools/command-registry.ts` to support nested docs (e.g. `workflow/tools/**/*.md`) or relocate/duplicate the command doc so `/workflow:gather` is discoverable.

## P1 (Should)

4. [docs] Canonical command naming
   - Pick one canonical slash (`/workflow:gather` vs `/workflow:tools:context-gather`) and update heading/examples accordingly; document any alias explicitly.
5. [docs] Make writer-of-record explicit
   - For each output artifact, state which actor produces it (orchestrator vs subagent), and how failures are handled.

## P2 (Optional)

6. [docs] Add minimal `context-package.json` required-field schema snippet.
7. [docs] Add an explicit cap for exploration angles for high-complexity tasks (e.g. max 4).

