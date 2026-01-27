import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, '../..');

const CANONICAL = '.claude/workflows/cli-templates/schemas/';

describe('learn schema path references', () => {
  it('uses the canonical schema directory in learn commands/agents', () => {
    const planMd = readFileSync(path.join(repoRoot, '.claude/commands/learn/plan.md'), 'utf8');
    const agentMd = readFileSync(path.join(repoRoot, '.claude/agents/learn-planning-agent.md'), 'utf8');

    assert.ok(planMd.includes(`${CANONICAL}learn-plan.schema.json`));
    assert.ok(agentMd.includes(`${CANONICAL}learn-plan.schema.json`));

    // Avoid older scratchpad schema path drift.
    assert.ok(!agentMd.includes('.workflow/.scratchpad/learn-workflow-draft/schemas/'));
  });
});

