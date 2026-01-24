---
name: profile
description: Manage user learning profiles with evidence-based skill assessment and personalized learning preferences
argument-hint: "[create|update|select|show] [profile-id] [--no-assessment]"
allowed-tools: TodoWrite(*), Task(*), AskUserQuestion(*), Bash(*), Read(*), Write(*)
---

# Learn:Profile Command - 个人档案管理

## Quick Start

```bash
/learn:profile create                    # 创建新档案（交互式评估）
/learn:profile update                    # 更新当前档案
/learn:profile select profile-advanced   # 选择激活档案
/learn:profile show                      # 显示当前档案
/learn:profile create --no-assessment    # 创建档案（跳过评估）
```

## Overview

`/learn:profile` 是 learn workflow 的用户画像系统，负责：
- 创建和管理个人学习档案
- Evidence-based技能水平评估（避免自我评估水分）
- 设置学习偏好和目标
- 跟踪学习历史和演进

**核心特性**：
- **Evidence-Based评估**：通过conceptual checks + micro-challenges客观测量技能
- **置信度机制**：避免绝对分数，使用confidence标记不确定性
- **个性化配置**：学习风格、资源偏好、时间预算
- **演进追踪**：记录技能提升历史和学习反馈

## Execution Process

```
Input Parsing:
   └─ 解析操作类型：create | update | select | show

Phase 1: Operation Routing
   ├─ create → Profile Creation Flow
   ├─ update → Profile Update Flow
   ├─ select → Profile Selection Flow
   └─ show → Profile Display Flow

Phase 2: Profile Creation Flow (create)
   ├─ Step 1: Basic Information
   │  ├─ AskUserQuestion: 学习目标类型
   │  ├─ AskUserQuestion: 经验水平（初步）
   │  └─ AskUserQuestion: 学习偏好
   ├─ Step 2: Evidence-Based Assessment (unless --no-assessment)
   │  ├─ Conceptual Checks（理论探针）
   │  │  ├─ 多选题验证基础概念
   │  │  ├─ 追问验证深度理解
   │  │  └─ 生成confidence score
   │  ├─ Micro-Challenges（微挑战）
   │  │  ├─ 代码片段任务（可验证）
   │  │  ├─ 场景应用题
   │  │  └─ 记录evidence + result
   │  └─ Proficiency Calculation
   │     ├─ 基于evidence加权计算
   │     ├─ 生成confidence标记
   │     └─ 避免单次失误误判
   ├─ Step 3: Known Topics Collection
   │  ├─ 基于评估结果生成known_topics
   │  ├─ 每个topic包含：proficiency + evidence + confidence
   │  └─ 标记last_updated时间戳
   └─ Step 4: Profile Creation
      ├─ 生成profile_id: profile-{timestamp}
      ├─ 写入profiles/{id}.json
      ├─ 更新state.json (active_profile_id)
      └─ 显示档案摘要

Phase 3: Profile Update Flow (update)
   ├─ 加载当前active_profile
   ├─ AskUserQuestion: 选择更新内容
   │  ├─ Update Skills: 重新评估技能水平
   │  ├─ Update Preferences: 修改学习偏好
   │  ├─ Add Topics: 添加新的known_topics
   │  └─ Review History: 查看feedback_journal
   └─ 应用更新并保存

Phase 4: Profile Selection Flow (select)
   ├─ 列出所有可用profiles
   ├─ 显示每个profile的摘要
   ├─ AskUserQuestion: 选择profile
   └─ 更新state.json (active_profile_id)

Phase 5: Profile Display Flow (show)
   ├─ 加载active_profile
   ├─ 格式化显示
   │  ├─ 基本信息（ID, experience_level）
   │  ├─ Known Topics（按proficiency排序）
   │  ├─ Learning Preferences
   │  └─ Feedback Journal（最近5条）
   └─ 显示统计信息
```

## Implementation

### Phase 2: Profile Creation Flow

#### Step 1: Basic Information

```javascript
// 学习目标类型
const GOAL_TYPE_KEY = 'goal_type';
const goalTypeAnswer = AskUserQuestion({
  questions: [{
    key: GOAL_TYPE_KEY,
    question: "What is your primary learning goal?",
    header: "Goal Type",
    multiSelect: false,
    options: [
      {value: "project", label: "Build Projects", description: "Learn by building real applications"},
      {value: "skill", label: "Master Skills", description: "Deep dive into specific technologies"},
      {value: "role", label: "Career Role", description: "Prepare for a specific job role"},
      {value: "exploration", label: "Explore & Discover", description: "Broad exploration of new areas"}
    ]
  }]
});

const goalType = goalTypeAnswer[GOAL_TYPE_KEY];

// 经验水平（初步）
const EXP_LEVEL_KEY = 'experience_level';
const expLevelAnswer = AskUserQuestion({
  questions: [{
    key: EXP_LEVEL_KEY,
    question: "What is your overall programming experience?",
    header: "Experience",
    multiSelect: false,
    options: [
      {value: "beginner", label: "Beginner", description: "< 1 year, learning fundamentals"},
      {value: "intermediate", label: "Intermediate", description: "1-3 years, comfortable with basics"},
      {value: "advanced", label: "Advanced", description: "3-5 years, deep expertise in some areas"},
      {value: "expert", label: "Expert", description: "5+ years, can architect complex systems"}
    ]
  }]
});

const experienceLevel = expLevelAnswer[EXP_LEVEL_KEY];

// 学习偏好
const STYLE_KEY = 'learning_style';
const SOURCES_KEY = 'preferred_sources';

const preferencesAnswer = AskUserQuestion({
  questions: [
    {
      key: STYLE_KEY,
      question: "What is your preferred learning style?",
      header: "Style",
      multiSelect: false,
      options: [
        {value: "practical", label: "Practical", description: "Learn by doing, hands-on exercises"},
        {value: "theoretical", label: "Theoretical", description: "Understand concepts deeply first"},
        {value: "visual", label: "Visual", description: "Diagrams, videos, visual explanations"}
      ]
    },
    {
      key: SOURCES_KEY,
      question: "Which learning resources do you prefer?",
      header: "Resources",
      multiSelect: true,
      options: [
        {value: "official-docs", label: "Official Docs", description: "Documentation from creators"},
        {value: "interactive-tutorials", label: "Interactive Tutorials", description: "Step-by-step guided learning"},
        {value: "video-courses", label: "Video Courses", description: "Video-based instruction"},
        {value: "books", label: "Books", description: "In-depth written content"},
        {value: "blogs", label: "Blogs & Articles", description: "Community-written guides"}
      ]
    }
  ]
});

const learningStyle = preferencesAnswer[STYLE_KEY];
const preferredSources = preferencesAnswer[SOURCES_KEY];
```

#### Step 2: Evidence-Based Assessment

```javascript
// Skip if --no-assessment flag
if (flags.noAssessment) {
  console.log('Skipping assessment. Using self-reported experience level.');
  // Create profile with minimal known_topics
  return createProfileWithDefaults(experienceLevel, learningStyle, preferredSources);
}

console.log('\n## Evidence-Based Skill Assessment\n');
console.log('We will assess your skills through conceptual checks and micro-challenges.');
console.log('This helps create an accurate learning plan without self-assessment bias.\n');

// Conceptual Checks (理论探针)
const knownTopics = [];

// Example: TypeScript Assessment
const TS_CONCEPT_KEY = 'ts_concept';
const tsConceptAnswer = AskUserQuestion({
  questions: [{
    key: TS_CONCEPT_KEY,
    question: "In TypeScript, what is the key purpose of the 'type' keyword?",
    header: "TypeScript",
    multiSelect: false,
    options: [
      {value: "correct", label: "Define type aliases", description: "Create custom type definitions"},
      {value: "wrong1", label: "Declare variables", description: "Similar to let/const"},
      {value: "wrong2", label: "Import types", description: "Import type definitions"},
      {value: "unsure", label: "Not sure", description: "I don't know TypeScript"}
    ]
  }]
});

const tsConceptResult = tsConceptAnswer[TS_CONCEPT_KEY];

if (tsConceptResult === 'correct') {
  // Follow-up question for depth verification
  const TS_DEPTH_KEY = 'ts_depth';
  const tsDepthAnswer = AskUserQuestion({
    questions: [{
      key: TS_DEPTH_KEY,
      question: "Can you explain when to use 'type' vs 'interface' in TypeScript?",
      header: "TypeScript Depth",
      multiSelect: false,
      options: [
        {value: "advanced", label: "Yes, with examples", description: "I understand the differences and trade-offs"},
        {value: "basic", label: "Basic understanding", description: "I know they're similar but not the details"},
        {value: "unsure", label: "Not sure", description: "I just use what works"}
      ]
    }]
  });

  const tsDepth = tsDepthAnswer[TS_DEPTH_KEY];

  // Calculate proficiency with confidence
  let tsProficiency = 0;
  let tsConfidence = 0;

  if (tsDepth === 'advanced') {
    tsProficiency = 0.7;
    tsConfidence = 0.8;
  } else if (tsDepth === 'basic') {
    tsProficiency = 0.5;
    tsConfidence = 0.7;
  } else {
    tsProficiency = 0.3;
    tsConfidence = 0.5;
  }

  knownTopics.push({
    topic_id: 'typescript',
    proficiency: tsProficiency,
    confidence: tsConfidence,
    last_updated: new Date().toISOString(),
    evidence: [
      `Conceptual check: ${tsConceptResult}`,
      `Depth verification: ${tsDepth}`
    ]
  });
} else if (tsConceptResult === 'unsure') {
  // No TypeScript knowledge
  console.log('ℹ️  TypeScript marked as unknown. Will be included in learning plans.');
} else {
  // Wrong answer - low proficiency with low confidence
  knownTopics.push({
    topic_id: 'typescript',
    proficiency: 0.2,
    confidence: 0.4,
    last_updated: new Date().toISOString(),
    evidence: [`Conceptual check: incorrect (${tsConceptResult})`]
  });
}

// Micro-Challenge (微挑战) - Optional for code-related goals
if (goalType === 'project' || goalType === 'skill') {
  console.log('\n## Micro-Challenge: Code Verification\n');
  console.log('Please complete a small coding task to verify practical skills.');

  const CHALLENGE_KEY = 'code_challenge';
  const challengeAnswer = AskUserQuestion({
    questions: [{
      key: CHALLENGE_KEY,
      question: "Write a JavaScript function that filters even numbers from an array. Type 'skip' to skip this challenge.",
      header: "Code Challenge",
      multiSelect: false,
      options: [
        {value: "completed", label: "I completed it", description: "I wrote the function"},
        {value: "skip", label: "Skip", description: "Skip this challenge"}
      ]
    }]
  });

  if (challengeAnswer[CHALLENGE_KEY] === 'completed') {
    // In real implementation, would analyze the code
    // For now, record as evidence
    const jsIndex = knownTopics.findIndex(t => t.topic_id === 'javascript');
    if (jsIndex >= 0) {
      knownTopics[jsIndex].evidence.push('Micro-challenge: array filtering (completed)');
      knownTopics[jsIndex].proficiency = Math.min(1.0, knownTopics[jsIndex].proficiency + 0.1);
    } else {
      knownTopics.push({
        topic_id: 'javascript',
        proficiency: 0.6,
        confidence: 0.7,
        last_updated: new Date().toISOString(),
        evidence: ['Micro-challenge: array filtering (completed)']
      });
    }
  }
}
```

#### Step 3: Known Topics Collection

```javascript
// Consolidate known_topics from assessment
console.log('\n## Assessment Summary\n');
console.log(`Assessed ${knownTopics.length} topics:`);

knownTopics.forEach(topic => {
  const proficiencyPercent = (topic.proficiency * 100).toFixed(0);
  const confidencePercent = (topic.confidence * 100).toFixed(0);
  console.log(`  - ${topic.topic_id}: ${proficiencyPercent}% proficiency (${confidencePercent}% confidence)`);
});

// Ask if user wants to add more topics manually
const ADD_MORE_KEY = 'add_more_topics';
const addMoreAnswer = AskUserQuestion({
  questions: [{
    key: ADD_MORE_KEY,
    question: "Would you like to add more topics to your profile?",
    header: "Add Topics",
    multiSelect: false,
    options: [
      {value: "yes", label: "Yes", description: "Add more known topics"},
      {value: "no", label: "No", description: "Continue with current topics"}
    ]
  }]
});

if (addMoreAnswer[ADD_MORE_KEY] === 'yes') {
  // Allow manual topic addition (simplified for MVP)
  console.log('ℹ️  Manual topic addition will be available in future versions.');
  console.log('   For now, topics will be added automatically as you complete learning sessions.');
}
```

#### Step 4: Profile Creation

```javascript
// Generate profile ID
const timestamp = Date.now();
const profileId = `profile-${timestamp}`;

// Create profile object
const profile = {
  "$schema": "./schemas/learn-profile.schema.json",
  "profile_id": profileId,
  "experience_level": experienceLevel,
  "known_topics": knownTopics,
  "learning_preferences": {
    "style": learningStyle,
    "preferred_sources": preferredSources
  },
  "feedback_journal": [],
  "_metadata": {
    "created_at": new Date().toISOString(),
    "updated_at": new Date().toISOString(),
    "version": "1.0.0",
    "goal_type": goalType,
    "assessment_method": flags.noAssessment ? "self-reported" : "evidence-based"
  }
};

// Ensure directory exists
const profilesDir = '.workflow/learn/profiles';
Bash(`mkdir -p ${profilesDir}`);

// Write profile file
const profilePath = `${profilesDir}/${profileId}.json`;
Write(profilePath, JSON.stringify(profile, null, 2));

// Update state.json
const statePath = '.workflow/learn/state.json';
let state;

try {
  state = JSON.parse(Read(statePath));
} catch (e) {
  // First profile - initialize state
  state = {
    active_profile_id: null,
    active_session_id: null,
    version: '1.0.0',
    _metadata: {
      last_updated: new Date().toISOString(),
      total_sessions_completed: 0
    }
  };
}

state.active_profile_id = profileId;
state._metadata.last_updated = new Date().toISOString();

Write(statePath, JSON.stringify(state, null, 2));

// Display summary
console.log(`
## Profile Created Successfully

**Profile ID**: ${profileId}
**Experience Level**: ${experienceLevel}
**Learning Style**: ${learningStyle}
**Known Topics**: ${knownTopics.length}

**Top Skills**:
${knownTopics
  .sort((a, b) => b.proficiency - a.proficiency)
  .slice(0, 5)
  .map(t => `  - ${t.topic_id}: ${(t.proficiency * 100).toFixed(0)}%`)
  .join('\n')}

✅ Profile activated. Ready to create learning plans with /learn:plan
`);
```

### Phase 3: Profile Update Flow

```javascript
// Load current profile
const statePath = '.workflow/learn/state.json';
const state = JSON.parse(Read(statePath));

if (!state.active_profile_id) {
  console.error('❌ No active profile. Create one with /learn:profile create');
  return;
}

const profilePath = `.workflow/learn/profiles/${state.active_profile_id}.json`;
const profile = JSON.parse(Read(profilePath));

// Ask what to update
const UPDATE_TYPE_KEY = 'update_type';
const updateAnswer = AskUserQuestion({
  questions: [{
    key: UPDATE_TYPE_KEY,
    question: "What would you like to update?",
    header: "Update Type",
    multiSelect: false,
    options: [
      {value: "skills", label: "Re-assess Skills", description: "Update known_topics with new assessment"},
      {value: "preferences", label: "Update Preferences", description: "Change learning style or resource preferences"},
      {value: "add_topics", label: "Add Topics", description: "Manually add new known topics"},
      {value: "review_history", label: "Review History", description: "View feedback journal"}
    ]
  }]
});

const updateType = updateAnswer[UPDATE_TYPE_KEY];

switch (updateType) {
  case 'skills':
    // Re-run assessment for specific topics
    console.log('Re-assessment feature coming soon.');
    break;
  case 'preferences':
    // Update learning preferences
    const STYLE_UPDATE_KEY = 'style_update';
    const styleUpdateAnswer = AskUserQuestion({
      questions: [{
        key: STYLE_UPDATE_KEY,
        question: "Update your learning style:",
        header: "Style",
        multiSelect: false,
        options: [
          {value: "practical", label: "Practical"},
          {value: "theoretical", label: "Theoretical"},
          {value: "visual", label: "Visual"}
        ]
      }]
    });

    profile.learning_preferences.style = styleUpdateAnswer[STYLE_UPDATE_KEY];
    profile._metadata.updated_at = new Date().toISOString();

    Write(profilePath, JSON.stringify(profile, null, 2));
    console.log('✅ Preferences updated');
    break;
  case 'add_topics':
    console.log('Manual topic addition coming soon.');
    break;
  case 'review_history':
    console.log('\n## Feedback Journal\n');
    profile.feedback_journal.slice(-5).forEach(entry => {
      console.log(`**${entry.date}** - Session: ${entry.session_id}`);
      console.log(`Rating: ${'⭐'.repeat(entry.rating)}`);
      if (entry.notes) console.log(`Notes: ${entry.notes}`);
      console.log('');
    });
    break;
}
```

## Error Handling

| Error | Resolution |
|-------|------------|
| No profiles directory | Auto-create `.workflow/learn/profiles/` |
| Profile not found | List available profiles, prompt selection |
| Invalid profile ID | Validate format, suggest correction |
| State.json missing | Initialize with default state |
| Assessment timeout | Save partial profile, allow resume |
| Schema validation fails | Log errors, use defaults for missing fields |

## Quality Checklist

Before completing profile creation, verify:

- [ ] `profile.json` follows `learn-profile.schema.json`
- [ ] All required fields present (profile_id, experience_level, known_topics)
- [ ] Proficiency scores in valid range (0.0-1.0)
- [ ] Evidence array populated for assessed topics
- [ ] Confidence scores included (if evidence-based)
- [ ] state.json updated with active_profile_id
- [ ] Profile file written successfully
- [ ] User confirmation displayed

## Related Commands

**Creates Profile For**:
- `/learn:plan` - Uses profile for gap analysis and personalization

**Updated By**:
- `/learn:review` - Updates proficiency scores after session completion

**References**:
- `schemas/learn-profile.schema.json` - Profile data structure definition

## Examples

### Example 1: Create Profile with Assessment

```bash
User: /learn:profile create

Output:
## Profile Creation

What is your primary learning goal?
[User selects: Build Projects]

What is your overall programming experience?
[User selects: Intermediate]

What is your preferred learning style?
[User selects: Practical]

## Evidence-Based Skill Assessment

In TypeScript, what is the key purpose of the 'type' keyword?
[User selects: Define type aliases]

Can you explain when to use 'type' vs 'interface' in TypeScript?
[User selects: Basic understanding]

## Assessment Summary
Assessed 1 topics:
  - typescript: 50% proficiency (70% confidence)

## Profile Created Successfully
**Profile ID**: profile-1737734400000
**Experience Level**: intermediate
**Learning Style**: practical
**Known Topics**: 1

✅ Profile activated. Ready to create learning plans with /learn:plan
```

### Example 2: Update Profile Preferences

```bash
User: /learn:profile update

Output:
What would you like to update?
[User selects: Update Preferences]

Update your learning style:
[User selects: Visual]

✅ Preferences updated
```

### Example 3: Show Current Profile

```bash
User: /learn:profile show

Output:
## Current Profile

**Profile ID**: profile-1737734400000
**Experience Level**: intermediate
**Learning Style**: visual
**Created**: 2025-01-24

**Known Topics** (3):
  - typescript: 50% (confidence: 70%)
  - javascript: 60% (confidence: 70%)
  - react: 40% (confidence: 60%)

**Preferred Resources**:
  - Official Docs
  - Interactive Tutorials

**Learning History**:
  - 2 sessions completed
  - Average rating: 4.5/5
```

## Integration Points

- **Input**: User responses via AskUserQuestion
- **Output**: Profile JSON file in `.workflow/learn/profiles/`
- **Side Effects**: Updates `state.json` with active_profile_id
- **Dependencies**: None (first command to run)
- **Consumed By**: `/learn:plan` (reads profile for personalization)

## P0 Fixes Applied

Based on multi-CLI analysis synthesis:

### 1. AskUserQuestion Pattern ✅

**Problem**: Brittle `Object.values(answer)[0]` usage
**Solution**: Key-based access pattern throughout

```javascript
// ✅ Robust pattern
const KEY = 'question_key';
const answer = AskUserQuestion({ questions: [{ key: KEY, ... }] });
const choice = answer[KEY];
```

### 2. Evidence-Based Assessment ✅

**Problem**: Self-assessment bias ("水分")
**Solution**: Conceptual checks + micro-challenges + confidence scoring

- Conceptual checks verify understanding
- Micro-challenges provide verifiable evidence
- Confidence scores acknowledge uncertainty
- Multiple evidence points prevent single-failure bias

### 3. Schema Compliance ✅

**Problem**: No schema validation
**Solution**: Reference `learn-profile.schema.json` and validate structure

- All profiles follow schema definition
- Required fields enforced
- Enum values validated
- Proficiency range checked (0.0-1.0)

---

**版本**: v1.0.0-mvp
**状态**: MVP Ready - P0 Fixes Applied
**最后更新**: 2026-01-24
