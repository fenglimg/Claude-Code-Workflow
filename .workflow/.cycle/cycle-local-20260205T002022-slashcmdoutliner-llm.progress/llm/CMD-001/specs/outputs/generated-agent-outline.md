# Agent Outline: ccw-coordinator

## Purpose

Implement and/or evolve the ccw-coordinator slash command according to CCW conventions with minimal regressions.

## Execution Model

- Default: incremental, testable changes
- Use ACE-tool to find existing patterns before adding new abstractions
- Follow pseudocode guidance in command doc - Claude executes intelligently based on context

## State & Artifacts

- Session folder (if used): `.workflow/.ccw-coordinator/{session_id}/`
- Required outputs:
  - Slash MD (command doc): `.claude/commands/ccw-coordinator.md` (already exists)
  - Main orchestration module: TBD (e.g., `ccw/src/commands/ccw-coordinator.ts`)
  - State management utilities: TBD
  - Hook callback integration: Extend existing `ccw/src/commands/hook.ts`
  - Validation notes / regression snapshots

## Tooling

- Allowed tools: Task(*), AskUserQuestion(*), Read(*), Write(*), Bash(*), Glob(*), Grep(*)
- Non-negotiables:
  - no unrelated changes
  - verify non-regression against completed corpus
  - respect minimum execution units (atomic command groups)
  - use CommandRegistry for all command discovery
  - follow serial blocking execution model (no TaskOutput polling)

## Validation Strategy

- P0 gates: frontmatter + allowed-tools + core sections + artifact references
- Regression: compare against snapshots for already-completed commands
- Functional validation:
  - Test task type detection patterns
  - Verify command chain recommendations for each task type
  - Validate state.json structure and persistence
  - Test hook callback integration
  - Verify smart parameter assembly for different command types
  - Test error handling paths (retry/skip/abort)
  - Validate minimum execution unit enforcement

## Implementation Phases

1. **Phase 1: Core Analysis Logic**
   - Implement `analyzeRequirements()` with task type detection
   - Implement complexity assessment
   - Add unit tests for pattern matching

2. **Phase 2: Command Discovery & Recommendation**
   - Integrate CommandRegistry
   - Implement port-based command chain selection
   - Implement minimum execution unit validation
   - Add recommendation display logic

3. **Phase 3: Execution Engine**
   - Implement `executeCommandChain()` with state tracking
   - Implement `formatCommand()` for smart parameter assembly
   - Add state.json persistence
   - Integrate with existing hook infrastructure

4. **Phase 4: User Interaction**
   - Implement confirmation flow with AskUserQuestion
   - Add chain adjustment capabilities
   - Implement error handling with user choices

5. **Phase 5: Testing & Validation**
   - Add integration tests for full workflow
   - Test all task type routing scenarios
   - Validate state persistence and resumption
   - Test hook callback handling
