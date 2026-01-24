---
name: review
description: Review completed learning sessions, consolidate knowledge, and optionally create practical projects as issues
argument-hint: "[--session=<session-id>] [--create-project]"
allowed-tools: Task(*), SlashCommand(*), AskUserQuestion(*), Bash(*), Read(*), Write(*)
---

# Learn:Review Command - 学习回顾与知识沉淀

## Quick Start

```bash
/learn:review                     # 回顾当前激活会话
/learn:review LS-20250124-001     # 回顾指定会话
/learn:review --create-project    # 创建实践项目 issue
```

## Overview

`/learn:review` 是 learn workflow 的知识沉淀系统，负责：
- 回顾整个学习会话的成果
- 生成结构化知识总结
- 更新用户档案（技能水平提升）
- 可选：创建实践项目将知识转化为实际技能

**核心特性**：
- **知识总结**：提取关键概念、学习路径、技能矩阵
- **档案更新**：提升相关技能的 proficiency 分数
- **反馈循环**：记录学习体验，改进后续学习
- **实践转化**：生成实践项目 idea，可转为 issue

## Execution Process

```
Input Parsing:
   └─ 解析参数：[session-id] + flags

Phase 1: Session Discovery
   ├─ --session 指定？
   │  ├─ Yes → 使用指定 session
   │  └─ No → 读取 state.json → active_session_id
   ├─ 验证 session 存在
   └─ 加载会话数据
      ├─ manifest.json（会话元数据）
      ├─ plan.json（学习计划）
      └─ progress.json（进度数据）

Phase 2: Completion Analysis
   ├─ 筛选已完成的知识点
   │  └─ status = "completed" in plan.json
   ├─ 统计学习数据
   │  ├─ 总知识点数
   │  ├─ 完成数、跳过数、进行中数
   │  ├─ 资源消费数
   │  └─ 问答交互数
   └─ 验证：至少 1 个已完成知识点
      └─ 否则 → 提示先用 /learn:execute 完成

Phase 3: Knowledge Synthesis
   ├─ 提取关键概念
   │  └─ 从所有已完成 KP 的 description 中提取
   ├─ 生成学习路径图
   │  └─ 基于 dependency_graph + 完成顺序
   ├─ 生成技能掌握矩阵
   │  └─ 目标技能 vs 完成状态
   └─ 生成学习时间线
      └─ 按时间排序的完成记录

Phase 4: Profile Update
   ├─ 识别学到的技能
   │  └─ 从 plan.learning_goal 提取关键词
   ├─ 更新 profile.known_topics
   │  ├─ 新技能：proficiency = 0.3 (入门)
   │  ├─ 已有技能：proficiency += 0.2 (提升)
   │  └─ 记录 evidence（来自 assessment）
   ├─ 添加 feedback_journal 条目
   │  ├─ date
   │  ├─ session_id
   │  ├─ topic（学习目标）
   │  ├─ rating（用户评分）
   │  ├─ notes（体验总结）
   │  └─ suggested_improvements
   └─ 写入 profiles/{id}.json

Phase 5: Practical Project Proposal (Optional)
   ├─ --create-project flag？
   │  ├─ Yes → 生成实践项目 idea
   │  │  ├─ 基于所学技能设计小型项目
   │  │  ├─ 生成项目描述和验收标准
   │  │  └─ 询问：是否创建 issue？
   │  └─ No → 跳过
   └─ 如果确认 → Bash(`ccw issue create ...`)

Phase 6: Summary Display
   ├─ 显示知识总结
   ├─ 显示档案更新
   ├─ 显示实践建议（如适用）
   └─ 建议下一步操作
      ├─ 继续深入学习：/learn:plan "advanced topic"
      ├─ 实践项目：已创建的 issue
      └─ 查看档案：/learn:profile show
```

## Implementation

### Phase 1: Session Discovery

```javascript
// Load global state
const state = JSON.parse(Read('.workflow/learn/state.json'));

// Determine session ID
let sessionId;
const sessionMatch = $ARGUMENTS.match(/--session=(\S+)/);

if (sessionMatch) {
  sessionId = sessionMatch[1];
} else {
  sessionId = state.active_session_id;
}

if (!sessionId) {
  console.log('No active session. Use /learn:plan first.');
  return;
}

const sessionFolder = `.workflow/learn/sessions/${sessionId}`;

// Validate session exists
try {
  Bash(`test -d ${sessionFolder}`);
} catch (e) {
  console.log(`Session ${sessionId} not found.`);
  return;
}

// Load session data
const manifest = JSON.parse(Read(`${sessionFolder}/manifest.json`));
const plan = JSON.parse(Read(`${sessionFolder}/plan.json`));
const progress = JSON.parse(Read(`${sessionFolder}/progress.json`));

console.log(`
## Session Overview

**ID**: ${sessionId}
**Goal**: ${plan.learning_goal}
**Created**: ${manifest.created_at}
**Status**: ${manifest.status}
`);
```

### Phase 2: Completion Analysis

```javascript
// Analyze knowledge points
const completedKps = plan.knowledge_points.filter(kp => kp.status === 'completed');
const skippedKps = plan.knowledge_points.filter(kp => kp.status === 'skipped');
const inProgressKps = plan.knowledge_points.filter(kp => kp.status === 'in_progress');
const pendingKps = plan.knowledge_points.filter(kp => kp.status === 'pending');

// Validate
if (completedKps.length === 0) {
  console.log(`
## No Completed Knowledge Points

This session has no completed knowledge points yet.

Status:
- Completed: 0
- In Progress: ${inProgressKps.length}
- Pending: ${pendingKps.length}
- Skipped: ${skippedKps.length}

Complete some knowledge points first with /learn:execute
  `);
  return;
}

// Calculate metrics
const metrics = {
  total: plan.knowledge_points.length,
  completed: completedKps.length,
  skipped: skippedKps.length,
  inProgress: inProgressKps.length,
  pending: pendingKps.length,
  completionRate: (completedKps.length / plan.knowledge_points.length * 100).toFixed(1),
  resourcesConsumed: progress.overall_metrics.resources_consumed || 0,
  questionsAsked: progress.overall_metrics.questions_asked || 0,
  timeSpent: progress.overall_metrics.total_time_spent_minutes || 0
};

console.log(`
## Completion Summary

✅ **Completed**: ${metrics.completed}/${metrics.total} (${metrics.completionRate}%)
⏭️ **Skipped**: ${metrics.skipped}
🔄 **In Progress**: ${metrics.inProgress}
⏳ **Pending**: ${metrics.pending}

**Learning Activity**:
- 📚 Resources consumed: ${metrics.resourcesConsumed}
- ❓ Questions asked: ${metrics.questionsAsked}
- ⏱️ Time spent: ${metrics.timeSpent} minutes
`);
```

### Phase 3: Knowledge Synthesis

```javascript
// Extract key concepts
const keyConcepts = completedKps.map(kp => ({
  id: kp.id,
  title: kp.title,
  description: kp.description,
  assessment: kp.assessment.type
}));

// Generate learning path
const learningPath = [];
const visited = new Set();

function visit(kpId) {
  if (visited.has(kpId)) return;
  visited.add(kpId);

  const kp = plan.knowledge_points.find(k => k.id === kpId);
  if (!kp) return;

  // Visit prerequisites first
  kp.prerequisites.forEach(prereqId => visit(prereqId));

  if (kp.status === 'completed') {
    learningPath.push({
      id: kp.id,
      title: kp.title,
      order: learningPath.length + 1
    });
  }
}

// Start from completed KPs
completedKps.forEach(kp => visit(kp.id));

// Generate skill matrix
const skillMatrix = {
  goal: plan.learning_goal,
  learnedSkills: extractSkills(plan.learning_goal),
  kpsCompleted: completedKps.length,
  kpsTotal: plan.knowledge_points.length,
  mastery: calculateMastery(completedKps, plan.knowledge_points)
};

function extractSkills(goal) {
  // Simple keyword extraction (can be enhanced)
  const keywords = goal.split(/\s+/)
    .filter(w => w.length > 3)
    .map(w => w.toLowerCase());
  return [...new Set(keywords)].slice(0, 5);
}

function calculateMastery(completed, total) {
  const ratio = completed.length / total.length;
  if (ratio >= 0.9) return 'Expert';
  if (ratio >= 0.7) return 'Advanced';
  if (ratio >= 0.5) return 'Intermediate';
  if (ratio >= 0.3) return 'Beginner';
  return 'Novice';
}

// Display knowledge summary
console.log(`
## Knowledge Summary

### Key Concepts Learned
${keyConcepts.map((kc, i) => `${i + 1}. **${kc.title}**
   ${kc.description.substring(0, 100)}...
   Assessment: ${kc.assessment}`).join('\n')}

### Learning Path
${learningPath.map(lp => `${lp.order}. ${lp.id}: ${lp.title}`).join('\n → ')}

### Skill Mastery
- **Goal**: ${skillMatrix.goal}
- **Skills**: ${skillMatrix.learnedSkills.join(', ')}
- **Level**: ${skillMatrix.mastery}
- **Coverage**: ${completedKps.length}/${plan.knowledge_points.length} KPs
`);
```

### Phase 4: Profile Update

```javascript
// Load user profile
const profileId = manifest.profile_id;
const profilePath = `.workflow/learn/profiles/${profileId}.json`;
let profile = JSON.parse(Read(profilePath));

// Extract skills from learning goal
const learnedSkills = extractSkills(plan.learning_goal);

// Update known_topics
const now = new Date().toISOString();

learnedSkills.forEach(skill => {
  const existingTopic = profile.known_topics.find(t => t.topic_id === skill);

  if (existingTopic) {
    // Skill exists: increase proficiency
    existingTopic.proficiency = Math.min(1.0, existingTopic.proficiency + 0.2);
    existingTopic.last_updated = now;

    // Add evidence from completed KPs
    const newEvidence = completedKps.map(kp => kp.title).join(', ');
    if (!existingTopic.evidence.includes(newEvidence)) {
      existingTopic.evidence.push(`Completed: ${newEvidence}`);
    }
  } else {
    // New skill: add with initial proficiency
    profile.known_topics.push({
      topic_id: skill,
      proficiency: 0.3,
      last_updated: now,
      evidence: completedKps.map(kp => kp.title)
    });
  }
});

// Collect user feedback
console.log(`
## Learning Experience

Please rate your learning experience:
`);

const feedback = AskUserQuestion({
  questions: [
    {
      question: "How would you rate this learning session?",
      header: "Rating",
      multiSelect: false,
      options: [
        {label: "⭐⭐⭐⭐⭐ Excellent", description: "Learned a lot, resources were perfect"},
        {label: "⭐⭐⭐⭐ Good", description: "Good progress, minor improvements possible"},
        {label: "⭐⭐⭐ Average", description: "Met expectations, some gaps"},
        {label: "⭐⭐ Fair", description: "Difficult to follow, needs improvement"},
        {label: "⭐ Poor", description: "Not effective, major issues"}
      ]
    },
    {
      question: "What was most helpful?",
      header: "What Worked",
      multiSelect: true,
      options: [
        {label: "Resource quality", description: "Gold/Silver resources were excellent"},
        {label: "Assessment tasks", description: "Practical exercises reinforced learning"},
        {label: "Pacing", description: "Progression felt natural"},
        {label: "Q&A support", description: "learn:ask helped clarify doubts"}
      ]
    },
    {
      question: "What could be improved?",
      header: "Improvements",
      multiSelect: true,
      options: [
        {label: "More resources", description: "Need more learning materials"},
        {label: "Better assessments", description: "Tasks were unclear or too hard"},
        {label: "Different pace", description: "Too fast or too slow"},
        {label: "More examples", description: "Need more code samples"}
      ]
    }
  ]
});

const rating = Object.values(feedback)[0];
const whatWorked = Object.values(feedback)[1];
const improvements = Object.values(feedback)[2];

// Map rating to number
const ratingMap = {
  '⭐⭐⭐⭐⭐ Excellent': 5,
  '⭐⭐⭐⭐ Good': 4,
  '⭐⭐⭐ Average': 3,
  '⭐⭐ Fair': 2,
  '⭐ Poor': 1
};
const ratingValue = ratingMap[rating];

// Add to feedback journal
const journalEntry = {
  date: now.split('T')[0],
  session_id: sessionId,
  topic: plan.learning_goal,
  rating: ratingValue,
  what_worked: whatWorked,
  suggested_improvements: improvements,
  notes: `Completed ${completedKps.length} KPs, ${metrics.completionRate}% completion rate`
};

profile.feedback_journal.push(journalEntry);

// Update metadata
profile._metadata.updated_at = now;

// Save profile
Write(profilePath, JSON.stringify(profile, null, 2));

console.log(`
✅ Profile updated: ${profileId}

**Skills Updated**:
${learnedSkills.map(skill => {
  const topic = profile.known_topics.find(t => t.topic_id === skill);
  return `- ${skill}: ${(topic.proficiency * 100).toFixed(0)}% proficiency`;
}).join('\n')}
`);
```

### Phase 5: Practical Project Proposal

```javascript
// Check if --create-project flag is set
const createProject = $ARGUMENTS.includes('--create-project');

if (!createProject) {
  // Ask user if they want a project
  const answer = AskUserQuestion({
    questions: [{
      question: "Would you like to create a practical project to apply what you've learned?",
      header: "Project",
      multiSelect: false,
      options: [
        {label: "Yes", description: "Generate a project idea and create an issue"},
        {label: "No", description: "Just review for now"}
      ]
    }]
  });

  const userChoice = Object.values(answer)[0];
  if (userChoice !== 'Yes') {
    console.log('\n✅ Review completed!');
    return;
  }
}

// Generate project idea based on learned skills
console.log('\n## Generating Project Idea...\n');

const projectIdea = generateProjectIdea(plan, completedKps, profile);

function generateProjectIdea(plan, kps, profile) {
  const goal = plan.learning_goal;
  const skills = extractSkills(goal);

  return {
    title: `Build a ${skills[0] || 'Project'} using learned skills`,
    description: `
# Project: Apply ${goal}

## Overview
Apply the knowledge gained from session ${sessionId} by building a practical project.

## Skills to Apply
${skills.map(s => `- ${s}`).join('\n')}

## Completed Knowledge Points
${kps.map(kp => `- ${kp.id}: ${kp.title}`).join('\n')}

## Project Requirements
1. **Core Feature**: Implement main functionality using key concepts
2. **Quality**: Write clean, well-documented code
3. **Testing**: Include basic tests or validation
4. **Documentation**: README with setup and usage instructions

## Success Criteria
- All core requirements met
- Code follows best practices
- Project is deployable/runnable
- Documentation is clear

## Suggested Tech Stack
Based on your learning: ${skills.join(', ')}

## Estimated Complexity
Medium (should take 1-3 days)

---

**Generated from**: ${sessionId}
**Learning Goal**: ${goal}
    `.trim(),
    labels: ['learning-project', sessionId, ...skills],
    priority: 'medium'
  };
}

console.log(`
## Project Proposal

**Title**: ${projectIdea.title}

${projectIdea.description}

**Labels**: ${projectIdea.labels.join(', ')}
**Priority**: ${projectIdea.priority}
`);

// Confirm and create issue
const confirm = AskUserQuestion({
  questions: [{
    question: "Create this project as an issue?",
    header: "Confirm",
    multiSelect: false,
    options: [
      {label: "Create Issue", description: "Create issue in tracker"},
      {label: "Cancel", description: "Don't create now"}
    ]
  }]
});

const confirmation = Object.values(confirm)[0];

if (confirmation === 'Create Issue') {
  // Create issue via CLI
  const result = Bash(`
    ccw issue create \\
      --title "${projectIdea.title.replace(/"/g, '\\"')}" \\
      --body "${projectIdea.description.replace(/"/g, '\\"').replace(/\n/g, '\\n')}" \\
      --label ${projectIdea.labels.join(',')} \\
      --priority ${projectIdea.priority}
  `);

  console.log(`\n✅ Project issue created! Use /issue:list to view it.`);
} else {
  console.log('\nProject idea saved. Create it later with /learn:review --create-project');
}
```

### Phase 6: Summary Display

```javascript
console.log(`
## 🎉 Learning Session Complete!

**Session**: ${sessionId}
**Goal**: ${plan.learning_goal}

### What You Achieved
- ✅ Completed ${metrics.completed} knowledge points
- 📚 Consumed ${metrics.resourcesConsumed} resources
- ❓ Asked ${metrics.questionsAsked} questions
- 📈 Skill level: ${skillMatrix.mastery}

### Profile Updates
- Skills: ${learnedSkills.join(', ')}
- New proficiency levels saved to profile
- Feedback recorded for future improvements

${createProject || confirmation === 'Create Issue' ? `
### Next Steps
1. 🎯 Start your project: Check issue tracker
2. 📝 Document your learning: Review Q&A in interactions/
3. 🚀 Continue learning: /learn:plan "next topic"
` : `
### Next Steps
1. 🎯 Create a project: /learn:review --create-project
2. 📝 Review your Q&A: Check interactions/ folder
3. 🚀 Start new learning: /learn:plan "advanced topic"
`}

### Related Commands
- View profile: /learn:profile show
- Start new session: /learn:plan "new goal"
- Review Q&A history: cat ${sessionFolder}/interactions/ask-*.md

---

Great job on completing your learning journey! 🌟
`);
```

## Helper Functions

```javascript
function extractSkills(text) {
  // Extract significant words (>3 chars) as potential skills
  const words = text.toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length > 3);

  // Remove common non-skill words
  const stopWords = ['master', 'learn', 'advanced', 'basic', 'build', 'create', 'implement'];
  const filtered = words.filter(w => !stopWords.includes(w));

  // Return unique, deduplicated
  return [...new Set(filtered)].slice(0, 5);
}
```

## Error Handling

| Error | Resolution |
|-------|------------|
| Session not found | List available sessions from index.json |
| No completed KPs | Prompt to complete KPs first |
| Profile not found | Create default profile |
| Issue creation fails | Show error, save project idea to file |
| State file corrupted | Rebuild from session data |

## Quality Checklist

Before completing review, verify:

- [ ] Session loaded successfully (manifest, plan, progress)
- [ ] At least 1 completed KP found
- [ ] Knowledge summary generated (concepts, path, mastery)
- [ ] Profile updated (proficiency increased, feedback added)
- [ ] User feedback collected (rating, what worked, improvements)
- [ ] Project idea generated (if requested)
- [ ] Summary displayed with next steps
- [ ] Session status updated to "completed" (optional)

## Related Commands

**Reviews Data From**:
- `/learn:plan` - Created the session
- `/learn:execute` - Generated progress data
- `/learn:ask` - Generated Q&A history

**Can Trigger**:
- `ccw issue create` - To create practical project
- `/learn:profile show` - To view updated profile
- `/learn:plan` - To start new learning session

## Examples

### Example 1: Basic Review

```bash
User: /learn:review

Output:
## Session Overview
**ID**: LS-20250124-001
**Goal**: Master React Server Components

## Completion Summary
✅ **Completed**: 5/5 (100.0%)
📚 Resources consumed: 12
❓ Questions asked: 3

## Knowledge Summary
[Key concepts, learning path, skill mastery...]

✅ Profile updated: profile-default

**Skills Updated**:
- react: 80% proficiency
- server-components: 60% proficiency

🎉 Learning Session Complete!
```

### Example 2: Review with Project Creation

```bash
User: /learn:review --create-project

Output:
[Standard review output...]

## Generating Project Idea...

## Project Proposal
**Title**: Build a Server Component Library

[Project description...]

✅ Project issue created!
```

## Session Archival

After review, consider archiving the session:

```bash
# Mark session as completed
manifest.status = "completed";
Write(`${sessionFolder}/manifest.json`, JSON.stringify(manifest, null, 2));

# Optional: Move to archive
# Bash(`mv ${sessionFolder} .workflow/learn/sessions/archived/`)
```

## Knowledge Consolidation

The review process serves three purposes:

1. **Cognitive Consolidation**
   - Revisit key concepts
   - Reinforce learning through summary
   - Connect concepts to practical application

2. **Profile Enhancement**
   - Update skill levels based on achievement
   - Record evidence of learning
   - Improve future personalization

3. **Practice Transformation**
   - Convert theoretical knowledge to practical skills
   - Bridge learning gap with real projects
   - Create measurable outcomes

This completes the learning cycle and prepares the user for the next learning journey.
