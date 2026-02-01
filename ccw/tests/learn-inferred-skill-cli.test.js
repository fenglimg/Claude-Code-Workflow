import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, '../..');
const ccwBin = path.join(repoRoot, 'ccw/bin/ccw.js');

function setupSandboxProject() {
  const dir = mkdtempSync(path.join(tmpdir(), 'ccw-learn-inferred-'));
  const schemaDir = path.join(dir, '.claude/workflows/cli-templates/schemas');
  mkdirSync(schemaDir, { recursive: true });

  for (const name of ['learn-state.schema.json', 'learn-profile.schema.json', 'learn-profile-snapshot.schema.json']) {
    const src = path.join(repoRoot, '.claude/workflows/cli-templates/schemas', name);
    const dst = path.join(schemaDir, name);
    writeFileSync(dst, readFileSync(src, 'utf8'), 'utf8');
  }

  return dir;
}

function runCcw(args, cwd, env = {}) {
  const finalEnv = { ...process.env, ...env };
  if (!('CCW_PROJECT_ROOT' in finalEnv)) finalEnv.CCW_PROJECT_ROOT = cwd;

  const res = spawnSync(process.execPath, [ccwBin, ...args], {
    cwd,
    env: finalEnv,
    encoding: 'utf8'
  });

  const stdout = (res.stdout || '').trim();
  const parsed = stdout ? JSON.parse(stdout) : null;
  return { res, out: parsed };
}

function readSnapshot(cwd, profileId) {
  const snapshotPath = path.join(cwd, '.workflow/learn/profiles/snapshots', `${profileId}.json`);
  return JSON.parse(readFileSync(snapshotPath, 'utf8'));
}

describe('ccw learn:* inferred skill state machine (TASK-005)', () => {
  it('propose -> confirm updates snapshot deterministically (confirm must be actor=user)', () => {
    const cwd = setupSandboxProject();
    try {
      const profile = { known_topics: [], experience_level: null };
      runCcw(['learn:write-profile', '--profile-id', 'p1', '--data', JSON.stringify(profile), '--json'], cwd);

      const { res: pRes, out: pOut } = runCcw(
        [
          'learn:propose-inferred-skill',
          '--profile-id',
          'p1',
          '--topic-id',
          'cocos_creator',
          '--proficiency',
          '0.4',
          '--confidence',
          '0.3',
          '--evidence',
          'e1',
          '--actor',
          'agent',
          '--json'
        ],
        cwd,
        { CCW_NOW_ISO: '2026-01-01T00:00:00.000Z' }
      );
      assert.equal(pRes.status, 0);
      assert.equal(pOut.ok, true);
      assert.equal(pOut.data.type, 'INFERRED_SKILL_PROPOSED');
      assert.equal(pOut.data.version, 1);

      const snap1 = readSnapshot(cwd, 'p1');
      assert.equal(snap1.version, 1);
      const s1 = snap1.skills.inferred.find((s) => s.topic_id === 'cocos_creator');
      assert.equal(s1.status, 'proposed');
      assert.equal(s1.proficiency, 0.4);
      assert.equal(s1.confidence, 0.3);

      const { res: badCRes, out: badCOut } = runCcw(
        ['learn:confirm-inferred-skill', '--profile-id', 'p1', '--topic-id', 'cocos_creator', '--actor', 'agent', '--json'],
        cwd
      );
      assert.notEqual(badCRes.status, 0);
      assert.equal(badCOut.ok, false);
      assert.equal(badCOut.error.code, 'INVALID_ARGS');

      const { res: cRes, out: cOut } = runCcw(
        ['learn:confirm-inferred-skill', '--profile-id', 'p1', '--topic-id', 'cocos_creator', '--actor', 'user', '--json'],
        cwd,
        { CCW_NOW_ISO: '2026-01-02T00:00:00.000Z' }
      );
      assert.equal(cRes.status, 0);
      assert.equal(cOut.ok, true);
      assert.equal(cOut.data.type, 'INFERRED_SKILL_CONFIRMED');
      assert.equal(cOut.data.version, 2);

      const snap2 = readSnapshot(cwd, 'p1');
      assert.equal(snap2.version, 2);
      const s2 = snap2.skills.inferred.find((s) => s.topic_id === 'cocos_creator');
      assert.equal(s2.status, 'confirmed');
      assert.equal(s2.proficiency, 0.4);
      assert.equal(s2.last_updated, '2026-01-02T00:00:00.000Z');
    } finally {
      rmSync(cwd, { recursive: true, force: true });
    }
  });

  it('reject blocks re-propose until cooldown + new evidence', () => {
    const cwd = setupSandboxProject();
    try {
      const profile = { known_topics: [], experience_level: null };
      runCcw(['learn:write-profile', '--profile-id', 'p1', '--data', JSON.stringify(profile), '--json'], cwd);

      runCcw(
        [
          'learn:propose-inferred-skill',
          '--profile-id',
          'p1',
          '--topic-id',
          'react',
          '--proficiency',
          '0.6',
          '--confidence',
          '0.2',
          '--evidence',
          'e1',
          '--json'
        ],
        cwd,
        { CCW_NOW_ISO: '2026-01-01T00:00:00.000Z' }
      );

      const { res: rRes, out: rOut } = runCcw(
        ['learn:reject-inferred-skill', '--profile-id', 'p1', '--topic-id', 'react', '--reason', 'nope', '--actor', 'user', '--json'],
        cwd,
        { CCW_NOW_ISO: '2026-01-02T00:00:00.000Z' }
      );
      assert.equal(rRes.status, 0);
      assert.equal(rOut.ok, true);
      assert.equal(rOut.data.type, 'INFERRED_SKILL_REJECTED');
      assert.equal(rOut.data.version, 2);

      const snap2 = readSnapshot(cwd, 'p1');
      const s2 = snap2.skills.inferred.find((s) => s.topic_id === 'react');
      assert.equal(s2.status, 'rejected');
      assert.equal(typeof s2._metadata?.rejected_evidence_hash, 'string');

      // Within cooldown: even with new evidence, reject should block.
      const { res: p2Res, out: p2Out } = runCcw(
        [
          'learn:propose-inferred-skill',
          '--profile-id',
          'p1',
          '--topic-id',
          'react',
          '--proficiency',
          '0.6',
          '--confidence',
          '0.2',
          '--evidence',
          'e2',
          '--json'
        ],
        cwd,
        { CCW_NOW_ISO: '2026-01-10T00:00:00.000Z' }
      );
      assert.notEqual(p2Res.status, 0);
      assert.equal(p2Out.ok, false);
      assert.equal(p2Out.error.code, 'COOLDOWN_ACTIVE');

      // After cooldown: same evidence must still be rejected as "not new".
      const { res: p3Res, out: p3Out } = runCcw(
        [
          'learn:propose-inferred-skill',
          '--profile-id',
          'p1',
          '--topic-id',
          'react',
          '--proficiency',
          '0.6',
          '--confidence',
          '0.2',
          '--evidence',
          'e1',
          '--json'
        ],
        cwd,
        { CCW_NOW_ISO: '2026-02-10T00:00:00.000Z' }
      );
      assert.notEqual(p3Res.status, 0);
      assert.equal(p3Out.ok, false);
      assert.equal(p3Out.error.code, 'EVIDENCE_NOT_NEW');

      // After cooldown + with new evidence: allowed.
      const { res: p4Res, out: p4Out } = runCcw(
        [
          'learn:propose-inferred-skill',
          '--profile-id',
          'p1',
          '--topic-id',
          'react',
          '--proficiency',
          '0.6',
          '--confidence',
          '0.2',
          '--evidence',
          'e3',
          '--json'
        ],
        cwd,
        { CCW_NOW_ISO: '2026-02-10T00:00:00.000Z' }
      );
      assert.equal(p4Res.status, 0);
      assert.equal(p4Out.ok, true);
      assert.equal(p4Out.data.type, 'INFERRED_SKILL_PROPOSED');
    } finally {
      rmSync(cwd, { recursive: true, force: true });
    }
  });

  it('rollback to version restores view (history preserved)', () => {
    const cwd = setupSandboxProject();
    try {
      const profile = { known_topics: [], experience_level: null };
      runCcw(['learn:write-profile', '--profile-id', 'p1', '--data', JSON.stringify(profile), '--json'], cwd);

      runCcw(
        ['learn:propose-inferred-skill', '--profile-id', 'p1', '--topic-id', 'nodejs', '--proficiency', '0.5', '--evidence', 'e1', '--json'],
        cwd,
        { CCW_NOW_ISO: '2026-01-01T00:00:00.000Z' }
      );
      runCcw(
        ['learn:reject-inferred-skill', '--profile-id', 'p1', '--topic-id', 'nodejs', '--actor', 'user', '--json'],
        cwd,
        { CCW_NOW_ISO: '2026-01-02T00:00:00.000Z' }
      );

      const { res: rbRes, out: rbOut } = runCcw(
        ['learn:rollback-profile', '--profile-id', 'p1', '--target-version', '1', '--actor', 'user', '--json'],
        cwd,
        { CCW_NOW_ISO: '2026-01-03T00:00:00.000Z' }
      );
      assert.equal(rbRes.status, 0);
      assert.equal(rbOut.ok, true);
      assert.equal(rbOut.data.event.type, 'ROLLBACK_TO_VERSION');
      assert.equal(rbOut.data.event.version, 3);

      const snap3 = readSnapshot(cwd, 'p1');
      assert.equal(snap3.version, 3);
      const s = snap3.skills.inferred.find((x) => x.topic_id === 'nodejs');
      assert.equal(s.status, 'proposed');
    } finally {
      rmSync(cwd, { recursive: true, force: true });
    }
  });
});

