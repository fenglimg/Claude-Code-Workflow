import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, '../..');

describe('learn/profile.md invariants (tool-verified challenges)', () => {
  it('does not use placeholder code content and documents a deterministic scratch-file flow', () => {
    const content = readFileSync(path.join(repoRoot, '.claude/commands/learn/profile.md'), 'utf8');

    assert.ok(!content.includes("codeContent = '/* user-provided code */';"));
    assert.ok(!content.includes('/* user-provided code */'));

    // Deterministic scratch file path marker (used by the tool-verified micro-challenge flow).
    assert.ok(content.includes('.workflow/.scratchpad/learn-challenges'));
  });
});

