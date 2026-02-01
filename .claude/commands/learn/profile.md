---
name: profile
description: Manage user learning profiles (validated via ccw learn:* CLI) with optional inferred-skill proposals
argument-hint: "[create|update|select|show] [profile-id] [--goal=\"<learning goal>\"] [--full-assessment[=true|false]]"
allowed-tools: TodoWrite(*), Task(*), AskUserQuestion(*), Bash(*), Read(*)
---

# Learn:Profile Command (/learn:profile)

## Quick Start

```bash
/learn:profile create
/learn:profile update
/learn:profile show
```

## Execution Phase Diagram (Code-Level)

```text
/learn:profile <op>
  |
  v
switch(op)
  |-- create -> createFlow()
  |            |
  |            +-> AskUserQuestion: pre_context_vNext (<=4 per call; may batch)
  |            +-> AskUserQuestion: background_text (required; reuse/update if possible)
  |            +-> main agent: background parse + topic association expansion (candidates + 1-line reasons)
  |            +-> AskUserQuestion loop: topic 覆盖校验（推荐 topics + type something 补漏）
  |            +-> ccw learn:write-profile (schema validated)
  |            +-> ccw learn:append-profile-event PRECONTEXT_CAPTURED (best-effort)
  |            +-> ccw learn:update-state active_profile_id
  |            +-> ccw learn:append-telemetry-event PROFILE_CREATED (best-effort)
  |            +-> (if --full-assessment=true) internal assess.js: 单 topic 评估（1题最小闭环；完整算法在后续 cycle）
  |
  |-- update -> updateFlow()
  |            |
  |            +-> ccw learn:read-profile
  |            +-> AskUserQuestion: update_action
  |                  |-- preferences -> AskUserQuestion: pre_context_vNext
  |                  |                  -> ccw learn:append-profile-event FIELD_SET (best-effort)
  |                  |                  -> ccw learn:write-profile
  |                  |-- assess_topic -> internal assess.js: 单 topic 评估入口
  |                  `-- show       -> showFlow()
  |
  |-- select -> selectFlow()
  |            |
  |            +-> ccw learn:list-profiles
  |            +-> ccw learn:read-state
  |            +-> AskUserQuestion: selected_profile
  |            `-> ccw learn:update-state active_profile_id
  |
  `-- show   -> showFlow()
               |
               +-> ccw learn:read-profile
               `-> ccw learn:read-profile-snapshot (best-effort)
```

## Reality Check (Matches Current Backend)

- Profile file is written via `ccw learn:write-profile` (schema-validated).
- Inferred skills are stored as immutable events + folded into snapshot (`skills.inferred`), not merged into `known_topics`.
  - Use `ccw learn:propose-inferred-skill`, `ccw learn:confirm-inferred-skill`, `ccw learn:reject-inferred-skill`.
- Pre-context is recorded as:
  - `PRECONTEXT_CAPTURED` event (append-only)
  - optional `FIELD_SET` corrections for `pre_context.parsed.*` (append-only)
- Background input (optional) is a single-line paste via AskUserQuestion (no local file reading in this command).
- Minimal-by-default: detailed skill assessment is intended to happen JIT (Just-in-time) during `/learn:plan` / `/learn:execute`.

## Implementation

```javascript
// /learn:profile create|update|select|show
// Tooling constraints: AskUserQuestion + Bash only. All persistence goes through ccw learn:* CLI.

const args = String($ARGUMENTS ?? '').trim().split(/\s+/).filter(Boolean);
const op = (args[0] || 'show').toLowerCase();

function parseFlags(argv) {
  // Default: full assessment is ON (can be explicitly disabled).
  const flags = { fullAssessment: true, goal: null };
  for (const a of argv) {
    if (a === '--full-assessment') flags.fullAssessment = true;
    if (a.startsWith('--full-assessment=')) {
      const v = a.slice('--full-assessment='.length).trim().toLowerCase();
      flags.fullAssessment = !(v === '0' || v === 'false' || v === 'no' || v === 'off');
    }
    if (a.startsWith('--goal=')) {
      const v = a.slice('--goal='.length);
      flags.goal = v ? v.replace(/^\"|\"$/g, '').replace(/^'|'$/g, '') : null;
    }
  }
  return flags;
}

const flags = parseFlags(args);

function lastJsonObjectFromText(text) {
  const raw = String(text ?? '').trim();
  if (!raw) throw new Error('Empty command output');
  const lines = raw.split('\n').map((l) => l.trim()).filter(Boolean);
  for (let i = lines.length - 1; i >= 0; i--) {
    try {
      return JSON.parse(lines[i]);
    } catch {
      // keep scanning
    }
  }
  const m = raw.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (m) return JSON.parse(m[1].trim());
  throw new Error('Failed to parse JSON from command output');
}

function escapeSingleQuotesForShell(s) {
  return String(s ?? '').replace(/'/g, "'\\''");
}

function runCcwJson(cmd) {
  const out = lastJsonObjectFromText(Bash(cmd));
  if (!out.ok) throw new Error(out.error?.message || 'Command failed');
  return out.data;
}

function runCcwBestEffort(cmd, label) {
  try {
    const out = lastJsonObjectFromText(Bash(cmd));
    if (!out.ok) console.warn(`⚠️ ${label} failed:`, out.error);
  } catch (e) {
    console.warn(`⚠️ ${label} failed:`, e?.message || e);
  }
}

// Internal-only assessment module (Cycle-1 plumbing): loaded via ESM import and used through factory injection.
const { createAssess } = await import('./_internal/assess.js');
const __assess = createAssess({ AskUserQuestion, Bash, Read });

function normalizeInferredTopicId(raw) {
  const s = String(raw ?? '').toLowerCase();
  const normalized = s
    .replace(/[^a-z0-9_-]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_+|_+$/g, '');
  return normalized;
}

function getActiveProfileIdOrNull() {
  const state = runCcwJson('ccw learn:read-state --json');
  const id = state?.active_profile_id ?? null;
  if (typeof id === 'string' && id.startsWith('p-e2e-')) return null;
  return id;
}

function getProfileIdFromArgsOrActive(argv, index) {
  const candidate = argv[index];
  if (candidate && !candidate.startsWith('--')) return candidate;
  return getActiveProfileIdOrNull();
}

function collectBackgroundTextRequired() {
  // Background is required in create. If a previous active profile has background, allow reuse.
  const state = runCcwJson('ccw learn:read-state --json');
  const activeId = String(state?.active_profile_id ?? '').trim();

  const loadPrev = () => {
    if (!activeId || activeId.startsWith('p-e2e-')) return null;
    try {
      const p = runCcwJson(`ccw learn:read-profile --profile-id \"${activeId}\" --json`);
      const raw = String(p?.background?.raw_text ?? '').trim();
      const summary = String(p?.background?.summary ?? '').trim();
      if (!raw && !summary) return null;
      return { profile_id: activeId, raw_text: raw, summary };
    } catch {
      return null;
    }
  };

  const prev = loadPrev();
  if (prev) {
    const KEY = 'background_reuse_action';
    const ans = AskUserQuestion({
      questions: [{
        key: KEY,
        header: '背景信息（必填）',
        multiSelect: false,
        question:
          `检测到你上一次的背景信息（profile: ${prev.profile_id}）。\\n` +
          `\\n摘要：${prev.summary || (prev.raw_text.slice(0, 120) + (prev.raw_text.length > 120 ? '…' : ''))}\\n` +
          `\\n是否复用？`,
        options: [
          { value: 'reuse', label: '复用', description: '沿用上一次的背景信息' },
          { value: 'update', label: '更新', description: '重新输入/更新背景信息' }
        ]
      }]
    });

    if (ans[KEY] === 'reuse') return prev.raw_text || prev.summary;
  }

  const KEY = 'background_text';
  const ans2 = AskUserQuestion({
    questions: [{
      key: KEY,
      header: '背景信息（必填）',
      multiSelect: false,
      question:
        '请粘贴你的背景信息（尽量一行，包含你做过的项目/技术栈/经验即可）。\\n' +
        '示例：\"3年React+Node，做过后台管理；用过Postgres\"\\n\\n' +
        '（直接输入文本继续）'
    }]
  });
  return String(ans2[KEY] ?? '').trim();
}

function preContextV13() {
  const PRE_CONTEXT_VERSION = 'pre_context_v1.3';
  const PRE_Q1_STYLE_KEY = 'pre_q1_style';
  const PRE_Q2_SOURCES_KEY = 'pre_q2_sources';
  const PRE_Q3_TIME_KEY = 'pre_q3_time';
  const PRE_Q4_CONTEXT_KEY = 'pre_q4_context';

  const answer = AskUserQuestion({
    questions: [
      {
        key: PRE_Q1_STYLE_KEY,
        question: '你更喜欢怎样学习？（可选，也可直接输入）',
        header: '学习方式',
        multiSelect: false,
        options: [
          { value: 'practical', label: '动手优先', description: '先做再总结' },
          { value: 'theoretical', label: '概念优先', description: '先理解再实践' },
          { value: 'mixed', label: '混合', description: '概念 + 实践平衡' },
          { value: 'visual', label: '视觉化', description: '图示/视频更高效' },
          { value: 'skip', label: '跳过', description: '暂时跳过' }
        ]
      },
      {
        key: PRE_Q2_SOURCES_KEY,
        question: '你更偏好的学习资源？（可多选，也可直接输入）',
        header: '资源偏好',
        multiSelect: true,
        options: [
          { value: 'official-docs', label: '官方文档', description: '更信任一手资料' },
          { value: 'interactive', label: '交互式教程', description: '一步步引导/沙盒' },
          { value: 'video', label: '视频课程', description: '视频/系统课' },
          { value: 'books', label: '书籍', description: '系统性强' },
          { value: 'articles', label: '文章/博客', description: '短平快/案例' },
          { value: 'skip', label: '跳过', description: '暂时跳过' }
        ]
      },
      {
        key: PRE_Q3_TIME_KEY,
        question: '你每周能稳定投入多少学习时间？（可选，也可直接输入）',
        header: '时间投入',
        multiSelect: false,
        options: [
          { value: 'lt2', label: '<2 小时/周', description: '时间很少' },
          { value: '2-5', label: '2-5 小时/周', description: '轻量' },
          { value: '5-10', label: '5-10 小时/周', description: '稳定' },
          { value: '10plus', label: '10+ 小时/周', description: '高强度' },
          { value: 'variable', label: '不固定', description: '有时忙有时闲' },
          { value: 'skip', label: '跳过', description: '暂时跳过' }
        ]
      },
      {
        key: PRE_Q4_CONTEXT_KEY,
        question: '你的学习场景更像哪种？（可选，也可直接输入）',
        header: '学习场景',
        multiSelect: false,
        options: [
          { value: 'work', label: '工作驱动', description: '为解决当前工作任务' },
          { value: 'project', label: '个人项目', description: '做出自己关心的东西' },
          { value: 'interview', label: '求职/面试', description: '为求职准备' },
          { value: 'hobby', label: '兴趣驱动', description: '好奇/乐趣' },
          { value: 'unsure', label: '还不确定', description: '先探索' },
          { value: 'skip', label: '跳过', description: '暂时跳过' }
        ]
      }
    ]
  });

  const capturedAt = new Date().toISOString();
  const skipped = {};
  if (answer[PRE_Q1_STYLE_KEY] === 'skip') skipped[PRE_Q1_STYLE_KEY] = capturedAt;
  {
    const v = answer[PRE_Q2_SOURCES_KEY];
    if ((Array.isArray(v) && v.includes('skip')) || v === 'skip') skipped[PRE_Q2_SOURCES_KEY] = capturedAt;
  }
  if (answer[PRE_Q3_TIME_KEY] === 'skip') skipped[PRE_Q3_TIME_KEY] = capturedAt;
  if (answer[PRE_Q4_CONTEXT_KEY] === 'skip') skipped[PRE_Q4_CONTEXT_KEY] = capturedAt;

  const normalizeSkipValue = (v) => (v === 'skip' ? null : v);
  const normalizeSkipMulti = (v) => {
    if (!Array.isArray(v)) return normalizeSkipValue(v);
    const filtered = v.filter((x) => x !== 'skip');
    return filtered.length > 0 ? filtered : null;
  };

  return {
    template_version: PRE_CONTEXT_VERSION,
    pre_context: {
      raw: {
        [PRE_Q1_STYLE_KEY]: answer[PRE_Q1_STYLE_KEY],
        [PRE_Q2_SOURCES_KEY]: answer[PRE_Q2_SOURCES_KEY],
        [PRE_Q3_TIME_KEY]: answer[PRE_Q3_TIME_KEY],
        [PRE_Q4_CONTEXT_KEY]: answer[PRE_Q4_CONTEXT_KEY]
      },
      parsed: {
        learning_style: normalizeSkipValue(answer[PRE_Q1_STYLE_KEY]),
        preferred_sources: normalizeSkipMulti(answer[PRE_Q2_SOURCES_KEY]),
        time_budget: normalizeSkipValue(answer[PRE_Q3_TIME_KEY]),
        learning_context: normalizeSkipValue(answer[PRE_Q4_CONTEXT_KEY])
      },
      provenance: {
        template_version: PRE_CONTEXT_VERSION,
        captured_at: capturedAt,
        asked_vs_reused: 'asked',
        gating_reason: 'create',
        skipped
      }
    }
  };
}

function preContextVNext() {
  // vNext pre-context: personal-only learning profile (not goal/env), asked in batches (<=4 per AskUserQuestion).
  const PRE_CONTEXT_VERSION = 'pre_context_vNext';

  const Q_STYLE = 'pre_style';
  const Q_SOURCES = 'pre_sources';
  const Q_HOURS_WEEK = 'pre_hours_week';
  const Q_SESSION_LEN = 'pre_session_len';

  const Q_PRACTICE = 'pre_practice_intensity';
  const Q_FEEDBACK = 'pre_feedback_style';
  const Q_PACE = 'pre_pace';
  const Q_MOTIVATION = 'pre_motivation';

  const b1 = AskUserQuestion({
    questions: [
      {
        key: Q_STYLE,
        header: '学习方式 (1/4)',
        multiSelect: false,
        question: '你更喜欢怎样学习？（可选，也可直接输入）',
        options: [
          { value: 'practical', label: '动手优先', description: '先做再总结' },
          { value: 'theoretical', label: '概念优先', description: '先理解再实践' },
          { value: 'mixed', label: '混合', description: '概念 + 实践平衡' },
          { value: 'visual', label: '视觉化', description: '图示/视频更高效' },
          { value: 'skip', label: '跳过', description: '暂时跳过' }
        ]
      },
      {
        key: Q_SOURCES,
        header: '资源偏好 (2/4)',
        multiSelect: true,
        question: '你更偏好的学习资源？（可多选，也可直接输入）',
        options: [
          { value: 'official-docs', label: '官方文档', description: '更信任一手资料' },
          { value: 'interactive', label: '交互式教程', description: '一步步引导/沙盒' },
          { value: 'video', label: '视频课程', description: '视频/系统课' },
          { value: 'books', label: '书籍', description: '系统性强' },
          { value: 'articles', label: '文章/博客', description: '短平快/案例' },
          { value: 'skip', label: '跳过', description: '暂时跳过' }
        ]
      },
      {
        key: Q_HOURS_WEEK,
        header: '每周投入 (3/4)',
        multiSelect: false,
        question: '你每周能稳定投入多少小时学习？（可选，也可直接输入数字/区间）',
        options: [
          { value: '1-3', label: '1-3 小时', description: '轻量' },
          { value: '3-6', label: '3-6 小时', description: '中等' },
          { value: '6-10', label: '6-10 小时', description: '认真投入' },
          { value: '10+', label: '10+ 小时', description: '高强度' },
          { value: 'skip', label: '跳过', description: '暂时跳过' }
        ]
      },
      {
        key: Q_SESSION_LEN,
        header: '单次时长 (4/4)',
        multiSelect: false,
        question: '你更偏好每次学习大概持续多久？（可选，也可直接输入）',
        options: [
          { value: '15', label: '15 分钟', description: '碎片化' },
          { value: '30', label: '30 分钟', description: '短时段' },
          { value: '60', label: '60 分钟', description: '中等时段' },
          { value: '90+', label: '90+ 分钟', description: '长时段' },
          { value: 'skip', label: '跳过', description: '暂时跳过' }
        ]
      }
    ]
  });

  const b2 = AskUserQuestion({
    questions: [
      {
        key: Q_PRACTICE,
        header: '练习强度 (1/4)',
        multiSelect: false,
        question: '你希望练习的强度更像哪种？（可选，也可直接输入）',
        options: [
          { value: 'low', label: '低', description: '更偏理解/阅读' },
          { value: 'mid', label: '中', description: '理解 + 适量练习' },
          { value: 'high', label: '高', description: '大量练习/项目驱动' },
          { value: 'skip', label: '跳过', description: '暂时跳过' }
        ]
      },
      {
        key: Q_FEEDBACK,
        header: '反馈风格 (2/4)',
        multiSelect: false,
        question: '你更喜欢怎样的反馈方式？（可选，也可直接输入）',
        options: [
          { value: 'direct', label: '直接指出问题', description: '直给、指出错误与改进点' },
          { value: 'gentle', label: '温和引导', description: '更鼓励式、循序渐进' },
          { value: 'step', label: '按步骤拆解', description: '一步一步给下一步行动' },
          { value: 'skip', label: '跳过', description: '暂时跳过' }
        ]
      },
      {
        key: Q_PACE,
        header: '节奏偏好 (3/4)',
        multiSelect: false,
        question: '你更偏好的学习节奏？（可选，也可直接输入）',
        options: [
          { value: 'slow', label: '慢一些更稳', description: '宁可慢也要扎实' },
          { value: 'normal', label: '正常', description: '平衡速度与理解' },
          { value: 'fast', label: '快一些', description: '先覆盖再回补' },
          { value: 'skip', label: '跳过', description: '暂时跳过' }
        ]
      },
      {
        key: Q_MOTIVATION,
        header: '动机 (4/4)',
        multiSelect: false,
        question: '你学习的主要动机更接近哪种？（可选，也可直接输入）',
        options: [
          { value: 'project', label: '做项目', description: '做出东西最重要' },
          { value: 'career', label: '工作/求职', description: '与岗位相关' },
          { value: 'exam', label: '考试/课程', description: '有明确要求' },
          { value: 'curiosity', label: '兴趣驱动', description: '好奇/想弄明白' },
          { value: 'skip', label: '跳过', description: '暂时跳过' }
        ]
      }
    ]
  });

  const asArray = (v) => {
    if (v == null) return [];
    if (Array.isArray(v)) return v.map(String).filter(Boolean);
    const s = String(v).trim();
    if (!s || s === 'skip') return [];
    return s.split(/[,，;；\\s]+/).map((x) => x.trim()).filter(Boolean);
  };

  const parseIntOrNull = (v) => {
    if (v == null) return null;
    const s = String(v).trim();
    if (!s || s === 'skip') return null;
    const n = Number(s.replace(/[^0-9]/g, ''));
    return Number.isFinite(n) && n >= 0 ? n : null;
  };

  const raw = {
    [Q_STYLE]: b1[Q_STYLE],
    [Q_SOURCES]: b1[Q_SOURCES],
    [Q_HOURS_WEEK]: b1[Q_HOURS_WEEK],
    [Q_SESSION_LEN]: b1[Q_SESSION_LEN],
    [Q_PRACTICE]: b2[Q_PRACTICE],
    [Q_FEEDBACK]: b2[Q_FEEDBACK],
    [Q_PACE]: b2[Q_PACE],
    [Q_MOTIVATION]: b2[Q_MOTIVATION]
  };

  const parsed = {
    learning_style: b1[Q_STYLE] === 'skip' ? null : (String(b1[Q_STYLE] ?? '').trim() || null),
    preferred_sources: asArray(b1[Q_SOURCES]),
    hours_per_week: (() => {
      const v = b1[Q_HOURS_WEEK];
      if (v === '1-3') return 2;
      if (v === '3-6') return 4;
      if (v === '6-10') return 8;
      if (v === '10+') return 12;
      return parseIntOrNull(v);
    })(),
    session_length_minutes: (() => {
      const v = b1[Q_SESSION_LEN];
      if (v === '90+') return 90;
      return parseIntOrNull(v);
    })(),
    practice_intensity: b2[Q_PRACTICE] === 'skip' ? null : (String(b2[Q_PRACTICE] ?? '').trim() || null),
    feedback_style: b2[Q_FEEDBACK] === 'skip' ? null : (String(b2[Q_FEEDBACK] ?? '').trim() || null),
    pace: b2[Q_PACE] === 'skip' ? null : (String(b2[Q_PACE] ?? '').trim() || null),
    motivation_type: b2[Q_MOTIVATION] === 'skip' ? null : (String(b2[Q_MOTIVATION] ?? '').trim() || null)
  };

  const capturedAt = new Date().toISOString();
  const provenance = {
    template_version: PRE_CONTEXT_VERSION,
    captured_at: capturedAt,
    asked_vs_reused: 'asked',
    gating_reason: 'create_required'
  };

  return {
    template_version: PRE_CONTEXT_VERSION,
    pre_context: {
      raw,
      parsed,
      provenance
    }
  };
}

function collectKnownTopicsMinimal(initialKnownTopics) {
  // Cycle-2: manual Add Topic is removed. Known topics should come from:
  // - background parse + topic coverage loop (then assessed), or
  // - later, taxonomy-first resolve + assessment events (Cycle-3).
  return Array.isArray(initialKnownTopics) ? initialKnownTopics.slice() : [];
}

function topicCoverageValidationLoop(topicCandidates) {
  // Cycle-4:
  // - Candidates are generated by the main agent (subjective parse + association expansion) from background.
  // - This is a feedback loop to confirm coverage (not a fixed list).
  // - Per round: 2 AskUserQuestion calls:
  //   1) 4 multiSelect questions (<=4 options each, total <=16 topics)
  //   2) free text supplement + covered/more confirm
  // - Only user-selected/typed labels can be resolve/ensure-topic (no taxonomy pollution).

  const normalizeLabel = (s) => String(s ?? '').trim();
  const asCandidate = (x) => {
    if (typeof x === 'string') return { label: normalizeLabel(x), reason: '候选' };
    if (!x || typeof x !== 'object') return { label: '', reason: '' };
    const label = normalizeLabel(x.label ?? x.topic ?? x.topic_id ?? x.value ?? '');
    const reason = normalizeLabel(x.reason ?? x.description ?? x.why ?? '候选');
    return { label, reason };
  };

  const uniq = [];
  const seen = new Set();
  for (const x of Array.isArray(topicCandidates) ? topicCandidates : []) {
    const c = asCandidate(x);
    if (!c.label) continue;
    const key = c.label.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    uniq.push(c);
    if (uniq.length >= 16) break; // hard limit: 4x4
  }

  const chunk = (arr, size) => {
    const out = [];
    for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
    return out;
  };

  const splitFreeText = (txt) =>
    String(txt ?? '')
      .trim()
      .split(/[,，;；\\s]+/)
      .map((x) => normalizeLabel(x))
      .filter(Boolean);

  const resolveOrEnsureOne = (rawLabel) => {
    const raw = normalizeLabel(rawLabel);
    if (!raw) return null;

    const resolved = runCcwJson(
      ['ccw learn:resolve-topic', `--raw-topic-label ${JSON.stringify(raw)}`, '--json'].join(' ')
    );

    if (resolved.found) return String(resolved.topic_id);

    if (resolved.ambiguous) {
      // Ask user to decide (no auto-choice).
      const KEY = `topic_ambiguous_${Date.now()}`;
      const opts = (resolved.candidates || []).slice(0, 4).map((c) => ({
        value: String(c.topic_id),
        label: String(c.topic_id),
        description: String(c.display_name_zh || c.display_name_en || c.topic_id)
      }));
      const picked = AskUserQuestion({
        questions: [{
          key: KEY,
          header: 'Topic 解析存在歧义',
          multiSelect: false,
          question: `“${raw}” 可能对应多个 topic，请选择一个：`,
          options: opts.length > 0 ? opts : [{ value: 'type', label: '手动输入', description: '候选为空时手动输入' }]
        }]
      });
      const choice = String(picked?.[KEY] ?? '').trim();
      if (choice && choice !== 'type') return choice;
      // If user refuses to pick one of the candidates, we treat it as a deliberate new label (allowed only because user selected it).
      const ensured = runCcwJson(
        ['ccw learn:ensure-topic', `--raw-topic-label ${JSON.stringify(raw)}`, '--actor user', '--json'].join(' ')
      );
      return String(ensured.topic_id);
    }

    // Not found: create provisional ONLY because user selected/typed it.
    const ensured = runCcwJson(
      ['ccw learn:ensure-topic', `--raw-topic-label ${JSON.stringify(raw)}`, '--actor user', '--json'].join(' ')
    );
    return String(ensured.topic_id);
  };

  let merged = [];
  for (let round = 1; round <= 3; round += 1) {
    const groups = chunk(uniq, 4);
    while (groups.length < 4) groups.push([]);

    const pickQuestions = groups.slice(0, 4).map((g, i) => {
      const key = `topic_pick_${round}_${i + 1}`;
      const opts = g.slice(0, 4).map((c) => ({ value: c.label, label: c.label, description: c.reason }));
      const options = opts.length > 0 ? opts : [{ value: 'none', label: '(无更多候选)', description: '可在下一步手动输入' }];
      return {
        key,
        header: `候选 Topics (${i + 1}/4)`,
        multiSelect: true,
        question: '请选择与你相关的 topics（可多选；也可以不选）。',
        options
      };
    });

    const picked = AskUserQuestion({ questions: pickQuestions });

    const selectedLabels = [];
    for (const q of pickQuestions) {
      const v = picked?.[q.key];
      const arr = Array.isArray(v) ? v : (v ? [v] : []);
      for (const x of arr) {
        const s = normalizeLabel(x);
        if (!s || s === 'none') continue;
        selectedLabels.push(s);
      }
    }

    const EXTRA_KEY = `topic_extra_${round}`;
    const COVERED_KEY = `topic_covered_${round}`;
    const round2 = AskUserQuestion({
      questions: [
        {
          key: EXTRA_KEY,
          header: `补充 topics（第 ${round} 轮）`,
          multiSelect: false,
          question: '如果还有缺失的技能点/细分 topic，请直接输入（可空；逗号/空格分隔）。'
        },
        {
          key: COVERED_KEY,
          header: '覆盖确认',
          multiSelect: false,
          question: '你认为 topics 是否已经覆盖了你预期的范围？',
          options: [
            { value: 'covered', label: '已覆盖', description: '进入下一步' },
            { value: 'more', label: '还需补充', description: '继续补充 topics' }
          ]
        }
      ]
    });

    const extraLabels = splitFreeText(round2?.[EXTRA_KEY]);
    merged = Array.from(new Set([...merged, ...selectedLabels, ...extraLabels])).filter(Boolean);

    if (String(round2?.[COVERED_KEY]) === 'covered') break;
  }

  // Resolve/ensure ONLY for user-selected/typed labels.
  const topicIds = [];
  for (const raw of merged) {
    const tid = resolveOrEnsureOne(raw);
    if (tid) topicIds.push(String(tid));
  }

  return Array.from(new Set(topicIds));
}

function createFlow() {
  // Phase 2: Profile Creation Flow (vNext)
  const requestedId = args[1] && !args[1].startsWith('--') ? args[1] : null;
  const activeId = getActiveProfileIdOrNull();
  const profileId = requestedId || activeId || `profile-${Date.now()}`;
  if (String(profileId).startsWith('p-e2e-')) throw new Error('p-e2e-* 是测试 profile，已永久隔离，不能用于真实交互');

  // A) pre_context_vNext (personal-only). Must be collected before background parsing.
  const pc = preContextVNext();
  const pre_context = pc.pre_context;
  const preContextEventPayload = JSON.stringify({ template_version: pc.template_version, pre_context });

  // B) Background is required (reuse/update allowed).
  const backgroundText = collectBackgroundTextRequired();
  if (!backgroundText) throw new Error('背景信息不能为空（create 阶段必填）');

  // C) Topic candidates (main agent subjective parse + association expansion).
  // Policy: DO NOT call learn:parse-background for this step (Cycle-4 decision override).
  // Keep <=16 candidates; each should include a 1-line reason to help user selection.
  const topicCandidates = (() => {
    const candidates = [];

    const t = String(backgroundText || '');
    const lower = t.toLowerCase();
    const push = (label, reason) => {
      const l = String(label || '').trim();
      if (!l) return;
      candidates.push({ label: l, reason: String(reason || '背景推断').trim() || '背景推断' });
    };

    // Lightweight heuristics (fallback). In practice, the main agent should enrich this list using its own understanding.
    if (lower.includes('typescript')) push('TypeScript', '背景中提到 TypeScript');
    if (lower.includes('javascript')) push('JavaScript', '背景中提到 JavaScript');
    if (lower.includes('react')) push('React', '背景中提到 React');
    if (lower.includes('node')) push('Node.js', '背景中提到 Node/后端');
    if (lower.includes('cocos')) push('Cocos Creator', '背景中提到 Cocos');

    // Always include a generic \"core\" fallback so the user can at least pick something.
    if (candidates.length === 0) push('general_learning', '未能从背景中提取明确关键词：先用通用 topic 作为起点');

    return candidates.slice(0, 16);
  })();

  // D) Topic coverage validation loop (4x4 + type something). Returns canonical topic_ids.
  const topicIds = topicCoverageValidationLoop(topicCandidates);

  const runFullAssessment = Boolean(flags.fullAssessment);
  const isMinimal = !runFullAssessment;
  const completionPercent = runFullAssessment ? 100 : 60;

  const now = new Date().toISOString();

  // Upsert: if profile already exists, we preserve prior known_topics/journal and update only the relevant fields.
  let existingProfile = null;
  try {
    existingProfile = runCcwJson(`ccw learn:read-profile --profile-id \"${profileId}\" --json`);
  } catch {
    existingProfile = null;
  }

  const createdAt = existingProfile?._metadata?.created_at ?? now;
  const baseKnownTopics = Array.isArray(existingProfile?.known_topics) ? existingProfile.known_topics : [];
  const baseJournal = Array.isArray(existingProfile?.feedback_journal) ? existingProfile.feedback_journal : [];

  const profile = {
    ...(existingProfile && typeof existingProfile === 'object' ? existingProfile : {}),
    $schema: './schemas/learn-profile.schema.json',
    profile_id: profileId,
    is_minimal: isMinimal,
    experience_level: existingProfile?.experience_level ?? null,
    known_topics: baseKnownTopics,
    pre_context,
    background: {
      raw_text: backgroundText,
      summary: backgroundText.slice(0, 240),
      _metadata: { captured_at: now }
    },
    learning_preferences: {
      style: pre_context?.parsed?.learning_style ?? null,
      preferred_sources: pre_context?.parsed?.preferred_sources ?? null
    },
    feedback_journal: baseJournal,
    _metadata: {
      ...(existingProfile?._metadata || {}),
      created_at: createdAt,
      updated_at: now,
      version: existingProfile?._metadata?.version ?? '1.0.0',
      goal_type: flags.goal ? 'custom' : 'general',
      goal_text: flags.goal ?? null,
      assessment_method: isMinimal ? 'minimal' : 'evidence-based',
      completion_percent: completionPercent
    }
  };

  // Write profile (validated).
  const profilePayload = JSON.stringify(profile);
  const escapedProfilePayload = escapeSingleQuotesForShell(profilePayload);
  const writeProfileResp = lastJsonObjectFromText(
    Bash(`ccw learn:write-profile --profile-id ${profileId} --data '${escapedProfilePayload}' --json`)
  );
  if (!writeProfileResp.ok) throw new Error(writeProfileResp.error?.message || 'Profile write failed');

  // Pre-context immutable event (best-effort, batch API).
  const preContextBatchEvents = JSON.stringify([{
    type: 'PRECONTEXT_CAPTURED',
    actor: 'user',
    payload: JSON.parse(preContextEventPayload)
  }]);
  runCcwBestEffort(
    `ccw learn:append-profile-events-batch --profile-id ${profileId} --events '${escapeSingleQuotesForShell(preContextBatchEvents)}' --json`,
    'append PRECONTEXT_CAPTURED (batch)'
  );

  // Set active profile (persisted via state API).
  runCcwJson(`ccw learn:update-state --field active_profile_id --value \"${profileId}\" --json`);

  // Telemetry (best-effort).
  runCcwBestEffort(
    `ccw learn:append-telemetry-event --event PROFILE_CREATED --profile-id ${profileId} --payload '${escapeSingleQuotesForShell(JSON.stringify({ is_minimal: isMinimal, topics_count: topicIds.length }))}' --json`,
    'append telemetry PROFILE_CREATED'
  );

  // E) Default: enter single-topic assessment (Cycle-1 plumbing) when full-assessment is enabled.
  if (runFullAssessment) {
    const remaining = Array.isArray(topicIds) ? [...topicIds] : [];

    const upsertKnownTopicFromAssessment = (assessResult) => {
      if (!assessResult || !assessResult.topic_id) return;
      if (assessResult.reused) return;

      profile.known_topics = Array.isArray(profile.known_topics) ? profile.known_topics : [];
      const tid = String(assessResult.topic_id);
      const idx = profile.known_topics.findIndex((t) => String(t?.topic_id || '') === tid);
      const ts = new Date().toISOString();

      const entry = idx >= 0 ? profile.known_topics[idx] : { topic_id: tid, proficiency: 0, evidence: [] };
      entry.topic_id = tid;
      entry.proficiency = Number(assessResult.proficiency ?? entry.proficiency ?? 0);
      if (assessResult.confidence !== undefined && assessResult.confidence !== null) {
        entry.confidence = Number(assessResult.confidence);
      }
      entry.last_updated = ts;
      entry.evidence = Array.isArray(entry.evidence) ? entry.evidence : [];
      entry.evidence.push({
        evidence_type: 'self-report',
        kind: 'assessment_summary',
        timestamp: ts,
        summary: `Full assessment summary (${assessResult.algorithm_version || 'cycle-3-vnext'})`,
        data: {
          session_id: assessResult.session_id ?? null,
          topic_id: tid,
          pack_key_hash: assessResult.pack_key_hash ?? null,
          completed: Boolean(assessResult.completed),
          stop_conditions: assessResult.stop_conditions ?? null
        }
      });

      if (idx >= 0) profile.known_topics[idx] = entry;
      else profile.known_topics.push(entry);
    };

    const proposeInferredSkillFromAssessment = (assessResult) => {
      if (!assessResult || !assessResult.topic_id) return;
      if (assessResult.reused) return;
      const tid = String(assessResult.topic_id);
      const prof = Number(assessResult.proficiency ?? 0);
      const conf = Number(assessResult.confidence ?? 0);
      const evidenceText =
        `Assessment result (topic=${tid}, session=${assessResult.session_id || 'n/a'}, ` +
        `completed=${Boolean(assessResult.completed)}, pack_key_hash=${assessResult.pack_key_hash || 'n/a'})`;

      runCcwBestEffort(
        [
          'ccw learn:propose-inferred-skill',
          `--profile-id ${profileId}`,
          `--topic-id ${JSON.stringify(tid)}`,
          `--proficiency ${prof}`,
          `--confidence ${conf}`,
          `--evidence ${JSON.stringify(evidenceText)}`,
          '--actor agent',
          '--json'
        ].join(' '),
        'propose inferred skill from assessment'
      );
    };

    const MAX_TOPIC_ROUNDS = 20;
    let rounds = 0;
    let done = false;
    while (!done && rounds < MAX_TOPIC_ROUNDS) {
      rounds += 1;

      const TOPIC_KEY = 'assess_topic_id';
      const topicOptions = (remaining.length > 0)
        ? remaining.slice(0, 4).map((t) => ({ value: String(t), label: String(t), description: '来自 topic 覆盖校验' }))
        : [{ value: 'game_dev_core', label: 'game_dev_core', description: '示例 topic（可直接输入其它）' }];

      const picked = AskUserQuestion({
        questions: [{
          key: TOPIC_KEY,
          header: '题目评估（单 topic）',
          multiSelect: false,
          question: '请选择（或直接输入）本次要评估的 topic_id（create 阶段默认必须进入评估）：',
          options: topicOptions
        }]
      });

      const topicId = normalizeInferredTopicId(String(picked[TOPIC_KEY] ?? '').trim());
      if (!topicId) throw new Error('必须选择/输入 topic_id 才能继续（--full-assessment=true）');

      const assessResult = __assess.assessTopic({ profileId, topicId, language: 'zh-CN' });
      if (assessResult?.reused) {
        console.log(`\nℹ️ topic=${assessResult.topic_id} 已在相同 pack_key 下评估过，本次跳过重复评估。`);
      } else {
        upsertKnownTopicFromAssessment(assessResult);
        proposeInferredSkillFromAssessment(assessResult);

        // Persist updated profile (validated).
        const updatedPayload = escapeSingleQuotesForShell(JSON.stringify(profile));
        const writeResp = lastJsonObjectFromText(
          Bash(`ccw learn:write-profile --profile-id ${profileId} --data '${updatedPayload}' --json`)
        );
        if (!writeResp.ok) throw new Error(writeResp.error?.message || 'Profile write failed (post-assessment)');
      }

      // Remove from remaining (best-effort).
      const idx = remaining.findIndex((t) => String(t) === String(assessResult?.topic_id || topicId));
      if (idx >= 0) remaining.splice(idx, 1);

      const NEXT_KEY = 'assess_next';
      const next = AskUserQuestion({
        questions: [{
          key: NEXT_KEY,
          header: '继续评估？',
          multiSelect: false,
          question: remaining.length > 0
            ? '是否继续评估下一个 topic？'
            : '没有更多推荐 topic。是否还要手动输入一个 topic 继续评估？',
          options: [
            { value: 'continue', label: '继续', description: '继续评估下一个 topic' },
            { value: 'end', label: '结束', description: '结束并保存' }
          ]
        }]
      });
      done = String(next[NEXT_KEY]) !== 'continue';
    }
  }

  console.log('\n✅ Profile created');
  console.log(`Profile ID: ${profileId}`);
  console.log(`Topics (confirmed): ${topicIds.join(', ') || '(none)'}`);
  console.log('Next: /learn:plan (JIT)');
}

function updateFlow() {
  // Phase 3: Profile Update Flow
  const profileId = getProfileIdFromArgsOrActive(args, 1);
  if (!profileId) throw new Error('没有可用的 active profile，请先运行：/learn:profile create');

  const profile = runCcwJson(`ccw learn:read-profile --profile-id \"${profileId}\" --json`);

  const KEY = 'update_action';
  const ans = AskUserQuestion({
    questions: [{
      key: KEY,
      header: '更新 Profile',
      multiSelect: false,
      question: '你想更新什么内容？',
      options: [
        { value: 'preferences', label: '更新偏好', description: '更新 pre_context.parsed + learning_preferences' },
        { value: 'assess_topic', label: '题目评估（单 topic）', description: '进入最小评估闭环（Cycle-1）' },
        { value: 'show', label: '查看', description: '查看当前 profile + snapshot' }
      ]
    }]
  });

  if (ans[KEY] === 'show') {
    showFlow(profileId);
    return;
  }

  if (ans[KEY] === 'assess_topic') {
    const TOPIC_KEY = 'assess_topic_id';
    const picked = AskUserQuestion({
      questions: [{
        key: TOPIC_KEY,
        header: '题目评估入口（最小闭环）',
        multiSelect: false,
        question: '请输入要评估的 topic_id（可直接输入；或选择跳过）。',
        options: [
          { value: 'game_dev_core', label: 'game_dev_core', description: '示例 topic（可直接输入其它）' },
          { value: 'skip', label: '跳过', description: '本次先不做题目评估' }
        ]
      }]
    });

    const topicId = normalizeInferredTopicId(String(picked[TOPIC_KEY] ?? '').trim());
    if (topicId && topicId !== 'skip') {
      const assessResult = __assess.assessTopic({ profileId, topicId, language: 'zh-CN' });
      if (assessResult?.reused) {
        console.log(`\nℹ️ topic=${assessResult.topic_id} 已在相同 pack_key 下评估过，本次不需要重复评估。`);
        return;
      }

      // Upsert into profile.known_topics (validated).
      profile.known_topics = Array.isArray(profile.known_topics) ? profile.known_topics : [];
      const tid = String(assessResult.topic_id || topicId);
      const idx = profile.known_topics.findIndex((t) => String(t?.topic_id || '') === tid);
      const ts = new Date().toISOString();
      const entry = idx >= 0 ? profile.known_topics[idx] : { topic_id: tid, proficiency: 0, evidence: [] };
      entry.topic_id = tid;
      entry.proficiency = Number(assessResult.proficiency ?? entry.proficiency ?? 0);
      if (assessResult.confidence !== undefined && assessResult.confidence !== null) {
        entry.confidence = Number(assessResult.confidence);
      }
      entry.last_updated = ts;
      entry.evidence = Array.isArray(entry.evidence) ? entry.evidence : [];
      entry.evidence.push({
        evidence_type: 'self-report',
        kind: 'assessment_summary',
        timestamp: ts,
        summary: 'Full assessment summary (cycle-3-vnext)',
        data: {
          session_id: assessResult.session_id ?? null,
          topic_id: tid,
          pack_key_hash: assessResult.pack_key_hash ?? null,
          completed: Boolean(assessResult.completed),
          stop_conditions: assessResult.stop_conditions ?? null
        }
      });
      if (idx >= 0) profile.known_topics[idx] = entry;
      else profile.known_topics.push(entry);

      // Persist updated profile (validated).
      const updatedPayload = escapeSingleQuotesForShell(JSON.stringify(profile));
      const writeResp = lastJsonObjectFromText(
        Bash(`ccw learn:write-profile --profile-id ${profileId} --data '${updatedPayload}' --json`)
      );
      if (!writeResp.ok) throw new Error(writeResp.error?.message || 'Profile write failed (post-assessment)');

      // Also write inferred skill proposal (audited, no auto-confirm).
      const prof = Number(assessResult.proficiency ?? 0);
      const conf = Number(assessResult.confidence ?? 0);
      const evidenceText =
        `Assessment result (topic=${tid}, session=${assessResult.session_id || 'n/a'}, ` +
        `completed=${Boolean(assessResult.completed)}, pack_key_hash=${assessResult.pack_key_hash || 'n/a'})`;
      runCcwBestEffort(
        [
          'ccw learn:propose-inferred-skill',
          `--profile-id ${profileId}`,
          `--topic-id ${JSON.stringify(tid)}`,
          `--proficiency ${prof}`,
          `--confidence ${conf}`,
          `--evidence ${JSON.stringify(evidenceText)}`,
          '--actor agent',
          '--json'
        ].join(' '),
        'propose inferred skill from assessment'
      );

      // Ask whether to continue (no "light confirmation").
      const NEXT_KEY = 'assess_next';
      const next = AskUserQuestion({
        questions: [{
          key: NEXT_KEY,
          header: '继续评估？',
          multiSelect: false,
          question: '是否继续评估下一个 topic？',
          options: [
            { value: 'end', label: '结束', description: '结束并保存' },
            { value: 'continue', label: '继续', description: '继续评估下一个 topic（将再次进入评估入口）' }
          ]
        }]
      });
      if (String(next[NEXT_KEY]) === 'continue') {
        console.log('➡️ 请再次选择“题目评估（单 topic）”进入下一个 topic 的评估。');
      } else {
        console.log('✅ 已保存评估结果。');
      }
    }
    return;
  }

  if (ans[KEY] === 'preferences') {
    const pc = preContextVNext();
    const nextParsed = pc.pre_context?.parsed ?? {};
    const curParsed = profile?.pre_context?.parsed ?? {};

    // Apply parsed preferences into profile JSON.
    profile.pre_context = pc.pre_context;
    profile.learning_preferences = profile.learning_preferences || {};
    profile.learning_preferences.style = profile.pre_context.parsed.learning_style ?? null;
    profile.learning_preferences.preferred_sources = profile.pre_context.parsed.preferred_sources ?? null;

    // Emit FIELD_SET events for changed parsed fields (best-effort, append-only).
    const changes = [
      { k: 'learning_style', path: 'pre_context.parsed.learning_style' },
      { k: 'preferred_sources', path: 'pre_context.parsed.preferred_sources' },
      { k: 'hours_per_week', path: 'pre_context.parsed.hours_per_week' },
      { k: 'session_length_minutes', path: 'pre_context.parsed.session_length_minutes' },
      { k: 'practice_intensity', path: 'pre_context.parsed.practice_intensity' },
      { k: 'feedback_style', path: 'pre_context.parsed.feedback_style' },
      { k: 'pace', path: 'pre_context.parsed.pace' },
      { k: 'motivation_type', path: 'pre_context.parsed.motivation_type' }
    ];
    for (const c of changes) {
      const prev = curParsed?.[c.k] ?? null;
      const next = nextParsed?.[c.k] ?? null;
      if (JSON.stringify(prev) === JSON.stringify(next)) continue;
      runCcwBestEffort(
        `ccw learn:append-profile-event --profile-id ${profileId} --type FIELD_SET --actor user --payload '${escapeSingleQuotesForShell(JSON.stringify({ field_path: c.path, old_value: prev, new_value: next }))}' --json`,
        `append FIELD_SET ${c.path}`
      );
    }
  }

  profile._metadata = profile._metadata || {};
  profile._metadata.updated_at = new Date().toISOString();

  const payload = JSON.stringify(profile);
  const escaped = escapeSingleQuotesForShell(payload);
  const writeProfileResp = lastJsonObjectFromText(Bash(`ccw learn:write-profile --profile-id ${profileId} --data '${escaped}' --json`));
  if (!writeProfileResp.ok) throw new Error(writeProfileResp.error?.message || 'Profile write failed');

  console.log('✅ Profile updated');
}

function selectFlow() {
  // Phase 4: Profile Selection Flow
  const summaries = runCcwJson('ccw learn:list-profiles --json');
  if (!Array.isArray(summaries) || summaries.length === 0) {
    console.error('❌ 没有找到任何 profiles，请先运行：/learn:profile create');
    return;
  }

  const activeId = getActiveProfileIdOrNull();
  const KEY = 'selected_profile';
  const ans = AskUserQuestion({
    questions: [{
      key: KEY,
      header: '选择 Profile',
      multiSelect: false,
      question: '请选择要激活的 profile：',
      options: summaries.map((s) => ({
        value: s.profile_id,
        label: s.profile_id,
        description: s.profile_id === activeId ? '当前已激活' : ''
      }))
    }]
  });

  const selectedId = ans[KEY];
  runCcwJson(`ccw learn:update-state --field active_profile_id --value \"${selectedId}\" --json`);
  console.log(`✅ 已设置 active profile：${selectedId}`);
}

function showFlow(profileIdArg) {
  // Phase 5: Profile Display Flow
  const profileId = profileIdArg || getProfileIdFromArgsOrActive(args, 1);
  if (!profileId) {
    console.error('❌ 没有 active profile，请先运行：/learn:profile create');
    return;
  }

  const profile = runCcwJson(`ccw learn:read-profile --profile-id \"${profileId}\" --json`);
  const knownTopics = Array.isArray(profile?.known_topics) ? profile.known_topics : [];

  let snapshot = null;
  try {
    snapshot = runCcwJson(`ccw learn:read-profile-snapshot --profile-id \"${profileId}\" --json`);
  } catch {
    snapshot = null;
  }

  console.log('\n## 当前 Profile\n');
  console.log(`Profile ID: ${profile.profile_id}`);
  console.log(`经验等级（可空）: ${profile.experience_level ?? null}`);
  console.log(`自述 known_topics 数量: ${knownTopics.length}`);
  if (knownTopics.length > 0) {
    knownTopics
      .slice()
      .sort((a, b) => (b.proficiency ?? 0) - (a.proficiency ?? 0))
      .slice(0, 10)
      .forEach((t) => console.log(`  - ${t.topic_id}: ${Math.round((t.proficiency ?? 0) * 100)}%`));
  }

  if (snapshot && snapshot.skills && Array.isArray(snapshot.skills.inferred)) {
    console.log('\n推断技能（snapshot）：');
    const inferred = snapshot.skills.inferred;
    if (inferred.length === 0) console.log('  (none)');
    inferred.forEach((s) => console.log(`  - ${s.topic_id}: ${s.status} (p=${s.proficiency ?? null}, c=${s.confidence ?? null})`));
  }
}

switch (op) {
  case 'create':
    createFlow();
    break;
  case 'update':
    updateFlow();
    break;
  case 'select':
    selectFlow();
    break;
  case 'show':
  default:
    showFlow();
    break;
}
```

### Tool-Verified Challenges (Deterministic Scratchpad)

If you later add tool-verified micro-challenges, use a deterministic scratch path (do not embed placeholder code strings).

- Scratch root: `.workflow/.scratchpad/learn-challenges`

```javascript
// Deterministic scratch file marker (used by tests and by tool-verified challenge flows).
const scratchRoot = '.workflow/.scratchpad/learn-challenges';

// Example: parse mcp-runner output robustly (avoid JSON.parse(raw)).
const raw = Bash('ccw mcp-runner --some-args --json');
const challengeResult = lastJsonObjectFromText(raw);
```

### Phase 4: Profile Selection Flow (select)

Implementation is in `selectFlow()` above; key invariants:

```javascript
const stateResp = lastJsonObjectFromText(Bash('ccw learn:read-state --json'));
const activeId = stateResp.data.active_profile_id;
// ...
Bash(`ccw learn:update-state --field active_profile_id --value "${selectedId}" --json`);
```

### Phase 5: Profile Display Flow (show)

Implementation is in `showFlow()` above; key invariants:

```javascript
const stateResp = lastJsonObjectFromText(Bash('ccw learn:read-state --json'));
const profileId = stateResp.data.active_profile_id;
const profileResp = lastJsonObjectFromText(Bash(`ccw learn:read-profile --profile-id "${profileId}" --json`));
```
