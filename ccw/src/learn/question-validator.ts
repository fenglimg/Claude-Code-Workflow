import type { GeneratedQuestion } from './question-types.js';

export type QuestionRuleId =
  | 'DIFFICULTY_DEVIATION'
  | 'OPTIONS_COUNT'
  | 'BEST_SCORE'
  | 'DISCRIMINATION'
  | 'STEM_LEN'
  | 'OPTION_LEN_BALANCE';

export interface QuestionValidationError {
  rule_id: QuestionRuleId;
  message: string;
  details?: any;
}

export interface QuestionValidationResult {
  ok: boolean;
  errors: QuestionValidationError[];
}

function clamp01(n: number): number {
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(1, n));
}

export function validateQuestion(q: GeneratedQuestion, targetDifficulty: number): QuestionValidationResult {
  const errors: QuestionValidationError[] = [];
  const target = clamp01(targetDifficulty);

  const diff = Math.abs(clamp01(q.difficulty) - target);
  if (diff > 0.15) {
    errors.push({
      rule_id: 'DIFFICULTY_DEVIATION',
      message: `difficulty deviation too large (diff=${diff.toFixed(2)} > 0.15)`,
      details: { target, actual: q.difficulty, diff }
    });
  }

  if (!Array.isArray(q.options) || q.options.length !== 4) {
    errors.push({
      rule_id: 'OPTIONS_COUNT',
      message: `expected exactly 4 options (got=${Array.isArray(q.options) ? q.options.length : 'n/a'})`
    });
    return { ok: false, errors };
  }

  const scores = q.options.map((o) => clamp01(o.score));
  const sorted = [...scores].sort((a, b) => b - a);
  const best = sorted[0] ?? 0;
  const second = sorted[1] ?? 0;

  if (best < 0.7) {
    errors.push({
      rule_id: 'BEST_SCORE',
      message: `best option score too low (best=${best.toFixed(2)} < 0.70)`,
      details: { best }
    });
  }

  const gap = best - second;
  if (gap < 0.25) {
    errors.push({
      rule_id: 'DISCRIMINATION',
      message: `insufficient discrimination between best and runner-up (gap=${gap.toFixed(2)} < 0.25)`,
      details: { best, second, gap }
    });
  }

  const stemLen = String(q.question ?? '').trim().length;
  if (stemLen < 15 || stemLen > 200) {
    errors.push({
      rule_id: 'STEM_LEN',
      message: `question length out of bounds (len=${stemLen}, expected 15..200)`,
      details: { len: stemLen }
    });
  }

  const optionLens = q.options.map((o) => String(o.text ?? '').trim().length);
  const minLen = Math.min(...optionLens);
  const maxLen = Math.max(...optionLens);
  const ratio = minLen > 0 ? maxLen / minLen : Infinity;
  if (minLen < 3 || ratio > 3) {
    errors.push({
      rule_id: 'OPTION_LEN_BALANCE',
      message: `option lengths imbalanced (min=${minLen}, max=${maxLen}, ratio=${Number.isFinite(ratio) ? ratio.toFixed(2) : 'inf'})`,
      details: { min: minLen, max: maxLen, ratio, lengths: optionLens }
    });
  }

  return { ok: errors.length === 0, errors };
}

export interface ValidateQuestionsResult {
  ok: boolean;
  valid: GeneratedQuestion[];
  invalid: Array<{ question: GeneratedQuestion; errors: QuestionValidationError[] }>;
}

export function validateQuestions(
  questions: GeneratedQuestion[],
  targetDifficulty: number,
  count = 4
): ValidateQuestionsResult {
  const valid: GeneratedQuestion[] = [];
  const invalid: Array<{ question: GeneratedQuestion; errors: QuestionValidationError[] }> = [];

  for (const q of Array.isArray(questions) ? questions : []) {
    const r = validateQuestion(q, targetDifficulty);
    if (r.ok) valid.push(q);
    else invalid.push({ question: q, errors: r.errors });
  }

  const ok = valid.length >= count && invalid.length === 0;
  return { ok, valid, invalid };
}

