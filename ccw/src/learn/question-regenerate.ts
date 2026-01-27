import type { GeneratedQuestion } from './question-types.js';
import { validateQuestion, type QuestionValidationError } from './question-validator.js';

export interface RegenerateOptions {
  maxAttempts?: number;
}

export interface RegenerateResultOk {
  ok: true;
  questions: GeneratedQuestion[];
  attempts_used: number;
}

export interface RegenerateResultErr {
  ok: false;
  questions: GeneratedQuestion[];
  attempts_used: number;
  invalid_count: number;
  last_errors: Array<{ index: number; errors: QuestionValidationError[] }>;
}

export type RegenerateResult = RegenerateResultOk | RegenerateResultErr;

export type GenerateFn = (args: {
  targetDifficulty: number;
  count: number;
  attempt: number;
  alreadyValid: GeneratedQuestion[];
}) => Promise<GeneratedQuestion[]>;

export async function regenerateUntilValid(
  generateFn: GenerateFn,
  targetDifficulty: number,
  count: number,
  opts: RegenerateOptions = {}
): Promise<RegenerateResult> {
  const maxAttempts = Number.isFinite(opts.maxAttempts) ? Math.max(1, Math.floor(opts.maxAttempts as number)) : 3;
  const target = Math.max(0, Math.min(1, Number(targetDifficulty)));

  const valid: GeneratedQuestion[] = [];
  let lastErrors: Array<{ index: number; errors: QuestionValidationError[] }> = [];

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    const needed = count - valid.length;
    if (needed <= 0) return { ok: true, questions: valid.slice(0, count), attempts_used: attempt - 1 };

    const batch = await generateFn({ targetDifficulty: target, count: needed, attempt, alreadyValid: [...valid] });
    if (!Array.isArray(batch)) {
      lastErrors = [
        { index: -1, errors: [{ rule_id: 'OPTIONS_COUNT', message: 'generateFn did not return an array' }] }
      ];
      continue;
    }

    lastErrors = [];
    for (let i = 0; i < batch.length; i += 1) {
      const q = batch[i];
      const res = validateQuestion(q, target);
      if (res.ok) {
        valid.push(q);
        if (valid.length >= count) return { ok: true, questions: valid.slice(0, count), attempts_used: attempt };
      } else {
        lastErrors.push({ index: i, errors: res.errors });
      }
    }
  }

  return {
    ok: false,
    questions: valid.slice(0, count),
    attempts_used: maxAttempts,
    invalid_count: lastErrors.length,
    last_errors: lastErrors
  };
}
