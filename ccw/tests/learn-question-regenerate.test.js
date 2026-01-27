import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

function makeValid(i = 0) {
  return {
    question: `Q${i}: Which statement is correct?`,
    difficulty: 0.5,
    options: [
      { text: 'A correct', score: 1 },
      { text: 'Option B', score: 0.2 },
      { text: 'Option C', score: 0.1 },
      { text: 'Option D', score: 0 }
    ]
  };
}

function makeInvalid(i = 0) {
  return { ...makeValid(i), options: [{ text: 'only one', score: 1 }] };
}

describe('learn/question-regenerate', () => {
  it('fills up to 4 valid questions within 2 attempts', async () => {
    const { regenerateUntilValid } = await import('../dist/learn/question-regenerate.js');

    const calls = [];
    const generateFn = async ({ count, attempt }) => {
      calls.push({ count, attempt });
      if (attempt === 1) return [makeValid(1), makeInvalid(2), makeValid(3), makeInvalid(4)];
      return [makeValid(5), makeValid(6)];
    };

    const res = await regenerateUntilValid(generateFn, 0.5, 4, { maxAttempts: 3 });
    assert.equal(res.ok, true);
    assert.equal(res.questions.length, 4);
    assert.equal(res.attempts_used, 2);
    assert.deepEqual(calls.map((c) => c.count), [4, 2]);
  });

  it('fails after maxAttempts and returns aggregated errors', async () => {
    const { regenerateUntilValid } = await import('../dist/learn/question-regenerate.js');

    const generateFn = async () => [makeInvalid(1), makeInvalid(2), makeInvalid(3), makeInvalid(4)];
    const res = await regenerateUntilValid(generateFn, 0.5, 4, { maxAttempts: 2 });
    assert.equal(res.ok, false);
    assert.equal(res.attempts_used, 2);
    assert.ok(res.invalid_count >= 1);
    assert.ok(Array.isArray(res.last_errors));
  });
});
