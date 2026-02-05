# Fix Plan: workflow:tools:test-task-generate

1. [docs] Update `.claude/commands/workflow/tools/test-task-generate.md` frontmatter:
   - add `allowed-tools: Task(*), Read(*), Write(*), Glob(*)`
   - keep `argument-hint` and examples
2. [docs] Replace the absolute agent path reference with the repo pointer `.claude/agents/test-action-planning-agent.md`.
3. [docs] Add an explicit Preconditions section:
   - require `.workflow/active/<session>/.process/TEST_ANALYSIS_RESULTS.md` (from `/workflow:tools:test-concept-enhanced`)
   - prefer `.workflow/active/<session>/.process/test-context-package.json` (from `/workflow:tools:test-context-gather`)
4. [tooling] Verify nested command discovery for `/workflow:tools:*` execution:
   - confirm the execution path does not rely on a workflow-flat registry that skips subdirectories
5. [validation] Add a lightweight output verification checklist and error messages that point to the producing upstream command.

