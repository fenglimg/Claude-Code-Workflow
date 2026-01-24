---
name: execute
description: Execute knowledge points with progress tracking, resource consumption tracking, and integration with issue system
argument-hint: "[knowledge-point-id] [--session=<session-id>] [--complete] [--skip] [--create-issue]"
allowed-tools: TodoWrite(*), Task(*), SlashCommand(*), AskUserQuestion(*), Bash(*), Read(*), Write(*)
---

# Learn:Execute Command - 知识点执行

## Quick Start

```bash
/learn:execute                    # 执行下一个待完成的知识点
/learn:execute KP-2               # 执行指定知识点
/learn:execute --complete         # 标记当前知识点为完成
/learn:execute --skip             # 跳过当前知识点
/learn:execute --create-issue     # 将当前知识点转为 issue
```

## Overview

`/learn:execute` 是 learn workflow 的执行引擎，负责：
- 展示知识点的学习内容和资源
- 跟踪学习进度和资源消费
- 提供交互式学习流程
- 支持将学习内容转为实际开发任务（issue）

**核心特性**：
- **依赖感知**：自动验证前置依赖是否满足
- **进度持久化**：实时更新 `progress.json`
- **资源分级**：按质量（Gold/Silver/Bronze）展示学习资源
- **灵活退出**：支持完成/跳过/转issue等多种操作

## Execution Process

```
Input Parsing:
   └─ 解析参数：[kp-id] + flags

Phase 1: Session & Plan Discovery
   ├─ 读取 state.json → active_session_id
   ├─ 如果 --session 指定 → 使用指定 session
   └─ 加载 plan.json + progress.json

Phase 2: Knowledge Point Selection
   ├─ 有 kp-id 参数？
   │  ├─ Yes → 验证 kp-id 存在于 plan.json
   │  └─ No → 自动选择下一个可执行的 KP
   │     ├─ 筛选：status = "pending"
   │     ├─ 验证：所有 prerequisites 已完成
   │     └─ 选择：优先级排序（依赖深度 → ID）
   └─ 如果无可用 KP → 提示所有任务完成，建议 /learn:review

Phase 3: Prerequisite Validation
   ├─ 读取 kp.prerequisites
   ├─ 检查 progress.json → 所有 prerequisites 状态
   └─ 如果未完成 → 显示依赖关系，提示先完成前置任务

Phase 4: Content Display
   ├─ 知识点标题 + 描述
   ├─ 学习资源（按质量分级）
   │  ├─ 🥇 Gold: 官方文档、权威书籍
   │  ├─ 🥈 Silver: 高质量博客、教程
   │  └─ 🥉 Bronze: 社区资源、视频
   ├─ 评估任务
   │  ├─ 类型：practical_task / code_challenge / multiple_choice
   │  └─ 验收标准
   └─ 当前进度
      ├─ 已完成的资源
      ├─ 已尝试的评估次数
      └─ 用户笔记

Phase 5: User Interaction Loop
   └─ AskUserQuestion: 选择下一步操作
      ├─ 📖 Study Resources: 标记资源为已学习
      ├─ ✅ Complete: 完成知识点，更新进度
      ├─ ⏭️ Skip: 跳过，记录原因
      ├─ ❓ Ask Question: 调用 /learn:ask
      ├─ 📝 Add Note: 添加学习笔记
      └─ 🎯 Create Issue: 转为开发任务

Phase 6: State Update
   ├─ 更新 progress.json
   │  ├─ current_knowledge_point_id
   │  ├─ completed/in_progress_knowledge_points
   │  ├─ knowledge_point_progress[kp-id]
   │  └─ overall_metrics
   └─ 更新 plan.json → kp.status

Phase 7: Next Step Suggestion
   └─ 检测下一个可执行的 KP
      ├─ 有下一个 → 提示继续 /learn:execute
      └─ 无下一个 → 提示 /learn:review
```

## Implementation

### Phase 1: Session & Plan Discovery

```javascript
// Load global state
const state = JSON.parse(Read('.workflow/learn/state.json'));

// Determine session
const sessionId = flags.session || state.active_session_id;
if (!sessionId) {
  console.log('No active session. Use /learn:plan to create one first.');
  return;
}

const sessionFolder = `.workflow/learn/sessions/${sessionId}`;

// Load plan and progress
const plan = JSON.parse(Read(`${sessionFolder}/plan.json`));
const progress = JSON.parse(Read(`${sessionFolder}/progress.json`));

console.log(`Session: ${sessionId}`);
console.log(`Goal: ${plan.learning_goal}`);
```

### Phase 2: Knowledge Point Selection

```javascript
let targetKpId;

if ($ARGUMENTS.match(/^(KP-\d+|[A-Z]+-\d+)$/)) {
  // Explicit KP ID provided
  targetKpId = RegExp.$1;

  // Validate existence
  const kp = plan.knowledge_points.find(kp => kp.id === targetKpId);
  if (!kp) {
    console.log(`Knowledge point ${targetKpId} not found in plan.`);
    return;
  }
} else {
  // Auto-select next executable KP
  const executableKps = plan.knowledge_points.filter(kp => {
    // Must be pending
    if (kp.status !== 'pending') return false;

    // All prerequisites must be completed
    const prereqsCompleted = kp.prerequisites.every(prereqId =>
      progress.completed_knowledge_points.includes(prereqId)
    );

    return prereqsCompleted;
  });

  if (executableKps.length === 0) {
    console.log(`
## No executable knowledge points found

All tasks completed or blocked by unmet prerequisites.

Completed: ${progress.completed_knowledge_points.length}
In Progress: ${progress.in_progress_knowledge_points.length}

Next: /learn:review
    `);
    return;
  }

  // Priority: execute tasks with fewer dependencies first (leaves of DAG)
  targetKpId = executableKps.sort((a, b) =>
    a.prerequisites.length - b.prerequisites.length
  )[0].id;
}

const kp = plan.knowledge_points.find(kp => kp.id === targetKpId);
```

### Phase 3: Prerequisite Validation

```javascript
if (kp.prerequisites.length > 0) {
  console.log(`\n## Prerequisites`);

  const allCompleted = kp.prerequisites.every(prereqId =>
    progress.completed_knowledge_points.includes(prereqId)
  );

  kp.prerequisites.forEach(prereqId => {
    const prereqKp = plan.knowledge_points.find(k => k.id === prereqId);
    const isCompleted = progress.completed_knowledge_points.includes(prereqId);
    const status = isCompleted ? '✅' : '⏳';

    console.log(`${status} ${prereqId}: ${prereqKp.title}`);
  });

  if (!allCompleted) {
    console.log('\n⚠️ Some prerequisites are not completed yet.');
    console.log('Complete them first with /learn:execute [prereq-id]');
    return;
  }

  console.log('\n✅ All prerequisites completed!\n');
}
```

### Phase 4: Content Display

```javascript
console.log(`
# ${kp.id}: ${kp.title}

**Description**: ${kp.description}

**Estimated Effort**: ${kp.estimated_effort}

---

## 📚 Learning Resources

${kp.resources.map((resource, index) => {
  const emoji = resource.quality === 'gold' ? '🥇' :
                resource.quality === 'silver' ? '🥈' : '🥉';
  const isCompleted = progress.knowledge_point_progress[kp.id]?.resources_completed?.includes(resource.type);

  return `
${index + 1}. ${emoji} **${resource.type}**
   ${resource.summary}
   🔗 [${resource.url}](${resource.url})
   ${isCompleted ? '✅ Completed' : ''}
  `;
}).join('\n')}

---

## 🎯 Assessment

**Type**: ${kp.assessment.type}
**Task**: ${kp.assessment.description}

**Acceptance Criteria**:
${kp.assessment.acceptance_criteria.map(c => `- ${c}`).join('\n')}

---

## 📊 Current Progress

**Status**: ${kp.status}
${progress.knowledge_point_progress[kp.id] ? `
**Started**: ${progress.knowledge_point_progress[kp.id].started_at}
**Resources Completed**: ${progress.knowledge_point_progress[kp.id].resources_completed?.length || 0}
**Assessment Attempts**: ${progress.knowledge_point_progress[kp.id].assessment_attempts || 0}
**Notes**: ${progress.knowledge_point_progress[kp.id].user_notes || 'None'}
` : ''}
`);
```

### Phase 5: User Interaction Loop

```javascript
const answer = AskUserQuestion({
  questions: [{
    question: "What would you like to do?",
    header: "Next Step",
    multiSelect: false,
    options: [
      {
        label: "📖 Study Resources",
        description: "Mark resources as completed (interactive)"
      },
      {
        label: "✅ Complete",
        description: "Mark knowledge point as completed"
      },
      {
        label: "⏭️ Skip",
        description: "Skip this knowledge point"
      },
      {
        label: "❓ Ask Question",
        description: "Get help from learn-mentor-agent"
      },
      {
        label: "📝 Add Note",
        description: "Add personal note or code snippet"
      },
      {
        label: "🎯 Create Issue",
        description: "Convert to development task via issue system"
      }
    ]
  }]
});

const userChoice = answer[Object.keys(answer)[0]];

// Handle user choice
switch (userChoice) {
  case '📖 Study Resources':
    handleStudyResources(kp, progress, sessionFolder);
    break;
  case '✅ Complete':
    handleComplete(kp, plan, progress, sessionFolder);
    break;
  case '⏭️ Skip':
    handleSkip(kp, plan, progress, sessionFolder);
    break;
  case '❓ Ask Question':
    SlashCommand('/learn:ask "I need help understanding this topic"');
    break;
  case '📝 Add Note':
    handleAddNote(kp, progress, sessionFolder);
    break;
  case '🎯 Create Issue':
    handleCreateIssue(kp, sessionId);
    break;
}
```

### Phase 6: State Update

```javascript
function updateProgress(kp, newStatus, progressData) {
  const now = new Date().toISOString();

  // Initialize KP progress if not exists
  if (!progress.knowledge_point_progress[kp.id]) {
    progress.knowledge_point_progress[kp.id] = {
      status: newStatus,
      started_at: now,
      resources_completed: [],
      assessment_attempts: 0,
      user_notes: null,
      interactions: []
    };
  }

  // Update KP progress
  Object.assign(progress.knowledge_point_progress[kp.id], progressData, {
    status: newStatus
  });

  // Update lists
  if (newStatus === 'in_progress' && !progress.in_progress_knowledge_points.includes(kp.id)) {
    progress.in_progress_knowledge_points.push(kp.id);
  } else if (newStatus === 'completed') {
    progress.in_progress_knowledge_points = progress.in_progress_knowledge_points.filter(id => id !== kp.id);
    if (!progress.completed_knowledge_points.includes(kp.id)) {
      progress.completed_knowledge_points.push(kp.id);
    }
  } else if (newStatus === 'skipped') {
    progress.in_progress_knowledge_points = progress.in_progress_knowledge_points.filter(id => id !== kp.id);
  }

  // Update current KP
  progress.current_knowledge_point_id = kp.id;
  progress._metadata.last_updated = now;

  // Write progress.json
  Write(`${sessionFolder}/progress.json`, JSON.stringify(progress, null, 2));
}
```

### Helper Functions

#### handleStudyResources

```javascript
function handleStudyResources(kp, progress, sessionFolder) {
  console.log('\n## Mark resources as completed\n');

  const resourceOptions = kp.resources.map((r, i) => ({
    label: `${i + 1}. ${r.type} (${r.quality})`,
    description: r.summary,
    value: i
  }));

  const answer = AskUserQuestion({
    questions: [{
      question: "Which resources have you completed?",
      header: "Resources",
      multiSelect: true,
      options: resourceOptions
    }]
  });

  const selectedIndices = Object.values(answer)[0];
  const completedTypes = selectedIndices.map(i => kp.resources[i].type);

  // Update progress
  const currentProgress = progress.knowledge_point_progress[kp.id] || {};
  currentProgress.resources_completed = [
    ...(currentProgress.resources_completed || []),
    ...completedTypes
  ];

  updateProgress(kp, 'in_progress', {
    resources_completed: currentProgress.resources_completed,
    overall_metrics: {
      ...progress.overall_metrics,
      resources_consumed: progress.overall_metrics.resources_consumed + selectedIndices.length
    }
  }, progress, sessionFolder);

  console.log(`\n✅ Marked ${selectedIndices.length} resources as completed`);
}
```

#### handleComplete

```javascript
function handleComplete(kp, plan, progress, sessionFolder) {
  console.log(`\n✅ Marking ${kp.id} as completed`);

  // Update plan.json
  const kpIndex = plan.knowledge_points.findIndex(k => k.id === kp.id);
  plan.knowledge_points[kpIndex].status = 'completed';
  Write(`${sessionFolder}/plan.json`, JSON.stringify(plan, null, 2));

  // Update progress.json
  updateProgress(kp, 'completed', {
    completed_at: new Date().toISOString()
  }, progress, sessionFolder);

  console.log(`
## Completed! 🎉

${kp.id}: ${kp.title}

Progress:
- Completed: ${progress.completed_knowledge_points.length}/${plan.knowledge_points.length}
- Remaining: ${plan.knowledge_points.length - progress.completed_knowledge_points.length}

Next: /learn:execute
  `);
}
```

#### handleSkip

```javascript
function handleSkip(kp, plan, progress, sessionFolder) {
  const answer = AskUserQuestion({
    questions: [{
      question: "Why are you skipping this knowledge point?",
      header: "Reason",
      multiSelect: false,
      options: [
        {label: "Already known", description: "I already know this topic"},
        {label: "Not relevant", description: "Not needed for my goal"},
        {label: "Too difficult", description: "Need to learn prerequisites first"},
        {label: "Other", description: "Different reason"}
      ]
    }]
  });

  const reason = Object.values(answer)[0];

  // Update plan.json
  const kpIndex = plan.knowledge_points.findIndex(k => k.id === kp.id);
  plan.knowledge_points[kpIndex].status = 'skipped';
  plan.knowledge_points[kpIndex].skip_reason = reason;
  Write(`${sessionFolder}/plan.json`, JSON.stringify(plan, null, 2));

  // Update progress.json
  updateProgress(kp, 'skipped', {
    skipped_at: new Date().toISOString(),
    skip_reason: reason
  }, progress, sessionFolder);

  console.log(`\n⏭️ Skipped ${kp.id} (${reason})`);
}
```

#### handleAddNote

```javascript
function handleAddNote(kp, progress, sessionFolder) {
  console.log('\n## Add Note\n');
  console.log('Enter your note (markdown supported):');
  console.log('Type END on a new line when done.\n');

  // In actual implementation, this would be multi-line input
  // For now, we'll use a simple approach
  const note = "User's note here"; // TODO: Implement proper input

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').substring(0, 19);
  const noteFile = `${sessionFolder}/interactions/notes/note-${timestamp}.md`;

  // Ensure directory exists
  Bash(`mkdir -p ${sessionFolder}/interactions/notes`);

  Write(noteFile, `# Note for ${kp.id}\n\n**Date**: ${new Date().toISOString()}\n\n${note}`);

  // Update progress
  const currentProgress = progress.knowledge_point_progress[kp.id] || {};
  currentProgress.user_notes = note;
  currentProgress.note_file = noteFile;

  updateProgress(kp, kp.status || 'in_progress', {
    user_notes: note,
    note_file: noteFile
  }, progress, sessionFolder);

  console.log(`\n✅ Note saved to ${noteFile}`);
}
```

#### handleCreateIssue

```javascript
function handleCreateIssue(kp, sessionId) {
  console.log('\n## Creating Issue\n');

  const issueTitle = `Learn: ${kp.title}`;
  const issueBody = `
# Knowledge Point: ${kp.id}

**Description**: ${kp.description}

**Learning Goal**: ${plan.learning_goal}

**Resources**:
${kp.resources.map(r => `- [${r.type}](${r.url}): ${r.summary}`).join('\n')}

**Assessment**:
- Type: ${kp.assessment.type}
- Task: ${kp.assessment.description}

**Acceptance Criteria**:
${kp.assessment.acceptance_criteria.map(c => `- ${c}`).join('\n')}

---

Generated from learn session: ${sessionId}
  `.trim();

  console.log(`Creating issue: ${issueTitle}`);
  console.log(`Body preview:\n${issueBody.substring(0, 200)}...\n`);

  // Execute CLI command to create issue
  const result = Bash(`
    ccw issue create \\
      --title "${issueTitle.replace(/"/g, '\\"')}" \\
      --body "${issueBody.replace(/"/g, '\\"').replace(/\n/g, '\\n')}" \\
      --label learning-task,${sessionId}
  `);

  console.log(`\n✅ Issue created! Use /issue:list to view it.`);
}
```

## Error Handling

| Error | Resolution |
|-------|------------|
| No active session | Prompt user to run `/learn:plan` first |
| KP ID not found | List available KP IDs from plan.json |
| Prerequisites not met | Show dependency chain, suggest order |
| Progress file corrupted | Rebuild from plan.json (fallback) |
| Issue creation fails | Show error, suggest manual creation |

## Quality Checklist

Before completing execution, verify:

- [ ] KP prerequisites validated
- [ ] Resources displayed with quality badges
- [ ] Assessment criteria shown
- [ ] User choice captured
- [ ] progress.json updated
- [ ] plan.json updated (kp.status)
- [ ] Next step suggested
- [ ] Notes/interactions saved (if applicable)

## Related Commands

**Requires**:
- `/learn:plan` - Creates the session and plan.json

**Can trigger**:
- `/learn:ask` - For mentor Q&A
- `ccw issue create` - To convert KP to issue

**Followed by**:
- `/learn:execute` - Continue with next KP
- `/learn:review` - Review completed session

## Examples

### Example 1: Execute Next KP

```bash
User: /learn:execute

Output:
Session: LS-20250124-001
Goal: Master React Server Components

# KP-1: Understanding Server Components

**Description**: Learn the fundamentals of React Server Components...

[Resources and assessment displayed...]

What would you like to do?
1. 📖 Study Resources
2. ✅ Complete
3. ⏭️ Skip
4. ❓ Ask Question
5. 📝 Add Note
6. 🎯 Create Issue
```

### Example 2: Complete a KP

```bash
User: [Selects ✅ Complete]

Output:
✅ Marking KP-1 as completed

## Completed! 🎉

KP-1: Understanding Server Components

Progress:
- Completed: 1/5
- Remaining: 4

Next: /learn:execute
```

### Example 3: Create Issue

```bash
User: [Selects 🎯 Create Issue]

Output:
Creating issue: Learn: Understanding Server Components

✅ Issue created! Use /issue:list to view it.
```

## Progress Tracking

**State Persistence**:
- `progress.json` updated on every interaction
- `plan.json` updated when KP status changes
- Notes saved to `interactions/notes/`

**Metrics Collected**:
- Total time spent (future: track start/end times)
- Resources consumed
- Questions asked (via /learn:ask)
- Assessment attempts

**Resume Capability**:
- Can resume any time with `/learn:execute`
- Progress never lost
- Can skip and return later
