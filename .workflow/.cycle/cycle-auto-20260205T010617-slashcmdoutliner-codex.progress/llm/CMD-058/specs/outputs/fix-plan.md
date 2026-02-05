# Fix Plan: workflow:tools:code-validation-gate

## P0 (Must)

1) Docs scope: update `.claude/commands/workflow/tools/code-validation-gate.md` frontmatter to include `allowed-tools` consistent with actual behavior (Read/Write/Edit/Bash/Glob/Grep).
2) Docs structure: add a `Usage` section with the canonical invocation and flag examples.
3) Output contract: ensure `code-validation-report.md` and `code-validation-report.json` are documented as always-written artifacts (even on HARD_FAIL).

## P1 (Should)

1) Decision thresholds: document PASS/SOFT_FAIL/HARD_FAIL criteria and retry limit in a compact table.
2) Target selection: document a deterministic ordering for target file discovery (context-package focus_paths -> IMPL output -> modified files).

## P2 (Optional)

1) JSON schema: add a small schema snippet (keys + meanings) for `code-validation-report.json`.
2) Dependency checklist: document expected tooling (tsc/eslint/madge) and remediation steps when missing.

