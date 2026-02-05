# Fix Plan: workflow:test-cycle-execute

## P0 (Must)

1. [docs] Replace broad git staging examples (avoid `git add .`); document staging of only files produced by the iteration, and require explicit opt-in before any commit/revert automation.
2. [docs] Ensure all implementation pointer tables use only verifiable Existing rows; downgrade uncertain pointers to Planned and add concrete `Test-Path`/`rg` verify steps.

## P1 (Should)

3. [docs] Add a short "artifact routing" note that aligns file paths with session-manager content types (`task`, `process`, `todo`) to avoid divergence.
4. [docs] Clarify resume requirements: which files must exist and which are optional (and how to initialize safely when missing).

## P2 (Optional)

5. [docs] Add cross-links to related commands for the upstream task generation and downstream execution flow.

