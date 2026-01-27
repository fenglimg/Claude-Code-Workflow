import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, '../..');

const ccwBin = path.join(repoRoot, 'ccw/bin/ccw.js');

function runCcw(args, env = {}) {
  const finalEnv = { ...process.env, ...env, CCW_PROJECT_ROOT: repoRoot };
  const res = spawnSync(process.execPath, [ccwBin, ...args], { cwd: repoRoot, env: finalEnv, encoding: 'utf8' });
  const stdout = (res.stdout || '').trim();
  const out = stdout ? JSON.parse(stdout) : null;
  return { res, out };
}

function makeValidQuestions() {
  return [
    {
      question: 'In JavaScript, what does the const keyword do?',
      difficulty: 0.5,
      options: [
        { text: 'Declares a block-scoped constant binding', score: 1 },
        { text: 'Declares a function-scoped variable', score: 0.2 },
        { text: 'Defines a class method', score: 0.1 },
        { text: 'Creates a JSON object', score: 0 }
      ]
    },
    {
      question: 'Which statement correctly creates an array in JavaScript?',
      difficulty: 0.48,
      options: [
        { text: 'const a = [];', score: 1 },
        { text: 'const a = {};', score: 0.25 },
        { text: 'const a = new Map();', score: 0.1 },
        { text: 'const a = 1..3;', score: 0 }
      ]
    },
    {
      question: 'What is the purpose of the strict equality operator (===) in JavaScript?',
      difficulty: 0.52,
      options: [
        { text: 'Compare value and type without coercion', score: 1 },
        { text: 'Compare values after type coercion', score: 0.2 },
        { text: 'Assign a value to a variable', score: 0.1 },
        { text: 'Create a new object instance', score: 0 }
      ]
    },
    {
      question: 'In JavaScript, what does Array.prototype.map return?',
      difficulty: 0.5,
      options: [
        { text: 'A new array with transformed elements', score: 1 },
        { text: 'The original array mutated in place', score: 0.2 },
        { text: 'A promise resolving to an array', score: 0.1 },
        { text: 'A map (key/value) object', score: 0 }
      ]
    }
  ];
}

describe('ccw learn:validate-questions', () => {
  it('returns ok=true and invalid_count=0 for valid input', () => {
    const questions = JSON.stringify(makeValidQuestions());
    const { res, out } = runCcw(['learn:validate-questions', '--target-difficulty', '0.5', '--questions', questions, '--json']);
    assert.equal(res.status, 0);
    assert.equal(out.ok, true);
    assert.equal(out.data.ok, true);
    assert.equal(out.data.invalid_count, 0);
  });

  it('returns ok=false with invalid_count>0 for invalid questions', () => {
    const bad = makeValidQuestions();
    bad[0].options = bad[0].options.slice(0, 3); // violates OPTIONS_COUNT
    const questions = JSON.stringify(bad);

    const { res, out } = runCcw(['learn:validate-questions', '--target-difficulty', '0.5', '--questions', questions, '--json']);
    assert.equal(res.status, 0);
    assert.equal(out.ok, true);
    assert.equal(out.data.ok, false);
    assert.ok(out.data.invalid_count >= 1);
    assert.ok(Array.isArray(out.data.errors));
  });

  it('returns ok=false when questions JSON is invalid', () => {
    const { res, out } = runCcw([
      'learn:validate-questions',
      '--target-difficulty',
      '0.5',
      '--questions',
      '{not-json}',
      '--json'
    ]);
    assert.equal(res.status, 1);
    assert.equal(out.ok, false);
    assert.ok(String(out.error.message).toLowerCase().includes('parse'));
  });
});

