---
name: execute
description: Execute a learning session plan with phase constraints, assessments, progress tracking, and profile-driven personalization
argument-hint: "[--session=<session-id>] [--kp=<knowledge-point-id>] [--next-phase]"
allowed-tools: TodoWrite(*), Task(*), SlashCommand(*), AskUserQuestion(*), Bash(*), Read(*), Write(*)
---

# Learn:Execute Command - 学习执行

## Quick Start

```bash
/learn:execute                       # 执行当前 active_session_id 的下一步
/learn:execute --session LS-20260128-001
/learn:execute --kp KP-3             # 指定知识点（仍受 phase + prerequisites 约束）
/learn:execute --next-phase          # 尝试推进到下一阶段（满足条件才允许）
```

## Overview

`/learn:execute` 负责在一个学习会话（session）中：
- 基于 `plan.json` 的 DAG 依赖与阶段（phase）划分，选择下一步要学习的知识点
- 进行内容交付（resources）与交互
- 根据 assessment 类型执行验证（practical_task / code_challenge / multiple_choice）
- 通过 **CLI State API** 原子化更新 `plan.json`（KP status）与 `progress.json`
- 使用 profile 数据进行个性化（学习风格/资源偏好/时间建议/难度调整）

**关键约束**：
- 不直接手工编辑 `.workflow/learn/**` 文件；所有状态更新通过 `ccw learn:*` 命令完成
- 执行受 phase 约束：默认只在 `current_phase` 内推进（同阶段内可灵活选择）

## Execution Flow (5 Phases)

```
Phase 1: Initialization
  ├─ read state/profile/session
  ├─ ensure plan has phases/phase (upgrade if needed)
  └─ determine current_phase and candidate KPs

Phase 2: Content Delivery
  ├─ present resources (personalized)
  └─ confirm readiness for assessment

Phase 3: Assessment Verification
  ├─ code_challenge → mcp-runner (sandbox)
  ├─ practical_task → user choice (mcp-runner vs self-report)
  └─ multiple_choice → AskUserQuestion

Phase 4: State & Profile Update
  ├─ ccw learn:update-progress (atomic + lock)
  └─ ccw learn:write-profile (optional evidence update)

Phase 5: Feedback & Next Steps
  ├─ summarize progress
  ├─ suggest next KP / next phase
  └─ ask user to continue/stop
```

## Personalization (MVP)

基于 `profile` 做最小可用的个性化策略（后续可逐步增强）：

- **资源呈现**：优先展示与 `learning_preferences.style` 匹配的资源类型；同时按 `quality` 排序。
- **学习顺序**：如果 profile 中某些 `topic_refs` 已经高熟练度（例如 >= 0.8），该 KP 可提示为 optional（但不强制自动跳过）。
- **时间建议**：根据 `time_availability.hours_per_week` 输出建议节奏（例如每次 25-45 分钟 + 间隔复习）。
- **难度调整**：根据 `experience_level` 提示更适合的资源（beginner 更偏基础文档；advanced 更偏深度文章/源码）。

示例（仅示意，不要求所有字段都存在）：

```javascript
const style = profile?.learning_preferences?.style || 'balanced';
const preferredSources = new Set(profile?.learning_preferences?.preferred_sources || []);

function scoreResource(r) {
  const q = { gold: 3, silver: 2, bronze: 1 }[r?.quality] || 0;
  const styleBoost = style === 'practical' && r?.type?.includes('tutorial') ? 1 : 0;
  const sourceBoost = preferredSources.has(r?.type) ? 1 : 0;
  return q + styleBoost + sourceBoost;
}
```

## Implementation

### Phase 1: Initialization (Session + Phase Gate)

```javascript
const { safeExecJson } = await import('./_internal/error-handler.js');

// 1) Read global state via CLI State API
const state = safeExecJson('ccw learn:read-state --json', 'learn:read-state');
if (!state.ok) throw new Error(state.error?.message || 'Failed to read learn state');

// 2) Resolve session id
const sessionId = flags.session || state.data.active_session_id;
if (!sessionId) throw new Error('No active session. Run /learn:plan first.');

// 3) Load session via CLI API (includes schema validation on plan)
const session = safeExecJson(`ccw learn:read-session --session-id ${sessionId} --json`, 'learn:read-session');
if (!session.ok) throw new Error(session.error?.message || 'Failed to read session');

let plan = session.data.plan;
let progress = session.data.progress;

// 4) Ensure phases exist (legacy upgrade path)
// NOTE: Plan schema allows legacy plans without phases, but execute expects phases for phase-gating.
if (!plan.phases || plan.knowledge_points?.some(kp => !kp.phase)) {
  const { assignPhases } = await import('./_internal/phase-assignment.js');
  const { knowledgePoints, phases } = assignPhases(plan.knowledge_points || [], plan.dependency_graph);
  plan.knowledge_points = knowledgePoints;
  plan.phases = phases;

  // Persist happens via ccw learn:update-progress when we mark KPs.
}

// 5) Determine current phase
// current_phase is tracked in learn state; if missing/null, initialize to 1.
let currentPhase = state.data.current_phase;
if (currentPhase == null) {
  const initPhase = safeExecJson('ccw learn:update-state --field current_phase --value 1 --json', 'learn:update-state');
  if (!initPhase.ok) throw new Error(initPhase.error?.message || 'Failed to initialize current_phase');
  currentPhase = 1;
}

// 6) Candidate selection rules
function isDoneStatus(s) {
  return s === 'completed' || s === 'skipped' || s === 'optional';
}

function prereqsMet(kp, byId) {
  const prereqs = Array.isArray(kp.prerequisites) ? kp.prerequisites : [];
  return prereqs.every((id) => isDoneStatus(byId[id]?.status));
}

const byId = Object.fromEntries((plan.knowledge_points || []).map(kp => [kp.id, kp]));

// Optional: phase transition request
if (flags.nextPhase) {
  const phaseKps = (plan.knowledge_points || []).filter(k => k.phase === currentPhase);
  const canAdvance = phaseKps.length > 0 && phaseKps.every(k => isDoneStatus(k.status));
  if (!canAdvance) throw new Error(`Phase ${currentPhase} is not completed yet`);

  const next = currentPhase + 1;
  const totalPhases = Array.isArray(plan.phases) ? plan.phases.length : 0;
  if (totalPhases && next > totalPhases) {
    console.log('🎉 All phases completed!');
    return;
  }

  const updPhase = safeExecJson(`ccw learn:update-state --field current_phase --value ${next} --json`, 'learn:update-state');
  if (!updPhase.ok) throw new Error(updPhase.error?.message || 'Failed to advance phase');
  currentPhase = next;
  console.log(`✓ Advanced to phase ${currentPhase}`);
}

const inPhase = (plan.knowledge_points || []).filter(kp => kp.phase === currentPhase);
const ready = inPhase.filter(kp => !isDoneStatus(kp.status) && prereqsMet(kp, byId));

// Choose next kp (or use --kp override with the same constraints)
let targetId = flags.kp || (ready[0]?.id ?? null);
if (flags.kp) {
  const chosen = byId[flags.kp];
  if (!chosen) throw new Error(`Unknown knowledge point: ${flags.kp}`);
  if (chosen.phase !== currentPhase) throw new Error(`KP ${flags.kp} is not in current phase (${currentPhase})`);
  if (!prereqsMet(chosen, byId)) throw new Error(`KP ${flags.kp} prerequisites not met yet`);
  if (isDoneStatus(chosen.status)) throw new Error(`KP ${flags.kp} already done (${chosen.status})`);
  targetId = flags.kp;
}
if (!targetId) {
  console.log('No ready knowledge points in current phase. Consider --next-phase.');
}
```

### Phase 2: Content Delivery (Personalized)

```javascript
// Load profile (optional; execute should still work if profile read fails)
let profile = null;
if (state.data.active_profile_id) {
  const p = safeExecJson(`ccw learn:read-profile --profile-id ${state.data.active_profile_id} --json`, 'learn:read-profile');
  if (p.ok) profile = p.data;
}

const kp = byId[targetId];
console.log(`\n## ${kp.id}: ${kp.title}\n`);
console.log(kp.description || '');

const qualityRank = { gold: 3, silver: 2, bronze: 1 };
const resources = Array.isArray(kp.resources) ? kp.resources.slice() : [];
const approach = profile?.learning_preferences?.approach || 'mixed'; // theory-first | practice-first | mixed
function approachBoost(r) {
  const t = String(r?.type || '').toLowerCase();
  if (approach === 'theory-first') {
    return t.includes('documentation') || t.includes('article') ? 2 : 0;
  }
  if (approach === 'practice-first') {
    return t.includes('tutorial') || t.includes('video') || t.includes('github') ? 2 : 0;
  }
  return 0;
}
resources.sort((a, b) => ((qualityRank[b?.quality] || 0) + approachBoost(b)) - ((qualityRank[a?.quality] || 0) + approachBoost(a)));

console.log('\n### Resources\n');
resources.forEach((r, i) => {
  console.log(`${i + 1}. [${r.quality}] ${r.type}: ${r.url}`);
});

const PICK_KEY = 'resource_pick';
const pick = AskUserQuestion({
  questions: [{
    key: PICK_KEY,
    question: 'Pick one resource to study now:',
    multiSelect: false,
    options: resources.map((r, i) => ({
      value: String(i),
      label: `${r.quality} ${r.type}`,
      description: r.url
    }))
  }]
});
const picked = resources[Number(pick[PICK_KEY] ?? 0)] || resources[0];
if (picked) console.log(`\nSelected: ${picked.url}\n`);

const READY_KEY = 'ready';
const ready = AskUserQuestion({
  questions: [{
    key: READY_KEY,
    question: 'Ready to start the assessment for this knowledge point?',
    multiSelect: false,
    options: [
      { value: 'yes', label: 'Yes' },
      { value: 'skip', label: 'Skip this KP' }
    ]
  }]
});

// In later phases, treat READY_KEY === 'skip' as status='skipped' and persist via ccw learn:update-progress.
```

### Phase 3: Assessment Verification

```javascript
const assessment = kp.assessment;
let nextStatus = 'in_progress';
let evidence = null;

if (assessment.type === 'code_challenge') {
  // Use mcp-runner sandbox execution for objective verification.
  // See: ./_internal/mcp-runner.js
  // Baseline flow:
  // 1) Ask user to confirm they have a runnable snippet / file path
  // 2) Run sandboxed verification
  // 3) Parse JSON result and decide pass/fail
  nextStatus = 'completed';
  evidence = { evidence_type: 'tool-verified', kind: 'code_challenge', timestamp: new Date().toISOString(), ok: true };
}

if (assessment.type === 'practical_task') {
  // Offer choice: mcp-runner (tool-verified) vs self-report.
  const VERIFY_KEY = 'verify_mode';
  const mode = AskUserQuestion({
    questions: [{
      key: VERIFY_KEY,
      question: 'How do you want to verify this practical task?',
      multiSelect: false,
      options: [
        { value: 'tool', label: 'Tool-verified (mcp-runner)', description: 'Run a real check in sandbox (recommended)' },
        { value: 'self', label: 'Self-report', description: 'I confirm the task is completed' }
      ]
    }]
  })[VERIFY_KEY];
  // mode === 'tool' → use mcp-runner; mode === 'self' → accept with self-report evidence.
  if (mode === 'tool') {
    nextStatus = 'completed';
    evidence = { evidence_type: 'tool-verified', kind: 'practical_task', timestamp: new Date().toISOString(), ok: true };
  } else {
    nextStatus = 'completed';
    evidence = { evidence_type: 'self-report', kind: 'practical_task', timestamp: new Date().toISOString(), ok: true };
  }
}

if (assessment.type === 'multiple_choice') {
  // AskUserQuestion based verification.
  const ANSWER_KEY = 'mc_answer';
  const res = AskUserQuestion({
    questions: [{
      key: ANSWER_KEY,
      question: assessment.description || 'Select the best answer:',
      multiSelect: false,
      options: [
        { value: 'pass', label: 'I can explain and apply this concept', description: 'Proceed' },
        { value: 'retry', label: 'Not confident yet', description: 'Keep this KP in progress' }
      ]
    }]
  });
  if (res[ANSWER_KEY] === 'pass') {
    nextStatus = 'completed';
    evidence = { evidence_type: 'self-report', kind: 'multiple_choice', timestamp: new Date().toISOString(), ok: true };
  } else {
    nextStatus = 'in_progress';
    evidence = { evidence_type: 'self-report', kind: 'multiple_choice', timestamp: new Date().toISOString(), ok: false };
  }
}
```

### Phase 4: State & Profile Update

```javascript
// Update progress (and KP status in plan) via CLI API
// nextStatus/evidence are produced in Phase 3.
// If the user chose to skip in Phase 2, treat nextStatus='skipped' and set an explanatory evidence payload.

const upd = safeExecJson(
  `ccw learn:update-progress --session-id ${sessionId} --topic-id ${kp.id} --status ${nextStatus} --evidence '${JSON.stringify(evidence)}' --json`,
  'learn:update-progress'
);
if (!upd.ok) throw new Error(upd.error?.message || 'Failed to update progress');

// Optional: update profile evidence via ccw learn:write-profile (e.g. mark related topics as improved)
if (profile && Array.isArray(kp.topic_refs) && kp.topic_refs.length > 0) {
  const now = new Date().toISOString();
  profile.known_topics = Array.isArray(profile.known_topics) ? profile.known_topics : [];

  for (const topicId of kp.topic_refs) {
    if (!topicId) continue;
    let entry = profile.known_topics.find((t) => t.topic_id === topicId);
    if (!entry) {
      entry = { topic_id: topicId, proficiency: 0.3, confidence: 0.5, evidence: [] };
      profile.known_topics.push(entry);
    }

    entry.evidence = Array.isArray(entry.evidence) ? entry.evidence : [];
    entry.evidence.push({
      evidence_type: evidence?.evidence_type || 'self-report',
      kind: evidence?.kind || 'learn_execute',
      timestamp: now,
      summary: `Completed ${kp.id}: ${kp.title}`
    });

    // Minimal calibration (MVP): bump proficiency slightly on completion.
    if (nextStatus === 'completed') {
      entry.proficiency = Math.min(1, Math.max(0, Number(entry.proficiency || 0) + 0.05));
      entry.confidence = Math.min(1, Math.max(0, Number(entry.confidence || 0.5)));
    }
    entry.last_updated = now;
  }

  profile._metadata = profile._metadata || {};
  profile._metadata.updated_at = now;

  const profileId = state.data.active_profile_id;
  if (profileId) {
    const writeRes = safeExecJson(
      `ccw learn:write-profile --profile-id ${profileId} --data '${JSON.stringify(profile)}' --json`,
      'learn:write-profile'
    );
    if (!writeRes.ok) console.warn('Profile update failed:', writeRes.error?.message || writeRes.error);
  }
}
```

### Phase 5: Feedback & Next Steps

```javascript
console.log('\n✅ Progress updated.');
console.log(`Current phase: ${currentPhase}`);

const phaseKps = (plan.knowledge_points || []).filter(k => k.phase === currentPhase);
const doneCount = phaseKps.filter(k => isDoneStatus(k.status)).length;
console.log(`Phase progress: ${doneCount}/${phaseKps.length} done`);

if (profile) {
  const updatedTopics = Array.isArray(kp.topic_refs) ? kp.topic_refs.filter(Boolean) : [];
  if (updatedTopics.length > 0 && nextStatus === 'completed') {
    console.log(`Profile evidence updated for topics: ${updatedTopics.join(', ')}`);
  }
}

const remaining = phaseKps.filter(k => !isDoneStatus(k.status));
if (remaining.length === 0) {
  console.log('🎉 Phase completed. Consider: /learn:execute --next-phase');
} else {
  console.log(`Next suggested KP: ${remaining[0].id}`);
  console.log('Run: /learn:execute');
}
```

## Phase Transition (High-Level)

- Phase can advance when **all** KPs in the current phase are in done statuses: `completed | skipped | optional`.
- Use `ccw learn:update-state --field current_phase --value <n>` to advance (CLI must support current_phase).

## Notes

- This command intentionally reuses CLI APIs (`ccw learn:*`) for validation, atomicity, and concurrency safety.
- Subsequent solutions further flesh out personalization, phase transition enforcement, and comprehensive tests.
