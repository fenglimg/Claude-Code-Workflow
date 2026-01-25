# Learn Workflow Test Plan

**Session ID**: TEST-learn-workflow-2026-01-24
**Started**: 2026-01-24
**Status**: In Progress

---

## Test Scope

### Commands to Test
1. `/learn:profile create` - Create new user profile
2. `/learn:profile show` - Display current profile
3. `/learn:plan` - Generate learning plan
4. `/learn:profile update` - Update existing profile

### Integration Points to Validate
- Schema validation (learn-profile, learn-plan, learn-state)
- State management (state.json)
- Session creation (manifest.json, plan.json, progress.json)
- MCP tool integration references

---

## Test Environment Setup

### Prerequisites
```bash
# Verify directory structure
.workflow/learn/profiles/     # For user profiles
.workflow/learn/sessions/     # For learning sessions
.claude/commands/learn/       # Command definitions
.claude/agents/               # Agent specifications
.claude/workflows/cli-templates/schemas/  # Schema files
```

### Initial State
- No active profile (state.json not created or empty)
- No existing sessions

---

## Test Cases

### TC-001: Profile Creation (/learn:profile create)

**Objective**: Verify profile creation with evidence-based assessment

**Steps**:
1. Execute `/learn:profile create`
2. Answer assessment questions
3. Verify profile file creation
4. Verify state.json update

**Expected Results**:
- [ ] Prompted for basic info (goal type, experience, preferences)
- [ ] Evidence-based assessment triggered (unless --no-assessment)
- [ ] Profile file created: `.workflow/learn/profiles/profile-{timestamp}.json`
- [ ] state.json updated with `active_profile_id`
- [ ] Profile follows learn-profile.schema.json
- [ ] Known topics populated with proficiency scores
- [ ] Evidence array contains assessment results

**Actual Results**:
```
[PENDING]
```

**Status**: ⏳ Pending

---

### TC-002: Profile Display (/learn:profile show)

**Objective**: Verify profile information display

**Steps**:
1. Execute `/learn:profile show`
2. Verify output format

**Expected Results**:
- [ ] Displays current profile ID
- [ ] Shows experience level
- [ ] Lists known topics with proficiency
- [ ] Shows learning preferences
- [ ] Displays feedback journal (if any)

**Actual Results**:
```
[PENDING]
```

**Status**: ⏳ Pending

---

### TC-003: Learning Plan Generation (/learn:plan)

**Objective**: Verify plan generation with DAG structure

**Steps**:
1. Execute `/learn:plan "Test Learning Goal"`
2. Choose agent or template mode
3. Verify session creation
4. Validate plan structure

**Expected Results**:
- [ ] Prompts for profile if none exists
- [ ] Generates knowledge points (5-15)
- [ ] Creates dependency graph (DAG)
- [ ] Each KP has ≥1 Gold-tier resource
- [ ] Session folder created: `.workflow/learn/sessions/LS-{date}-{nnn}/`
- [ ] Files created: manifest.json, plan.json, progress.json
- [ ] Plan follows learn-plan.schema.json
- [ ] No circular dependencies
- [ ] Validation gate passes (4 layers)

**Actual Results**:
```
[PENDING]
```

**Status**: ⏳ Pending

---

### TC-004: Profile Update (/learn:profile update)

**Objective**: Verify profile update functionality

**Steps**:
1. Execute `/learn:profile update`
2. Select update type
3. Verify changes saved

**Expected Results**:
- [ ] Shows update options (skills, preferences, topics, history)
- [ ] Updates profile file
- [ ] Maintains schema compliance
- [ ] Timestamp updated in _metadata

**Actual Results**:
```
[PENDING]
```

**Status**: ⏳ Pending

---

## Schema Validation Tests

### SV-001: learn-profile.schema.json

**Validation Checks**:
- [ ] Required fields: profile_id, experience_level, known_topics
- [ ] Enum validation: experience_level (beginner|intermediate|advanced|expert)
- [ ] Range validation: proficiency (0.0-1.0)
- [ ] Array constraints: known_topics items structure

**Status**: ⏳ Pending

---

### SV-002: learn-plan.schema.json

**Validation Checks**:
- [ ] Required fields: session_id, learning_goal, knowledge_points, dependency_graph
- [ ] Pattern validation: KP-ID format (^KP-\d+$)
- [ ] Array constraints: maxItems=15 for knowledge_points
- [ ] Enum validation: quality (gold|silver|bronze)
- [ ] Min items: resources array ≥1

**Status**: ⏳ Pending

---

### SV-003: learn-state.schema.json

**Validation Checks**:
- [ ] Required fields: active_profile_id, active_session_id, version
- [ ] Pattern validation: version (\d+.\d+.\d+)
- [ ] Null allowed: active_profile_id, active_session_id

**Status**: ⏳ Pending

---

## Integration Tests

### IT-001: MCP Tool References

**Objective**: Verify MCP tool integration is documented

**Checks**:
- [ ] mcp__ace-tool__search_context referenced in plan.md
- [ ] mcp__exa__get_code_context_exa referenced in plan.md
- [ ] mcp__ccw-tools__smart_search referenced in plan.md
- [ ] Tool order documented (ACE → Exa → smart_search)

**Status**: ⏳ Pending

---

### IT-002: Agent Integration

**Objective**: Verify learn-planning-agent is properly specified

**Checks**:
- [ ] Agent file exists: `.claude/agents/learn-planning-agent.md`
- [ ] Agent called from plan.md with correct parameters
- [ ] Input context structure matches agent expectations
- [ ] Output format matches plan.json schema

**Status**: ⏳ Pending

---

## P0 Fixes Validation

### P0-001: AskUserQuestion Key-Based Pattern

**Objective**: Verify key-based access pattern is used

**Checks**:
- [ ] No `Object.values(answer)[0]` usage
- [ ] All questions have explicit `key` field
- [ ] Access pattern: `answer[KEY_NAME]`

**Files to Check**:
- [ ] learn/profile.md
- [ ] learn/plan.md

**Status**: ⏳ Pending

---

### P0-002: Schema-First Approach

**Objective**: Verify schema validation is documented

**Checks**:
- [ ] Schema files deployed to correct location
- [ ] Schema validation mentioned in command docs
- [ ] 4-layer validation gate documented in plan.md

**Status**: ⏳ Pending

---

### P0-003: NO Time Estimates

**Objective**: Verify time estimates are not included

**Checks**:
- [ ] No time estimates in plan generation
- [ ] Use `estimated_effort` (easy|medium|hard) instead
- [ ] Documentation mentions NO time estimates constraint

**Status**: ⏳ Pending

---

## Test Execution Log

### 2026-01-24 23:30 - Test Environment Setup

**Actions**:
- Verified directory structure exists
- Confirmed schema files deployed
- Confirmed command files created

**Status**: ✅ Environment ready

---

## Summary

| Category | Total | Passed | Failed | Pending |
|----------|-------|--------|--------|---------|
| Test Cases | 4 | 0 | 0 | 4 |
| Schema Validation | 3 | 0 | 0 | 3 |
| Integration Tests | 2 | 0 | 0 | 2 |
| P0 Fixes | 3 | 0 | 0 | 3 |
| **TOTAL** | **12** | **0** | **0** | **12** |

---

## Next Steps

1. Execute TC-001: Profile creation test
2. Execute TC-003: Plan generation test
3. Validate schema compliance
4. Verify P0 fixes
5. Document findings

---

**Status**: Test plan created, ready for execution
