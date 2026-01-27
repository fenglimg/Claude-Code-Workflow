import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

describe('learn-planning-agent.md personalization instructions', () => {
  it('documents profile-aware rules and resource personalization', () => {
    const content = readFileSync('.claude/agents/learn-planning-agent.md', 'utf8');

    assert.ok(content.includes('Profile-Aware Analysis'), 'Expected Profile-Aware Analysis section');
    assert.ok(content.includes('Skip High-Proficiency'), 'Expected rule for high-proficiency topics');
    assert.ok(content.includes('Adjust Difficulty Distribution'), 'Expected difficulty distribution rule');
    assert.ok(content.includes('Build on Existing Knowledge'), 'Expected transfer learning rule');
    assert.ok(content.includes('Match Resource Types'), 'Expected resource matching rule');

    assert.ok(content.includes('calculatePersonalizationScore'), 'Expected resource personalization scoring helper');
    assert.ok(content.includes('personalization_score'), 'Expected personalization_score field in resource scoring');
  });
});

