/**
 * Regression test: learn docs should not rely on brittle JSON.parse(Bash(...)) patterns.
 *
 * The learn docs call CLI commands that may emit noisy output (stderr, shell startup output).
 * We document a helper that extracts the last valid JSON object from text instead.
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { lastJsonObjectFromText as lastJsonObjectFromTextFromModule } from '../../.claude/commands/learn/_internal/json-parser.js';

function lastJsonObjectFromText(text) {
  const raw = String(text ?? '').trim();
  if (!raw) throw new Error('Empty command output');

  const lines = raw.split('\n').map((l) => l.trim()).filter(Boolean);
  for (let i = lines.length - 1; i >= 0; i--) {
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

describe('learn docs: robust JSON parsing', () => {
  const planDoc = readFileSync('.claude/commands/learn/plan.md', 'utf8');
  const profileDoc = readFileSync('.claude/commands/learn/profile.md', 'utf8');

  it('does not use JSON.parse(Bash(...)) in learn docs', () => {
    assert.ok(!planDoc.includes('JSON.parse(Bash('), 'plan.md should not contain JSON.parse(Bash(');
    assert.ok(!profileDoc.includes('JSON.parse(Bash('), 'profile.md should not contain JSON.parse(Bash(');
  });

  it('documents a JSON extraction helper', () => {
    assert.ok(planDoc.includes('lastJsonObjectFromText'), 'plan.md should mention lastJsonObjectFromText');
    assert.ok(profileDoc.includes('lastJsonObjectFromText'), 'profile.md should mention lastJsonObjectFromText');
  });

  it('json-parser utility matches documented behavior (empty + single-line)', () => {
    assert.throws(() => lastJsonObjectFromTextFromModule(''), /Empty command output/i);
    assert.deepEqual(lastJsonObjectFromTextFromModule(' {\"a\":1} '), { a: 1 });
  });

  it('helper extracts JSON from noisy output (last JSON wins)', () => {
    const noisy = [
      'some warning: ignore',
      '{"ok":false,"error":"ignore this too"}',
      '{"ok":true,"data":{"x":1}}',
    ].join('\n');
    assert.deepEqual(lastJsonObjectFromText(noisy), { ok: true, data: { x: 1 } });
    assert.deepEqual(lastJsonObjectFromTextFromModule(noisy), { ok: true, data: { x: 1 } });
  });

  it('helper extracts JSON from code-fenced blocks', () => {
    const fenced = [
      'random preface',
      '```json',
      '{\"a\":1}',
      '```',
      'tail noise',
    ].join('\n');
    assert.deepEqual(lastJsonObjectFromText(fenced), { a: 1 });
    assert.deepEqual(lastJsonObjectFromTextFromModule(fenced), { a: 1 });
  });
});

