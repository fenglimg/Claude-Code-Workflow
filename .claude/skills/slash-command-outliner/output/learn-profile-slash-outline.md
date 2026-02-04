---
name: profile
description: Manage user learning profile with structured interaction for background, preferences, and skill assessment
argument-hint: "[create|update|view] [--topic topic-id] [--assess]"
allowed-tools: Read(*), Write(*), AskUserQuestion(*), Bash(*), TodoWrite(*)
group: learn
---

# Learn Profile Command (/learn:profile)

## Overview

- Goal: 管理用户学习画像，通过结构化交互收集背景、偏好，并建立初步技能评估闭环，为后续学习计划生成提供基础数据
- Command: `/learn:profile`

## Usage

```bash
# Create new profile (interactive)
/learn:profile create

# Update existing profile
/learn:profile update

# Update with topic assessment
/learn:profile update --topic t_abc123def456 --assess

# View current profile
/learn:profile view
```

## Inputs

- Required inputs:
  - `operation`: create | update | view (default: create if no profile exists)

- Optional inputs:
  - `--topic <topic-id>`: Specific topic for assessment (update mode only)
  - `--assess`: Trigger micro-assessment for specified topic (requires --topic)

## Outputs / Artifacts

- Writes:
  - `.workflow/learn/profile.json`: User profile snapshot with preferences, background, topics
  - `.workflow/learn/events.ndjson`: Append-only event log (PRECONTEXT_CAPTURED, TOPIC_ADDED, ASSESSMENT_COMPLETED)
  - `.workflow/learn/assessments/<topic-id>.json`: Assessment results per topic
  - `.workflow/learn/question-packs/<topic-id>-seed.json`: Seed question pack (4 questions, blocking)
  - `.workflow/learn/question-packs/<topic-id>-full.json`: Full question pack (async generation)

- Reads:
  - `.workflow/learn/profile.json`: Existing profile (for update/view operations)
  - `.workflow/learn/events.ndjson`: Event history for traceability

## Implementation Pointers

- Command doc: `.claude/commands/learn/profile.md`
- Likely code locations:
  - `ccw/src/commands/learn/profile.ts`: Main command handler
  - `ccw/src/commands/learn/profile-create.ts`: Create flow logic
  - `ccw/src/commands/learn/profile-update.ts`: Update flow logic
  - `ccw/src/commands/learn/assessment.ts`: Assessment engine
  - `ccw/src/commands/learn/topic-utils.ts`: Topic ID generation, alias resolution
  - `ccw/src/commands/learn/question-generator.ts`: Gemini-based question generation

## Execution Process

### Create Flow (New Profile)

```
Phase 1: Preference Collection (Pre-context vNext)
   ├─ Batch 1: 4 questions (learning style, resource preference, time investment, motivation)
   │   └─ AskUserQuestion (max 4 questions, 2-4 options each)
   ├─ Batch 2: 4 questions (interaction preference, feedback style, challenge level, goal type)
   │   └─ AskUserQuestion (max 4 questions, 2-4 options each)
   └─ Record event: PRECONTEXT_CAPTURED

Phase 2: Background Parsing
   ├─ Prompt user for background text (mandatory)
   │   └─ AskUserQuestion with text input
   ├─ Heuristic analysis: Extract keywords, infer related topics
   │   └─ Generate <=16 candidate topics with rationale
   └─ Record event: BACKGROUND_PARSED

Phase 3: Topic Coverage Validation (4x4 Matrix)
   ├─ Display 16 candidate topics in 4 batches of 4
   │   └─ AskUserQuestion (multiSelect: true, max 4 options per batch)
   ├─ Allow manual additions via "Other" option
   ├─ Finalize topic list (deduplicate, normalize)
   │   └─ Generate topic_id = "t_" + sha1(normalized_label).slice(0,12)
   │   └─ Build alias_to_canonical mapping
   └─ Record event: TOPICS_FINALIZED

Phase 4: Data Persistence
   ├─ Validate against schema (profile-schema.json)
   ├─ Write profile.json
   │   └─ ccw learn write-profile --data '{"preferences":{...}, "topics":{...}}'
   ├─ Append events to events.ndjson
   └─ Update active_profile_id in global state

Phase 5: Completion Summary
   └─ Display profile summary (preferences, topics count, completion %)
```

### Update Flow (Existing Profile)

```
Phase 1: Load Existing Profile
   ├─ Read profile.json
   └─ Validate schema version compatibility

Phase 2: Update Type Detection
   ├─ If --topic + --assess: Micro-Assessment Flow
   ├─ If --topic only: Topic Management Flow
   └─ Otherwise: Preference Update Flow

Phase 3A: Micro-Assessment Flow (--topic + --assess)
   ├─ Validate topic exists in profile
   ├─ Generate Seed Pack (blocking)
   │   ├─ Call Gemini CLI for 4 core questions
   │   │   └─ ccw cli -p "Generate 4 assessment questions for topic: {topic_label}" --tool gemini --mode analysis
   │   ├─ Parse questions from CLI output
   │   └─ Write question-packs/{topic-id}-seed.json
   ├─ Execute Assessment Loop
   │   ├─ Present questions via AskUserQuestion (1 at a time)
   │   ├─ Calculate proficiency score (0..1) using IRT model
   │   ├─ Update confidence interval (sigma)
   │   └─ Stop when: sigma <= 0.1 OR question count >= 4
   ├─ Write assessment result
   │   └─ assessments/{topic-id}.json: {proficiency, confidence, timestamp}
   ├─ Trigger Full Pack Generation (async, non-blocking)
   │   └─ Background: ccw cli -p "Generate 20 comprehensive questions for {topic}" --tool gemini --mode analysis
   └─ Record event: ASSESSMENT_COMPLETED

Phase 3B: Topic Management Flow (--topic only)
   ├─ Add new topic or update existing
   ├─ Regenerate alias mappings
   └─ Record event: TOPIC_UPDATED

Phase 3C: Preference Update Flow (no flags)
   ├─ Display current preferences
   ├─ Ask which preferences to update (multiSelect)
   ├─ Re-ask selected preference questions
   └─ Record event: PREFERENCES_UPDATED

Phase 4: Data Persistence
   ├─ Validate updated profile against schema
   ├─ Write profile.json (overwrite with new version)
   ├─ Append events to events.ndjson
   └─ Display update summary
```

### View Flow

```
Phase 1: Load Profile
   ├─ Read profile.json
   └─ Validate exists

Phase 2: Display Summary
   ├─ Preferences (8 key-value pairs)
   ├─ Background (truncated to 200 chars)
   ├─ Topics (count + list with IDs)
   ├─ Assessments (completed count, avg proficiency)
   └─ Metadata (version, created_at, completion_percent)
```

## Data Model (Topic V0)

### Profile Schema

```typescript
interface LearningProfile {
  version: string; // "1.0.0"
  created_at: string; // ISO 8601
  updated_at: string;
  completion_percent: number; // 0-100

  preferences: {
    learning_style: string; // "visual" | "hands-on" | "reading" | "discussion"
    resource_preference: string; // "video" | "docs" | "interactive" | "mixed"
    time_investment: string; // "daily-30min" | "weekly-2hr" | "intensive" | "flexible"
    motivation: string; // "career" | "hobby" | "project" | "curiosity"
    interaction_preference: string; // "guided" | "self-paced" | "challenge-based"
    feedback_style: string; // "immediate" | "summary" | "milestone"
    challenge_level: string; // "beginner" | "intermediate" | "advanced" | "mixed"
    goal_type: string; // "skill-mastery" | "project-completion" | "exploration"
  };

  background: {
    raw_text: string; // User-provided background (max 2000 chars)
    parsed_keywords: string[]; // Extracted keywords
    inferred_experience_level: string; // "beginner" | "intermediate" | "advanced"
  };

  custom_fields: {
    topic_v0: {
      topics_by_id: {
        [topic_id: string]: {
          label: string; // Normalized topic name
          added_at: string; // ISO 8601
          source: "background" | "manual" | "recommendation";
          proficiency?: number; // 0..1 (from assessment)
          confidence?: number; // 0..1 (sigma from IRT)
          last_assessed?: string; // ISO 8601
        };
      };
      alias_to_canonical: {
        [alias: string]: string; // Alias -> canonical topic_id
      };
    };
  };
}
```

### Event Schema (NDJSON)

```typescript
interface ProfileEvent {
  event_type:
    | "PRECONTEXT_CAPTURED"
    | "BACKGROUND_PARSED"
    | "TOPICS_FINALIZED"
    | "TOPIC_ADDED"
    | "TOPIC_UPDATED"
    | "PREFERENCES_UPDATED"
    | "ASSESSMENT_COMPLETED"
    | "PROFILE_CREATED";
  timestamp: string; // ISO 8601
  data: Record<string, any>; // Event-specific payload
}
```

### Assessment Result Schema

```typescript
interface AssessmentResult {
  topic_id: string;
  topic_label: string;
  proficiency: number; // 0..1 (IRT-based score)
  confidence: number; // 0..1 (1 - sigma)
  questions_answered: number;
  correct_count: number;
  timestamp: string; // ISO 8601
  convergence_reason: "sigma_threshold" | "max_questions" | "user_abort";
}
```

## Technical Specifications

### Interaction Constraints

- **Question Limit**: Max 4 questions per AskUserQuestion call
- **Option Limit**: 2-4 options per question
- **Deduplication**: Unique question text and option labels within single call
- **Batch Strategy**: Split 8 preference questions into 2 batches of 4

### Topic ID Generation

```typescript
function generateTopicId(label: string): string {
  const normalized = label.toLowerCase().trim().replace(/\s+/g, "-");
  const hash = sha1(normalized).slice(0, 12);
  return `t_${hash}`;
}
```

### Storage Specifications

- **Snapshot**: `profile.json` (atomic write, validated against schema)
- **Events**: `events.ndjson` (append-only, one event per line)
- **Assessments**: `assessments/<topic-id>.json` (one file per topic)
- **Question Packs**: `question-packs/<topic-id>-{seed|full}.json`

### Side Effects

- **State Sync**: Update `active_profile_id` in `.workflow/learn/state.json`
- **Telemetry**: Trigger `PROFILE_CREATED` event (best-effort, non-blocking)

## Error Handling

### Profile Errors

```bash
# Profile already exists (create mode)
ERROR: Profile already exists at .workflow/learn/profile.json
Use /learn:profile update to modify existing profile

# Profile not found (update/view mode)
ERROR: No profile found
Run /learn:profile create to create a new profile

# Schema validation failure
ERROR: Profile validation failed
Details: [validation errors]
Backup preserved at profile.json.backup
```

### Assessment Errors

```bash
# Topic not found
ERROR: Topic t_abc123def456 not found in profile
Available topics: [list]

# Gemini CLI failure (seed pack generation)
WARNING: Question generation failed, using fallback questions
Proceeding with generic assessment questions

# Assessment incomplete
WARNING: Assessment stopped before convergence
Proficiency estimate may have low confidence (sigma > 0.1)
```

### Input Validation Errors

```bash
# Background text too short
ERROR: Background text must be at least 50 characters
Please provide more details about your experience and goals

# No topics selected
ERROR: At least 1 topic must be selected
Please select topics from the list or add custom topics

# Invalid topic ID format
ERROR: Invalid topic ID format: {input}
Expected format: t_<12-char-hash>
```

## Examples

### Example 1: Create New Profile

```bash
/learn:profile create

# Batch 1: Preferences (4 questions)
Q1: What's your preferred learning style?
A: Hands-on practice

Q2: Which resource format do you prefer?
A: Interactive tutorials

Q3: How much time can you invest?
A: 30 minutes daily

Q4: What's your primary motivation?
A: Career advancement

# Batch 2: Preferences (4 questions)
Q5: Interaction preference?
A: Self-paced learning

Q6: Feedback style?
A: Immediate feedback

Q7: Challenge level?
A: Intermediate

Q8: Goal type?
A: Skill mastery

# Background input
Q: Please describe your background and learning goals:
A: "I'm a frontend developer with 3 years of React experience.
    Want to learn backend development with Node.js and databases."

# Topic selection (16 candidates in 4 batches)
Batch 1: [Node.js, Express, REST APIs, GraphQL]
Selected: Node.js, REST APIs

Batch 2: [MongoDB, PostgreSQL, Redis, SQL]
Selected: PostgreSQL, SQL

Batch 3: [Authentication, Authorization, JWT, OAuth]
Selected: Authentication, JWT

Batch 4: [Docker, Kubernetes, CI/CD, Testing]
Selected: Docker, Testing
+ Manual addition: "TypeScript backend"

# Output
✓ Profile created successfully
- Preferences: 8/8 configured
- Background: Parsed (5 keywords extracted)
- Topics: 8 topics added
- Completion: 100%

Next steps:
- Run /learn:profile update --topic t_abc123 --assess to assess your skill level
- Run /learn:plan to generate a personalized learning plan
```

### Example 2: Update with Assessment

```bash
/learn:profile update --topic t_nodejs123 --assess

# Seed pack generation (blocking)
Generating assessment questions for Node.js...

# Assessment loop
Q1: What is the purpose of the event loop in Node.js?
A: [User selects answer]
→ Proficiency estimate: 0.45 (sigma: 0.25)

Q2: How do you handle asynchronous errors in async/await?
A: [User selects answer]
→ Proficiency estimate: 0.52 (sigma: 0.18)

Q3: What is the difference between process.nextTick() and setImmediate()?
A: [User selects answer]
→ Proficiency estimate: 0.58 (sigma: 0.12)

Q4: How does Node.js handle child processes?
A: [User selects answer]
→ Proficiency estimate: 0.61 (sigma: 0.09)

# Convergence reached (sigma <= 0.1)
✓ Assessment completed
- Topic: Node.js (t_nodejs123)
- Proficiency: 0.61 (Intermediate)
- Confidence: 0.91 (High)
- Questions answered: 4/4

Background: Generating full question pack (20 questions)...

Next steps:
- Run /learn:plan to generate learning plan based on assessment
- Run /learn:profile view to see updated profile
```

### Example 3: View Profile

```bash
/learn:profile view

# Output
=== Learning Profile ===

Preferences:
- Learning style: Hands-on practice
- Resource preference: Interactive tutorials
- Time investment: 30 minutes daily
- Motivation: Career advancement
- Interaction: Self-paced
- Feedback: Immediate
- Challenge level: Intermediate
- Goal type: Skill mastery

Background:
"I'm a frontend developer with 3 years of React experience..."
Keywords: frontend, React, backend, Node.js, databases

Topics (8):
- Node.js (t_nodejs123) - Proficiency: 0.61 (Intermediate) ✓
- REST APIs (t_restapi456) - Not assessed
- PostgreSQL (t_postgres789) - Not assessed
- SQL (t_sql012) - Not assessed
- Authentication (t_auth345) - Not assessed
- JWT (t_jwt678) - Not assessed
- Docker (t_docker901) - Not assessed
- Testing (t_testing234) - Not assessed

Assessments: 1/8 completed (12.5%)
Average proficiency: 0.61

Metadata:
- Version: 1.0.0
- Created: 2025-01-15T10:30:00Z
- Updated: 2025-01-15T11:45:00Z
- Completion: 100%

Next steps:
- Assess remaining topics: /learn:profile update --topic <id> --assess
- Generate learning plan: /learn:plan
```

## Related Commands

- `/learn:plan` - Generate personalized learning plan based on profile
- `/learn:execute` - Execute learning tasks from generated plan
