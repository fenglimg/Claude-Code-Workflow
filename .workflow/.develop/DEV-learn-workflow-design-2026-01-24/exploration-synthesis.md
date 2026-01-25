# Learn-Profile Iteration - Multi-CLI Exploration Synthesis

**Session ID**: DEV-learn-workflow-design-2026-01-24
**Exploration Date**: 2026-01-25
**Exploration Count**: 4 (Gemini x3, Qwen x1)

---

## Executive Summary

Four deep CLI explorations were conducted to analyze the learn-profile create/update iteration requirements. The explorations covered:
1. Dynamic tech stack detection architecture
2. Profile integration into learn-plan Phase1
3. Profile customization enhancement
4. Skill assessment algorithm optimization

All explorations completed successfully with comprehensive architectural designs and implementation recommendations.

---

## Exploration Results

### 1. Dynamic Tech Stack Detection (Gemini - analysis-review-architecture)

**Session ID**: 1769271237077-gemini
**Focus**: Design approach for inferring tech stack from user's role background

#### Key Findings

**Current Problem**:
- Static, hardcoded assessment for single technology (TypeScript)
- No dynamic inference based on role description
- Limited scalability for diverse tech stacks

**Proposed Architecture**:
```
Pipeline: Inference → Confirmation → Assessment Seeding

1. Input Trigger: goal_type: "role" selected
2. Collect Free-Text: Role title + background description
3. Inference Stage: TechStackInference service
   - Parse text using keyword dictionary
   - Map keywords to canonical topic_ids
   - Return inferred_topic_ids[]
4. Confirmation Stage: User validation
   - Multi-select AskUserQuestion
   - User deselects incorrect, adds missing
   - Return confirmed_topic_ids[]
5. Assessment Seeding: Generate known_topics
   - Low default proficiency (0.3)
   - Low confidence (0.5)
   - Evidence: "Inferred from role description"
```

**Integration Point**: `.claude/commands/learn/profile.md:121` (after goal_type selection)

**Key Components**:
- `KeywordDictionary.json`: Externalized, scalable tech keyword mapping
- `TechStackInference` service: Keyword matching algorithm
- User confirmation flow: Multi-select validation
- Profile seeding: Generate initial known_topics array

**Scalability Strategy**:
- Externalized keyword dictionary (no code changes for new tech)
- Separation of concerns (inference, confirmation, generation)
- Optional ACE integration for skill suggestion

**Prioritized Recommendations**:
1. [P0] Implement core inference pipeline
2. [P1] Implement fallback mechanism (empty inference → manual entry)
3. [P2] Evolve evidence-based assessment to handle dynamic topics
4. [P3] Integrate MCP/ACE for skill suggestion

---

### 2. Profile Integration in learn-plan (Gemini - planning-plan-architecture-design)

**Session ID**: 1769270947257-gemini
**Focus**: Seamless profile create/update flow in learn-plan Phase1

#### Key Findings

**Current Problem**:
- learn-plan Phase1 checks profile existence
- If exists, loads directly without update
- No validation against new learning goal
- Profile may be stale or irrelevant

**Proposed Integration Flow**:
```
/learn:plan "$ARGUMENTS" 启动
   │
   ├─► 读取 state.json, 获取 active_profile_id
   │
   └─◊─── profileId 是否存在?
         │
         ├─(不存在)───► 调用 /learn:profile create ───► 重新读取 state.json ──┐
         │                                                                     │
         └─(存在)───► 加载 profile.json                                        │
                   │                                                           │
                   ├─► AskUserQuestion("是否根据新目标更新档案?") // 附带上次更新时间信息
                   │                                                           │
                   └─◊─── 用户是否同意更新?                                      │
                         │                                                     │
                         ├─(是)───► 调用 /learn:profile update --goal "$ARGUMENTS" │
                         │                                                     │
                         └─(否)───► 直接继续                                      │
                                   │                                           │
┌──────────────────────────────────┴───────────────────────────────────────────┘
│
├─► [统一出口] 重新加载 profile.json // 确保数据最新
│   [数据: profile]
│
├─► 进入 Phase 2: Knowledge Gap Analysis
```

**Key Modifications**:

**File: `.claude/commands/learn/plan.md`**
- Location: Phase 1: Profile Discovery
- Modification:
  1. Keep `if (!profileId)` block (create flow)
  2. Add user confirmation after profile load
  3. Ask: "Profile last updated [date]. Update for goal '[goal]'?"
  4. If yes: Execute `/learn:profile update --goal "${learning_goal}"`
  5. Reload profile.json after any operation

**File: `.claude/commands/learn/profile.md`**
- Location: Phase 3: Profile Update Flow
- Modification:
  1. Add `--goal "<learning goal>"` flag
  2. Check flag at update flow start
  3. If flag exists: Bypass interactive prompts
  4. Extract keywords from goal string
  5. Run targeted Evidence-Based Assessment
  6. Update known_topics for relevant skills only
  7. Save and exit

**Error Handling**:
- Wrap SlashCommand calls in try...catch
- On failure: Terminate learn-plan with clear error
- Prevent plan generation with stale/invalid profile

**UX Considerations**:
- Show last update timestamp in confirmation
- Non-interactive mode for --goal parameter
- Minimal output for script invocation

---

### 3. Profile Customization Enhancement (Qwen - analysis-analyze-code-patterns)

**Session ID**: 1769270949457-qwen
**Focus**: Rich profile schema supporting diverse learning scenarios

#### Key Findings

**Current Gaps**:
1. No time availability tracking
2. Limited learning preferences (missing depth vs breadth, theory vs practice)
3. No career context (current/target roles, timeline)
4. No previous learning history
5. No constraint factors (budget, resource access)

**Extended Schema Design**:

**New Fields**:
1. `time_availability`:
   - `hours_per_week`: integer (0-168)
   - `schedule.preferred_time_of_day`: enum (morning/afternoon/evening/night)
   - `schedule.preferred_days`: array of day strings
   - `schedule.availability_consistency`: enum (consistent/variable/irregular)

2. `learning_preferences` (extended):
   - `focus`: enum (depth/breadth/balanced)
   - `approach`: enum (theory-first/practice-first/mixed)

3. `career_context`:
   - `current_role`: string
   - `target_role`: string
   - `industry`: string
   - `transition_timeline_months`: integer (≥0)
   - `career_change_intent`: enum (none/exploring/planning/active)

4. `learning_history`:
   - `completed_courses`: array of course objects
     - `course_name`, `provider`, `completion_date`, `certification_earned`
   - `completed_projects`: array of project objects
     - `project_name`, `description`, `technologies_used`, `completion_date`, `source_url`

5. `constraints`:
   - `monthly_learning_budget_usd`: number (≥0)
   - `resource_access`:
     - `has_paid_resources_access`: boolean
     - `has_internet_restriction`: boolean
     - `preferred_free_resources_only`: boolean

**Backward Compatibility Strategy**:
1. All new fields are optional (no breaking changes)
2. Default values when missing:
   - `time_availability`: 5 hours/week, flexible schedule
   - `learning_preferences.focus/approach`: "balanced"/"mixed"
   - `career_context`: empty strings, 0 timeline
   - `learning_history`: empty arrays
   - `constraints`: 0 budget, conservative access
3. Lazy migration: Update on load, save on next update
4. Schema versioning: Add version property in metadata

**Field Classification**:
- **Required**: profile_id, experience_level, known_topics (unchanged)
- **Optional**: All new extensions

**Migration Path**:
1. Lazy migration (no proactive conversion)
2. Non-destructive (append optional fields)
3. User-focused updates (prompt for new fields during interaction)
4. Gradual integration (progressive adoption)

---

### 4. Skill Assessment Algorithm Optimization (Gemini - analysis-diagnose-bug-root-cause)

**Session ID**: 1769270944491-gemini
**Focus**: Evidence-based assessment preventing level inflation

#### Key Findings

**Root Cause Analysis**:
- Current assessment over-relies on user self-evaluation
- Conceptual checks: Only single-layer multiple choice (weak verification)
- Micro-challenges: User self-reports completion (no code verification)
- Result: "水分" (inflated skill levels)

**Proposed Multi-Factor Verification Algorithm**:

```
Algorithm Flowchart:
START
│
├─► 1. [INPUT] Initial Self-Assessment (beginner/intermediate)
│    └─ Used for initial difficulty calibration. Low weight in final score.
│
├─► 2. [VERIFICATION] Conceptual Understanding Checks
│    ├─ Use open-ended questions via AskUserQuestion
│    ├─ Follow-up AI Agent evaluates text response
│    └─ SCORE_CONCEPT = (Quality of explanation)
│
├─► 3. [VERIFICATION] Practical Challenge (via MCP)
│    ├─ a. Select Challenge: Difficulty based on Self-Assessment + Conceptual Score
│    ├─ b. Present Challenge: Description, function signature, examples
│    ├─ c. Await Code Submission: User submits code
│    ├─ d. MCP Validation:
│    │   └─ Task('mcp.validate', { code, challenge_id })
│    │      // Returns: { success, tests_passed, tests_total, performance }
│    └─ SCORE_CHALLENGE = (tests_passed / tests_total) * performance_factor
│
├─► 4. [CONTEXT] Cross-Validation with Learning Goal
│    └─ Get user's goal_type (project/theoretical)
│
└─► 5. [CALCULATION] Final Proficiency & Confidence Score
     ├─ Define weights based on goal:
     │  IF goal_type == 'project': w_concept=0.3, w_challenge=0.7
     │  ELSE IF goal_type == 'theoretical': w_concept=0.7, w_challenge=0.3
     │
     ├─ Proficiency = (SCORE_CONCEPT * w_concept) + (SCORE_CHALLENGE * w_challenge)
     │   // Note: Initial self-assessment NOT in final score
     │
     ├─ Confidence = Based on evidence strength
     │  IF (MCP validation passed): confidence = 0.9
     │  ELSE IF (Conceptual check passed but MCP failed): confidence = 0.6
     │  ELSE: confidence = 0.4
     │
     └─ Evidence Trail (structured):
        evidence: [
          { type: 'conceptual_check', question: '...', response: '...', score: 0.8 },
          { type: 'micro_challenge', challenge_id: '...', result: { passed: 10, total: 10 }, score: 1.0 }
        ]
```

**Anti-Inflation Mechanisms**:
1. **Forced Evidence**: Programming challenges require MCP code submission + test validation
2. **Reduced Subjective Weight**: Final score from objective evidence only (self-eval for calibration)
3. **Confidence Decay**: Skill proficiency confidence decreases over time (encourage re-assessment)
4. **Weighted Scoring**: Dynamic weights based on learning goal type

**MCP Integration**:
- `Task('mcp.validate', { code: user_code, challenge_id: 'js-filter-even' })`
- Returns: `{ success: bool, tests_passed: int, tests_total: int, performance: float }`

**Implementation Considerations**:
- **Complexity**: MCP platform is the biggest challenge
- **Initial approach**: Simulated MCP with code input + safe sandbox (vm2 for Node.js)
- **UX**: Longer assessment flow (provide progress indicators, allow skip with warning)
- **Challenge library**: Build coverage of different skills and difficulties

**Verification Scenarios**:
1. High estimator: Self-eval "advanced" but weak fundamentals → corrected to lower level
2. Low estimator: Self-eval "beginner" but strong performance → elevated to higher level
3. Goal difference: Project-focused users weighted more on practical challenges

---

## Synthesis & Recommendations

### Cross-Cutting Themes

1. **Evidence-Based Validation**: All explorations emphasize objective, verifiable evidence over subjective self-assessment
2. **User-in-the-Loop**: Confirmation steps ensure accuracy while maintaining user control
3. **Scalability via Externalization**: Keyword dictionaries, challenge libraries, schema extensions
4. **Backward Compatibility**: All changes are additive, non-breaking
5. **MCP Integration**: External validation platform for code challenges

### Integration Dependencies

```
Dynamic Tech Stack Detection
   ↓ (seeds known_topics)
Skill Assessment Algorithm
   ↓ (generates profile)
Profile Customization Enhancement
   ↓ (enriched profile)
Profile Integration in learn-plan
   ↓ (validates/updates profile)
Learn Plan Generation
```

### Implementation Priority

**Phase 1: Foundation (P0)**
1. Implement dynamic tech stack detection
   - Create KeywordDictionary.json
   - Build TechStackInference service
   - Add user confirmation flow
2. Enhance profile schema
   - Add optional fields (time_availability, career_context, etc.)
   - Implement lazy migration
   - Update schema validation

**Phase 2: Assessment (P1)**
1. Optimize skill assessment algorithm
   - Implement multi-factor verification
   - Build simulated MCP for code validation
   - Add weighted scoring model
2. Integrate profile update in learn-plan
   - Add --goal parameter to profile update
   - Implement Phase1 confirmation flow
   - Add error handling

**Phase 3: Enhancement (P2)**
1. Evolve evidence-based assessment for dynamic topics
2. Build challenge library
3. Integrate ACE for skill suggestion
4. Add confidence decay mechanism

### Risk Mitigation

**High Risk**:
- MCP implementation complexity → Start with simulated version
- User experience degradation (longer flows) → Add progress indicators, skip options
- Challenge library maintenance → Start small, expand iteratively

**Medium Risk**:
- Keyword dictionary accuracy → Regular updates, user feedback loop
- Profile migration issues → Thorough testing, rollback plan
- Assessment algorithm calibration → A/B testing, user feedback

**Low Risk**:
- Schema extension → Backward compatible by design
- Integration with learn-plan → Well-defined interfaces

---

## Next Steps

1. Create detailed implementation plan for Phase 1
2. Design KeywordDictionary.json structure
3. Prototype TechStackInference service
4. Design MCP validation interface
5. Update learn-profile.schema.json
6. Modify learn-profile.md and learn-plan.md
7. Write integration tests
8. Update session documentation

---

**Exploration Complete**: 2026-01-25
**Total CLI Sessions**: 4
**Total Analysis Time**: ~5 minutes
**Output Quality**: High (comprehensive architectural designs with implementation details)
