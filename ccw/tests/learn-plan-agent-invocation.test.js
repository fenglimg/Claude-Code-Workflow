import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, '../..');

describe('learn/plan.md agent invocation', () => {
  it('invokes the learn-planning-agent via ccw cli (not simulated Task subagent)', () => {
    const content = readFileSync(path.join(repoRoot, '.claude/commands/learn/plan.md'), 'utf8');
    assert.ok(content.includes('ccw cli -p'));
    assert.ok(!content.includes('subagent_type: \"learn-planning-agent\"'));
  });
});

