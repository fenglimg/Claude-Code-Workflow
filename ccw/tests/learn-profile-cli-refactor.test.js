import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, '../..');

describe('learn/profile.md CLI refactor', () => {
  it('does not use direct Read()/Write() calls', () => {
    const content = readFileSync(path.join(repoRoot, '.claude/commands/learn/profile.md'), 'utf8');
    // Allow tool declaration in frontmatter like "Read(*)", but forbid real calls like "Read('path')" or "Write(path, ...)".
    // Note: /learn:profile may be allowed to Read(), but all persistence must still go through ccw learn:* CLI.
    assert.ok(!/\bRead\(\s*(?!\*)[^)]/.test(content));
    assert.ok(!/\bWrite\(\s*[^)]/.test(content));
  });

  it('uses ccw learn:* commands for state/profile operations', () => {
    const content = readFileSync(path.join(repoRoot, '.claude/commands/learn/profile.md'), 'utf8');
    assert.ok(content.includes('ccw learn:read-state'));
    assert.ok(content.includes('ccw learn:read-profile'));
    assert.ok(content.includes('ccw learn:write-profile'));
    assert.ok(content.includes('ccw learn:update-state'));
  });
});
