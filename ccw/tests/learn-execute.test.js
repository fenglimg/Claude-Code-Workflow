import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

describe('learn/execute.md command contract', () => {
  it('documents the 5-phase execution flow and uses CLI State API commands', () => {
    const content = readFileSync('.claude/commands/learn/execute.md', 'utf8');

    // Structure
    assert.ok(content.includes('Execution Flow (5 Phases)'), 'Expected 5-phase flow section');
    assert.ok(content.includes('Phase 1: Initialization'), 'Expected Phase 1 section');
    assert.ok(content.includes('Phase 2: Content Delivery'), 'Expected Phase 2 section');
    assert.ok(content.includes('Phase 3: Assessment Verification'), 'Expected Phase 3 section');
    assert.ok(content.includes('Phase 4: State & Profile Update'), 'Expected Phase 4 section');
    assert.ok(content.includes('Phase 5: Feedback & Next Steps'), 'Expected Phase 5 section');

    // CLI State API integration (no direct file edits in docs)
    assert.ok(content.includes('ccw learn:read-state --json'), 'Expected learn:read-state usage');
    assert.ok(content.includes('ccw learn:read-session --session-id'), 'Expected learn:read-session usage');
    assert.ok(content.includes('ccw learn:update-progress --session-id'), 'Expected learn:update-progress usage');
    assert.ok(content.includes('ccw learn:update-state --field current_phase'), 'Expected current_phase state updates');

    // Phase gating
    assert.ok(content.includes('--next-phase'), 'Expected --next-phase option');
    assert.ok(content.includes('Phase can advance'), 'Expected phase transition documentation');
  });
});

