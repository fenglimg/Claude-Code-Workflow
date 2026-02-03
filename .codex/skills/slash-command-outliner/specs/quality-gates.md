# Quality Gates (Non-regression First)

## P0 Gates (Must Pass)

P0 failure means “not CCW-aligned” and blocks completion.

1) **Frontmatter completeness**
   - `name`, `description`, `allowed-tools` must exist
   - `argument-hint` optional but recommended for non-trivial commands
2) **Allowed-tools correctness**
   - no tools outside the supported CCW set for the intended workflow
   - no missing tools required by the described behavior
3) **Core sections present**
   - at least: `Overview`, `Usage`, `Execution Process`, `Output/Artifacts`, `Error Handling`
4) **No broken artifact references**
   - referenced paths must be either created by the command or explicitly documented as pre-existing

## Non-regression Policy

Once a command is marked “completed” in the corpus, future changes must not introduce new P0 failures for it.

Mechanism:
- keep snapshots in `regression/expected/`
- compare newly generated `regression/current/` to expected
- store diffs in `regression/diff/`

Default behavior (gate enabled):
- If `expected/` snapshot is missing, initialize it from current output.
- If `expected/` differs from `current/`, the run fails (blocks) and a diff is written.

To accept intentional changes:
- re-run with `--update-expected` to overwrite `expected/` for the differing snapshots.
