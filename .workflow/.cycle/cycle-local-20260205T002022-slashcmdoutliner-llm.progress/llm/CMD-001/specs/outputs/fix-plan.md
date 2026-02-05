# Fix Plan: ccw-coordinator Implementation

## Overview

Implement the ccw-coordinator command orchestration tool following the comprehensive specification in `.claude/commands/ccw-coordinator.md`. The implementation will be done in phases to ensure incremental progress and testability.

## Implementation Strategy

**Approach**: Bottom-up implementation with unit testing at each layer
**Timeline**: 7 phases with clear deliverables
**Validation**: Evidence-based verification at each step

## Phase 1: Core Analysis Logic

**Goal**: Implement task analysis with type detection and complexity assessment

**Tasks**:
1. Create module structure: `ccw/src/commands/ccw-coordinator/analyzer.ts`
2. Implement `analyzeRequirements(taskDescription)` function
3. Implement `detectTaskType(text)` with regex patterns for:
   - bugfix, tdd, test-fix, test-gen, review
   - issue-batch, issue-transition
   - brainstorm-file, brainstorm-to-issue, debug-file, analyze-file
   - brainstorm, multi-cli, feature (default)
4. Implement `determineComplexity(text)` with scoring algorithm
5. Add unit tests for all task type patterns
6. Add unit tests for complexity scoring

**Deliverables**:
- `ccw/src/commands/ccw-coordinator/analyzer.ts`
- `ccw/src/commands/ccw-coordinator/analyzer.test.ts`
- All tests passing

**Verification**:
```bash
npm test -- analyzer.test.ts
```

## Phase 2: Command Discovery & Recommendation

**Goal**: Integrate CommandRegistry and implement port-based command chain selection

**Tasks**:
1. Create module: `ccw/src/commands/ccw-coordinator/recommender.ts`
2. Import and instantiate CommandRegistry
3. Implement `determinePortFlow(taskType, constraints)` with port mappings
4. Define command port definitions (as per doc specification)
5. Implement `recommendCommandChain(analysis)` with port-based matching
6. Implement minimum execution unit validation
7. Add unit tests for port flow determination
8. Add unit tests for chain recommendations per task type

**Deliverables**:
- `ccw/src/commands/ccw-coordinator/recommender.ts`
- `ccw/src/commands/ccw-coordinator/recommender.test.ts`
- All tests passing

**Verification**:
```bash
npm test -- recommender.test.ts
rg "getAllCommandsSummary" ccw/src/commands/ccw-coordinator/recommender.ts
```

## Phase 3: State Management

**Goal**: Implement state.json persistence and utilities

**Tasks**:
1. Create module: `ccw/src/commands/ccw-coordinator/state.ts`
2. Define TypeScript interfaces for state structure:
   - `CoordinatorState`
   - `CommandChainItem`
   - `ExecutionResult`
   - `PromptRecord`
3. Implement `createInitialState(sessionId, analysis, chain)` function
4. Implement `saveState(stateDir, state)` function
5. Implement `loadState(stateDir)` function
6. Implement `updateCommandStatus(state, index, status)` function
7. Add unit tests for state operations

**Deliverables**:
- `ccw/src/commands/ccw-coordinator/state.ts`
- `ccw/src/commands/ccw-coordinator/state.test.ts`
- All tests passing

**Verification**:
```bash
npm test -- state.test.ts
```

## Phase 4: Smart Parameter Assembly

**Goal**: Implement command-specific parameter formatting

**Tasks**:
1. Create module: `ccw/src/commands/ccw-coordinator/formatter.ts`
2. Implement `formatCommand(cmd, previousResults, analysis)` with logic for:
   - Planning commands (lite-plan, plan, tdd-plan, multi-cli-plan)
   - Execution commands (lite-execute, execute)
   - Bug fix commands (lite-fix, debug)
   - Test commands (test-gen, test-fix-gen, test-cycle-execute)
   - Review commands (review, review-cycle-fix)
   - Issue workflow commands (discover, plan, queue, execute, convert-to-plan)
   - With-File workflows (brainstorm-with-file, debug-with-file, analyze-with-file)
3. Implement `parseOutput(output)` for session ID and artifact extraction
4. Add unit tests for all command types
5. Add unit tests for output parsing

**Deliverables**:
- `ccw/src/commands/ccw-coordinator/formatter.ts`
- `ccw/src/commands/ccw-coordinator/formatter.test.ts`
- All tests passing

**Verification**:
```bash
npm test -- formatter.test.ts
```

## Phase 5: Execution Engine

**Goal**: Implement sequential command execution with state tracking

**Tasks**:
1. Create module: `ccw/src/commands/ccw-coordinator/executor.ts`
2. Implement `executeCommandChain(chain, analysis)` function:
   - Create session directory
   - Initialize state.json
   - Loop through commands
   - Assemble prompts using formatCommand()
   - Execute via `ccw cli -p "..." --tool claude --mode write` in background
   - Save checkpoints to state.json
   - Stop after first command (wait for hook callback)
3. Implement error handling with user choices (Retry/Skip/Abort)
4. Add integration tests for execution flow

**Deliverables**:
- `ccw/src/commands/ccw-coordinator/executor.ts`
- `ccw/src/commands/ccw-coordinator/executor.test.ts`
- All tests passing

**Verification**:
```bash
npm test -- executor.test.ts
rg "run_in_background: true" ccw/src/commands/ccw-coordinator/executor.ts
```

## Phase 6: Hook Integration & Continuation

**Goal**: Extend hook infrastructure for ccw-coordinator callbacks

**Tasks**:
1. Extend `ccw/src/commands/hook.ts` with ccw-coordinator handler
2. Implement `handleCliCompletion(sessionId, taskId, output)` callback:
   - Load state.json
   - Find pending command by task_id
   - Parse output for session ID and artifacts
   - Update execution result
   - Update command status
   - Save state.json
   - Trigger next command or mark complete
3. Implement `resumeChainExecution(sessionId, nextIdx)` function
4. Add integration tests for hook callbacks

**Deliverables**:
- Updated `ccw/src/commands/hook.ts`
- `ccw/src/commands/ccw-coordinator/hook-handler.ts`
- `ccw/src/commands/ccw-coordinator/hook-handler.test.ts`
- All tests passing

**Verification**:
```bash
npm test -- hook-handler.test.ts
rg "handleCliCompletion" ccw/src/commands/hook.ts
```

## Phase 7: User Interaction & Main Entry

**Goal**: Implement user confirmation flow and wire up all components

**Tasks**:
1. Create module: `ccw/src/commands/ccw-coordinator/ui.ts`
2. Implement `getUserConfirmation(chain)` with AskUserQuestion:
   - Options: Confirm / Show Details / Adjust / Cancel
   - Display command details on request
   - Support chain adjustment
3. Implement `displayAnalysis(analysis)` function
4. Implement `displayRecommendation(chain)` function
5. Create main entry: `ccw/src/commands/ccw-coordinator/index.ts`
6. Implement `ccwCoordinator(taskDescription)` function:
   - Phase 1: analyzeRequirements()
   - Phase 2: recommendCommandChain()
   - Phase 2b: getUserConfirmation()
   - Phase 3: executeCommandChain()
7. Add command registration
8. Add end-to-end integration tests

**Deliverables**:
- `ccw/src/commands/ccw-coordinator/ui.ts`
- `ccw/src/commands/ccw-coordinator/index.ts`
- `ccw/src/commands/ccw-coordinator/integration.test.ts`
- All tests passing

**Verification**:
```bash
npm test -- integration.test.ts
node .claude/skills/slash-command-outliner/scripts/verify-evidence.js
```

## Testing Strategy

**Unit Tests**:
- Each module has corresponding .test.ts file
- Test all public functions
- Mock external dependencies (CommandRegistry, Bash, Write, Read)
- Achieve >80% code coverage

**Integration Tests**:
- Test full workflow for each task type
- Test state persistence and resumption
- Test hook callback handling
- Test error handling paths

**Manual Testing**:
- Test with real command execution
- Verify state.json structure
- Test chain adjustment UI
- Test all task type routing scenarios

## Success Criteria

- [ ] All unit tests passing
- [ ] All integration tests passing
- [ ] Evidence verification script passes
- [ ] Manual testing complete for all task types
- [ ] State persistence working correctly
- [ ] Hook callbacks triggering next commands
- [ ] Error handling working as expected
- [ ] Documentation updated with implementation notes

## Rollback Plan

If implementation encounters blocking issues:
1. Revert to last working commit
2. Document blocking issue in gap-report.md
3. Adjust fix plan with alternative approach
4. Re-run evidence verification

## Notes

- Follow existing code style in ccw/src/
- Use TypeScript strict mode
- Add JSDoc comments for all public functions
- Keep modules focused and single-purpose
- Prefer composition over inheritance
- Use existing utilities where possible (CommandRegistry, state management patterns)
