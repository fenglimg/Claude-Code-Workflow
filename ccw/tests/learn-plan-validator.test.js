import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, '../..');

const validatorPath = path.join(repoRoot, '.claude/commands/learn/_internal/learn-plan-validator.js');

function runValidator(planPath, profilePath = null) {
  const args = [validatorPath, planPath];
  if (profilePath) args.push('--profile', profilePath);

  const res = spawnSync(process.execPath, args, { encoding: 'utf8' });
  assert.equal(res.error, undefined);
  const out = JSON.parse(res.stdout.trim());
  return { out, res };
}

describe('learn-plan-validator (Layer 0)', () => {
  it('passes a schema-valid plan', () => {
    const dir = mkdtempSync(path.join(tmpdir(), 'ccw-learn-plan-validate-'));
    try {
      const now = new Date().toISOString();
      const plan = {
        session_id: 'LS-20260127-001',
        learning_goal: 'Test goal',
        profile_id: 'profile-test',
        knowledge_points: [
          {
            id: 'KP-1',
            title: 'Basics',
            prerequisites: [],
            topic_refs: [],
            resources: [{ type: 'documentation', url: 'https://example.com', quality: 'gold' }],
            assessment: { type: 'practical_task', description: 'Do it', acceptance_criteria: ['OK'] },
            status: 'pending'
          }
        ],
        dependency_graph: { nodes: ['KP-1'], edges: [] },
        _metadata: { created_at: now }
      };
      const planPath = path.join(dir, 'plan.json');
      writeFileSync(planPath, JSON.stringify(plan), 'utf8');

      const { out, res } = runValidator(planPath);
      assert.equal(res.status, 0);
      assert.equal(out.ok, true);
      assert.equal(out.layer0.ok, true);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it('fails an invalid plan and returns schema errors', () => {
    const dir = mkdtempSync(path.join(tmpdir(), 'ccw-learn-plan-validate-'));
    try {
      const plan = { session_id: 'LS-20260127-001' }; // missing required fields
      const planPath = path.join(dir, 'plan.json');
      writeFileSync(planPath, JSON.stringify(plan), 'utf8');

      const { out, res } = runValidator(planPath);
      assert.equal(res.status, 1);
      assert.equal(out.ok, false);
      assert.equal(out.layer0.ok, false);
      assert.ok(Array.isArray(out.layer0.errors));
      assert.ok(out.layer0.errors.length >= 1);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it('fails when dependency_graph contains a cycle (Layer 1)', () => {
    const dir = mkdtempSync(path.join(tmpdir(), 'ccw-learn-plan-validate-'));
    try {
      const plan = {
        session_id: 'LS-20260127-002',
        learning_goal: 'Cycle goal',
        knowledge_points: [
          {
            id: 'KP-1',
            title: 'A',
            prerequisites: ['KP-2'],
            topic_refs: [],
            resources: [{ type: 'documentation', url: 'https://example.com', quality: 'gold' }],
            assessment: { type: 'practical_task', description: 'Do it' },
            status: 'pending'
          },
          {
            id: 'KP-2',
            title: 'B',
            prerequisites: ['KP-1'],
            topic_refs: [],
            resources: [{ type: 'documentation', url: 'https://example.com', quality: 'gold' }],
            assessment: { type: 'practical_task', description: 'Do it' },
            status: 'pending'
          }
        ],
        dependency_graph: {
          nodes: ['KP-1', 'KP-2'],
          edges: [
            { from: 'KP-1', to: 'KP-2' },
            { from: 'KP-2', to: 'KP-1' }
          ]
        }
      };
      const planPath = path.join(dir, 'plan.json');
      writeFileSync(planPath, JSON.stringify(plan), 'utf8');

      const { out, res } = runValidator(planPath);
      assert.equal(res.status, 1);
      assert.equal(out.layer0.ok, true);
      assert.equal(out.layer1.ok, false);
      assert.ok(out.layer1.cycle);
      assert.ok(out.layer1.errors?.length >= 1);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it('emits warning-only profile→plan matching findings (Layer 2)', () => {
    const dir = mkdtempSync(path.join(tmpdir(), 'ccw-learn-plan-validate-'));
    try {
      const profile = {
        profile_id: 'profile-test',
        experience_level: 'intermediate',
        known_topics: [{ topic_id: 'react', proficiency: 0.9, confidence: 0.9, last_updated: new Date().toISOString(), evidence: [] }]
      };

      const plan = {
        session_id: 'LS-20260127-003',
        learning_goal: 'React goal',
        profile_id: 'profile-test',
        knowledge_points: [
          {
            id: 'KP-1',
            title: 'React basics',
            prerequisites: [],
            topic_refs: ['react'],
            resources: [{ type: 'documentation', url: 'https://example.com', quality: 'gold' }],
            assessment: { type: 'practical_task', description: 'Do it' },
            status: 'pending'
          }
        ],
        dependency_graph: { nodes: ['KP-1'], edges: [] }
      };

      const profilePath = path.join(dir, 'profile.json');
      const planPath = path.join(dir, 'plan.json');
      writeFileSync(profilePath, JSON.stringify(profile), 'utf8');
      writeFileSync(planPath, JSON.stringify(plan), 'utf8');

      const { out, res } = runValidator(planPath, profilePath);
      assert.equal(res.status, 0);
      assert.equal(out.ok, true);
      assert.equal(out.layer2.ok, true);
      assert.ok(typeof out.layer2.profile_fingerprint === 'string');
      assert.ok(out.layer2.warnings?.some((w) => w.type === 'high_proficiency_topic'));
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});
