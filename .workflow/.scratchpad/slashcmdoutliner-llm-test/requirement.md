# Requirement (sanitized)

Command identity:
- group: issue
- name: new
- description: Create structured issue from GitHub URL or text description
- argument-hint: "[-y|--yes] <github-url | text-description> [--priority 1-5]"
- allowed-tools: TodoWrite(*), Bash(*), Read(*), AskUserQuestion(*), mcp__ace-tool__search_context(*)

Intended workflow:
- interaction: iterative
- primary user value: turn input into a tracked issue with structured fields

Hard constraints:
- must not expose secrets
- do not claim paths exist unless verified

Artifacts:
- writes: .workflow/issue/* (placeholder)
- reads: repo files as needed
