import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

function makeBaseQuestion() {
  return {
    question: 'What is the correct way to declare a const in JavaScript?',
    difficulty: 0.5,
    options: [
      { text: 'const x = 1;', score: 1, explanation: 'Correct syntax.' },
      { text: 'constant x = 1;', score: 0.2 },
      { text: 'let const x = 1;', score: 0.1 },
      { text: 'x := 1', score: 0 }
    ],
    rationale: 'Tests basic JS syntax.'
  };
}

describe('learn/question-validator', () => {
  it('accepts a valid question', async () => {
    const { validateQuestion } = await import('../dist/learn/question-validator.js');
    const q = makeBaseQuestion();
    const res = validateQuestion(q, 0.5);
    assert.equal(res.ok, true);
    assert.equal(res.errors.length, 0);
  });

  it('flags difficulty deviation', async () => {
    const { validateQuestion } = await import('../dist/learn/question-validator.js');
    const q = makeBaseQuestion();
    q.difficulty = 0.9;
    const res = validateQuestion(q, 0.5);
    assert.equal(res.ok, false);
    assert.ok(res.errors.some((e) => e.rule_id === 'DIFFICULTY_DEVIATION'));
  });

  it('flags invalid option count', async () => {
    const { validateQuestion } = await import('../dist/learn/question-validator.js');
    const q = makeBaseQuestion();
    q.options = q.options.slice(0, 3);
    const res = validateQuestion(q, 0.5);
    assert.equal(res.ok, false);
    assert.ok(res.errors.some((e) => e.rule_id === 'OPTIONS_COUNT'));
  });

  it('flags low best score', async () => {
    const { validateQuestion } = await import('../dist/learn/question-validator.js');
    const q = makeBaseQuestion();
    q.options[0].score = 0.6;
    const res = validateQuestion(q, 0.5);
    assert.equal(res.ok, false);
    assert.ok(res.errors.some((e) => e.rule_id === 'BEST_SCORE'));
  });

  it('flags insufficient discrimination', async () => {
    const { validateQuestion } = await import('../dist/learn/question-validator.js');
    const q = makeBaseQuestion();
    q.options[1].score = 0.85; // too close to best
    const res = validateQuestion(q, 0.5);
    assert.equal(res.ok, false);
    assert.ok(res.errors.some((e) => e.rule_id === 'DISCRIMINATION'));
  });

  it('flags stem length out of bounds', async () => {
    const { validateQuestion } = await import('../dist/learn/question-validator.js');
    const q = makeBaseQuestion();
    q.question = 'Too short?';
    const res = validateQuestion(q, 0.5);
    assert.equal(res.ok, false);
    assert.ok(res.errors.some((e) => e.rule_id === 'STEM_LEN'));
  });

  it('flags option length imbalance', async () => {
    const { validateQuestion } = await import('../dist/learn/question-validator.js');
    const q = makeBaseQuestion();
    q.options[0].text = 'a';
    q.options[1].text = 'This option is extremely long compared to others to trigger imbalance';
    const res = validateQuestion(q, 0.5);
    assert.equal(res.ok, false);
    assert.ok(res.errors.some((e) => e.rule_id === 'OPTION_LEN_BALANCE'));
  });

  it('validateQuestions groups valid/invalid and returns ok=false when any invalid', async () => {
    const { validateQuestions } = await import('../dist/learn/question-validator.js');
    const good = makeBaseQuestion();
    const bad = makeBaseQuestion();
    bad.options = bad.options.slice(0, 3);

    const out = validateQuestions([good, bad], 0.5, 1);
    assert.equal(out.ok, false);
    assert.equal(out.valid.length, 1);
    assert.equal(out.invalid.length, 1);
    assert.ok(out.invalid[0].errors.length >= 1);
  });
});

