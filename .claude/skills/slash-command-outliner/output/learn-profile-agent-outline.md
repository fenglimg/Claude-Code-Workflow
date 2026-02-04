# Agent Outline: learn:profile

## Purpose

Implement the `/learn:profile` slash command according to CCW conventions with minimal regressions. This agent is responsible for creating, updating, and viewing user learning profiles with structured interaction flows.

## Execution Model

- Default: incremental, testable changes
- Use ACE-tool to find existing patterns before adding new abstractions
- Follow existing CCW command patterns (especially `/issue:new`, `/workflow:init`, `/workflow:replan`)

## State & Artifacts

### Session Folder

Not applicable - this command operates on global learning state, not workflow sessions.

### Required Outputs

1. **Slash MD (Command Documentation)**
   - Path: `.claude/commands/learn/profile.md`
   - Content: Complete command documentation following CCW template
   - Frontmatter: name, description, argument-hint, allowed-tools, group

2. **Implementation Modules**
   - `ccw/src/commands/learn/profile.ts`: Main command handler with operation routing
   - `ccw/src/commands/learn/profile-create.ts`: Create flow implementation
   - `ccw/src/commands/learn/profile-update.ts`: Update flow implementation
   - `ccw/src/commands/learn/profile-view.ts`: View flow implementation
   - `ccw/src/commands/learn/assessment.ts`: Assessment engine with IRT model
   - `ccw/src/commands/learn/topic-utils.ts`: Topic ID generation, normalization, alias resolution
   - `ccw/src/commands/learn/question-generator.ts`: Gemini CLI integration for question generation
   - `ccw/src/commands/learn/schema-validator.ts`: JSON schema validation for profile.json

3. **Schema Definitions**
   - Path: `ccw/schemas/learn/profile-schema.json`
   - Content: JSON Schema for profile.json validation
   - Includes: preferences, background, topics, metadata structures

4. **CLI Endpoint Integration**
   - Command: `ccw learn write-profile`
   - Purpose: Atomic write with schema validation
   - Input: JSON via stdin or --data flag
   - Output: Validated profile.json with trailing newline

5. **Validation Notes**
   - Path: `.workflow/.scratchpad/learn-profile-validation.md`
   - Content: Test scenarios, edge cases, validation results
   - Include: Non-regression checks against existing commands

## Tooling

### Allowed Tools

Read(*), Write(*), AskUserQuestion(*), Bash(*), TodoWrite(*)

### Tool Usage Patterns

1. **AskUserQuestion**
   - Max 4 questions per call (hard constraint)
   - 2-4 options per question
   - Use multiSelect for topic selection (4x4 matrix)
   - Batch preference questions (2 batches of 4)

2. **Bash**
   - CLI endpoint calls: `ccw learn write-profile`
   - Gemini CLI for question generation: `ccw cli -p "..." --tool gemini --mode analysis`
   - Schema validation: `ccw learn validate-profile`

3. **Read/Write**
   - Read existing profile: `.workflow/learn/profile.json`
   - Write events: `.workflow/learn/events.ndjson` (append-only)
   - Write assessments: `.workflow/learn/assessments/<topic-id>.json`

### Non-negotiables

- No unrelated changes to existing commands
- Verify non-regression against completed corpus (especially `/issue:new`, `/workflow:init`)
- Follow existing error handling patterns
- Use existing CLI endpoint patterns (pipe input, heredoc for complex JSON)

## Implementation Strategy

### Phase 1: Foundation Setup

**Goal**: Establish data structures and schema validation

**Tasks**:
1. Create schema definition (`profile-schema.json`)
   - Reference: `/workflow:init` for project-tech.json schema
   - Include: preferences (8 fields), background, topics, metadata
   - Validation rules: required fields, type constraints, value ranges

2. Implement topic utilities (`topic-utils.ts`)
   - `generateTopicId(label: string): string` - SHA1-based ID generation
   - `normalizeTopicLabel(label: string): string` - Lowercase, trim, hyphenate
   - `buildAliasMapping(topics: Topic[]): Record<string, string>` - Alias resolution
   - Reference: Existing ID generation patterns in codebase

3. Create CLI endpoint (`ccw learn write-profile`)
   - Input: JSON via stdin or --data flag
   - Validation: Against profile-schema.json
   - Output: Validated profile.json with trailing newline
   - Reference: `/issue:new` CLI endpoint pattern (ccw issue create)

### Phase 2: Create Flow Implementation

**Goal**: Implement interactive profile creation with 5-phase flow

**Tasks**:
1. Implement preference collection (`profile-create.ts`)
   - Batch 1: 4 questions (learning_style, resource_preference, time_investment, motivation)
   - Batch 2: 4 questions (interaction_preference, feedback_style, challenge_level, goal_type)
   - Use AskUserQuestion with 2-4 options per question
   - Record PRECONTEXT_CAPTURED event

2. Implement background parsing
   - Prompt for background text (min 50 chars, max 2000 chars)
   - Extract keywords using simple heuristics (stopword filtering, frequency analysis)
   - Infer experience level from keywords
   - Generate <=16 candidate topics with rationale
   - Record BACKGROUND_PARSED event

3. Implement topic coverage validation
   - Display 16 candidates in 4 batches of 4
   - Use AskUserQuestion with multiSelect: true
   - Allow manual additions via "Other" option
   - Deduplicate and normalize selected topics
   - Generate topic IDs and alias mappings
   - Record TOPICS_FINALIZED event

4. Implement data persistence
   - Validate profile against schema
   - Call `ccw learn write-profile` via Bash (pipe input)
   - Append events to events.ndjson
   - Update active_profile_id in state.json
   - Record PROFILE_CREATED event

5. Display completion summary
   - Preferences: 8/8 configured
   - Background: keyword count
   - Topics: count + list
   - Completion: 100%
   - Next steps: assessment, plan generation

### Phase 3: Update Flow Implementation

**Goal**: Implement profile updates with 3 sub-flows (assessment, topic management, preference update)

**Tasks**:
1. Implement micro-assessment flow (`assessment.ts`)
   - Validate topic exists in profile
   - Generate seed pack (4 questions) via Gemini CLI
     - Prompt template: "Generate 4 multiple-choice assessment questions for {topic_label}. Format: JSON array with question, options, correct_answer, difficulty."
     - Parse CLI output to extract questions
   - Execute assessment loop:
     - Present questions via AskUserQuestion (1 at a time)
     - Calculate proficiency using IRT model (simplified 2PL)
     - Update confidence interval (sigma)
     - Stop when: sigma <= 0.1 OR questions >= 4
   - Write assessment result to `assessments/<topic-id>.json`
   - Trigger async full pack generation (20 questions, non-blocking)
   - Record ASSESSMENT_COMPLETED event

2. Implement topic management flow
   - Add new topic: generate ID, add to topics_by_id
   - Update existing topic: modify label, source
   - Regenerate alias mappings
   - Record TOPIC_UPDATED event

3. Implement preference update flow
   - Display current preferences
   - Ask which preferences to update (multiSelect)
   - Re-ask selected preference questions
   - Merge with existing preferences
   - Record PREFERENCES_UPDATED event

4. Implement update persistence
   - Validate updated profile against schema
   - Atomic write via `ccw learn write-profile`
   - Append events to events.ndjson
   - Display update summary

### Phase 4: View Flow Implementation

**Goal**: Implement profile viewing with formatted output

**Tasks**:
1. Implement profile loading (`profile-view.ts`)
   - Read profile.json
   - Validate schema version compatibility
   - Handle missing profile error

2. Implement formatted display
   - Preferences: 8 key-value pairs
   - Background: truncated to 200 chars + keyword list
   - Topics: count + table with ID, label, proficiency, assessment status
   - Assessments: completed count, average proficiency
   - Metadata: version, timestamps, completion %
   - Next steps: assessment suggestions, plan generation

### Phase 5: Question Generation Integration

**Goal**: Integrate Gemini CLI for question generation

**Tasks**:
1. Implement question generator (`question-generator.ts`)
   - Seed pack generation (blocking):
     - Call `ccw cli -p "..." --tool gemini --mode analysis`
     - Prompt template with topic context
     - Parse JSON response to extract questions
     - Validate question format (question, options, correct_answer, difficulty)
     - Write to `question-packs/<topic-id>-seed.json`
   
   - Full pack generation (async):
     - Same CLI call with extended prompt (20 questions)
     - Background execution via `run_in_background: true`
     - Write to `question-packs/<topic-id>-full.json`
     - Non-blocking, best-effort

2. Implement fallback mechanism
   - If Gemini CLI fails, use generic fallback questions
   - Log warning but continue assessment
   - Fallback questions stored in `ccw/data/learn/fallback-questions.json`

### Phase 6: Error Handling & Validation

**Goal**: Implement comprehensive error handling

**Tasks**:
1. Profile existence checks
   - Create mode: Error if profile exists
   - Update/View mode: Error if profile missing
   - Suggest appropriate command for recovery

2. Input validation
   - Background text: min 50 chars, max 2000 chars
   - Topic selection: at least 1 topic required
   - Topic ID format: validate `t_<12-char-hash>` pattern

3. Assessment errors
   - Topic not found: list available topics
   - CLI failure: use fallback questions
   - Incomplete assessment: warn about low confidence

4. Schema validation errors
   - Display validation errors clearly
   - Preserve backup on validation failure
   - Suggest manual fix or rollback

## Validation Strategy

### P0 Gates (Must Pass)

1. **Frontmatter completeness**
   - ✓ name: "profile"
   - ✓ description: present and concise
   - ✓ allowed-tools: Read(*), Write(*), AskUserQuestion(*), Bash(*), TodoWrite(*)
   - ✓ argument-hint: "[create|update|view] [--topic topic-id] [--assess]"
   - ✓ group: "learn"

2. **Allowed-tools correctness**
   - ✓ No tools outside CCW supported set
   - ✓ All required tools included (AskUserQuestion for interaction, Bash for CLI)
   - ✓ No missing tools for described behavior

3. **Core sections present**
   - ✓ Overview (goal, command)
   - ✓ Usage (examples)
   - ✓ Inputs (required, optional)
   - ✓ Outputs/Artifacts (writes, reads)
   - ✓ Execution Process (detailed flow)
   - ✓ Error Handling (comprehensive)
   - ✓ Examples (create, update, view)

4. **No broken artifact references**
   - ✓ All referenced paths documented (profile.json, events.ndjson, assessments/, question-packs/)
   - ✓ CLI endpoints documented (ccw learn write-profile)
   - ✓ Schema files referenced (profile-schema.json)

### Regression Checks

**Compare against existing commands**:

1. **vs /issue:new**
   - ✓ Similar clarity detection pattern (create vs update mode)
   - ✓ Similar AskUserQuestion usage (batched questions, multiSelect)
   - ✓ Similar CLI endpoint pattern (pipe input, JSON output)
   - ✓ Similar event logging (append-only NDJSON)

2. **vs /workflow:init**
   - ✓ Similar initialization pattern (check existing, backup on regenerate)
   - ✓ Similar agent delegation (cli-explore-agent vs question-generator)
   - ✓ Similar schema validation (project-tech.json vs profile.json)
   - ✓ Similar completion summary display

3. **vs /workflow:replan**
   - ✓ Similar update flow (detect mode, load context, apply changes)
   - ✓ Similar backup strategy (preserve previous version)
   - ✓ Similar validation (schema check, consistency verification)

### Test Scenarios

1. **Create Flow**
   - New profile creation with all 8 preferences
   - Background parsing with keyword extraction
   - Topic selection (16 candidates, 4x4 matrix)
   - Manual topic additions
   - Profile persistence and event logging

2. **Update Flow - Assessment**
   - Seed pack generation via Gemini CLI
   - Assessment loop with IRT convergence
   - Proficiency calculation and confidence tracking
   - Assessment result persistence
   - Async full pack generation

3. **Update Flow - Topic Management**
   - Add new topic
   - Update existing topic label
   - Alias mapping regeneration

4. **Update Flow - Preference Update**
   - Select preferences to update
   - Re-ask selected questions
   - Merge with existing preferences

5. **View Flow**
   - Display formatted profile
   - Show assessment status
   - Calculate completion percentage

6. **Error Scenarios**
   - Profile already exists (create mode)
   - Profile not found (update/view mode)
   - Background text too short
   - No topics selected
   - Topic not found (assessment)
   - Gemini CLI failure (fallback)
   - Schema validation failure

### Non-Regression Validation

**Mechanism**:
- Store expected output in `regression/expected/learn-profile.md`
- Generate current output in `regression/current/learn-profile.md`
- Compare and store diff in `regression/diff/learn-profile.diff`
- Block if P0 gates fail or unexpected regressions detected

**Acceptance Criteria**:
- All P0 gates pass
- No regressions in existing commands
- All test scenarios pass
- Error handling comprehensive
- Documentation complete and accurate

## Implementation Checklist

### Pre-Implementation
- [ ] Review existing commands: `/issue:new`, `/workflow:init`, `/workflow:replan`
- [ ] Identify reusable patterns (AskUserQuestion batching, CLI endpoints, event logging)
- [ ] Design schema structure (profile.json, events.ndjson, assessments)
- [ ] Plan CLI endpoint integration (ccw learn write-profile)

### Phase 1: Foundation
- [ ] Create profile-schema.json with validation rules
- [ ] Implement topic-utils.ts (ID generation, normalization, alias mapping)
- [ ] Create CLI endpoint (ccw learn write-profile)
- [ ] Test schema validation with sample data

### Phase 2: Create Flow
- [ ] Implement preference collection (2 batches of 4 questions)
- [ ] Implement background parsing (keyword extraction, topic inference)
- [ ] Implement topic coverage validation (4x4 matrix, multiSelect)
- [ ] Implement data persistence (CLI endpoint, event logging)
- [ ] Test end-to-end create flow

### Phase 3: Update Flow
- [ ] Implement micro-assessment (seed pack, IRT loop, convergence)
- [ ] Implement topic management (add, update, alias regeneration)
- [ ] Implement preference update (select, re-ask, merge)
- [ ] Implement update persistence (atomic write, event logging)
- [ ] Test all update sub-flows

### Phase 4: View Flow
- [ ] Implement profile loading (read, validate)
- [ ] Implement formatted display (preferences, topics, assessments)
- [ ] Test view output formatting

### Phase 5: Question Generation
- [ ] Implement Gemini CLI integration (seed pack, full pack)
- [ ] Implement question parsing and validation
- [ ] Implement fallback mechanism (generic questions)
- [ ] Test question generation and fallback

### Phase 6: Error Handling
- [ ] Implement all error scenarios (existence, validation, CLI failure)
- [ ] Test error messages and recovery suggestions
- [ ] Verify backup preservation on failures

### Validation
- [ ] Run P0 gate checks (frontmatter, tools, sections, references)
- [ ] Run regression checks (vs /issue:new, /workflow:init, /workflow:replan)
- [ ] Run all test scenarios (create, update, view, errors)
- [ ] Generate validation report

### Documentation
- [ ] Write complete command documentation (.claude/commands/learn/profile.md)
- [ ] Document CLI endpoints (ccw learn write-profile)
- [ ] Document schema structure (profile-schema.json)
- [ ] Write validation notes (.workflow/.scratchpad/learn-profile-validation.md)

## Key Design Decisions

### 1. Topic ID Generation
**Decision**: Use SHA1-based IDs (`t_<12-char-hash>`) instead of sequential IDs
**Rationale**: 
- Deterministic: Same label always generates same ID
- Collision-resistant: 12-char hash provides sufficient uniqueness
- Portable: IDs remain stable across profile exports/imports

### 2. Assessment Model
**Decision**: Use simplified IRT (Item Response Theory) 2PL model
**Rationale**:
- Adaptive: Adjusts difficulty based on user responses
- Convergent: Stops when confidence threshold reached (sigma <= 0.1)
- Efficient: Typically converges in 4-6 questions

### 3. Question Generation
**Decision**: Blocking seed pack (4 questions) + async full pack (20 questions)
**Rationale**:
- UX: User can start assessment immediately with seed pack
- Performance: Full pack generation doesn't block user interaction
- Fallback: Generic questions available if CLI fails

### 4. Event Logging
**Decision**: Append-only NDJSON for event history
**Rationale**:
- Immutable: Events never deleted, full audit trail
- Parseable: Easy to process with standard tools (jq, grep)
- Traceable: Can reconstruct profile state at any point in time

### 5. Preference Batching
**Decision**: Split 8 preferences into 2 batches of 4
**Rationale**:
- UX: Avoids overwhelming user with 8 questions at once
- Constraint: AskUserQuestion max 4 questions per call
- Logical grouping: Batch 1 (learning approach), Batch 2 (interaction style)

## References

### Existing Commands (Patterns to Follow)
- `/issue:new`: Clarity detection, AskUserQuestion batching, CLI endpoint pattern
- `/workflow:init`: Initialization flow, schema validation, agent delegation
- `/workflow:replan`: Update flow, backup strategy, validation

### CCW Conventions
- Frontmatter format: name, description, argument-hint, allowed-tools, group
- CLI endpoint pattern: pipe input, JSON output, trailing newline
- Event logging: append-only NDJSON, ISO 8601 timestamps
- Error handling: clear messages, recovery suggestions, backup preservation

### External Dependencies
- Gemini CLI: Question generation via `ccw cli -p "..." --tool gemini --mode analysis`
- SHA1: Topic ID generation (Node.js crypto module)
- JSON Schema: Profile validation (ajv library)
