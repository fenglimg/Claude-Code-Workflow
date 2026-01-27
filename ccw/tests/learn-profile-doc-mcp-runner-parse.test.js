import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, '../..');

describe('learn/profile.md invariants (mcp-runner output parsing)', () => {
  it('does not parse mcp-runner output with JSON.parse(raw)', () => {
    const content = readFileSync(path.join(repoRoot, '.claude/commands/learn/profile.md'), 'utf8');

    assert.ok(!content.includes('challengeResult = JSON.parse(raw)'));
    assert.ok(content.includes('challengeResult = lastJsonObjectFromText(raw)'));
  });
});

