import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, '../..');

describe('learn/plan.md JIT assessment triggers', () => {
  it('documents --skip-assessment and JIT tracking', () => {
    const content = readFileSync(path.join(repoRoot, '.claude/commands/learn/plan.md'), 'utf8');
    assert.ok(content.includes('--skip-assessment'));
    assert.ok(content.includes('jit-assessments.json'));
    assert.ok(content.includes('JIT Assessment'));
  });
});

