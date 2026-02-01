import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, '../..');
const ccwBin = path.join(repoRoot, 'ccw/bin/ccw.js');

function setupSandboxProject() {
  const dir = mkdtempSync(path.join(tmpdir(), 'ccw-learn-taxonomy-'));
  const schemaDir = path.join(dir, '.claude/workflows/cli-templates/schemas');
  mkdirSync(schemaDir, { recursive: true });

  // Some learn:* commands expect these schemas to exist under CCW_PROJECT_ROOT.
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

describe('ccw learn:* taxonomy index CLI (Cycle-3)', () => {
  it('resolve-topic returns not found on empty taxonomy index', () => {
    const cwd = setupSandboxProject();
    try {
      const { res, out } = runCcw(['learn:resolve-topic', '--raw-topic-label', 'TypeScript', '--json'], cwd);
      assert.equal(res.status, 0);
      assert.equal(out.ok, true);
      assert.equal(out.data.found, false);
      assert.equal(out.data.ambiguous, false);
      assert.deepEqual(out.data.candidates, []);
    } finally {
      rmSync(cwd, { recursive: true, force: true });
    }
  });

  it('ensure-topic creates a provisional canonical topic_id and makes it resolvable by alias', () => {
    const cwd = setupSandboxProject();
    try {
      const { res: eRes, out: eOut } = runCcw(['learn:ensure-topic', '--raw-topic-label', 'TypeScript', '--json'], cwd);
      assert.equal(eRes.status, 0);
      assert.equal(eOut.ok, true);
      assert.equal(eOut.data.found, true);
      assert.equal(eOut.data.status, 'provisional');
      assert.equal(eOut.data.topic_id, 'typescript');
      assert.equal(eOut.data.resolution_source, 'provisional');
      assert.equal(eOut.data.taxonomy_version, 'v0');

      const indexPath = path.join(cwd, '.workflow/learn/taxonomy/index.json');
      assert.equal(existsSync(indexPath), true);

      const { res: rRes, out: rOut } = runCcw(['learn:resolve-topic', '--raw-topic-label', 'TypeScript', '--json'], cwd);
      assert.equal(rRes.status, 0);
      assert.equal(rOut.ok, true);
      assert.equal(rOut.data.found, true);
      assert.equal(rOut.data.topic_id, 'typescript');
      assert.equal(['topic_id', 'alias', 'redirect', 'provisional'].includes(rOut.data.resolution_source), true);
    } finally {
      rmSync(cwd, { recursive: true, force: true });
    }
  });

  it('taxonomy-alias adds alias and resolve-topic maps alias to canonical', () => {
    const cwd = setupSandboxProject();
    try {
      runCcw(['learn:ensure-topic', '--raw-topic-label', 'TypeScript', '--json'], cwd);

      const { res: aRes, out: aOut } = runCcw(['learn:taxonomy-alias', '--topic-id', 'typescript', '--alias', 'ts', '--json'], cwd);
      assert.equal(aRes.status, 0);
      assert.equal(aOut.ok, true);

      const { res: rRes, out: rOut } = runCcw(['learn:resolve-topic', '--raw-topic-label', 'ts', '--json'], cwd);
      assert.equal(rRes.status, 0);
      assert.equal(rOut.ok, true);
      assert.equal(rOut.data.found, true);
      assert.equal(rOut.data.topic_id, 'typescript');
    } finally {
      rmSync(cwd, { recursive: true, force: true });
    }
  });

  it('taxonomy-redirect follows redirects and reports resolution_source=redirect', () => {
    const cwd = setupSandboxProject();
    try {
      runCcw(['learn:ensure-topic', '--raw-topic-label', 'TypeScript', '--json'], cwd);
      runCcw(['learn:ensure-topic', '--raw-topic-label', 'TypeScript Old Name', '--json'], cwd);

      const { res: redRes } = runCcw(
        ['learn:taxonomy-redirect', '--from-topic-id', 'typescript_old_name', '--to-topic-id', 'typescript', '--json'],
        cwd
      );
      assert.equal(redRes.status, 0);

      const { res: rRes, out: rOut } = runCcw(['learn:resolve-topic', '--raw-topic-label', 'typescript_old_name', '--json'], cwd);
      assert.equal(rRes.status, 0);
      assert.equal(rOut.ok, true);
      assert.equal(rOut.data.found, true);
      assert.equal(rOut.data.topic_id, 'typescript');
      assert.equal(rOut.data.resolution_source, 'redirect');
      assert.deepEqual(rOut.data.redirect_chain, ['typescript_old_name']);
    } finally {
      rmSync(cwd, { recursive: true, force: true });
    }
  });

  it('taxonomy-promote enforces regression>=30 gate', () => {
    const cwd = setupSandboxProject();
    try {
      runCcw(['learn:ensure-topic', '--raw-topic-label', 'TypeScript', '--json'], cwd);

      const pack_key = {
        topic_id: 'typescript',
        taxonomy_version: 'v0',
        rubric_version: 'v0',
        question_bank_version: 'v0',
        language: 'zh-CN'
      };
      const pack = {
        pack_key,
        topic_id: 'typescript',
        language: 'zh-CN',
        taxonomy_version: 'v0',
        rubric_version: 'v0',
        question_bank_version: 'v0',
        created_at: '2026-01-01T00:00:00.000Z',
        questions: [{ id: 'q1', prompt: 'Explain variance between type and value space.' }],
        regression_cases: Array.from({ length: 29 }, (_, i) => ({ id: `r${i + 1}` }))
      };

      const { res: wRes } = runCcw(['learn:write-pack', '--pack', JSON.stringify(pack), '--json'], cwd);
      assert.equal(wRes.status, 0);

      const { res: pBad, out: oBad } = runCcw(['learn:taxonomy-promote', '--topic-id', 'typescript', '--json'], cwd);
      assert.notEqual(pBad.status, 0);
      assert.equal(oBad.ok, false);
      assert.equal(oBad.error.code, 'PROMOTION_GATE');

      // Write a pack meeting the threshold (>=30).
      pack.regression_cases.push({ id: 'r30' });
      const { res: wRes2 } = runCcw(['learn:write-pack', '--pack', JSON.stringify(pack), '--json'], cwd);
      assert.equal(wRes2.status, 0);

      const { res: pOk, out: oOk } = runCcw(['learn:taxonomy-promote', '--topic-id', 'typescript', '--json'], cwd);
      assert.equal(pOk.status, 0);
      assert.equal(oOk.ok, true);
      assert.equal(oOk.data.status, 'active');
      assert.equal(oOk.data.promoted, true);
    } finally {
      rmSync(cwd, { recursive: true, force: true });
    }
  });
});
