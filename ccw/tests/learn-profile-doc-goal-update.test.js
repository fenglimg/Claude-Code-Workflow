import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, '../..');

describe('learn/profile.md invariants (--goal update)', () => {
  it('does not reference extractKeywords without defining it', () => {
    const content = readFileSync(path.join(repoRoot, '.claude/commands/learn/profile.md'), 'utf8');
    const references = content.includes('extractKeywords(');
    const defines =
      content.includes('function extractKeywords') ||
      content.includes('const extractKeywords');

    if (references) {
      assert.ok(defines, 'profile.md references extractKeywords() but does not define it');
    }
  });
});

