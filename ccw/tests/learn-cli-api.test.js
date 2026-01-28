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
  const dir = mkdtempSync(path.join(tmpdir(), 'ccw-learn-session-cli-'));
  const schemaDir = path.join(dir, '.claude/workflows/cli-templates/schemas');
  mkdirSync(schemaDir, { recursive: true });

  for (const name of ['learn-state.schema.json', 'learn-profile.schema.json', 'learn-plan.schema.json']) {
    const src = path.join(repoRoot, '.claude/workflows/cli-templates/schemas', name);
    const dst = path.join(schemaDir, name);
    writeFileSync(dst, readFileSync(src, 'utf8'), 'utf8');
  }

  return dir;
}

function runCcw(args, cwd, env = {}, options = {}) {
  const { setProjectRoot = true } = options;
  const finalEnv = { ...process.env, ...env };
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

function writeTestSession(cwd, sessionId, { withProgress = false } = {}) {
  const sessionDir = path.join(cwd, '.workflow/learn/sessions', sessionId);
  mkdirSync(sessionDir, { recursive: true });

  const plan = {
    session_id: sessionId,
    learning_goal: 'Test Goal',
    profile_id: 'p1',
    knowledge_points: [
      {
        id: 'KP-1',
        title: 'KP 1',
        description: 'd',
        prerequisites: [],
        topic_refs: [],
        resources: [{ type: 'documentation', url: 'https://example.com', quality: 'gold' }],
        assessment: { type: 'practical_task', description: 'do it' },
        status: 'pending'
      }
    ],
    dependency_graph: { nodes: ['KP-1'], edges: [] }
  };

  writeFileSync(path.join(sessionDir, 'plan.json'), JSON.stringify(plan, null, 2), 'utf8');

  if (withProgress) {
    const progress = {
      session_id: sessionId,
      completed_knowledge_points: [],
      in_progress_knowledge_points: [],
      knowledge_point_progress: {},
      _metadata: { last_updated: new Date().toISOString() }
    };
    writeFileSync(path.join(sessionDir, 'progress.json'), JSON.stringify(progress, null, 2), 'utf8');
  }

  return sessionDir;
}

describe('ccw learn:* session/progress commands', () => {
  it('learn:read-session reads plan.json and returns empty progress when missing', () => {
    const cwd = setupSandboxProject();
    try {
      const sessionId = 'LS-20260128-001';
      writeTestSession(cwd, sessionId, { withProgress: false });

      const { res, out } = runCcw(['learn:read-session', '--session-id', sessionId, '--json'], cwd);
      assert.equal(res.status, 0);
      assert.equal(out.ok, true);
      assert.equal(out.data.session_id, sessionId);
      assert.equal(out.data.plan.session_id, sessionId);
      assert.deepEqual(out.data.progress, {});
    } finally {
      rmSync(cwd, { recursive: true, force: true });
    }
  });

  it('learn:read-session returns NOT_FOUND when session missing', () => {
    const cwd = setupSandboxProject();
    try {
      const { res, out } = runCcw(['learn:read-session', '--session-id', 'LS-20260128-001', '--json'], cwd);
      assert.equal(res.status, 1);
      assert.equal(out.ok, false);
      assert.equal(out.error.code, 'NOT_FOUND');
    } finally {
      rmSync(cwd, { recursive: true, force: true });
    }
  });

  it('learn:update-progress creates progress.json and updates knowledge_point_progress', () => {
    const cwd = setupSandboxProject();
    try {
      const sessionId = 'LS-20260128-001';
      const sessionDir = writeTestSession(cwd, sessionId, { withProgress: false });

      const { res, out } = runCcw(
        [
          'learn:update-progress',
          '--session-id',
          sessionId,
          '--topic-id',
          'KP-1',
          '--status',
          'completed',
          '--evidence',
          '{}',
          '--json'
        ],
        cwd
      );

      assert.equal(res.status, 0);
      assert.equal(out.ok, true);
      assert.equal(out.data.session_id, sessionId);
      assert.equal(out.data.knowledge_point_progress['KP-1'].status, 'completed');
      assert.equal(typeof out.data.knowledge_point_progress['KP-1'].updated_at, 'string');

      const persisted = JSON.parse(readFileSync(path.join(sessionDir, 'progress.json'), 'utf8'));
      assert.equal(persisted.session_id, sessionId);
      assert.equal(persisted.knowledge_point_progress['KP-1'].status, 'completed');
      assert.ok(Array.isArray(persisted.completed_knowledge_points));
      assert.ok(persisted.completed_knowledge_points.includes('KP-1'));
    } finally {
      rmSync(cwd, { recursive: true, force: true });
    }
  });

  it('serializes concurrent progress writers via the learn lock', async () => {
    const cwd = setupSandboxProject();
    try {
      const sessionId = 'LS-20260128-001';
      const sessionDir = writeTestSession(cwd, sessionId, { withProgress: true });

      const p1 = spawn(
        process.execPath,
        [
          ccwBin,
          'learn:update-progress',
          '--session-id',
          sessionId,
          '--topic-id',
          'KP-1',
          '--status',
          'in_progress',
          '--evidence',
          '{}',
          '--json'
        ],
        {
          cwd,
          env: { ...process.env, CCW_PROJECT_ROOT: cwd, CCW_LEARN_LOCK_HOLD_MS: '200' },
          stdio: ['ignore', 'pipe', 'pipe']
        }
      );

      await waitForFile(path.join(cwd, '.workflow/learn/.lock'), 1000);

      const { res, out } = runCcw(
        [
          'learn:update-progress',
          '--session-id',
          sessionId,
          '--topic-id',
          'KP-1',
          '--status',
          'completed',
          '--evidence',
          '{}',
          '--json'
        ],
        cwd
      );
      assert.equal(res.status, 0);
      assert.equal(out.ok, true);

      await new Promise((resolve, reject) => {
        p1.on('exit', (code) => (code === 0 ? resolve() : reject(new Error(`p1 exited ${code}`))));
      });

      const persisted = JSON.parse(readFileSync(path.join(sessionDir, 'progress.json'), 'utf8'));
      assert.equal(persisted.knowledge_point_progress['KP-1'].status, 'completed');
    } finally {
      rmSync(cwd, { recursive: true, force: true });
    }
  });
});
