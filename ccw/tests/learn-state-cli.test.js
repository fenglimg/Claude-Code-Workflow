import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { spawn, spawnSync } from 'node:child_process';
import { existsSync, mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, '../..');

const ccwBin = path.join(repoRoot, 'ccw/bin/ccw.js');

function setupSandboxProject() {
  const dir = mkdtempSync(path.join(tmpdir(), 'ccw-learn-cli-'));
  const schemaDir = path.join(dir, '.claude/workflows/cli-templates/schemas');
  mkdirSync(schemaDir, { recursive: true });

  for (const name of ['learn-state.schema.json', 'learn-profile.schema.json']) {
    const src = path.join(repoRoot, '.claude/workflows/cli-templates/schemas', name);
    const dst = path.join(schemaDir, name);
    writeFileSync(dst, readFileSync(src, 'utf8'), 'utf8');
  }

  return dir;
}

function runCcw(args, cwd, env = {}, options = {}) {
  const { setProjectRoot = true } = options;
  const finalEnv = { ...process.env, ...env };
  // For most tests we want a hermetic project root under the temp sandbox.
  // The learn commands now default to a stable package root, so we override via env.
  if (setProjectRoot && !('CCW_PROJECT_ROOT' in finalEnv)) {
    finalEnv.CCW_PROJECT_ROOT = cwd;
  }

  const res = spawnSync(process.execPath, [ccwBin, ...args], {
    cwd,
    env: finalEnv,
    encoding: 'utf8'
  });

  const stdout = (res.stdout || '').trim();
  const parsed = stdout ? JSON.parse(stdout) : null;
  return { res, out: parsed };
}

async function waitForFile(filePath, timeoutMs = 1000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    if (existsSync(filePath)) return;
    await new Promise((r) => setTimeout(r, 10));
  }
  throw new Error(`Timed out waiting for file: ${filePath}`);
}

describe('ccw learn:* state commands', () => {
  it('learn:read-state initializes default state and returns JSON', () => {
    const cwd = setupSandboxProject();
    try {
      const { res, out } = runCcw(['learn:read-state', '--json'], cwd);
      assert.equal(res.status, 0);
      assert.equal(out.ok, true);
      assert.ok('active_profile_id' in out.data);
      assert.ok('active_session_id' in out.data);
      assert.ok('version' in out.data);
    } finally {
      rmSync(cwd, { recursive: true, force: true });
    }
  });

  it('learn:update-state updates active_profile_id and persists', () => {
    const cwd = setupSandboxProject();
    try {
      const { res: r1, out: o1 } = runCcw(
        ['learn:update-state', '--field', 'active_profile_id', '--value', 'profile-1', '--json'],
        cwd
      );
      assert.equal(r1.status, 0);
      assert.equal(o1.ok, true);
      assert.equal(o1.data.active_profile_id, 'profile-1');

      const { res: r2, out: o2 } = runCcw(['learn:read-state', '--json'], cwd);
      assert.equal(r2.status, 0);
      assert.equal(o2.data.active_profile_id, 'profile-1');
    } finally {
      rmSync(cwd, { recursive: true, force: true });
    }
  });

  it('learn:write-profile + learn:read-profile roundtrip', () => {
    const cwd = setupSandboxProject();
    try {
      const payload = {
        experience_level: 'beginner',
        known_topics: []
      };

      const { res: r1, out: o1 } = runCcw(
        ['learn:write-profile', '--profile-id', 'p1', '--data', JSON.stringify(payload), '--json'],
        cwd
      );
      assert.equal(r1.status, 0);
      assert.equal(o1.ok, true);
      assert.equal(o1.data.profile_id, 'p1');

      const { res: r2, out: o2 } = runCcw(['learn:read-profile', '--profile-id', 'p1', '--json'], cwd);
      assert.equal(r2.status, 0);
      assert.equal(o2.ok, true);
      assert.equal(o2.data.profile_id, 'p1');
      assert.equal(o2.data.experience_level, 'beginner');
    } finally {
      rmSync(cwd, { recursive: true, force: true });
    }
  });

  it('rejects invalid profile ids (path traversal)', () => {
    const cwd = setupSandboxProject();
    try {
      const payload = { experience_level: 'beginner', known_topics: [] };
      const { res, out } = runCcw(
        ['learn:write-profile', '--profile-id', '../evil', '--data', JSON.stringify(payload), '--json'],
        cwd
      );
      assert.equal(res.status, 1);
      assert.equal(out.ok, false);
      assert.equal(out.error.code, 'INVALID_ARGS');
    } finally {
      rmSync(cwd, { recursive: true, force: true });
    }
  });

  it('serializes concurrent writers via the lock', async () => {
    const cwd = setupSandboxProject();
    try {
      // Start a writer that holds the lock briefly.
      const p1 = spawn(process.execPath, [ccwBin, 'learn:update-state', '--field', 'active_profile_id', '--value', 'p1', '--json'], {
        cwd,
        env: { ...process.env, CCW_PROJECT_ROOT: cwd, CCW_LEARN_LOCK_HOLD_MS: '200' },
        stdio: ['ignore', 'pipe', 'pipe']
      });

      // Wait for p1 to acquire the lock (avoid flakiness).
      await waitForFile(path.join(cwd, '.workflow/learn/.lock'), 1000);

      // Second writer should wait and eventually succeed (no corruption / no lock error).
      const { res, out } = runCcw(
        ['learn:update-state', '--field', 'active_profile_id', '--value', 'p2', '--json'],
        cwd
      );
      assert.equal(res.status, 0);
      assert.equal(out.ok, true);
      assert.equal(out.data.active_profile_id, 'p2');

      await new Promise((resolve, reject) => {
        p1.on('exit', (code) => (code === 0 ? resolve() : reject(new Error(`p1 exited ${code}`))));
      });
    } finally {
      rmSync(cwd, { recursive: true, force: true });
    }
  });

  it('returns exit code 2 when lock wait times out', async () => {
    const cwd = setupSandboxProject();
    try {
      // Spawn a process that holds the lock longer than the wait timeout (2s).
      const p1 = spawn(process.execPath, [ccwBin, 'learn:update-state', '--field', 'active_profile_id', '--value', 'p1', '--json'], {
        cwd,
        env: { ...process.env, CCW_PROJECT_ROOT: cwd, CCW_LEARN_LOCK_HOLD_MS: '2500' },
        stdio: ['ignore', 'pipe', 'pipe']
      });

      await waitForFile(path.join(cwd, '.workflow/learn/.lock'), 1000);

      const { res, out } = runCcw(
        ['learn:update-state', '--field', 'active_profile_id', '--value', 'p2', '--json'],
        cwd
      );
      assert.equal(res.status, 2);
      assert.equal(out.ok, false);
      assert.equal(out.error.code, 'LOCKED');

      await new Promise((resolve) => p1.on('exit', resolve));
    } finally {
      rmSync(cwd, { recursive: true, force: true });
    }
  });

  it('uses package root learn paths when invoked from a nested cwd', () => {
    const nestedCwd = path.join(repoRoot, 'ccw');
    const nestedWorkflowDir = path.join(nestedCwd, '.workflow');

    const learnDir = path.join(repoRoot, '.workflow', 'learn');
    const profilesDir = path.join(learnDir, 'profiles');
    const statePath = path.join(learnDir, 'state.json');

    const hadLearnDir = existsSync(learnDir);
    const hadProfilesDir = existsSync(profilesDir);
    const prevState = existsSync(statePath) ? readFileSync(statePath, 'utf8') : null;

    rmSync(nestedWorkflowDir, { recursive: true, force: true });

    const unique = `test-${process.pid}-${Date.now()}`;
    try {
      const { res, out } = runCcw(
        ['learn:update-state', '--field', 'active_session_id', '--value', unique, '--json'],
        nestedCwd,
        {},
        { setProjectRoot: false }
      );
      assert.equal(res.status, 0);
      assert.equal(out.ok, true);

      const persisted = JSON.parse(readFileSync(statePath, 'utf8'));
      assert.equal(persisted.active_session_id, unique);
      assert.equal(existsSync(nestedWorkflowDir), false);
    } finally {
      if (prevState !== null) {
        writeFileSync(statePath, prevState, 'utf8');
      } else {
        rmSync(statePath, { force: true });
      }

      if (!hadProfilesDir) {
        rmSync(profilesDir, { recursive: true, force: true });
      }
      if (!hadLearnDir) {
        rmSync(learnDir, { recursive: true, force: true });
      }
    }
  });
});
