# Gap Report: ccw-coordinator

## Reference

- Selected reference: ccw-coordinator (`.claude/commands/ccw-coordinator.md`)

## P0 Gaps (Must Fix)

**None identified** - The command document is comprehensive and well-structured:

- ✅ Frontmatter complete with all required fields
- ✅ Allowed-tools correctly specified for orchestration workflow
- ✅ Core sections present (Overview, Usage, Execution Process, Error Handling, Examples)
- ✅ Artifact references clearly documented
- ✅ Implementation pointers with evidence-based status labels

## P1 Gaps (Should Fix)

1. **Missing Implementation Code**
   - Status: Command doc exists, but no TypeScript implementation yet
   - Impact: Command cannot be executed until core logic is implemented
   - Recommendation: Implement in phases as outlined in agent-outline.md

2. **Hook Callback Integration Details**
   - Status: Generic hook infrastructure exists, but ccw-coordinator-specific callback logic not implemented
   - Impact: Cannot resume execution after background CLI completion
   - Recommendation: Extend existing hook.ts with ccw-coordinator session handling

3. **State Resumption Logic**
   - Status: State file structure documented, but no resumption implementation
   - Impact: Cannot recover from interruptions or continue partial executions
   - Recommendation: Add state loading and validation logic

## P2 Gaps (Optional)

1. **Advanced Chain Adjustment UI**
   - Status: Basic adjustment mentioned, but no detailed UX flow
   - Impact: Limited user control over recommended chains
   - Recommendation: Consider interactive chain editor for power users

2. **Performance Optimization**
   - Status: No caching strategy for CommandRegistry results
   - Impact: Repeated command discovery may be slow for large command sets
   - Recommendation: Leverage existing CommandRegistry cache

3. **Telemetry and Analytics**
   - Status: No tracking of command chain success rates or user preferences
   - Impact: Cannot optimize recommendations based on usage patterns
   - Recommendation: Add optional telemetry for chain effectiveness

## Implementation Pointers (Evidence)

| Pointer | Status | Evidence | Verify | Notes |
|---|---|---|---|---|
| `.claude/commands/ccw-coordinator.md` | Existing | docs: `.claude/commands/ccw-coordinator.md` / `# CCW Coordinator Command` ; ts: N/A (doc only) | `ls .claude/commands/ccw-coordinator.md` | Command specification exists and is comprehensive |
| `ccw/src/tools/command-registry.ts` | Existing | docs: `.claude/commands/ccw-coordinator.md` / `## CommandRegistry Integration` ; ts: `ccw/src/tools/command-registry.ts` / `export class CommandRegistry` | `rg "export class CommandRegistry" ccw/src/tools/command-registry.ts` | Core tool for command discovery |
| `CommandRegistry.getAllCommandsSummary()` | Existing | docs: `.claude/commands/ccw-coordinator.md` / `const allCommands = registry.getAllCommandsSummary()` ; ts: `ccw/src/tools/command-registry.ts` / `public getAllCommandsSummary(): Map<string, CommandSummary>` | `rg "getAllCommandsSummary" ccw/src/tools/command-registry.ts` | Returns Map of all commands with name and description |
| `CommandRegistry.getAllCommandsByCategory()` | Existing | docs: `.claude/commands/ccw-coordinator.md` / `const byCategory = registry.getAllCommandsByCategory()` ; ts: `ccw/src/tools/command-registry.ts` / `public getAllCommandsByCategory(): Record<string, CommandMetadata[]>` | `rg "getAllCommandsByCategory" ccw/src/tools/command-registry.ts` | Returns categorized command metadata |
| `CommandRegistry.getCommand()` | Existing | docs: `.claude/commands/ccw-coordinator.md` / `const cmd = registry.getCommand('lite-plan')` ; ts: `ccw/src/tools/command-registry.ts` / `public getCommand(name: string)` | `rg "public getCommand" ccw/src/tools/command-registry.ts` | Single command metadata lookup |
| `ccw/src/commands/hook.ts` | Existing | docs: `.claude/commands/ccw-coordinator.md` / `### Phase 3: Execute Sequential Command Chain` ; ts: `ccw/src/commands/hook.ts` / hook handling infrastructure | `ls ccw/src/commands/hook.ts` | Foundation for CLI completion callbacks |
| Main coordinator module | Planned | docs: `.claude/commands/ccw-coordinator.md` / `## Execution Flow` ; ts: TBD / `async function ccwCoordinator(taskDescription)` | TBD | Entry point to be implemented |
| `analyzeRequirements()` | Planned | docs: `.claude/commands/ccw-coordinator.md` / `### Phase 1: Analyze Requirements` ; ts: TBD / `function analyzeRequirements(taskDescription)` | TBD | Task analysis with type detection and complexity assessment |
| `detectTaskType()` | Planned | docs: `.claude/commands/ccw-coordinator.md` / `function detectTaskType(text)` ; ts: TBD / pattern matching logic | TBD | Regex-based task type classification |
| `determineComplexity()` | Planned | docs: `.claude/commands/ccw-coordinator.md` / `function determineComplexity(text)` ; ts: TBD / scoring algorithm | TBD | Complexity scoring based on keywords |
| `recommendCommandChain()` | Planned | docs: `.claude/commands/ccw-coordinator.md` / `### Phase 2: Discover Commands & Recommend Chain` ; ts: TBD / `async function recommendCommandChain(analysis)` | TBD | Port-based command chain selection |
| `determinePortFlow()` | Planned | docs: `.claude/commands/ccw-coordinator.md` / `function determinePortFlow(taskType, constraints)` ; ts: TBD / port mapping logic | TBD | Maps task types to input/output ports |
| `getUserConfirmation()` | Planned | docs: `.claude/commands/ccw-coordinator.md` / `### Phase 2b: Get User Confirmation` ; ts: TBD / `async function getUserConfirmation(chain)` | TBD | Interactive confirmation with AskUserQuestion |
| `executeCommandChain()` | Planned | docs: `.claude/commands/ccw-coordinator.md` / `### Phase 3: Execute Sequential Command Chain` ; ts: TBD / `async function executeCommandChain(chain, analysis)` | TBD | Sequential execution with state tracking |
| `formatCommand()` | Planned | docs: `.claude/commands/ccw-coordinator.md` / `function formatCommand(cmd, previousResults, analysis)` ; ts: TBD / smart parameter assembly | TBD | Assembles command-specific parameters based on context |
| `handleCliCompletion()` | Planned | docs: `.claude/commands/ccw-coordinator.md` / `async function handleCliCompletion(sessionId, taskId, output)` ; ts: TBD / hook callback handler | TBD | Processes CLI completion and triggers next command |
| `parseOutput()` | Planned | docs: `.claude/commands/ccw-coordinator.md` / `function parseOutput(output)` ; ts: TBD / regex extraction | TBD | Extracts session ID and artifacts from CLI output |
| State file schema | Planned | docs: `.claude/commands/ccw-coordinator.md` / `## State File Structure` ; ts: TBD / TypeScript interface | TBD | JSON structure for state.json persistence |

## Implementation Hints (Tooling/Server)

**CommandRegistry Integration:**
- Already implemented and tested in `ccw/src/tools/command-registry.ts`
- Supports caching for performance
- Handles both workflow and issue commands
- Use `getAllCommandsSummary()` for initial discovery
- Use `getCommand(name)` for detailed metadata lookup

**Hook Infrastructure:**
- Existing foundation in `ccw/src/commands/hook.ts`
- Extend with ccw-coordinator-specific session handling
- Parse task_id from background Bash execution
- Match task_id to pending command in state.json
- Update state and trigger next command via resumeChainExecution()

**CLI Execution:**
- Use `ccw cli -p "PROMPT" --tool claude --mode write` format
- Always run in background: `Bash(..., { run_in_background: true })`
- Stop immediately after launching (no polling)
- Wait for hook callback to continue

**State Management:**
- Store in `.workflow/.ccw-coordinator/{session_id}/state.json`
- Include full execution history for debugging
- Record all prompts used for reproducibility
- Support resumption from any point in chain

## Proposed Fix Plan (Minimal)

### Step 1: Core Analysis Implementation
- Create `ccw/src/commands/ccw-coordinator/analyzer.ts`
- Implement `analyzeRequirements()`, `detectTaskType()`, `determineComplexity()`
- Add unit tests for pattern matching
- Verify all task type patterns from doc

### Step 2: Command Discovery Integration
- Create `ccw/src/commands/ccw-coordinator/recommender.ts`
- Integrate CommandRegistry for command discovery
- Implement `recommendCommandChain()` with port-based matching
- Implement `determinePortFlow()` with task type mapping
- Add minimum execution unit validation

### Step 3: Execution Engine
- Create `ccw/src/commands/ccw-coordinator/executor.ts`
- Implement `executeCommandChain()` with state tracking
- Implement `formatCommand()` for smart parameter assembly
- Add state.json persistence utilities
- Implement `parseOutput()` for result extraction

### Step 4: Hook Integration
- Extend `ccw/src/commands/hook.ts` with ccw-coordinator handler
- Implement `handleCliCompletion()` callback
- Add state update and next command triggering
- Test background execution flow

### Step 5: User Interaction
- Create `ccw/src/commands/ccw-coordinator/ui.ts`
- Implement `getUserConfirmation()` with AskUserQuestion
- Add chain adjustment logic
- Implement error handling with user choices

### Step 6: Main Entry Point
- Create `ccw/src/commands/ccw-coordinator/index.ts`
- Implement main `ccwCoordinator()` function
- Wire up all phases
- Add command registration

### Step 7: Testing & Validation
- Add integration tests for full workflow
- Test all task type routing scenarios
- Validate state persistence and resumption
- Test hook callback handling
- Run evidence verification: `node .claude/skills/slash-command-outliner/scripts/verify-evidence.js`
