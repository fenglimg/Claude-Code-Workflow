import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

describe('learn/question-parse', () => {
  it('extracts questions JSON from noisy output (last JSON wins)', async () => {
    const { parseQuestionsFromText } = await import('../dist/learn/question-parse.js');

    const noisy = [
      'warning: ignore',
      '{"questions":[{\"question\":\"Q1\",\"difficulty\":0.5,\"options\":[{\"text\":\"A\",\"score\":1},{\"text\":\"B\",\"score\":0},{\"text\":\"C\",\"score\":0},{\"text\":\"D\",\"score\":0}]}]}',
      '{"questions":[{\"question\":\"Q2\",\"difficulty\":0.6,\"options\":[{\"text\":\"A\",\"score\":1},{\"text\":\"B\",\"score\":0},{\"text\":\"C\",\"score\":0},{\"text\":\"D\",\"score\":0}]}]}'
    ].join('\n');

    const qs = parseQuestionsFromText(noisy);
    assert.equal(qs.length, 1);
    assert.equal(qs[0].question, 'Q2');
  });

  it('extracts questions from code-fenced JSON', async () => {
    const { parseQuestionsFromText } = await import('../dist/learn/question-parse.js');

    const fenced = [
      'preface',
      '```json',
      '{"questions":[{\"question\":\"Q\",\"difficulty\":0.4,\"options\":[{\"text\":\"A\",\"score\":1},{\"text\":\"B\",\"score\":0},{\"text\":\"C\",\"score\":0},{\"text\":\"D\",\"score\":0}]}]}',
      '```',
      'tail'
    ].join('\n');

    const qs = parseQuestionsFromText(fenced);
    assert.equal(qs.length, 1);
    assert.equal(qs[0].difficulty, 0.4);
  });

  it('clamps numeric difficulty/score to [0,1]', async () => {
    const { parseQuestionsFromText } = await import('../dist/learn/question-parse.js');

    const text = '{"questions":[{\"question\":\"Q\",\"difficulty\":1.2,\"options\":[{\"text\":\"A\",\"score\":-0.2},{\"text\":\"B\",\"score\":2},{\"text\":\"C\",\"score\":0.5},{\"text\":\"D\",\"score\":0.1}]}]}';
    const qs = parseQuestionsFromText(text);
    assert.equal(qs[0].difficulty, 1);
    assert.equal(qs[0].options[0].score, 0);
    assert.equal(qs[0].options[1].score, 1);
  });

  it('throws a diagnosable error for invalid structures', async () => {
    const { parseQuestionsFromText } = await import('../dist/learn/question-parse.js');
    assert.throws(
      () => parseQuestionsFromText('{"questions":[{\"difficulty\":0.5,\"options\":[]}]}'),
      /Invalid question structure/
    );
  });
});

