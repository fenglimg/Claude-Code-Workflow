export interface Range01 {
  min: number;
  max: number;
}

export interface AdaptiveAssessmentRoundRecord {
  round_index: number;
  target_difficulty: number;
  question_count: number;
  score_mean: number;
  range_after: Range01;
  confidence_after: number;
  hard?: boolean;
  misjudgment?: MisjudgmentType | null;
}

export interface AdaptiveAssessmentEvidence {
  kind: 'adaptive_assessment';
  rounds: AdaptiveAssessmentRoundRecord[];
  range_after: Range01;
  confidence_after: number;
  target_confidence: number;
}

export interface AdaptiveAssessmentState {
  range: Range01;
  confidence: number;
  rounds: AdaptiveAssessmentRoundRecord[];

  minRounds: number;
  maxRounds: number;
  targetConfidence: number;
  jitter: number;

  /**
   * When true, the next round should use "hard" (verification) questions to avoid misjudgment loops.
   */
  hardNextRound: boolean;

  /**
   * Count of expand actions applied; used to prevent infinite expand cycles.
   */
  expandCount: number;
}

export type MisjudgmentType = 'all_correct' | 'all_wrong' | 'inconsistent';

export interface RoundResult {
  correct_ratio: number;
  score_mean: number;
  consistency: number;
}

export interface MisjudgmentDecision {
  type: MisjudgmentType;
  action: 'expand_upper' | 'expand_lower' | 'continue';
  reason: string;
}

export interface AdaptiveAssessmentOptions {
  minRounds?: number;
  maxRounds?: number;
  targetConfidence?: number;
  jitter?: number;
}

function clamp01(n: number): number {
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(1, n));
}

function clampRange(range: Range01): Range01 {
  const a = clamp01(range.min);
  const b = clamp01(range.max);
  if (a <= b) return { min: a, max: b };
  return { min: b, max: a };
}

function rangeSize(range: Range01): number {
  const r = clampRange(range);
  return Math.max(0, r.max - r.min);
}

export function createInitialAdaptiveState(opts: AdaptiveAssessmentOptions = {}): AdaptiveAssessmentState {
  const minRounds = Number.isFinite(opts.minRounds) ? Number(opts.minRounds) : 3;
  const maxRounds = Number.isFinite(opts.maxRounds) ? Number(opts.maxRounds) : 5;
  const targetConfidence = Number.isFinite(opts.targetConfidence) ? Number(opts.targetConfidence) : 0.85;
  const jitter = Number.isFinite(opts.jitter) ? Number(opts.jitter) : 0.05;

  return {
    range: { min: 0, max: 1 },
    confidence: 0,
    rounds: [],
    minRounds: Math.max(1, Math.min(10, Math.floor(minRounds))),
    maxRounds: Math.max(1, Math.min(10, Math.floor(maxRounds))),
    targetConfidence: clamp01(targetConfidence),
    jitter: Math.max(0, Math.min(0.25, jitter)),
    hardNextRound: false,
    expandCount: 0
  };
}

export function calculateTargetDifficulty(
  range: Range01,
  opts: { jitter?: number; random?: () => number } = {}
): number {
  const r = clampRange(range);
  const mid = (r.min + r.max) / 2;
  const jitter = Math.max(0, Math.min(0.25, Number.isFinite(opts.jitter) ? (opts.jitter as number) : 0.05));
  const rand = typeof opts.random === 'function' ? opts.random : Math.random;
  const j = (rand() * 2 - 1) * jitter;
  return clamp01(Math.min(r.max, Math.max(r.min, mid + j)));
}

type ResponseLike = boolean | { correct?: boolean | null };
type QuestionLike = { difficulty?: number } | null;

export function analyzeResponses(responses: ResponseLike[], questions: QuestionLike[] = []): RoundResult {
  const n = Math.max(0, responses?.length ?? 0);
  if (n === 0) return { correct_ratio: 0, score_mean: 0, consistency: 0 };

  const vals: number[] = [];
  for (const r of responses) {
    const correct = typeof r === 'boolean' ? r : Boolean(r?.correct);
    vals.push(correct ? 1 : 0);
  }

  const sum = vals.reduce((a, b) => a + b, 0);
  const mean = sum / n;

  // Consistency: measures monotonicity w.r.t. difficulty.
  // If a user gets harder questions right while missing easier ones, treat it as inconsistent.
  const diffs = Array.isArray(questions) ? questions.slice(0, n).map((q) => Number(q?.difficulty)) : [];
  const hasDiffs = diffs.length === n && diffs.every((d) => Number.isFinite(d));

  let consistency = 0.5;
  if (hasDiffs) {
    const items = diffs.map((d, i) => ({ d, v: vals[i] }));
    items.sort((a, b) => a.d - b.d);

    let inversions = 0;
    const pairs = (n * (n - 1)) / 2;
    for (let i = 0; i < items.length; i += 1) {
      for (let j = i + 1; j < items.length; j += 1) {
        // Expect v to not increase as difficulty increases.
        if (items[i].v < items[j].v) inversions += 1;
      }
    }
    // Scale inversion penalty so a fully "anti-monotonic" pattern can drop below 0.3 even with 4 questions.
    // With 4 binary questions, max inversions is 4 (pairs=6). Scaling by 1.5 maps 4/6 -> 1.0.
    consistency = pairs > 0 ? clamp01(1 - (inversions / pairs) * 1.5) : 1;
  } else {
    // Fallback: if we don't know difficulty ordering, use a gentle heuristic:
    // treat "all correct" / "all wrong" as highly consistent, otherwise medium.
    consistency = mean <= 0.01 || mean >= 0.99 ? 1 : 0.6;
  }

  // score_mean: currently identical to correct_ratio; placeholder for future weighting by difficulty.
  return { correct_ratio: clamp01(mean), score_mean: clamp01(mean), consistency };
}

export function detectMisjudgment(round: RoundResult, state: AdaptiveAssessmentState): MisjudgmentDecision | null {
  const correct = clamp01(round.correct_ratio);
  const consistency = clamp01(round.consistency);

  // Inconsistency means we don't trust the signal; keep narrowing conservative and continue.
  if (consistency < 0.3) {
    return {
      type: 'inconsistent',
      action: 'continue',
      reason: 'consistency < 0.3 (noisy signal)'
    };
  }

  // Extreme outcomes can indicate the current range is mis-centered (too easy/too hard).
  if (correct >= 0.99) {
    return {
      type: 'all_correct',
      action: state.range.max < 0.99 && state.expandCount < 2 ? 'expand_upper' : 'continue',
      reason: 'all correct (range likely too easy)'
    };
  }

  if (correct <= 0.01) {
    return {
      type: 'all_wrong',
      action: state.range.min > 0.01 && state.expandCount < 2 ? 'expand_lower' : 'continue',
      reason: 'all wrong (range likely too hard)'
    };
  }

  return null;
}

export function updateRange(
  round: RoundResult,
  state: AdaptiveAssessmentState
): { range: Range01; hardNextRound: boolean; expandCount: number } {
  const prev = clampRange(state.range);
  const size = rangeSize(prev);

  const decision = detectMisjudgment(round, state);
  if (decision?.action === 'expand_upper') {
    // Shift range upward and slightly widen to verify; cap expansions.
    const widen = Math.max(0.1, size);
    const max = clamp01(prev.max + widen * 0.5);
    const min = clamp01(Math.max(prev.min, max - widen));
    return { range: clampRange({ min, max }), hardNextRound: true, expandCount: state.expandCount + 1 };
  }
  if (decision?.action === 'expand_lower') {
    const widen = Math.max(0.1, size);
    const min = clamp01(prev.min - widen * 0.5);
    const max = clamp01(Math.min(prev.max, min + widen));
    return { range: clampRange({ min, max }), hardNextRound: true, expandCount: state.expandCount + 1 };
  }

  // Standard narrowing: move midpoint towards performance, shrink width.
  // correct_ratio > 0.5 => shift up, < 0.5 => shift down.
  const correct = clamp01(round.correct_ratio);
  const dir = correct >= 0.55 ? 1 : correct <= 0.45 ? -1 : 0;

  // Shrink factor based on how decisive the signal is.
  const decisiveness = Math.abs(correct - 0.5) * 2; // 0..1
  const shrink = 0.4 + 0.45 * decisiveness; // 0.4..0.85 (ensures convergence within <=5 rounds)
  const newSize = Math.max(0.02, size * (1 - shrink));

  const mid = (prev.min + prev.max) / 2;
  const shift = dir === 0 ? 0 : (size * 0.25 * dir * (0.5 + decisiveness / 2));
  const nextMid = clamp01(mid + shift);

  const half = newSize / 2;
  const next = clampRange({ min: nextMid - half, max: nextMid + half });
  return { range: next, hardNextRound: false, expandCount: state.expandCount };
}

export function updateConfidence(round: RoundResult, state: AdaptiveAssessmentState, nextRange: Range01): number {
  const prevSize = rangeSize(state.range);
  const nextSize = rangeSize(nextRange);
  const shrinkGain = prevSize > 0 ? clamp01((prevSize - nextSize) / prevSize) : 0;
  const consistency = clamp01(round.consistency);

  // Conservative accumulation: consistency dominates, shrink reinforces.
  const delta = 0.08 * consistency + 0.12 * shrinkGain;
  const next = clamp01(Math.min(0.99, state.confidence + delta));

  // Penalize noisy rounds to avoid false confidence.
  if (consistency < 0.3) return clamp01(Math.max(0, next - 0.08));
  return next;
}

export function shouldContinue(state: AdaptiveAssessmentState): boolean {
  const rounds = state.rounds.length;
  if (rounds < state.minRounds) return true;
  if (rounds >= state.maxRounds) return false;

  const size = rangeSize(state.range);
  if (state.confidence >= state.targetConfidence) return false;
  if (size <= 0.1) return false;
  return true;
}

export function applyRound(
  args: {
    state: AdaptiveAssessmentState;
    targetDifficulty: number;
    roundResult: RoundResult;
    questionCount: number;
  }
): { updated_state: AdaptiveAssessmentState; should_continue: boolean; next_target_difficulty: number | null } {
  const { state, targetDifficulty, roundResult, questionCount } = args;

  const { range: nextRange, hardNextRound, expandCount } = updateRange(roundResult, state);
  const nextConfidence = updateConfidence(roundResult, state, nextRange);
  const mis = detectMisjudgment(roundResult, state);

  const record: AdaptiveAssessmentRoundRecord = {
    round_index: state.rounds.length,
    target_difficulty: clamp01(targetDifficulty),
    question_count: Math.max(0, Math.floor(questionCount)),
    score_mean: clamp01(roundResult.score_mean),
    range_after: nextRange,
    confidence_after: nextConfidence,
    hard: state.hardNextRound || hardNextRound,
    misjudgment: mis?.type ?? null
  };

  const updated: AdaptiveAssessmentState = {
    ...state,
    range: nextRange,
    confidence: nextConfidence,
    rounds: [...state.rounds, record],
    hardNextRound,
    expandCount
  };

  const cont = shouldContinue(updated);
  const nextDifficulty = cont ? calculateTargetDifficulty(updated.range, { jitter: updated.jitter }) : null;
  return { updated_state: updated, should_continue: cont, next_target_difficulty: nextDifficulty };
}

export function toEvidence(state: AdaptiveAssessmentState): AdaptiveAssessmentEvidence {
  return {
    kind: 'adaptive_assessment',
    rounds: state.rounds,
    range_after: clampRange(state.range),
    confidence_after: clamp01(state.confidence),
    target_confidence: clamp01(state.targetConfidence)
  };
}
