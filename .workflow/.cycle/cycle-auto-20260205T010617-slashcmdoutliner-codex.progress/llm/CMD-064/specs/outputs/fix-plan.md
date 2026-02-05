# Fix Plan: workflow/tools/test-concept-enhanced (CMD-064)

## P0 (Must Fix)

1) Docs: add `allowed-tools` to `.claude/commands/workflow/tools/test-concept-enhanced.md` frontmatter
   - Recommended: `Task(*), Read(*), Write(*), Glob(*)`
   - Verify: `rg \"^allowed-tools:\" .claude/commands/workflow/tools/test-concept-enhanced.md`

2) Docs: add missing template sections to `.claude/commands/workflow/tools/test-concept-enhanced.md`
   - `Usage` (show `/workflow:tools:test-concept-enhanced ...`)
   - `Inputs` (`--session`, `--context`)
   - `Outputs / Artifacts` (reads/writes)
   - `Implementation Pointers` + evidence table (docs + TS anchors)

## P1 (Should Fix)

3) Docs: strengthen output validation + fallback
   - Define required sections for `TEST_ANALYSIS_RESULTS.md`
   - Specify minimal fallback schema for synthesized output when Gemini fails

## P2 (Optional)

4) Docs: add cross-links
   - Upstream: `/workflow:tools:test-context-gather`
   - Downstream: `/workflow:tools:test-task-generate`

