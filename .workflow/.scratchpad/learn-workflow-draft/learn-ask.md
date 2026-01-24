---
name: ask
description: Interactive mentor Q&A with context-aware guidance based on current knowledge point and user profile
argument-hint: "\"<question>\" [--knowledge-point=<kp-id>]"
allowed-tools: Task(*), Read(*), Write(*), Bash(*)
---

# Learn:Ask Command - 导师问答

## Quick Start

```bash
/learn:ask "What's the difference between Pick and Omit?"
/learn:ask "Can you explain conditional types with an example?"
/learn:ask "How do I handle async errors properly?" --knowledge-point KP-3
```

## Overview

`/learn:ask` 是 learn workflow 的智能导师系统，提供：
- 基于当前知识点的上下文问答
- 个性化解释（根据用户水平调整）
- 代码示例和实践指导
- 交互历史记录

**核心特性**：
- **上下文感知**：自动加载当前知识点和用户档案
- **个性化**：根据用户经验水平调整解释深度
- **导师级**：提供渐进式、实践导向的回答
- **持久化**：所有问答记录保存，可回顾

## Execution Process

```
Input Parsing:
   └─ 解析问题文本 + 可选 kp-id

Phase 1: Context Gathering
   ├─ 读取 state.json → active_session_id + active_profile_id
   ├─ 加载 profile.json
   │  ├─ experience_level
   │  ├─ known_topics (技能背景)
   │  └─ learning_preferences (学习偏好)
   ├─ 加载当前 session
   │  ├─ plan.json → 所有知识点
   │  └─ progress.json → 当前进度 + 交互历史
   └─ 确定目标知识点
      ├─ --knowledge-point 指定 → 使用指定的 KP
      └─ 否则 → 使用 progress.current_knowledge_point_id

Phase 2: Agent Invocation
   ├─ 构建完整上下文
   │  ├─ 用户问题
   │  ├─ 知识点上下文 (title, description, resources, assessment)
   │  ├─ 用户档案 (level, known_topics, preferences)
   │  └─ 相关历史交互 (recent Q&A)
   └─ 调用 learn-mentor-agent
      ├─ Task(tool="learn-mentor-agent")
      └─ 传递：完整上下文 + 回答原则

Phase 3: Response Processing
   ├─ 解析 agent 输出
   │  ├─ 直接回答
   │  ├─ 代码示例（如适用）
   │  ├─ 延伸学习建议
   │  └─ 相关知识点链接
   └─ 格式化展示给用户

Phase 4: Interaction Recording
   ├─ 生成 Q&A 文件：interactions/ask-{timestamp}.md
   │  ├─ 问题
   │  ├─ 上下文快照
   │  └─ 回答全文
   ├─ 更新 progress.json
   │  └─ knowledge_point_progress[].interactions
   └─ 更新 overall_metrics.questions_asked

Phase 5: Follow-up Suggestions
   └─ 根据回答内容，建议后续操作
      ├─ 继续学习：/learn:execute
      ├─ 相关资源：查看特定资源
      ├─ 实践建议：尝试某个练习
      └─ 深入学习：推荐相关知识点
```

## Implementation

### Phase 1: Context Gathering

```javascript
// Load global state
const state = JSON.parse(Read('.workflow/learn/state.json'));
const sessionId = state.active_session_id;

if (!sessionId) {
  console.log('No active session. Use /learn:plan first.');
  return;
}

// Load profile
const profileId = state.active_profile_id;
const profile = JSON.parse(Read(`.workflow/learn/profiles/${profileId}.json`));

// Load session data
const sessionFolder = `.workflow/learn/sessions/${sessionId}`;
const plan = JSON.parse(Read(`${sessionFolder}/plan.json`));
const progress = JSON.parse(Read(`${sessionFolder}/progress.json`));

// Determine target knowledge point
let kpId;
const kpMatch = $ARGUMENTS.match(/--knowledge-point=(\S+)/);

if (kpMatch) {
  kpId = kpMatch[1];
} else {
  kpId = progress.current_knowledge_point_id;
}

if (!kpId) {
  console.log('No knowledge point in context. Use /learn:execute first.');
  return;
}

const kp = plan.knowledge_points.find(k => k.id === kpId);
const kpProgress = progress.knowledge_point_progress[kpId] || {};

// Load recent interactions (last 5)
const recentInteractions = (kpProgress.interactions || [])
  .slice(-5)
  .map(interaction => {
    const interactionFile = `${sessionFolder}/${interaction.file}`;
    try {
      const content = Read(interactionFile);
      return {
        type: interaction.type,
        timestamp: interaction.timestamp,
        file: interaction.file,
        preview: content.substring(0, 200) + '...'
      };
    } catch (e) {
      return null;
    }
  })
  .filter(i => i !== null);

console.log(`
## Context
**Knowledge Point**: ${kp.id} - ${kp.title}
**Experience Level**: ${profile.experience_level}
**Related Skills**: ${profile.known_topics.filter(t => t.proficiency > 0.5).map(t => t.topic_id).join(', ')}
`);
```

### Phase 2: Agent Invocation

```javascript
const userQuestion = $ARGUMENTS.replace(/--knowledge-point=\S+/, '').trim();

const agentResponse = Task({
  subagent_type: "learn-mentor-agent",
  run_in_background: false,
  description: `Answer question about ${kp.id}`,
  prompt: `
## Mentor Task
Answer the user's question about the current knowledge point with personalized, context-aware guidance.

## User Question
${userQuestion}

## Knowledge Point Context
**ID**: ${kp.id}
**Title**: ${kp.title}
**Description**: ${kp.description}

**Resources**:
${kp.resources.map(r => `- [${r.type}] ${r.url}: ${r.summary}`).join('\n')}

**Assessment**:
- Type: ${kp.assessment.type}
- Task: ${kp.assessment.description}

## User Profile
**Experience Level**: ${profile.experience_level}
**Learning Style**: ${profile.learning_preferences.style}

**Known Topics** (background):
${profile.known_topics.map(t => `- ${t.topic_id}: ${(t.proficiency * 100).toFixed(0)}% proficiency`).join('\n')}

**Learning Preferences**:
- Preferred sources: ${profile.learning_preferences.preferred_sources.join(', ')}

## Recent Interactions
${recentInteractions.length > 0 ? recentInteractions.map((i, idx) => `
${idx + 1}. [${i.timestamp}] ${i.type}
   ${i.preview}
`).join('\n') : 'No recent interactions'}

## Answering Principles

1. **Personalization**:
   - Adjust depth based on experience_level (${profile.experience_level})
   - If beginner: focus on intuition, simple examples
   - If advanced: dive into nuances, edge cases, internals
   - Reference known_topics to build on existing knowledge

2. **Practice-Oriented**:
   - Provide executable code examples
   - Show before/after comparisons
   - Include common pitfalls and how to avoid them
   - Link to assessment task if relevant

3. **Progressive Disclosure**:
   - Start with simple explanation
   - Add complexity gradually
   - Build mental models step by step
   - Use analogies for abstract concepts

4. **Contextual Relevance**:
   - Tie answer back to current knowledge point
   - Reference provided resources when applicable
   - Connect to related topics in known_topics
   - Consider recent Q&A to avoid repetition

5. **Learning Style Adaptation**:
   - If style = "practical": emphasize code, examples, exercises
   - If style = "theoretical": explain concepts, principles, design patterns
   - If style = "visual": suggest diagrams, visual representations

## Output Format

### Direct Answer
[Clear, concise answer to the question]

### Code Example (if applicable)
\`\`\`language
[Executable code example]
\`\`\`

### Explanation
[Why this works, key insights]

### Common Pitfalls
[What beginners often get wrong]

### Related Learning
- Resources to review: [specific resources from KP]
- Practice: [suggested exercise related to assessment]
- Next: [related knowledge point if applicable]

### Additional Notes
[Any tips, tricks, or nuances]
`
});

// Wait for agent to complete
const answer = agentResponse;
```

### Phase 3: Response Processing & Display

```javascript
console.log(`
# Answer to: "${userQuestion}"

${answer}

---

📚 **Want to learn more?**
- View all resources: /learn:execute ${kp.id}
- Practice with assessment: ${kp.assessment.type}
- Ask another question: /learn:ask "your question"
`);
```

### Phase 4: Interaction Recording

```javascript
// Generate Q&A file
const timestamp = new Date().toISOString().replace(/[:.]/g, '-').substring(0, 19);
const qaFile = `${sessionFolder}/interactions/ask-${timestamp}.md`;

const qaContent = `# Q&A: ${userQuestion.substring(0, 50)}...

**Knowledge Point**: ${kp.id} - ${kp.title}
**Date**: ${new Date().toISOString()}
**User Level**: ${profile.experience_level}

## Question

${userQuestion}

## Context

**Knowledge Point**: ${kp.title}
**Description**: ${kp.description}

**User Profile**:
- Experience: ${profile.experience_level}
- Known Topics: ${profile.known_topics.map(t => `${t.topic_id} (${(t.proficiency * 100).toFixed(0)}%)`).join(', ')}

## Answer

${answer}

---

**Session**: ${sessionId}
**Auto-generated by learn:ask command**
`;

// Ensure directory exists
Bash(`mkdir -p ${sessionFolder}/interactions`);

// Write Q&A file
Write(qaFile, qaContent);

// Update progress.json
if (!progress.knowledge_point_progress[kp.id]) {
  progress.knowledge_point_progress[kp.id] = {
    status: 'in_progress',
    started_at: new Date().toISOString(),
    resources_completed: [],
    assessment_attempts: 0,
    user_notes: null,
    interactions: []
  };
}

progress.knowledge_point_progress[kp.id].interactions.push({
  type: 'ask',
  timestamp: new Date().toISOString(),
  file: `interactions/ask-${timestamp}.md`
});

// Update metrics
progress.overall_metrics.questions_asked = (progress.overall_metrics.questions_asked || 0) + 1;
progress._metadata.last_updated = new Date().toISOString();

// Write progress.json
Write(`${sessionFolder}/progress.json`, JSON.stringify(progress, null, 2));

console.log(`\n✅ Q&A saved to: ${qaFile}`);
```

### Phase 5: Follow-up Suggestions

```javascript
// Analyze answer to provide smart suggestions
const suggestions = [];

// Suggest practice if answer includes code
if (answer.includes('```')) {
  suggestions.push('💡 Try the code example in your editor');
}

// Suggest resource review if related
if (kp.resources.length > 0) {
  suggestions.push(`📚 Review resources: ${kp.resources[0].type}`);
}

// Suggest assessment if ready
const kpProgress = progress.knowledge_point_progress[kp.id];
if (kpProgress && kpProgress.resources_completed && kpProgress.resources_completed.length > 0) {
  suggestions.push(`🎯 Ready for assessment: ${kp.assessment.type}`);
}

// Suggest next KP if dependencies met
if (progress.completed_knowledge_points.includes(kp.id)) {
  const nextKps = plan.knowledge_points.filter(nkp =>
    nkp.prerequisites.includes(kp.id) &&
    nkp.status === 'pending' &&
    nkp.prerequisites.every prereqId => progress.completed_knowledge_points.includes(prereqId)
  );

  if (nextKps.length > 0) {
    suggestions.push(`➡️ Next: ${nextKps[0].id} - ${nextKps[0].title}`);
  } else {
    suggestions.push('🏆 All knowledge points completed! Use /learn:review');
  }
}

if (suggestions.length > 0) {
  console.log('\n## Suggestions\n');
  suggestions.forEach(s => console.log(s));
}
```

## Answer Quality Guidelines

### For Beginner Users

**Characteristics**:
- Start with intuition, avoid jargon initially
- Use simple, relatable analogies
- One concept at a time
- Clear "what", "why", "how" structure
- Code examples with comments

**Example Structure**:
```
1. Simple Explanation (what)
2. Why it matters (motivation)
3. Basic Example (how)
4. Common Mistakes to Avoid
```

### For Intermediate Users

**Characteristics**:
- Assume some familiarity with basics
- Connect to related concepts they know
- Show trade-offs and when to use what
- Include production-ready patterns
- Reference official documentation

**Example Structure**:
```
1. Technical Explanation (with nuances)
2. Comparison with alternatives
3. Production Example
4. Best Practices
5. Performance Considerations
```

### For Advanced Users

**Characteristics**:
- Dive into internals and edge cases
- Discuss implementation details
- Advanced patterns and optimizations
- Source code references
- Architectural implications

**Example Structure**:
```
1. Deep Technical Analysis
2. Internals and Implementation
3. Advanced Patterns
4. Performance Optimization
5. Edge Cases and Gotchas
```

## Learning Style Adaptation

### Practical Style
- Emphasize code examples
- Show before/after
- Provide exercises
- Focus on "how to"

### Theoretical Style
- Explain concepts and principles
- Discuss design patterns
- Compare approaches
- Focus on "why"

### Visual Style
- Suggest diagrams
- Use tables for comparisons
- Reference visual resources
- Focus on mental models

## Error Handling

| Error | Resolution |
|-------|------------|
| No active session | Prompt to use `/learn:plan` first |
| KP not in context | Suggest `/learn:execute` first |
| Agent timeout | Retry with simplified context |
| Profile missing | Use default intermediate level |
| Question too vague | Ask for clarification |

## Quality Checklist

Before completing, verify:

- [ ] User question captured accurately
- [ ] KP context loaded (title, description, resources)
- [ ] User profile loaded (level, known_topics, preferences)
- [ ] Agent response received and formatted
- [ ] Q&A file saved to interactions/
- [ ] progress.json updated (interactions, metrics)
- [ ] Follow-up suggestions provided
- [ ] User can continue learning seamlessly

## Related Commands

**Context From**:
- `/learn:execute` - Sets current_knowledge_point_id
- `/learn:profile` - Provides user background

**Can Trigger**:
- `/learn:execute` - To apply what was learned
- `/learn:review` - If all KPs completed

## Examples

### Example 1: Beginner Question

```bash
User: /learn:ask "What's a type in TypeScript?"

Output:
## Context
**Knowledge Point**: KP-1 - TypeScript Basics
**Experience Level**: beginner

# Answer to: "What's a type in TypeScript?"

## Direct Answer
Think of a type like a label on a box 📦. It tells you what's inside before you open it.

[...detailed explanation with beginner-friendly examples...]
```

### Example 2: Intermediate Question

```bash
User: /learn:ask "When should I use Pick vs Omit?"

Output:
## Context
**Knowledge Point**: KP-2 - Utility Types
**Experience Level**: intermediate
**Related Skills**: typescript (70%), react (50%)

# Answer to: "When should I use Pick vs Omit?"

## Direct Answer
Both \`Pick\` and \`Omit\` create new types by selecting properties, but they work in opposite directions...

[...technical explanation with comparisons...]
```

### Example 3: Advanced Question

```bash
User: /learn:ask "How does TypeScript infer conditional types?"

Output:
## Context
**Knowledge Point**: KP-5 - Advanced Type System
**Experience Level**: advanced

# Answer to: "How does TypeScript infer conditional types?"

## Direct Answer
TypeScript uses a process called "unification" to infer conditional types...

[...deep dive into type system internals...]
```

## Interaction History

All Q&A interactions are preserved in:
```
.workflow/learn/sessions/{session-id}/interactions/
├── ask-20250124-103000.md
├── ask-20250124-141500.md
└── notes/
    └── note-*.md
```

This creates a searchable knowledge base of the user's learning journey.

## Performance Considerations

- **Context Loading**: ~50-200ms per call (file I/O)
- **Agent Execution**: ~5-30s depending on question complexity
- **Storage Growth**: ~1-5KB per Q&A interaction
- **Memory**: Recent 5 interactions loaded per call

Optimization strategies:
- Lazy load profile (cache in memory)
- Compress old interactions
- Index Q&A for search (future enhancement)
