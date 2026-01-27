export interface QuestionOption {
  text: string;
  score: number; // 0..1 (higher = better)
  explanation?: string;
}

export interface GeneratedQuestion {
  question: string;
  difficulty: number; // 0..1
  options: QuestionOption[];
  rationale?: string;
}

export interface ValidationError {
  path: string;
  message: string;
}

function clamp01(n: number): number {
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(1, n));
}

export function normalizeOption(raw: any, path: string): { ok: true; value: QuestionOption } | { ok: false; errors: ValidationError[] } {
  const errors: ValidationError[] = [];
  const text = typeof raw?.text === 'string' ? raw.text : null;
  if (!text) errors.push({ path: `${path}.text`, message: 'Expected non-empty string' });

  const scoreRaw = raw?.score;
  const scoreNum = typeof scoreRaw === 'number' ? scoreRaw : Number.NaN;
  if (!Number.isFinite(scoreNum)) errors.push({ path: `${path}.score`, message: 'Expected finite number' });

  if (errors.length > 0) return { ok: false, errors };

  const explanation = typeof raw?.explanation === 'string' ? raw.explanation : undefined;
  return { ok: true, value: { text, score: clamp01(scoreNum), explanation } };
}

export function normalizeQuestion(
  raw: any,
  path: string
): { ok: true; value: GeneratedQuestion } | { ok: false; errors: ValidationError[] } {
  const errors: ValidationError[] = [];
  const q = typeof raw?.question === 'string' ? raw.question : null;
  if (!q) errors.push({ path: `${path}.question`, message: 'Expected non-empty string' });

  const dRaw = raw?.difficulty;
  const dNum = typeof dRaw === 'number' ? dRaw : Number.NaN;
  if (!Number.isFinite(dNum)) errors.push({ path: `${path}.difficulty`, message: 'Expected finite number' });

  const opts = Array.isArray(raw?.options) ? raw.options : null;
  if (!opts) errors.push({ path: `${path}.options`, message: 'Expected array' });

  if (errors.length > 0) return { ok: false, errors };

  const normalizedOptions: QuestionOption[] = [];
  for (let i = 0; i < opts.length; i += 1) {
    const res = normalizeOption(opts[i], `${path}.options[${i}]`);
    if (!res.ok) errors.push(...res.errors);
    else normalizedOptions.push(res.value);
  }

  if (errors.length > 0) return { ok: false, errors };

  const rationale = typeof raw?.rationale === 'string' ? raw.rationale : undefined;
  return {
    ok: true,
    value: {
      question: q,
      difficulty: clamp01(dNum),
      options: normalizedOptions,
      rationale
    }
  };
}

