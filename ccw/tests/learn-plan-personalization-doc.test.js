import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

describe('learn/plan.md personalization documentation', () => {
  it('documents related experience gap analysis and learning path visualization', () => {
    const content = readFileSync('.claude/commands/learn/plan.md', 'utf8');

    assert.ok(content.includes('related_experience'), 'Expected related_experience in gap analysis');
    assert.ok(content.includes('recommended_focus'), 'Expected recommended_focus in gap analysis');
    assert.ok(content.includes('Learning Path'), 'Expected learning path visualization section');
  });
});

