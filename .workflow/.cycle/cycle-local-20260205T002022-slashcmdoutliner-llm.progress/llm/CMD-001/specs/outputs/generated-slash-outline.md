---
name: ccw-coordinator
description: Command orchestration tool - analyze requirements, recommend chain, execute sequentially with state persistence
argument-hint: "[task description]"
allowed-tools: Task(*), AskUserQuestion(*), Read(*), Write(*), Bash(*), Glob(*), Grep(*)
group: (none)
---

# CCW Coordinator Command

## Overview

- Goal: Provide intelligent command orchestration that analyzes user tasks, recommends optimal command chains based on minimum execution units, and executes them sequentially with full state tracking
- Command: `/ccw-coordinator`

## Usage

```bash
/ccw-coordinator "Implement user authentication with email validation"
```

## Inputs

- Required inputs:
  - Task description (string): Natural language description of the task to accomplish
- Optional inputs:
  - None (all configuration is inferred from task analysis)

## Outputs / Artifacts

- Writes:
  - `.workflow/.ccw-coordinator/{session_id}/state.json` - Complete execution state including analysis, command chain, results, and prompts used
- Reads:
  - `.claude/commands/workflow/*.md` - Command metadata via CommandRegistry
  - `.claude/commands/issue/*.md` - Issue workflow command metadata
  - Previous execution state (for resumption scenarios)

## Implementation Pointers

- Command doc: `.claude/commands/ccw-coordinator.md`
- Likely code locations:
  - Main orchestration logic (to be implemented)
  - CommandRegistry integration (existing)
  - State management utilities (to be implemented)
  - Hook callback handlers (existing foundation)

### Evidence (Existing vs Planned)

| Pointer | Status | Evidence (docs + TS) | Verify | Why |
|---|---|---|---|---|
| `.claude/commands/ccw-coordinator.md` | Existing | docs: `.claude/commands/ccw-coordinator.md` / `# CCW Coordinator Command` ; ts: N/A (doc only) | `ls .claude/commands/ccw-coordinator.md` | Command specification document |
| `ccw/src/tools/command-registry.ts` | Existing | docs: `.claude/commands/ccw-coordinator.md` / `## CommandRegistry Integration` ; ts: `ccw/src/tools/command-registry.ts` / `export class CommandRegistry` | `rg "class CommandRegistry" ccw/src/tools/command-registry.ts` | Dynamic command discovery tool |
| `CommandRegistry.getAllCommandsSummary()` | Existing | docs: `.claude/commands/ccw-coordinator.md` / `## CommandRegistry Integration` ; ts: `ccw/src/tools/command-registry.ts` / `public getAllCommandsSummary()` | `rg "getAllCommandsSummary" ccw/src/tools/command-registry.ts` | Retrieve all available commands |
| `CommandRegistry.getAllCommandsByCategory()` | Existing | docs: `.claude/commands/ccw-coordinator.md` / `## CommandRegistry Integration` ; ts: `ccw/src/tools/command-registry.ts` / `public getAllCommandsByCategory()` | `rg "getAllCommandsByCategory" ccw/src/tools/command-registry.ts` | Categorized command retrieval |
| `CommandRegistry.getCommand()` | Existing | docs: `.claude/commands/ccw-coordinator.md` / `## CommandRegistry Integration` ; ts: `ccw/src/tools/command-registry.ts` / `public getCommand(` | `rg "public getCommand" ccw/src/tools/command-registry.ts` | Single command metadata lookup |
| Hook callback infrastructure | Existing | docs: `.claude/commands/ccw-coordinator.md` / `### Phase 3: Execute Sequential Command Chain` ; ts: `ccw/src/commands/hook.ts` / hook handling logic | `ls ccw/src/commands/hook.ts` | Background CLI completion callbacks |
| Main coordinator entry point | Planned | docs: `.claude/commands/ccw-coordinator.md` / `## Execution Flow` ; ts: TBD / `async function ccwCoordinator` | TBD | Main orchestration function to be implemented |
| `analyzeRequirements()` function | Planned | docs: `.claude/commands/ccw-coordinator.md` / `### Phase 1: Analyze Requirements` ; ts: TBD / `function analyzeRequirements` | TBD | Task analysis logic |
| `recommendCommandChain()` function | Planned | docs: `.claude/commands/ccw-coordinator.md` / `### Phase 2: Discover Commands & Recommend Chain` ; ts: TBD / `async function recommendCommandChain` | TBD | Command chain recommendation algorithm |
| `executeCommandChain()` function | Planned | docs: `.claude/commands/ccw-coordinator.md` / `### Phase 3: Execute Sequential Command Chain` ; ts: TBD / `async function executeCommandChain` | TBD | Sequential execution with state tracking |
| `formatCommand()` function | Planned | docs: `.claude/commands/ccw-coordinator.md` / `### Phase 3: Execute Sequential Command Chain` ; ts: TBD / `function formatCommand` | TBD | Smart parameter assembly for commands |
| `handleCliCompletion()` callback | Planned | docs: `.claude/commands/ccw-coordinator.md` / `### Phase 3: Execute Sequential Command Chain` ; ts: TBD / `async function handleCliCompletion` | TBD | Hook callback for CLI completion |
| State file structure | Planned | docs: `.claude/commands/ccw-coordinator.md` / `## State File Structure` ; ts: TBD / state.json schema | TBD | JSON state persistence format |

## Execution Process

1. **Phase 1: Analyze Requirements**
   - Parse task description to extract goal, scope, constraints, complexity
   - Detect task type using pattern matching (bugfix, tdd, test-fix, review, issue-batch, brainstorm-file, etc.)
   - Determine complexity level (simple, medium, complex)
   - Display analysis summary to user

2. **Phase 2: Discover Commands & Recommend Chain**
   - Use CommandRegistry to get all available commands
   - Determine input/output port flow based on task type
   - Apply port-based matching to select command chain
   - Respect minimum execution units (atomic command groups)
   - Display recommended pipeline with visual representation
   - Show command list with descriptions

3. **Phase 2b: Get User Confirmation**
   - Present options: Confirm / Show Details / Adjust / Cancel
   - Allow user to view command details
   - Support chain adjustment (remove/reorder commands)
   - Proceed only after explicit confirmation

4. **Phase 3: Execute Sequential Command Chain**
   - Create session directory: `.workflow/.ccw-coordinator/{session_id}/`
   - Initialize state.json with analysis and command chain
   - For each command in chain:
     - Update command status to 'running'
     - Assemble prompt using formatCommand() with smart parameter logic
     - Build full prompt: command + task + previous results
     - Execute via `ccw cli -p "PROMPT" --tool claude --mode write` in background
     - Save checkpoint to state.json
     - **STOP and wait for hook callback** (no polling)
   - Hook callback updates state and triggers next command
   - Continue until all commands complete or failure occurs

5. **Error Handling**
   - On command failure: offer Retry / Skip / Abort options
   - Update state.json with failure status
   - Allow user to decide continuation strategy

6. **Completion**
   - Mark state as 'completed' when all commands finish
   - Display session ID and state file location
   - State file contains full execution history for resumption

## Error Handling

- [ ] Invalid task description → Display error and request clarification
- [ ] No commands available → Check CommandRegistry initialization
- [ ] User cancels during confirmation → Clean exit with message
- [ ] Command fails to start → Offer Retry/Skip/Abort with state preservation
- [ ] CLI execution timeout → Rely on hook callback (no timeout in orchestrator)
- [ ] State file write failure → Log error and attempt recovery
- [ ] Hook callback with unknown task_id → Log error and skip
- [ ] Incomplete command chain → Validate minimum execution units before execution
- [ ] Missing session_id in command output → Mark as failed and offer retry

## Examples

**Example 1: Simple Feature Implementation**
```bash
/ccw-coordinator "Add user profile page with avatar upload"

# Analysis:
#   Goal: Add user profile page with avatar upload
#   Task Type: feature (simple)
#   Complexity: simple
#
# Recommended Chain:
#   需求 → 【lite-plan → lite-execute】→ 代码 → 【test-fix-gen → test-cycle-execute】→ 测试通过
#
# Commands:
#   1. /workflow:lite-plan
#   2. /workflow:lite-execute
#   3. /workflow:test-fix-gen
#   4. /workflow:test-cycle-execute
```

**Example 2: Bug Fix**
```bash
/ccw-coordinator "Fix memory leak in WebSocket connection handler"

# Analysis:
#   Goal: Fix memory leak in WebSocket connection handler
#   Task Type: bugfix
#   Complexity: medium
#
# Recommended Chain:
#   Bug报告 → 【lite-fix → lite-execute】→ 修复代码 → 【test-fix-gen → test-cycle-execute】→ 测试通过
#
# Commands:
#   1. /workflow:lite-fix
#   2. /workflow:lite-execute
#   3. /workflow:test-fix-gen
#   4. /workflow:test-cycle-execute
```

**Example 3: Issue Workflow**
```bash
/ccw-coordinator "Discover and fix all security issues in authentication module"

# Analysis:
#   Goal: Discover and fix all security issues in authentication module
#   Task Type: issue-batch
#   Complexity: complex
#
# Recommended Chain:
#   代码库 → 【discover → plan → queue → execute】→ 完成 issues
#
# Commands:
#   1. /issue:discover
#   2. /issue:plan
#   3. /issue:queue
#   4. /issue:execute
```

**Example 4: Brainstorm with Documentation**
```bash
/ccw-coordinator "Brainstorm approaches for implementing real-time collaboration"

# Analysis:
#   Goal: Brainstorm approaches for implementing real-time collaboration
#   Task Type: brainstorm-file
#   Complexity: medium
#
# Recommended Chain:
#   主题 → brainstorm-with-file → brainstorm.md (自包含)
#
# Commands:
#   1. /workflow:brainstorm-with-file
```
