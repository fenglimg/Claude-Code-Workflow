# Fix Plan: workflow:init-guidelines

## Minimal Changes (P0)

1) Update `.claude/commands/workflow/init-guidelines.md` frontmatter
- Add: `allowed-tools: Read(*), Write(*), AskUserQuestion(*)`
- Add: `group: workflow` (if required/used by your command registry UI)

2) Make overwrite semantics explicit
- If `.workflow/project-guidelines.json` is populated and `--reset` is not set:
  - Ask user to choose: overwrite vs append/merge
  - Document how conflicts/duplicates are handled

3) Harden JSON read/write
- On read parse failure: show error, offer overwrite (or require `--reset`)
- On write: update `_metadata.last_updated` + `_metadata.updated_by` and keep output valid JSON

## Follow-ups (P1)

- Add \"Related Commands\" links and next steps: `/workflow:init`, `/workflow:plan`, `/workflow:session:solidify`.
- Add a compact example of the output shape (avoid large schemas / duplication).

