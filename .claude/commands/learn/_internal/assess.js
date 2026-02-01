import { safeExecJson } from './error-handler.js';

function requireFn(name, fn) {
  if (typeof fn !== 'function') {
    throw new Error(`learn/_internal/assess.js: missing dependency ${name}()`);
  }
}

function nowIso() {
  return new Date().toISOString();
}

function escapeSingleQuotesForShell(s) {
  return String(s ?? '').replace(/'/g, "'\\''");
}

function execCcwJson(bashFn, command, desc) {
  const out = safeExecJson(command, desc, { bashFn });
  if (!out || typeof out !== 'object') throw new Error(`Unexpected CLI output for ${desc}`);
  if (!out.ok) {
    const msg = out?.error?.message || `${desc} failed`;
    const err = new Error(msg);
    err.code = out?.error?.code;
    err.details = out?.error?.details;
    throw err;
  }
  return out.data;
}

function clamp01(n) {
  const x = Number(n);
  if (!Number.isFinite(x)) return 0;
  return Math.max(0, Math.min(1, x));
}

function normalizeInferredTopicId(raw) {
  return String(raw ?? '').trim().toLowerCase();
}

function safeJsonParse(line) {
  try {
    return JSON.parse(line);
  } catch {
    return null;
  }
}

function tryReadText(Read, path) {
  try {
    const v = Read(path);
    return typeof v === 'string' ? v : String(v ?? '');
  } catch {
    return '';
  }
}

function findPriorAssessmentSummary(Read, profileId, topicId, packKeyHash) {
  const eventsPath = `.workflow/learn/profiles/events/${profileId}.ndjson`;
  const raw = tryReadText(Read, eventsPath);
  if (!raw.trim()) return null;

  // Scan from the end (bounded) for performance.
  const lines = raw.trim().split(/\r?\n/);
  for (let i = lines.length - 1; i >= 0 && i >= lines.length - 500; i -= 1) {
    const evt = safeJsonParse(lines[i]);
    if (!evt || evt.type !== 'ASSESSMENT_SESSION_SUMMARIZED') continue;
    const p = evt.payload || {};
    if (String(p.topic_id || '') !== topicId) continue;

    const hash = String(p.pack_key_hash || '');
    if (hash && hash === packKeyHash) return { event: evt, payload: p };
  }

  return null;
}

/**
 * Internal-only assessment module for /learn:profile.
 *
 * Cycle-4 scope:
 * - No self-rating (no "correct/partial/wrong" from user)
 * - No skip; only confirm submit / continue edit
 * - Continuous ability interval [lo,hi] (0..1), stop when sigma<=0.1 (or N_seed_max reached -> low_confidence)
 * - Seed=4 comes from pack (Gemini-first via ccw learn:ensure-pack); full pack is async job (non-blocking)
 * - Event persistence is batched via ccw learn:append-profile-events-batch (flush every 4 questions)
 */
export function createAssess(deps = {}) {
  const AskUserQuestion = deps.AskUserQuestion;
  const Bash = deps.Bash;
  const Read = deps.Read;
  const scoreAnswer =
    typeof deps.scoreAnswer === 'function'
      ? deps.scoreAnswer
      : ({ answer_text }) => {
          // Deterministic fallback scorer (tests + safe default).
          const a = String(answer_text ?? '').trim();
          const unknown = /不知道|不会|不清楚|不了解|忘了/i.test(a);
          if (!a) return { p_correct: 0, confidence: 0.8, rubric: 'empty', evidence: 'empty answer' };
          if (unknown) return { p_correct: 0.1, confidence: 0.8, rubric: 'unknown', evidence: 'explicit unknown' };
          if (a.length < 12) return { p_correct: 0.4, confidence: 0.4, rubric: 'too_short', evidence: 'too short' };
          return { p_correct: 0.8, confidence: 0.7, rubric: 'heuristic_ok', evidence: 'non-trivial answer' };
        };

  requireFn('AskUserQuestion', AskUserQuestion);
  requireFn('Bash', Bash);
  requireFn('Read', Read);

  function resolveTopicOrThrow(rawTopicLabel) {
    const raw = String(rawTopicLabel ?? '').trim();
    if (!raw) throw new Error('assessTopic: missing topicId/raw label');

    const resolved = execCcwJson(
      Bash,
      ['ccw learn:resolve-topic', `--raw-topic-label ${JSON.stringify(raw)}`, '--json'].join(' '),
      'learn:resolve-topic'
    );

    if (resolved.found) return resolved;
    if (resolved.ambiguous) {
      const err = new Error('Topic resolve ambiguous; must be resolved in /learn:profile topic selection');
      err.code = 'AMBIGUOUS_TOPIC';
      err.details = { raw_topic_label: raw, candidates: resolved.candidates };
      throw err;
    }

    // Cycle-4 policy: do NOT auto ensure-topic here (only user-selected topics can be ensured upstream).
    const err = new Error('Topic not found; must be ensured in /learn:profile topic selection');
    err.code = 'TOPIC_NOT_FOUND';
    err.details = { raw_topic_label: raw };
    throw err;
  }

  function ensurePack(topicId, language, mode) {
    return execCcwJson(
      Bash,
      [
        'ccw learn:ensure-pack',
        `--topic-id ${JSON.stringify(topicId)}`,
        mode ? `--mode ${JSON.stringify(mode)}` : '',
        language ? `--language ${JSON.stringify(language)}` : '',
        '--json'
      ].filter(Boolean).join(' '),
      'learn:ensure-pack'
    );
  }

  function readPack(packKey) {
    const readData = execCcwJson(
      Bash,
      [
        'ccw learn:read-pack',
        `--topic-id ${JSON.stringify(packKey.topic_id)}`,
        `--taxonomy-version ${JSON.stringify(packKey.taxonomy_version)}`,
        `--rubric-version ${JSON.stringify(packKey.rubric_version)}`,
        `--question-bank-version ${JSON.stringify(packKey.question_bank_version)}`,
        `--language ${JSON.stringify(packKey.language)}`,
        '--json'
      ].join(' '),
      'learn:read-pack'
    );
    if (!readData.found) throw new Error('assessTopic: pack not found after ensure-pack');
    return readData.pack;
  }

  function packStatus(topicId, language) {
    return execCcwJson(
      Bash,
      ['ccw learn:pack-status', `--topic-id ${JSON.stringify(topicId)}`, language ? `--language ${JSON.stringify(language)}` : '', '--json']
        .filter(Boolean)
        .join(' '),
      'learn:pack-status'
    );
  }

  function appendEventsBatchBestEffort(profileId, events) {
    try {
      const payloadStr = escapeSingleQuotesForShell(JSON.stringify(events ?? []));
      execCcwJson(
        Bash,
        ['ccw learn:append-profile-events-batch', `--profile-id ${JSON.stringify(profileId)}`, `--events '${payloadStr}'`, '--json'].join(
          ' '
        ),
        'learn:append-profile-events-batch'
      );
    } catch {
      // best-effort
    }
  }

  function assessTopic(input) {
    const profileId = String(input?.profileId ?? '').trim();
    const topicIdRaw = String(input?.topicId ?? '').trim();
    const language = String(input?.language ?? 'zh-CN').trim() || 'zh-CN';

    if (!profileId) throw new Error('assessTopic: missing profileId');
    if (!topicIdRaw) throw new Error('assessTopic: missing topicId');

    const resolved = resolveTopicOrThrow(topicIdRaw);
    const topicId = normalizeInferredTopicId(resolved.topic_id);

    // Always ensure seed pack first (blocking).
    const seedEnsure = ensurePack(topicId, language, 'seed');
    const seedPackKey = seedEnsure.pack_key;
    const packKeyHash = seedEnsure.pack_key_hash;

    // No-op if already assessed for same pack_key.
    const prior = findPriorAssessmentSummary(Read, profileId, topicId, packKeyHash);
    if (prior) {
      return {
        ok: true,
        reused: true,
        topic_id: topicId,
        algorithm_version: 'cycle-4-interval-v1',
        pack_key: seedPackKey,
        pack_key_hash: packKeyHash,
        previous_summary: prior.payload?.summary ?? null
      };
    }

    const sessionId = `as-${Date.now()}`;
    const pendingEvents = [];

    const pushEvt = (type, payload) => {
      pendingEvents.push({
        type,
        actor: 'agent',
        payload: payload ?? {}
      });
    };

    const FLUSH_INTERVAL = 4;
    const flush = () => {
      if (pendingEvents.length === 0) return;
      appendEventsBatchBestEffort(profileId, pendingEvents.splice(0, pendingEvents.length));
    };

    pushEvt('ASSESSMENT_SESSION_STARTED', {
      session_id: sessionId,
      topic_id: topicId,
      pack_key: seedPackKey,
      pack_key_hash: packKeyHash,
      algorithm_version: 'cycle-4-interval-v1',
      started_at: nowIso()
    });

    // Start full-pack job (non-blocking). We never wait here.
    try {
      ensurePack(topicId, language, 'full');
    } catch {
      // ignore; we can still continue with session-level questions
    }

    // Load initial pack (seed or existing full).
    let pack = readPack(seedPackKey);

    // Evidence map: subpoint_id -> pass_count.
    const evidence = new Map();
    const subpointMeta = new Map(); // subpoint_id -> {priority,min_evidence,label}

    const loadTaxonomyFromPack = (p) => {
      const sps = Array.isArray(p?.taxonomy?.subpoints) ? p.taxonomy.subpoints : [];
      for (const sp of sps) {
        if (!sp || typeof sp !== 'object') continue;
        const sid = String(sp.id || '');
        if (!sid) continue;
        subpointMeta.set(sid, {
          priority: String(sp.priority || 'core'),
          min_evidence: Number(sp.min_evidence ?? 1) || 1,
          label: String(sp.label || sid)
        });
        if (!evidence.has(sid)) evidence.set(sid, 0);
      }
    };
    loadTaxonomyFromPack(pack);

    const mustIds = () => [...subpointMeta.entries()].filter(([, v]) => v.priority === 'must').map(([k]) => k);

    const isMustEvidenceSatisfied = () => {
      const must = mustIds();
      if (must.length === 0) return true;
      for (const id of must) {
        const meta = subpointMeta.get(id);
        if (!meta) continue;
        const c = evidence.get(id) || 0;
        if (c < meta.min_evidence) return false;
      }
      return true;
    };

    // Ability interval in [0,1].
    let lo = 0;
    let hi = 1;
    const sigma = () => hi - lo;
    const midpoint = () => (lo + hi) / 2;

    const pass_th = 0.75;
    const fail_th = 0.25;
    const confidence_gate = 0.6;

    const asked = new Set();
    let askedCount = 0;
    let lowConfidenceStop = false;

    // Seed difficulties are fixed; order is adaptive.
    const SEED_DIFFICULTIES = [0.25, 0.45, 0.65, 0.85];
    const N_SEED_MAX = 6;

    const normalizeQuestion = (q) => {
      const id = String(q?.id || '');
      const prompt = String(q?.prompt || '');
      const subpoint_ids = Array.isArray(q?.subpoint_ids) ? q.subpoint_ids.map((x) => String(x)).filter(Boolean) : [];
      const difficulty = typeof q?.difficulty === 'number' ? q.difficulty : null;
      const capability_node = String(q?.capability_node || '');
      return { id, prompt, subpoint_ids, difficulty, capability_node };
    };

    const pickSeedQuestion = () => {
      const qs = (Array.isArray(pack?.questions) ? pack.questions : []).map(normalizeQuestion).filter((q) => q.id && q.prompt);
      const seedQs = qs.filter((q) => typeof q.difficulty === 'number' && SEED_DIFFICULTIES.some((d) => Math.abs(q.difficulty - d) < 1e-6));
      const remaining = seedQs.filter((q) => !asked.has(q.id));
      if (remaining.length === 0) return null;
      const mid = midpoint();
      remaining.sort((a, b) => Math.abs(a.difficulty - mid) - Math.abs(b.difficulty - mid));
      return remaining[0];
    };

    const pickFromFullPack = () => {
      const qs = (Array.isArray(pack?.questions) ? pack.questions : []).map(normalizeQuestion).filter((q) => q.id && q.prompt);
      const candidates = qs.filter((q) => typeof q.difficulty === 'number' && !asked.has(q.id));
      if (candidates.length === 0) return null;
      const mid = midpoint();
      candidates.sort((a, b) => Math.abs(a.difficulty - mid) - Math.abs(b.difficulty - mid));
      return candidates[0];
    };

    const buildSessionQuestion = (difficulty, capability_node) => {
      const id = `session-q${askedCount + 1}`;
      const cap = capability_node || 'debug';
      const d = Number.isFinite(Number(difficulty)) ? clamp01(difficulty) : clamp01(midpoint());
      const prompt =
        `【${topicId}｜会话补题｜${cap}｜d=${d.toFixed(2)}】\\n` +
        `请根据你的理解作答：\\n` +
        `1) 给出可检验的解释/步骤\\n` +
        `2) 给一个具体例子/场景\\n` +
        `3) 指出一个边界条件/常见坑（如适用）\\n` +
        `（不知道可以直接说不知道）`;
      return { id, prompt, subpoint_ids: [], difficulty: d, capability_node: cap };
    };

    const askAnswerWithConfirm = (questionPrompt) => {
      const ANSWER_KEY = 'assessment_answer';
      const SUBMIT_KEY = 'assessment_submit_action';

      let answerText = '';
      for (;;) {
        const ans = AskUserQuestion({
          questions: [
            {
              key: ANSWER_KEY,
              header: `作答（${topicId}）`,
              multiSelect: false,
              question: questionPrompt,
              options: []
            }
          ]
        });
        answerText = String(ans?.[ANSWER_KEY] ?? '').trim();

        const confirm = AskUserQuestion({
          questions: [
            {
              key: SUBMIT_KEY,
              header: `提交确认（${topicId}）`,
              multiSelect: false,
              question: '请选择：确认提交 / 继续编辑（不提供跳过）',
              options: [
                { value: 'submit', label: '确认提交', description: '提交此答案并继续' },
                { value: 'edit', label: '继续编辑', description: '返回继续修改答案' }
              ]
            }
          ]
        });

        if (String(confirm?.[SUBMIT_KEY]) === 'edit') continue;
        return answerText;
      }
    };

    const updateInterval = (difficulty, p_correct, confidence) => {
      const d = clamp01(difficulty);
      if (confidence >= confidence_gate && p_correct >= pass_th) {
        lo = Math.max(lo, d);
      } else if (confidence >= confidence_gate && p_correct <= fail_th) {
        hi = Math.min(hi, d);
      }
      if (hi < lo) hi = lo;
    };

    for (;;) {
      if (sigma() <= 0.1 && isMustEvidenceSatisfied()) break;
      if (askedCount >= N_SEED_MAX) {
        lowConfidenceStop = sigma() > 0.1 || !isMustEvidenceSatisfied();
        break;
      }

      // Refresh full pack occasionally (coarse-grained) after flush windows.
      if (askedCount > 0 && askedCount % FLUSH_INTERVAL === 0) {
        try {
          const st = packStatus(topicId, language);
          if (st?.found && st?.pack_kind === 'full' && st?.full_completeness) {
            // Re-read pack (it may have been upgraded by async job).
            const pk = st.pack_key || seedPackKey;
            pack = readPack(pk);
            loadTaxonomyFromPack(pack);
          }
        } catch {
          // ignore
        }
      }

      let q = pickSeedQuestion();
      if (!q) q = pickFromFullPack();
      if (!q) q = buildSessionQuestion(midpoint(), 'debug');
      if (!q || !q.id) break;

      asked.add(q.id);
      askedCount += 1;

      pushEvt('ASSESSMENT_QUESTION_ASKED', {
        session_id: sessionId,
        topic_id: topicId,
        question_id: q.id,
        prompt: q.prompt,
        difficulty: q.difficulty,
        capability_node: q.capability_node || null,
        subpoint_ids: q.subpoint_ids,
        asked_at: nowIso()
      });

      const answerText = askAnswerWithConfirm(q.prompt);

      pushEvt('ASSESSMENT_ANSWER_RECORDED', {
        session_id: sessionId,
        topic_id: topicId,
        question_id: q.id,
        answer_text: answerText,
        recorded_at: nowIso()
      });

      let p_correct = 0.5;
      let confidence = 0;
      let rubric = 'unknown';
      let evidenceText = '';
      try {
        const scored = scoreAnswer({
          topic_id: topicId,
          question_id: q.id,
          question_prompt: q.prompt,
          difficulty: q.difficulty,
          capability_node: q.capability_node,
          answer_text: answerText
        });
        p_correct = clamp01(scored?.p_correct);
        confidence = clamp01(scored?.confidence);
        rubric = String(scored?.rubric ?? 'rubric');
        evidenceText = String(scored?.evidence ?? '');
      } catch (e) {
        p_correct = 0.5;
        confidence = 0;
        rubric = 'scorer_error';
        evidenceText = String(e?.message || e);
      }

      // Evidence updates only on confident pass.
      if (confidence >= confidence_gate && p_correct >= pass_th) {
        for (const sid of q.subpoint_ids || []) {
          evidence.set(sid, (evidence.get(sid) || 0) + 1);
        }
      }

      updateInterval(q.difficulty ?? midpoint(), p_correct, confidence);

      pushEvt('ASSESSMENT_SCORED', {
        session_id: sessionId,
        topic_id: topicId,
        question_id: q.id,
        scorer: 'cycle-4-rubric',
        p_correct,
        confidence,
        rubric,
        evidence: evidenceText,
        ability_interval: { lo, hi, sigma: sigma() },
        scored_at: nowIso()
      });

      if (askedCount % FLUSH_INTERVAL === 0) flush();
    }

    // Final flush + summarize.
    flush();

    const proficiency = clamp01(midpoint());
    const confidence = clamp01(1 - sigma());
    const completed = sigma() <= 0.1 && isMustEvidenceSatisfied() && !lowConfidenceStop;

    const stop_conditions = {
      sigma: sigma(),
      sigma_threshold: 0.1,
      must_evidence_satisfied: isMustEvidenceSatisfied(),
      asked_count: askedCount,
      low_confidence_stop: lowConfidenceStop
    };

    pushEvt('ASSESSMENT_SESSION_SUMMARIZED', {
      session_id: sessionId,
      topic_id: topicId,
      pack_key: seedPackKey,
      pack_key_hash: packKeyHash,
      algorithm_version: 'cycle-4-interval-v1',
      completed,
      summary: completed
        ? `已完成 ${topicId} 评估（sigma<=0.1）。`
        : `已结束 ${topicId} 评估（sigma=${sigma().toFixed(2)}，题数=${askedCount}，low_confidence=${lowConfidenceStop}）。`,
      question_count: askedCount,
      proficiency,
      confidence,
      stop_conditions,
      summarized_at: nowIso()
    });
    flush();

    return {
      ok: true,
      reused: false,
      session_id: sessionId,
      topic_id: topicId,
      algorithm_version: 'cycle-4-interval-v1',
      pack_key: seedPackKey,
      pack_key_hash: packKeyHash,
      question_count: askedCount,
      completed,
      proficiency,
      confidence,
      stop_conditions
    };
  }

  return { assessTopic };
}
