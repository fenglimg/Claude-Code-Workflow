import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { existsSync, mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, '../..');
const ccwBin = path.join(repoRoot, 'ccw/bin/ccw.js');

function setupSandboxProject() {
  const dir = mkdtempSync(path.join(tmpdir(), 'ccw-learn-pack-'));
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

describe('ccw learn:* assessment pack CLI + profile event whitelist (Cycle-1)', () => {
  it('resolve-pack-key defaults are stable and question_bank_version binds to taxonomy_version', () => {
    const cwd = setupSandboxProject();
    try {
      const { res, out } = runCcw(['learn:resolve-pack-key', '--topic-id', 'game_dev_core', '--json'], cwd);
      assert.equal(res.status, 0);
      assert.equal(out.ok, true);
      assert.equal(out.data.pack_key.topic_id, 'game_dev_core');
      assert.equal(out.data.pack_key.taxonomy_version, 'v0');
      assert.equal(out.data.pack_key.rubric_version, 'v0');
      assert.equal(out.data.pack_key.question_bank_version, 'v0');
      assert.equal(out.data.pack_key.language, 'zh-CN');
    } finally {
      rmSync(cwd, { recursive: true, force: true });
    }
  });

  it('write-pack -> read-pack roundtrip works', () => {
    const cwd = setupSandboxProject();
    try {
      const pack_key = {
        topic_id: 'game_dev_core',
        taxonomy_version: 'v0',
        rubric_version: 'v0',
        question_bank_version: 'v0',
        language: 'zh-CN'
      };
      const pack = {
        pack_key,
        topic_id: 'game_dev_core',
        language: 'zh-CN',
        taxonomy_version: 'v0',
        rubric_version: 'v0',
        question_bank_version: 'v0',
        created_at: '2026-01-01T00:00:00.000Z',
        questions: [{ id: 'q1', prompt: 'Explain the game loop and fixed timestep tradeoffs.' }]
      };

      const { res: wRes, out: wOut } = runCcw(['learn:write-pack', '--pack', JSON.stringify(pack), '--json'], cwd);
      assert.equal(wRes.status, 0);
      assert.equal(wOut.ok, true);
      assert.equal(typeof wOut.data.path, 'string');

      const expectedPath = path.join(
        cwd,
        '.workflow/learn/packs/game_dev_core/pack.v0.v0.v0.zh-CN.json'
      );
      assert.equal(existsSync(expectedPath), true);

      const { res: rRes, out: rOut } = runCcw(['learn:read-pack', '--topic-id', 'game_dev_core', '--json'], cwd);
      assert.equal(rRes.status, 0);
      assert.equal(rOut.ok, true);
      assert.equal(rOut.data.found, true);
      assert.equal(rOut.data.pack.pack_key.topic_id, 'game_dev_core');
      assert.equal(rOut.data.pack.questions.length, 1);
      assert.equal(rOut.data.pack.questions[0].id, 'q1');
    } finally {
      rmSync(cwd, { recursive: true, force: true });
    }
  });

  it('append-profile-event enforces explicit whitelist (ASSESSMENT_* allowed, unknown rejected)', () => {
    const cwd = setupSandboxProject();
    try {
      // Create a profile so append-profile-event can target it.
      const profile = { known_topics: [], experience_level: null };
      const { res: pRes } = runCcw(['learn:write-profile', '--profile-id', 'p1', '--data', JSON.stringify(profile), '--json'], cwd);
      assert.equal(pRes.status, 0);

      const { res: okRes, out: okOut } = runCcw(
        [
          'learn:append-profile-event',
          '--profile-id',
          'p1',
          '--type',
          'ASSESSMENT_SESSION_STARTED',
          '--payload',
          JSON.stringify({ topic_id: 'game_dev_core', pack_key: { topic_id: 'game_dev_core' } }),
          '--json'
        ],
        cwd
      );
      assert.equal(okRes.status, 0);
      assert.equal(okOut.ok, true);
      assert.equal(okOut.data.type, 'ASSESSMENT_SESSION_STARTED');

      const { res: badRes, out: badOut } = runCcw(
        ['learn:append-profile-event', '--profile-id', 'p1', '--type', 'SOME_RANDOM_EVENT', '--payload', '{}', '--json'],
        cwd
      );
      assert.notEqual(badRes.status, 0);
      assert.equal(badOut.ok, false);
      assert.equal(badOut.error.code, 'INVALID_EVENT_TYPE');
    } finally {
      rmSync(cwd, { recursive: true, force: true });
    }
  });
});

