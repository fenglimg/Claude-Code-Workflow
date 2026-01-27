import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, '../..');

const CANONICAL = '.claude/workflows/cli-templates/schemas/';
const WORKFLOW_PROFILE_SCHEMAS = '.workflow/learn/profiles/schemas/';

describe('learn schema path references', () => {
  it('uses the canonical schema directory in learn commands/agents', () => {
    const planMd = readFileSync(path.join(repoRoot, '.claude/commands/learn/plan.md'), 'utf8');
    const agentMd = readFileSync(path.join(repoRoot, '.claude/agents/learn-planning-agent.md'), 'utf8');

    assert.ok(planMd.includes(`${CANONICAL}learn-plan.schema.json`));
    assert.ok(agentMd.includes(`${CANONICAL}learn-plan.schema.json`));

    // Avoid older scratchpad schema path drift.
    assert.ok(!agentMd.includes('.workflow/.scratchpad/learn-workflow-draft/schemas/'));
  });

  it('provides schema files at the profile $schema path and keeps them in sync', () => {
    for (const name of ['learn-profile.schema.json', 'learn-state.schema.json']) {
      const canonicalPath = path.join(repoRoot, CANONICAL, name);
      const workflowPath = path.join(repoRoot, WORKFLOW_PROFILE_SCHEMAS, name);

      assert.ok(existsSync(workflowPath), `Missing schema copy: ${workflowPath}`);

      const canonicalJson = JSON.parse(readFileSync(canonicalPath, 'utf8'));
      const workflowJson = JSON.parse(readFileSync(workflowPath, 'utf8'));
      assert.deepStrictEqual(workflowJson, canonicalJson, `${name} drifted from canonical schema`);
    }

    // Keep at least one tracked profile's $schema resolvable for IDE validation.
    const sampleProfilePath = path.join(repoRoot, '.workflow/learn/profiles/profile-1737734400000.json');
    assert.ok(existsSync(sampleProfilePath), `Missing sample profile: ${sampleProfilePath}`);

    const profile = JSON.parse(readFileSync(sampleProfilePath, 'utf8'));
    const schemaRel = profile.$schema;
    assert.equal(typeof schemaRel, 'string');

    const resolvedSchemaPath = path.join(path.dirname(sampleProfilePath), schemaRel);
    assert.ok(existsSync(resolvedSchemaPath), `Profile $schema does not resolve: ${schemaRel}`);
  });
});
