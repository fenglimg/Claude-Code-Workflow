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
  const dir = mkdtempSync(path.join(tmpdir(), 'ccw-learn-pack-vnext-'));
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
  // Tests must not rely on external LLM availability; force deterministic pack generation.
  if (!('CCW_LEARN_PACK_GENERATOR' in finalEnv)) finalEnv.CCW_LEARN_PACK_GENERATOR = 'deterministic';

  const res = spawnSync(process.execPath, [ccwBin, ...args], {
    cwd,
    env: finalEnv,
    encoding: 'utf8'
  });

  const stdout = (res.stdout || '').trim();
  const parsed = stdout ? JSON.parse(stdout) : null;
  return { res, out: parsed };
}

describe('ccw learn:* pack completeness (Cycle-3)', () => {
  it('ensure-pack auto creates seed=4 pack for provisional topics; full completeness is false', () => {
    const cwd = setupSandboxProject();
    try {
      runCcw(['learn:ensure-topic', '--raw-topic-label', 'TypeScript', '--json'], cwd);

      const { res, out } = runCcw(['learn:ensure-pack', '--topic-id', 'typescript', '--json'], cwd);
      assert.equal(res.status, 0);
      assert.equal(out.ok, true);
      assert.equal(out.data.desired_kind, 'seed');
      assert.equal(out.data.status.pack_kind, 'seed');
      assert.equal(out.data.status.question_count, 4);
      assert.equal(out.data.status.has_taxonomy, true);
      assert.equal(out.data.status.has_question_bank, true);
      assert.equal(out.data.status.has_regression_skeleton, false);
      assert.equal(out.data.status.full_completeness, false);
      assert.equal(out.data.status.must_total, 2);
      assert.equal(out.data.status.must_covered, 2);
      assert.equal(out.data.status.core_total, 4);
      assert.equal(out.data.status.core_covered >= 1, true);

      const { res: sRes, out: sOut } = runCcw(['learn:pack-status', '--topic-id', 'typescript', '--json'], cwd);
      assert.equal(sRes.status, 0);
      assert.equal(sOut.ok, true);
      assert.equal(sOut.data.found, true);
      assert.equal(sOut.data.pack_kind, 'seed');
    } finally {
      rmSync(cwd, { recursive: true, force: true });
    }
  });

  it('ensure-pack full upgrades to full completeness (must/core covered + regression=30)', () => {
    const cwd = setupSandboxProject();
    try {
      runCcw(['learn:ensure-topic', '--raw-topic-label', 'TypeScript', '--json'], cwd);
      runCcw(['learn:ensure-pack', '--topic-id', 'typescript', '--mode', 'seed', '--json'], cwd);

      const { res, out } = runCcw(['learn:ensure-pack', '--topic-id', 'typescript', '--mode', 'full', '--json'], cwd);
      assert.equal(res.status, 0);
      assert.equal(out.ok, true);
      assert.equal(out.data.desired_kind, 'full');
      assert.equal(out.data.status.pack_kind, 'full');
      assert.equal(out.data.status.has_regression_skeleton, true);
      assert.equal(out.data.status.regression_cases_count, 30);
      assert.equal(out.data.status.must_total, out.data.status.must_covered);
      assert.equal(out.data.status.core_total, out.data.status.core_covered);
      assert.equal(out.data.status.full_completeness, true);
    } finally {
      rmSync(cwd, { recursive: true, force: true });
    }
  });
});
