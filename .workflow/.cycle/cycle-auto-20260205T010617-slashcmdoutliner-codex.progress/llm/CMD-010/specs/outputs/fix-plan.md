# Fix Plan: issue:convert-to-plan

## P0 (Must)

1) Define `--supplement` behavior precisely
- Scope: command implementation + doc update
- Decision: update-in-place (preserve existing solution ID) vs create-new-and-rebind (new ID).
- Verify:
  - `ccw issue solutions --issue <id> --json`
  - `ccw issue solution <issue-id> --solution-id <sol-id> --json`

2) Enforce persistence rules consistently
- Scope: command implementation
- Prefer:
  - `ccw issue solution <issue-id> --data '<solution-json>' --json`
  - `ccw issue bind <issue-id> <solution-id>`
  - `ccw issue update <issue-id> --status planned`
- Only if supplement requires in-place edits: rewrite `.workflow/issues/solutions/<issue-id>.jsonl` once, then re-validate by reading via CLI.

## P1 (Should)

3) Strengthen source detection + validations
- Scope: command implementation
- Verify:
  - lite-plan: `Test-Path <dir>/plan.json`
  - session: `Test-Path .workflow/active/<WFS>/workflow-session.json`
  - task glob: `rg \"IMPL-\" .workflow/active/<WFS>/.task/`

4) Make CLI call sequence explicit in docs
- Scope: command doc update
- Include the exact `ccw issue` commands used in each mode (new issue vs existing issue; supplement vs new).

## P2 (Optional)

5) Markdown extractor hardening
- Scope: command implementation
- Add a single retry path on non-JSON output + show a minimal error snippet to the user (no secrets).

