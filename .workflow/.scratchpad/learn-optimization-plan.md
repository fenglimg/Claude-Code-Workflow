# Learn Workflow Optimization Plan

## Executive Summary

Based on 5 rounds of multi-CLI collaborative analysis (Gemini exploration + Codex review), this plan addresses critical trust gaps, architectural debt, and intelligence enhancement opportunities in the learn:profile and learn:plan commands.

## Approach

**Trust-First Evolution Strategy**: Prioritize evidence trustworthiness and quality assurance before architectural refactoring and intelligence enhancements. The critical path ensures reliable data foundation before building advanced features.

**Key Principles**:
- Maintain Isolated Strategy (zero core code modifications)
- Ensure backward compatibility
- Incremental implementation with validation checkpoints
- Evidence-based confidence semantics

## Tasks

### Epic 1: Enhance Evidence Trustworthiness (P0)

#### T1: Implement Real MCP Verification Framework
**Scope**: `.claude/commands/learn/profile.md` (lines 405-465)
**Action**: Implement
**Description**: Replace simulated micro-challenge validation with real code execution and test verification.

**Implementation**:
1. Create `.claude/commands/learn/_internal/mcp-runner.js` - isolated verification script
2. Modify challenge flow in profile.md to capture user code submission
3. Use Bash tool to invoke mcp-runner.js with user code and test cases
4. Parse structured JSON result (tests_passed, tests_total, score)
5. Calculate challengeScore based on real test results
6. Update evidence array with type: 'real_mcp' and verification metadata

**Acceptance**:
- User code is captured and stored in evidence array
- Tests are executed in isolated environment (no file/network access)
- Proficiency scores reflect actual test pass rates
- Confidence values distinguish verified vs self-reported evidence

**Security**: Use Node.js child process with restricted permissions, no eval(), pure function execution only

---

#### T2: Strengthen Evidence Data Structure
**Scope**: `.workflow/learn/profiles/{profile-id}.json`, `schemas/learn-profile.schema.json`
**Action**: Update
**Description**: Enhance evidence field structure to support verification provenance and confidence calibration.

**Implementation**:
1. Update profile schema to define evidence object structure
2. Add evidence_type field: 'self-report' | 'conceptual' | 'tool-verified'
3. Add verification_metadata: { method, timestamp, test_results }
4. Modify confidence calculation rules based on evidence_type
5. Implement confidence caps: self-report ≤ 0.5, conceptual ≤ 0.7, verified ≤ 0.95
6. Update profile.md to populate new evidence structure

**Acceptance**:
- Evidence objects contain type and verification metadata
- Confidence scores respect evidence-type caps
- Profile schema validates evidence structure
- Existing profiles remain compatible (graceful degradation)

---

#### T3: Fix Schema Path Inconsistencies
**Scope**: `.claude/commands/learn/plan.md`, `.claude/agents/learn-planning-agent.md`
**Action**: Fix
**Description**: Unify schema path references to single canonical location.

**Implementation**:
1. Audit all schema references in learn commands and agents
2. Establish canonical schema location: `.claude/workflows/cli-templates/schemas/`
3. Update all references to use consistent paths
4. Add schema path validation in plan generation
5. Document schema location in README.md

**Acceptance**:
- All schema references point to same canonical location
- Schema validation works consistently across commands
- No broken schema path errors in plan generation

---

### Epic 2: Quality Assurance Layer (P0)

#### T4: Implement Schema Validation (Layer 0)
**Scope**: `.claude/commands/learn/plan.md` (lines 60-65)
**Action**: Implement
**Description**: Enforce JSON schema validation for all generated plans.

**Implementation**:
1. Load learn-plan.schema.json at plan generation time
2. Validate generated plan.json against schema before writing
3. Block plan creation if schema validation fails
4. Provide clear error messages for validation failures
5. Log validation results to session metadata

**Acceptance**:
- All generated plans conform to schema
- Invalid plans are rejected with clear error messages
- Schema validation is deterministic and testable

---

#### T5: Implement DAG Cycle Detection (Layer 1)
**Scope**: `.claude/commands/learn/plan.md` (lines 66-68)
**Action**: Implement
**Description**: Validate dependency graph is acyclic before plan creation.

**Implementation**:
1. Extract dependency graph from knowledge points
2. Implement DFS-based cycle detection algorithm
3. Block plan creation if cycles detected
4. Generate topological sort for learning sequence
5. Display dependency visualization in plan summary

**Acceptance**:
- Circular dependencies are detected and rejected
- Valid DAGs pass validation
- Topological order is generated for valid plans
- Clear error messages identify cycle locations

---

#### T6: Add Profile-Plan Matching Warnings (Layer 2)
**Scope**: `.claude/commands/learn/plan.md` (lines 69-72)
**Action**: Add
**Description**: Warn when plan doesn't match user profile proficiency levels.

**Implementation**:
1. Compare plan topics with profile known_topics
2. Mark knowledge points as optional if proficiency ≥ 0.8
3. Warn if missing foundational prerequisites
4. Generate profile_fingerprint for mismatch detection
5. Allow user to proceed with warnings (non-blocking)

**Acceptance**:
- High-proficiency topics marked as optional
- Missing prerequisites generate warnings
- Users can proceed despite warnings
- Profile-plan alignment is measurable

---

### Epic 3: State Management Refactoring (P1)

#### T7: Design Internal CLI State Commands
**Scope**: New file `.claude/commands/ccw/learn.md`
**Action**: Create
**Description**: Design CLI specification for learn state management subcommands.

**Implementation**:
1. Define command interface: `ccw learn:write-profile`, `ccw learn:update-state`, `ccw learn:read-state`
2. Specify parameters and return values for each command
3. Design error handling and validation logic
4. Document atomic write strategy for state files
5. Define JSON schema validation requirements

**Acceptance**:
- CLI interface is clearly documented
- All state operations have defined commands
- Error handling is specified
- Atomic write strategy is documented

---

#### T8: Implement State Management CLI
**Scope**: New implementation for `ccw learn` commands
**Action**: Implement
**Description**: Implement internal CLI commands for state management.

**Implementation**:
1. Implement ccw learn:write-profile with schema validation
2. Implement ccw learn:update-state with atomic updates
3. Implement ccw learn:read-state with error handling
4. Add file locking for concurrent access protection
5. Implement backup/recovery for corrupted state files
6. Write unit tests for all state operations

**Acceptance**:
- All CLI commands work correctly
- Schema validation is enforced
- Atomic writes prevent corruption
- Unit tests achieve >80% coverage
- Concurrent access is handled safely

---

#### T9: Refactor Profile Command to Use CLI
**Scope**: `.claude/commands/learn/profile.md` (lines 663-689)
**Action**: Refactor
**Description**: Replace direct file operations with CLI state management calls.

**Implementation**:
1. Replace all Read() calls with Bash('ccw learn:read-state')
2. Replace all Write() calls with Bash('ccw learn:write-profile')
3. Update error handling to process CLI return codes
4. Remove direct file path construction
5. Test backward compatibility with existing profiles

**Acceptance**:
- No direct Read()/Write() calls remain in profile.md
- All state operations use CLI commands
- Existing profiles continue to work
- Error handling is improved

---

### Epic 4: Intelligence Enhancement (P1)

#### T10: Implement Real Agent for Plan Generation
**Scope**: `.claude/commands/learn/plan.md`, `.claude/agents/learn-planning-agent.md`
**Action**: Implement
**Description**: Replace simulated planning with real LLM agent invocation.

**Implementation**:
1. Design learn-planning-agent.md prompt with clear instructions
2. Define agent input context: user goal + profile + available resources
3. Implement agent invocation via `ccw cli -p learn-planning-agent.md`
4. Parse structured JSON output from agent
5. Implement fallback to template-based planning if agent fails
6. Add retry logic for agent failures

**Acceptance**:
- Agent generates valid plan JSON
- Plans are personalized based on user profile
- Fallback mechanism works when agent unavailable
- Agent output conforms to plan schema

---

### Epic 5: Progressive Profiling (P2)

#### T11: Implement JIT Assessment Triggers
**Scope**: `.claude/commands/learn/plan.md` (Phase 1)
**Action**: Add
**Description**: Trigger targeted assessments when plan detects low-confidence topics.

**Implementation**:
1. Analyze plan topics against profile confidence scores
2. Identify topics with confidence < 0.6
3. Trigger mini-assessment flow via AskUserQuestion
4. Update profile with new assessment results
5. Regenerate plan with updated profile
6. Limit to one assessment per topic per session

**Acceptance**:
- Low-confidence topics trigger assessments
- Assessments are targeted and brief
- Profile is updated with new results
- Plan reflects updated profile data
- User experience is not overly intrusive

---

#### T12: Streamline Initial Profile Creation
**Scope**: `.claude/commands/learn/profile.md` (Phase 1)
**Action**: Refactor
**Description**: Reduce initial profile creation friction by deferring detailed assessments.

**Implementation**:
1. Collect only essential fields: experience_level, goal_type, learning_style
2. Defer topic assessments to JIT triggers
3. Create minimal profile in <1 minute
4. Mark all topics as low-confidence initially
5. Rely on JIT assessment during plan generation

**Acceptance**:
- Initial profile creation takes <1 minute
- Essential fields are collected
- Profile is valid and usable
- Detailed assessments happen just-in-time

---

## Metadata

**Source**: 5-round multi-CLI analysis (Gemini + Codex)
**Complexity**: High
**Estimated Time**: 2-4 weeks
**Critical Path**: T1 → T2 → T3 → T4 → T5 → T10

**Analysis Rounds**:
- Round 1: Architecture patterns (isolated strategy, simulated agent, direct state management)
- Round 2: Intelligence enhancement (hybrid agent model, adaptive assessment)
- Round 3: Context gathering (multi-source, progressive profiling)
- Round 4: QA strategies (validation gates, confidence calibration)
- Round 5: Execution framework (task prioritization and dependencies)

**Key Risks**:
- Security: User code execution requires strict sandboxing
- Compatibility: State refactoring must not break existing profiles
- Complexity: Real MCP implementation is technically challenging

**Success Criteria**:
- Evidence-based assessment is truly verifiable
- Profile and plan data is reliable and consistent
- User trust in skill assessments increases
- System is maintainable and extensible
