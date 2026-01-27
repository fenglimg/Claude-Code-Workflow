import { normalizeQuestion, type GeneratedQuestion, type ValidationError } from './question-types.js';

export function lastJsonObjectFromText(text: string): any {
  const raw = String(text ?? '').trim();
  if (!raw) throw new Error('Empty command output');

  const lines = raw
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);

  for (let i = lines.length - 1; i >= 0; i -= 1) {
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

export function parseQuestionsFromText(text: string): GeneratedQuestion[] {
  const parsed = lastJsonObjectFromText(text);
  const rawQuestions = Array.isArray(parsed) ? parsed : parsed?.questions;

  if (!Array.isArray(rawQuestions)) {
    throw Object.assign(new Error('Expected a questions array in parsed JSON'), {
      code: 'INVALID_QUESTIONS_JSON',
      details: { keys: parsed && typeof parsed === 'object' ? Object.keys(parsed) : null }
    });
  }

  const questions: GeneratedQuestion[] = [];
  const errors: ValidationError[] = [];

  for (let i = 0; i < rawQuestions.length; i += 1) {
    const res = normalizeQuestion(rawQuestions[i], `questions[${i}]`);
    if (res.ok) questions.push(res.value);
    else errors.push(...res.errors);
  }

  if (errors.length > 0) {
    throw Object.assign(new Error('Invalid question structure'), { code: 'INVALID_QUESTION', details: errors });
  }

  return questions;
}

