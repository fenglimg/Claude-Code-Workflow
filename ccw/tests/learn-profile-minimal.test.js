import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, '../..');

describe('learn/profile.md minimal profile flow', () => {
  it('documents minimal-by-default + --full-assessment', () => {
    const content = readFileSync(path.join(repoRoot, '.claude/commands/learn/profile.md'), 'utf8');
    assert.ok(content.includes('--full-assessment'));
    assert.ok(content.includes('is_minimal'));
    assert.ok(content.includes('completion_percent'));
    assert.ok(content.includes('JIT'));
    assert.ok(content.includes('learn:parse-background'));
  });
});

