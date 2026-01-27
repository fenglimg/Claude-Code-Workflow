import chalk from 'chalk';
import { normalizeQuestion, type GeneratedQuestion, type ValidationError } from '../learn/question-types.js';
import { validateQuestion, type QuestionValidationError } from '../learn/question-validator.js';

interface BaseOptions {
  json?: boolean;
}

interface ValidateQuestionsOptions extends BaseOptions {
  targetDifficulty?: string;
  questions?: string;
}

type ResultOk<T> = { ok: true; data: T };
type ResultErr = { ok: false; error: { code: string; message: string; details?: any } };
type Result<T> = ResultOk<T> | ResultErr;

function print<T>(options: BaseOptions, payload: Result<T>): void {
  if (options.json) {
    // eslint-disable-next-line no-console
    console.log(JSON.stringify(payload));
    return;
  }

  if (payload.ok) {
    // eslint-disable-next-line no-console
    console.log(chalk.green('✓ OK'));
    // eslint-disable-next-line no-console
    console.log(chalk.gray(JSON.stringify(payload.data, null, 2)));
  } else {
    // eslint-disable-next-line no-console
    console.error(chalk.red(`✗ ${payload.error.code}: ${payload.error.message}`));
    if (payload.error.details) {
      // eslint-disable-next-line no-console
      console.error(chalk.gray(JSON.stringify(payload.error.details, null, 2)));
    }
  }
}

function fail<T>(options: BaseOptions, error: ResultErr['error']): never {
  print(options, { ok: false, error } as Result<T>);
  process.exit(1);
}

function clamp01(n: number): number {
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(1, n));
}

function parseJsonArg(raw: string, label: string): any {
  try {
    return JSON.parse(String(raw));
  } catch (err: any) {
    throw Object.assign(new Error(`Invalid JSON for ${label} (parse error: ${err?.message ?? String(err)})`), {
      code: 'INVALID_ARGS',
      details: err?.message ?? String(err)
    });
  }
}

function normalizeQuestionsFromJson(parsed: any): { ok: true; questions: GeneratedQuestion[] } | { ok: false; errors: ValidationError[] } {
  const rawQuestions = Array.isArray(parsed) ? parsed : parsed?.questions;
  if (!Array.isArray(rawQuestions)) {
    throw Object.assign(new Error('Expected a JSON array of questions (or object with "questions" array)'), {
      code: 'INVALID_ARGS'
    });
  }

  const questions: GeneratedQuestion[] = [];
  const errors: ValidationError[] = [];
  for (let i = 0; i < rawQuestions.length; i += 1) {
    const res = normalizeQuestion(rawQuestions[i], `questions[${i}]`);
    if (res.ok) questions.push(res.value);
    else errors.push(...res.errors);
  }

  if (errors.length > 0) return { ok: false, errors };
  return { ok: true, questions };
}

export async function learnValidateQuestionsCommand(options: ValidateQuestionsOptions): Promise<void> {
  if (!options.targetDifficulty) fail(options, { code: 'INVALID_ARGS', message: 'Missing --target-difficulty' });
  if (!options.questions) fail(options, { code: 'INVALID_ARGS', message: 'Missing --questions (JSON string)' });

  const targetNum = Number(options.targetDifficulty);
  if (!Number.isFinite(targetNum)) fail(options, { code: 'INVALID_ARGS', message: 'target-difficulty must be a finite number (0..1)' });
  const targetDifficulty = clamp01(targetNum);

  try {
    const parsed = parseJsonArg(options.questions, '--questions');
    const normalized = normalizeQuestionsFromJson(parsed);
    if (!normalized.ok) {
      fail(options, { code: 'INVALID_QUESTION', message: 'Invalid question structure', details: normalized.errors });
    }

    const errors: Array<{ index: number; errors: QuestionValidationError[] }> = [];
    for (let i = 0; i < normalized.questions.length; i += 1) {
      const r = validateQuestion(normalized.questions[i], targetDifficulty);
      if (!r.ok) errors.push({ index: i, errors: r.errors });
    }

    const invalid_count = errors.length;
    const expected_count = 4;
    const ok = invalid_count === 0 && normalized.questions.length === expected_count;

    print(options, {
      ok: true,
      data: {
        ok,
        target_difficulty: targetDifficulty,
        question_count: normalized.questions.length,
        expected_count,
        invalid_count,
        errors
      }
    });
  } catch (err: any) {
    fail(options, { code: err?.code ?? 'ERROR', message: err?.message ?? String(err), details: err?.details });
  }
}

