---
name: execute
description: Execute a learning session plan with phase-based progression and backward-compatible plan upgrades
argument-hint: "[--session=<session-id>] [--kp=<knowledge-point-id>]"
allowed-tools: TodoWrite(*), Task(*), SlashCommand(*), AskUserQuestion(*), Bash(*), Read(*), Write(*)
---

# Learn:Execute Command - 学习执行

## Overview

`/learn:execute` 负责在一个学习会话（session）中按阶段（phase）推进知识点（knowledge points）的学习与验证。

本文件在完整实现前先提供一个关键的兼容性约束：**当 plan.json 还是旧格式（缺少 phases / kp.phase）时，必须在初始化阶段自动补全并原子写回**，保证后续执行流程与 schema 校验一致。

## Initialization: Ensure phases (Backward Compatibility)

```javascript
// Backward compatibility: upgrade legacy plans before any execution logic.
//
// - learn-plan.schema.json now requires:
//   - plan.phases (root-level)
//   - knowledge_points[].phase
//
// This init step ensures:
// - Existing sessions created before phases support can still run.
// - We upgrade + validate + atomically write back plan.json.

const { safeReadJson, safeExecJson } = await import('./_internal/error-handler.js');

function assignPhasesFallback(knowledgePoints) {
  const kps = Array.isArray(knowledgePoints) ? knowledgePoints : [];
  const updated = kps.map((kp) => {
    const phase = typeof kp?.phase === 'number' && kp.phase >= 1 ? kp.phase : 1;
    return { ...kp, phase };
  });

  const ids = updated.map((kp) => kp?.id).filter(Boolean);
  const phases = [
    {
      phase_number: 1,
      phase_name: 'Phase 1',
      knowledge_point_ids: ids,
      description: 'Auto-generated fallback phase (upgrade path: DAG-based assignPhases)',
      status: 'active'
    }
  ];

  return { knowledgePoints: updated, phases };
}

function ensurePhases(plan) {
  if (!plan || typeof plan !== 'object') return plan;

  const kps = Array.isArray(plan.knowledge_points) ? plan.knowledge_points : [];
  const hasPhases = Array.isArray(plan.phases) && plan.phases.length > 0;
  const missingKpPhase = kps.some((kp) => typeof kp?.phase !== 'number' || kp.phase < 1);

  if (hasPhases && !missingKpPhase) return plan;

  const { knowledgePoints, phases } =
    typeof assignPhases === 'function'
      ? assignPhases(kps, plan.dependency_graph)
      : assignPhasesFallback(kps);

  plan.knowledge_points = knowledgePoints;
  plan.phases = phases;

  return plan;
}

const sessionFolder = `.workflow/learn/sessions/${sessionId}`;
const planPath = `${sessionFolder}/plan.json`;
const profilePath = `.workflow/learn/profiles/${state.active_profile_id}.json`;

let plan = safeReadJson(planPath);
const upgraded = ensurePhases(plan);

// Atomic write pattern: write tmp → validate → mv into place.
const upgradeTmp = `${sessionFolder}/plan.upgrade.tmp.json`;
Write(upgradeTmp, JSON.stringify(upgraded, null, 2));

const validation = safeExecJson(
  `node .claude/commands/learn/_internal/learn-plan-validator.js ${upgradeTmp} --profile ${profilePath}`,
  'learn-plan-validator'
);

if (!validation.ok) {
  console.error('❌ Upgraded plan failed validation:', validation.layer0?.errors || validation.layer1?.errors);
  throw new Error('Plan upgrade failed schema/DAG validation. Please regenerate the plan.');
}

Bash(`mv ${upgradeTmp} ${planPath}`);
plan = safeReadJson(planPath);
```

