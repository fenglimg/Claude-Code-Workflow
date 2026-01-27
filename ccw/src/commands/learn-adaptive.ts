import chalk from 'chalk';
import { applyRound, calculateTargetDifficulty, createInitialAdaptiveState, type AdaptiveAssessmentState } from '../learn/adaptive-ability-assessment.js';

interface BaseOptions {
  json?: boolean;
}

interface AdaptiveStepOptions extends BaseOptions {
  state?: string;
  roundResult?: string;
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

function coerceState(input: any): AdaptiveAssessmentState {
  const base = createInitialAdaptiveState();
  if (!input || typeof input !== 'object') return base;

  const range = input.range && typeof input.range === 'object' ? input.range : {};
  const min = Number(range.min);
  const max = Number(range.max);

  return {
    ...base,
    ...input,
    range: {
      min: Number.isFinite(min) ? min : base.range.min,
      max: Number.isFinite(max) ? max : base.range.max
    },
    confidence: Number.isFinite(Number(input.confidence)) ? Number(input.confidence) : base.confidence,
    rounds: Array.isArray(input.rounds) ? input.rounds : base.rounds
  };
}

function parseJsonArg(raw: string, label: string): any {
  try {
    return JSON.parse(String(raw));
  } catch (err: any) {
    throw Object.assign(new Error(`Invalid JSON for ${label}`), { code: 'INVALID_ARGS', details: err?.message ?? String(err) });
  }
}

export async function learnAdaptiveStepCommand(options: AdaptiveStepOptions): Promise<void> {
  if (!options.state) fail(options, { code: 'INVALID_ARGS', message: 'Missing --state (JSON string)' });
  if (!options.roundResult) fail(options, { code: 'INVALID_ARGS', message: 'Missing --round-result (JSON string)' });

  try {
    const state = coerceState(parseJsonArg(options.state, '--state'));
    const rr = parseJsonArg(options.roundResult, '--round-result');

    const correct_ratio = Number(rr.correct_ratio);
    const score_mean = Number(rr.score_mean ?? rr.correct_ratio);
    const consistency = Number(rr.consistency);
    const questionCount = Number.isFinite(Number(rr.question_count)) ? Number(rr.question_count) : 4;

    if (!Number.isFinite(correct_ratio) || !Number.isFinite(consistency)) {
      fail(options, { code: 'INVALID_ARGS', message: 'round-result must include numeric correct_ratio and consistency' });
    }

    const targetDifficulty = Number.isFinite(Number(rr.target_difficulty))
      ? Number(rr.target_difficulty)
      : calculateTargetDifficulty(state.range, { jitter: state.jitter });

    const { updated_state, should_continue, next_target_difficulty } = applyRound({
      state,
      targetDifficulty,
      roundResult: { correct_ratio, score_mean, consistency },
      questionCount
    });

    print(options, {
      ok: true,
      data: { should_continue, next_target_difficulty, updated_state }
    });
  } catch (err: any) {
    fail(options, { code: err?.code ?? 'ERROR', message: err?.message ?? String(err), details: err?.details });
  }
}

