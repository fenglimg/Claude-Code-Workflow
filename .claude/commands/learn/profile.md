---
name: profile
description: Manage user learning profiles (validated via ccw learn:* CLI) with optional inferred-skill proposals
argument-hint: "[create|update] [profile-id] [--goal=\"<learning goal>\"] [--full-assessment[=true|false]]"
allowed-tools: TodoWrite(*), Task(*), AskUserQuestion(*), Bash(*), Read(*)
---

# Learn:Profile Command (/learn:profile)

## Quick Start

```bash
/learn:profile create
/learn:profile update
```

## Execution Process

```
START
   ↓
Input Parsing:
   ├─ 解析 op(create|update) + flags(--goal, --full-assessment)
   └─ 硬约束（避免 INVALID_ARGS / UX 崩溃）：
      - AskUserQuestion 每次调用 <=4 questions
      - 每题 options 数量 2..4（multiSelect/free text 也需要 options 时要补齐）
      - question 文案唯一（同一次调用内）
      - option.label 唯一（同一题内）
   ↓

Topic V0 (Cycle-5: simpler topic model):
   ├─ topic 是最小能力粒度：topics = Set(topic_id)，无包含/无层级/无父子推导
   ├─ 去重规则：只按 topic_id 去重（不做“近似相似度合并”）
   ├─ topic_id 生成：topic_id = "t_" + sha1(normalized_label).slice(0,12)
   │                （即：t_<sha1(normalized_label)>；normalized_label = NFKC + trim + 空白折叠 + lowercase；保留中文）
   ├─ 合并规则：只允许显式合并 alias_map（profile.custom_fields.topic_v0.alias_to_canonical）
   └─ 旧 topics 只读展示：existing known_topics 不参与本次“新候选”池（避免重复创建）

Gemini Seed Pack + 题库策略（用于最小评估闭环）：
   ├─ 评估入口（assess_topic）先确保 seed pack（阻塞）：ccw learn:ensure-pack --mode seed（Gemini-first；失败回退 deterministic）
   └─ 然后触发 full pack（非阻塞）：ccw learn:ensure-pack --mode full（异步 job；后台补全题库）
   ↓

Phase A: Create Flow (/learn:profile create)
   Phase A1: pre_context_vNext（偏好/目标/学习方式等）
       ├─ AskUserQuestion 批 1（4题）
       └─ AskUserQuestion 批 2（4题）
   Phase A2: background_text（必填；可复用上一次 active profile）
       └─ AskUserQuestion（含 options；支持“查看示例”）
   Phase A3: existing profile upsert baseline（Topic V0 合并基线）
       ├─ ccw learn:read-profile（best-effort）
       ├─ 读取 existing known_topics（只读展示）
       └─ 读取 profile.custom_fields.topic_v0.alias_to_canonical（作为显式合并表）
   Phase A4: topic candidates（主 Agent parse+联想；考虑 existing topics；fallback heuristics 兜底）
       └─ 产出 <=16 候选，每个带 1 句理由
   Phase A5: topic 覆盖校验 loop（Topic V0）
       ├─ 每轮 1：4 个 multiSelect questions（<=4 options each，总<=16）
       ├─ 每轮 2：free text 补充 + covered/more 确认
       ├─ loop 上限：3 轮
       └─ 输出：topic_ids = t_<sha1(normalized_label)>, topics_by_id（并减去 existing topics）
   Phase A6: write profile（schema validated）
       ├─ ccw learn:write-profile
       └─ profile.custom_fields.topic_v0:
          ├─ topics_by_id（topic_id -> display_label/topic_key）
          └─ alias_to_canonical（显式合并表，延续旧值）
   Phase A7: side effects（best-effort）
       ├─ ccw learn:append-profile-events-batch PRECONTEXT_CAPTURED
       ├─ ccw learn:update-state active_profile_id
       └─ ccw learn:append-telemetry-event PROFILE_CREATED
   Phase A8: optional assessment (--full-assessment=true)
       ├─ AskUserQuestion：选择/输入要评估的 topic（可用 display_label；可手输中文 label）
       └─ internal assess.js：
          ├─ ccw learn:ensure-pack --mode seed（阻塞，Gemini-first）
          └─ ccw learn:ensure-pack --mode full（异步 job，不阻塞）

Phase B: Update Flow (/learn:profile update)
   Phase B1: load profile
       └─ ccw learn:read-profile
   Phase B2: AskUserQuestion update_action
       ├─ preferences -> pre_context_vNext -> FIELD_SET events -> write-profile
       ├─ assess_topic -> 输入 topic_id 或中文 label（Topic V0 hash）-> internal assess.js
       └─ 仅保留 create/update 两条主路径；查看/切换请直接使用 ccw learn:* CLI（避免在主交互里引入多分支噪音）

Outputs (What you get after running this command):
   ├─ profile.json snapshot: ccw learn:write-profile（schema validated）
   ├─ events: PRECONTEXT_CAPTURED + optional FIELD_SET + ASSESSMENT_*（append-only via ccw learn:append-profile-events-batch）
   ├─ state: active_profile_id updated（ccw learn:update-state）
   └─ packs: seed/full question bank written by ccw learn:ensure-pack (best-effort async for full)
   ↓
DONE
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
  |            +-> AskUserQuestion loop: topic 覆盖校验（Topic V0: label -> topic_id=t_<hash>；可 type something 补漏）
  |            +-> ccw learn:write-profile (schema validated)
  |            +-> ccw learn:append-profile-event PRECONTEXT_CAPTURED (best-effort)
  |            +-> ccw learn:update-state active_profile_id
  |            +-> ccw learn:append-telemetry-event PROFILE_CREATED (best-effort)
  |            +-> (if --full-assessment=true) internal assess.js:
  |                 - ccw learn:ensure-pack --mode seed (blocking; Gemini-first; deterministic fallback)
  |                 - ccw learn:ensure-pack --mode full (async job; non-blocking)
  |                 - adaptive interval assessment -> ASSESSMENT_* events
  |
  |-- update -> updateFlow()
  |            |
  |            +-> ccw learn:read-profile
  |            +-> AskUserQuestion: update_action
  |                  |-- preferences -> AskUserQuestion: pre_context_vNext
  |                  |                  -> ccw learn:append-profile-event FIELD_SET (best-effort)
  |                  |                  -> ccw learn:write-profile
  |                  |-- assess_topic -> internal assess.js (same ensure-pack + assessment loop)
  |                  `-- (no show/select in Cycle-5)
```

## Reality Check (Matches Current Backend)

- Profile file is written via `ccw learn:write-profile` (schema-validated).
- Inferred skills are stored as immutable events + folded into snapshot (`skills.inferred`), not merged into `known_topics`.
  - Use `ccw learn:propose-inferred-skill`, `ccw learn:confirm-inferred-skill`, `ccw learn:reject-inferred-skill`.
- Topic V0 metadata is stored in `profile.custom_fields.topic_v0`:
  - `topics_by_id`: `topic_id -> { display_label, topic_key }`
  - `alias_to_canonical`: explicit merge map (`topic_key -> canonical topic_id`)
- Pre-context is recorded as:
  - `PRECONTEXT_CAPTURED` event (append-only)
  - optional `FIELD_SET` corrections for `pre_context.parsed.*` (append-only)
- Background input is required in create (may reuse previous active profile); updates are opt-in via AskUserQuestion (no local file reading in this command).
- Minimal-by-default: detailed skill assessment is intended to happen JIT (Just-in-time) during `/learn:plan` / `/learn:execute`.

## Example Scenario (Topic V0 + Seed/Full Pack)

**场景**：你已有 profile `p_alice`，known_topics 里已经有 React / TypeScript。现在你想补充“跨平台开发”相关能力并做一次最小评估闭环。

1) `/learn:profile update p_alice` → 选择 `assess_topic`  
2) 输入 `跨平台开发`（中文 label）  
3) 系统内部会计算 Topic V0：
   - normalized_label = `"跨平台开发"`（NFKC/trim/空白折叠/lowercase）
   - topic_id = `t_<sha1(normalized_label)>`（示例：`t_3f5e9a1b2c3d`）
4) `internal assess.js` 执行：
   - `ccw learn:ensure-pack --mode seed`：生成/确保 seed 题（阻塞，Gemini-first；失败回退 deterministic）
   - `ccw learn:ensure-pack --mode full`：触发后台补全题库（异步 job，不阻塞）
   - 进入 interval assessment，产出 ASSESSMENT_* events，并最终写回 profile snapshot（proficiency 仍是 0..1）

**关键点**：如果该 profile 已经存在同一个 topic_id（或 alias_to_canonical 显式指向同一个 canonical），则不会重复创建；Topic V0 不做“包含关系/层级”推导。

## Implementation

```javascript
// /learn:profile create|update
// Tooling constraints: AskUserQuestion + Bash only. All persistence goes through ccw learn:* CLI.

const args = String($ARGUMENTS ?? '').trim().split(/\s+/).filter(Boolean);
const op = (args[0] || 'update').toLowerCase();

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
const { createHash } = await import('node:crypto');
const { createAssess } = await import('./_internal/assess.js');
const __assess = createAssess({ AskUserQuestion, Bash, Read });

function normalizeInferredTopicId(raw) {
  // Align with ccw safeInferredSkillIdOrThrow (lowercase + [a-z0-9_-]).
  const s = String(raw ?? '').trim().toLowerCase();
  const normalized = s
    .replace(/[^a-z0-9_-]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_+|_+$/g, '');
  return normalized;
}

function normalizeTopicKeyV0(rawLabel) {
  // V0: keep Unicode (incl. Chinese), only normalize whitespace/compat forms.
  // This is the stable "alias_key" and also the basis of topic_id hashing.
  return String(rawLabel ?? '')
    .normalize('NFKC')
    .trim()
    .replace(/\s+/g, ' ')
    .toLowerCase();
}

function topicIdV0FromKey(topicKey) {
  const k = String(topicKey ?? '').trim();
  if (!k) return '';
  const hex = createHash('sha1').update(k, 'utf8').digest('hex');
  return `t_${hex.slice(0, 12)}`;
}

function buildAliasMapV0(existingTopicIds, explicitAliasToCanonical) {
  // Build a minimal alias map so that common "label <-> existing topic_id" matches don't re-create hash ids.
  // Order: derived-from-existing (fallback) -> explicitAliasToCanonical (override).
  const map = Object.create(null);

  const add = (aliasKey, topicId) => {
    const k = normalizeTopicKeyV0(aliasKey);
    const v = normalizeInferredTopicId(topicId);
    if (!k || !v) return;
    map[k] = v;
  };

  for (const tid of Array.isArray(existingTopicIds) ? existingTopicIds : []) {
    const id = normalizeInferredTopicId(tid);
    if (!id) continue;
    // allow matching by id itself, and by "id with underscores as spaces" (cocos_creator -> cocos creator)
    add(id, id);
    add(id.replace(/_/g, ' '), id);
  }

  const explicit = explicitAliasToCanonical && typeof explicitAliasToCanonical === 'object' ? explicitAliasToCanonical : {};
  for (const [k, v] of Object.entries(explicit)) add(k, v);

  return map;
}

function topicV0FromLabel(rawLabel, aliasToCanonical) {
  const display_label = String(rawLabel ?? '').trim();
  const topic_key = normalizeTopicKeyV0(display_label);
  if (!topic_key) return { topic_id: '', topic_key: '', display_label: '' };

  const mapped = aliasToCanonical && typeof aliasToCanonical === 'object' ? aliasToCanonical[topic_key] : null;
  const topic_id = mapped ? normalizeInferredTopicId(mapped) : topicIdV0FromKey(topic_key);
  return { topic_id, topic_key, display_label };
}

function topicIdFromUserInputV0(rawInput, aliasToCanonical) {
  const s = String(rawInput ?? '').trim();
  if (!s) return '';

  // If user typed a safe topic_id, accept it directly.
  const maybeId = normalizeInferredTopicId(s);
  if (maybeId && /^[a-z0-9][a-z0-9_-]{0,127}$/.test(maybeId)) return maybeId;

  // Otherwise treat it as a human label and hash it (or map via alias).
  return topicV0FromLabel(s, aliasToCanonical).topic_id;
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
      options: [
        { value: 'type', label: '输入背景', description: '直接输入你的背景信息' },
        { value: 'example', label: '查看示例', description: '先看一条示例，再继续输入' }
      ],
      question:
        '请粘贴你的背景信息（尽量一行，包含你做过的项目/技术栈/经验即可）。\\n' +
        '（直接输入文本继续；如需示例可先选择“查看示例”）'
    }]
  });

  const v0 = String(ans2[KEY] ?? '').trim();
  // AskUserQuestion may return option label instead of value; normalize both.
  const v = v0 === '查看示例' ? 'example' : (v0 === '输入背景' ? 'type' : v0);
  if (v === 'example') {
    console.log('\n示例：\"3年React+Node，做过后台管理；用过Postgres\"\\n');
    const KEY2 = 'background_text_2';
    const ans3 = AskUserQuestion({
      questions: [{
        key: KEY2,
        header: '背景信息（必填）',
        multiSelect: false,
        options: [
          { value: 'type', label: '输入背景', description: '直接输入你的背景信息' },
          { value: 'cancel', label: '取消', description: '返回上一层' }
        ],
        question: '请继续输入你的背景信息（尽量一行）。'
      }]
    });
    const v20 = String(ans3[KEY2] ?? '').trim();
    const v2 = v20 === '取消' ? 'cancel' : (v20 === '输入背景' ? 'type' : v20);
    if (v2 === 'cancel') return '';
    if (!v2 || v2 === 'type') {
      // User picked the placeholder option but did not type; ask once more.
      const KEY3 = 'background_text_3';
      const ans4 = AskUserQuestion({
        questions: [{
          key: KEY3,
          header: '背景信息（必填）',
          multiSelect: false,
          options: [
            { value: 'type', label: '输入背景', description: '请直接输入你的背景信息' },
            { value: 'cancel', label: '取消', description: '返回上一层' }
          ],
          question: '请直接输入你的背景信息（必填，尽量一行）。'
        }]
      });
      const v30 = String(ans4[KEY3] ?? '').trim();
      const v3 = v30 === '取消' ? 'cancel' : (v30 === '输入背景' ? 'type' : v30);
      return v3 === 'cancel' || v3 === 'type' ? '' : v3;
    }
    return v2;
  }

  if (!v || v === 'type') {
    const KEY4 = 'background_text_4';
    const ans5 = AskUserQuestion({
      questions: [{
        key: KEY4,
        header: '背景信息（必填）',
        multiSelect: false,
        options: [
          { value: 'type', label: '输入背景', description: '请直接输入你的背景信息' },
          { value: 'cancel', label: '取消', description: '返回上一层' }
        ],
        question: '请直接输入你的背景信息（必填，尽量一行）。'
      }]
    });
    const v40 = String(ans5[KEY4] ?? '').trim();
    const v4 = v40 === '取消' ? 'cancel' : (v40 === '输入背景' ? 'type' : v40);
    return v4 === 'cancel' || v4 === 'type' ? '' : v4;
  }

  return v;
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
          { value: 'none', label: '暂不填', description: '本题先不填写' }
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
          { value: 'none', label: '暂不填', description: '本题先不填写' }
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
          { value: 'none', label: '暂不填', description: '本题先不填写' }
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
          { value: 'none', label: '暂不填', description: '本题先不填写' }
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
          { value: 'none', label: '暂不填', description: '本题先不填写' }
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
          { value: 'none', label: '暂不填', description: '本题先不填写' }
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
          { value: 'none', label: '暂不填', description: '本题先不填写' }
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
          { value: 'curiosity', label: '兴趣驱动', description: '好奇/想弄明白' },
          { value: 'none', label: '暂不填', description: '本题先不填写' }
        ]
      }
    ]
  });

  const isNone = (v) => v === 'none' || v === null || v === undefined;

  const asArray = (v) => {
    if (v == null) return [];
    if (Array.isArray(v)) return v.map(String).filter(Boolean);
    const s = String(v).trim();
    if (!s || isNone(s)) return [];
    return s.split(/[,，;；\\s]+/).map((x) => x.trim()).filter(Boolean);
  };

  const parseIntOrNull = (v) => {
    if (v == null) return null;
    const s = String(v).trim();
    if (!s || isNone(s)) return null;
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
    learning_style: isNone(b1[Q_STYLE]) ? null : (String(b1[Q_STYLE] ?? '').trim() || null),
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
    practice_intensity: isNone(b2[Q_PRACTICE]) ? null : (String(b2[Q_PRACTICE] ?? '').trim() || null),
    feedback_style: isNone(b2[Q_FEEDBACK]) ? null : (String(b2[Q_FEEDBACK] ?? '').trim() || null),
    pace: isNone(b2[Q_PACE]) ? null : (String(b2[Q_PACE] ?? '').trim() || null),
    motivation_type: isNone(b2[Q_MOTIVATION]) ? null : (String(b2[Q_MOTIVATION] ?? '').trim() || null)
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
  // - later cycles may reintroduce taxonomy-first governance, but Cycle-5 uses Topic V0 (hash-id) by default.
  return Array.isArray(initialKnownTopics) ? initialKnownTopics.slice() : [];
}

function topicCoverageValidationLoop(topicCandidates, opts = {}) {
  // Cycle-5 (Topic V0):
  // - Candidate selection is a coverage feedback loop (not a fixed taxonomy list).
  // - topic_id is stable: t_<sha1(normalized_label)>
  // - Dedupe/merge uses alias_map + existing topic_id derived aliases.
  // - existing topics are excluded from the "new candidates" output.

  const normalizeLabel = (s) => String(s ?? '').trim();
  const asCandidate = (x) => {
    if (typeof x === 'string') return { label: normalizeLabel(x), reason: '候选' };
    if (!x || typeof x !== 'object') return { label: '', reason: '' };
    const label = normalizeLabel(x.label ?? x.topic ?? x.topic_id ?? x.value ?? '');
    const reason = normalizeLabel(x.reason ?? x.description ?? x.why ?? '候选');
    return { label, reason };
  };

  const existingTopicIds = Array.isArray(opts.existingTopicIds) ? opts.existingTopicIds.map(String) : [];
  const explicitAliasToCanonical =
    opts.explicitAliasToCanonical && typeof opts.explicitAliasToCanonical === 'object' ? opts.explicitAliasToCanonical : {};
  const aliasToCanonical = buildAliasMapV0(existingTopicIds, explicitAliasToCanonical);
  const existingSet = new Set(existingTopicIds.map((t) => normalizeInferredTopicId(t)).filter(Boolean));

  const uniq = [];
  const seen = new Set();
  for (const x of Array.isArray(topicCandidates) ? topicCandidates : []) {
    const c = asCandidate(x);
    if (!c.label) continue;
    const key = normalizeTopicKeyV0(c.label);
    if (!key) continue;
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
      .filter((x) => Boolean(x) && x !== 'none' && x !== 'type' && x !== '无补充' && x !== '输入补充');

  let merged = [];
  for (let round = 1; round <= 3; round += 1) {
    const groups = chunk(uniq, 4);
    while (groups.length < 4) groups.push([]);

    const pickQuestions = groups.slice(0, 4).map((g, i) => {
      const key = `topic_pick_${round}_${i + 1}`;
      const opts = g.slice(0, 4).map((c) => ({ value: c.label, label: c.label, description: c.reason }));
      const options =
        opts.length > 0
          ? opts
          : [
              { value: 'none', label: '(无更多候选)', description: '可在下一步手动输入' },
              { value: 'none2', label: '(本组不选)', description: '跳过本组' }
            ];
      return {
        key,
        header: `候选 Topics (${i + 1}/4)`,
        multiSelect: true,
        question: `请选择与你相关的 topics - 第 ${i + 1} 组（可多选；也可以不选）。`,
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
        if (!s || s === 'none' || s === 'none2') continue;
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
          options: [
            { value: 'type', label: '输入补充', description: '直接输入文本即可（可空）' },
            { value: 'none', label: '无补充', description: '本轮不补充' }
          ],
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

    const extraRaw0 = String(round2?.[EXTRA_KEY] ?? '').trim();
    // AskUserQuestion may return option label instead of value; normalize both.
    const extraRaw =
      extraRaw0 === '无补充' ? 'none' : (extraRaw0 === '输入补充' ? 'type' : extraRaw0);
    const extraLabels = extraRaw === 'none' || extraRaw === 'type' ? [] : splitFreeText(extraRaw);
    merged = Array.from(new Set([...merged, ...selectedLabels, ...extraLabels])).filter(Boolean);

    if (String(round2?.[COVERED_KEY]) === 'covered') break;
  }

  // Canonicalize -> dedupe by topic_id -> subtract existing topics.
  const outIds = [];
  const topicsById = Object.create(null);
  for (const raw of merged) {
    const t = topicV0FromLabel(raw, aliasToCanonical);
    if (!t.topic_id) continue;
    if (existingSet.has(t.topic_id)) continue;
    if (topicsById[t.topic_id]) continue;
    topicsById[t.topic_id] = { display_label: t.display_label, topic_key: t.topic_key };
    outIds.push(t.topic_id);
  }

  return { topic_ids: outIds, topics_by_id: topicsById };
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

  const existingTopicIds = baseKnownTopics.map((t) => String(t?.topic_id ?? '')).filter(Boolean);
  const prevCustomFields =
    existingProfile?.custom_fields && typeof existingProfile.custom_fields === 'object' ? existingProfile.custom_fields : {};
  const prevTopicV0 = prevCustomFields?.topic_v0 && typeof prevCustomFields.topic_v0 === 'object' ? prevCustomFields.topic_v0 : {};
  const explicitAliasToCanonical =
    prevTopicV0?.alias_to_canonical && typeof prevTopicV0.alias_to_canonical === 'object' ? prevTopicV0.alias_to_canonical : {};

  if (existingTopicIds.length > 0) {
    console.log('\n(只读) 当前 profile 已有 topics：');
    existingTopicIds.slice(0, 20).forEach((t) => console.log(`  - ${t}`));
    if (existingTopicIds.length > 20) console.log(`  ... +${existingTopicIds.length - 20}`);
  }

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

  // D) Topic coverage validation loop (4x4 + type something).
  // Cycle-5 Topic V0: returns stable ids (t_<hash>) and a topics_by_id map for display/audit.
  const topicSel = topicCoverageValidationLoop(topicCandidates, { existingTopicIds, explicitAliasToCanonical });
  const topicIds = Array.isArray(topicSel?.topic_ids) ? topicSel.topic_ids : [];
  const topicsByIdV0 = topicSel?.topics_by_id && typeof topicSel.topics_by_id === 'object' ? topicSel.topics_by_id : {};

  const runFullAssessment = Boolean(flags.fullAssessment);
  const isMinimal = !runFullAssessment;
  const completionPercent = runFullAssessment ? 100 : 60;

  const prevTopicsById =
    prevTopicV0?.topics_by_id && typeof prevTopicV0.topics_by_id === 'object' ? prevTopicV0.topics_by_id : {};
  const nextTopicsById = { ...prevTopicsById, ...topicsByIdV0 };

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
    custom_fields: {
      ...prevCustomFields,
      topic_v0: {
        schema_version: '1.0.0',
        updated_at: now,
        alias_to_canonical: explicitAliasToCanonical,
        topics_by_id: nextTopicsById
      }
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
        ? (() => {
            const counts = Object.create(null);
            const opts = remaining.slice(0, 4).map((t) => {
              const tid = String(t);
              const base = String(topicsByIdV0?.[tid]?.display_label ?? tid);
              const k = base.toLowerCase();
              counts[k] = (counts[k] ?? 0) + 1;
              const label = counts[k] > 1 ? `${base} (${tid})` : base;
              const key = String(topicsByIdV0?.[tid]?.topic_key ?? '');
              return {
                value: tid,
                label,
                description: key ? `topic_key=${key}` : `topic_id=${tid}`
              };
            });
            return opts;
          })()
        : [{ value: 'game_dev_core', label: 'game_dev_core', description: '示例 topic（可直接输入其它）' }];

      const labelToId = new Map(topicOptions.map((o) => [String(o.label), String(o.value)]));

      const picked = AskUserQuestion({
        questions: [{
          key: TOPIC_KEY,
          header: '题目评估（单 topic）',
          multiSelect: false,
          question: '请选择（或直接输入）本次要评估的 topic_id（create 阶段默认必须进入评估）：',
          options: topicOptions
        }]
      });

      const rawPick = String(picked[TOPIC_KEY] ?? '').trim();
      const direct = normalizeInferredTopicId(rawPick);
      const topicId =
        labelToId.get(rawPick) ??
        direct ||
        topicV0FromLabel(rawPick, buildAliasMapV0(existingTopicIds, explicitAliasToCanonical)).topic_id;
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
  const topicLabels = (Array.isArray(topicIds) ? topicIds : []).map((tid) => {
    const name = topicsByIdV0?.[tid]?.display_label;
    return name ? `${name} (${tid})` : String(tid);
  });
  console.log(`Topics (confirmed): ${topicLabels.join(', ') || '(none)'}`);
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
        { value: 'assess_topic', label: '题目评估（单 topic）', description: '进入最小评估闭环（Cycle-5 Topic V0 + Gemini packs）' }
      ]
    }]
  });

  if (ans[KEY] === 'assess_topic') {
    const TOPIC_KEY = 'assess_topic_id';
    const picked = AskUserQuestion({
      questions: [{
        key: TOPIC_KEY,
        header: '题目评估入口（最小闭环）',
        multiSelect: false,
        question: '请输入要评估的 topic_id（可直接输入；也可取消）。',
        options: [
          { value: 'game_dev_core', label: 'game_dev_core', description: '示例 topic（可直接输入其它）' },
          { value: 'cancel', label: '取消', description: '返回上一步' }
        ]
      }]
    });

    const rawPick = String(picked[TOPIC_KEY] ?? '').trim();
    if (rawPick === 'cancel') return;

    const existingTopicIds = Array.isArray(profile?.known_topics) ? profile.known_topics.map((t) => String(t?.topic_id ?? '')).filter(Boolean) : [];
    const custom = profile?.custom_fields && typeof profile.custom_fields === 'object' ? profile.custom_fields : {};
    const topicV0 = custom?.topic_v0 && typeof custom.topic_v0 === 'object' ? custom.topic_v0 : {};
    const explicitAliasToCanonical =
      topicV0?.alias_to_canonical && typeof topicV0.alias_to_canonical === 'object' ? topicV0.alias_to_canonical : {};
    const aliasToCanonical = buildAliasMapV0(existingTopicIds, explicitAliasToCanonical);

    const topicId = topicIdFromUserInputV0(rawPick, aliasToCanonical);
    if (topicId) {
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

switch (op) {
  case 'create':
    createFlow();
    break;
  case 'update':
    updateFlow();
    break;
  default:
    console.log('Usage: /learn:profile create|update');
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
