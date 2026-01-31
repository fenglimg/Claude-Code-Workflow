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
  const dir = mkdtempSync(path.join(tmpdir(), 'ccw-learn-snapshot-'));
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

describe('ccw learn:* snapshot rebuild + rollback (Milestone B)', () => {
  it('rebuild supports target_version and is deterministic', () => {
    const cwd = setupSandboxProject();
    try {
      const profile = { known_topics: [], experience_level: null };
      const { res: r0 } = runCcw(['learn:write-profile', '--profile-id', 'p1', '--data', JSON.stringify(profile), '--json'], cwd);
      assert.equal(r0.status, 0);

      const pre_context = {
        raw: { pre_q1_style: 'mixed' },
        parsed: { learning_style: 'mixed' },
        provenance: {
          template_version: 'pre_context_v1.3',
          captured_at: '2026-01-01T00:00:00.000Z',
          asked_vs_reused: 'asked',
          gating_reason: 'test'
        }
      };

      const { res: r1, out: o1 } = runCcw(
        [
          'learn:append-profile-event',
          '--profile-id',
          'p1',
          '--type',
          'PRECONTEXT_CAPTURED',
          '--payload',
          JSON.stringify({ template_version: 'pre_context_v1.3', pre_context }),
          '--json'
        ],
        cwd
      );
      assert.equal(r1.status, 0);
      assert.equal(o1.ok, true);
      assert.equal(o1.data.version, 1);

      const { res: r2, out: o2 } = runCcw(
        [
          'learn:append-profile-event',
          '--profile-id',
          'p1',
          '--type',
          'FIELD_SET',
          '--payload',
          JSON.stringify({ field_path: 'pre_context.parsed.learning_style', new_value: 'theoretical' }),
          '--json'
        ],
        cwd
      );
      assert.equal(r2.status, 0);
      assert.equal(o2.ok, true);
      assert.equal(o2.data.version, 2);

      const { res: rb1, out: ob1 } = runCcw(
        ['learn:rebuild-profile-snapshot', '--profile-id', 'p1', '--target-version', '1', '--no-persist', '--json'],
        cwd
      );
      assert.equal(rb1.status, 0);
      assert.equal(ob1.ok, true);
      assert.equal(ob1.data.profile_id, 'p1');
      assert.equal(ob1.data.version, 1);
      assert.equal(ob1.data.pre_context?.parsed?.learning_style, 'mixed');

      const { res: rb2, out: ob2 } = runCcw(
        ['learn:rebuild-profile-snapshot', '--profile-id', 'p1', '--target-version', '2', '--no-persist', '--json'],
        cwd
      );
      assert.equal(rb2.status, 0);
      assert.equal(ob2.ok, true);
      assert.equal(ob2.data.version, 2);
      assert.equal(ob2.data.pre_context?.parsed?.learning_style, 'theoretical');

      // Determinism: same event stream -> same folded snapshot.
      const { out: ob2Again } = runCcw(
        ['learn:rebuild-profile-snapshot', '--profile-id', 'p1', '--target-version', '2', '--no-persist', '--json'],
        cwd
      );
      assert.deepEqual(ob2Again.data, ob2.data);
    } finally {
      rmSync(cwd, { recursive: true, force: true });
    }
  });

  it('rollback appends event and updates snapshot view without deleting history', () => {
    const cwd = setupSandboxProject();
    try {
      const profile = { known_topics: [], experience_level: null };
      runCcw(['learn:write-profile', '--profile-id', 'p1', '--data', JSON.stringify(profile), '--json'], cwd);

      const pre_context = {
        raw: { pre_q1_style: 'mixed' },
        parsed: { learning_style: 'mixed' },
        provenance: {
          template_version: 'pre_context_v1.3',
          captured_at: '2026-01-01T00:00:00.000Z',
          asked_vs_reused: 'asked',
          gating_reason: 'test'
        }
      };
      runCcw(
        ['learn:append-profile-event', '--profile-id', 'p1', '--type', 'PRECONTEXT_CAPTURED', '--payload', JSON.stringify({ pre_context }), '--json'],
        cwd
      );
      runCcw(
        [
          'learn:append-profile-event',
          '--profile-id',
          'p1',
          '--type',
          'FIELD_SET',
          '--payload',
          JSON.stringify({ field_path: 'pre_context.parsed.learning_style', new_value: 'theoretical' }),
          '--json'
        ],
        cwd
      );

      const { res: rr, out: orr } = runCcw(
        ['learn:rollback-profile', '--profile-id', 'p1', '--target-version', '1', '--actor', 'user', '--json'],
        cwd
      );
      assert.equal(rr.status, 0);
      assert.equal(orr.ok, true);
      assert.equal(orr.data.event.type, 'ROLLBACK_TO_VERSION');
      assert.equal(orr.data.event.version, 3);
      assert.equal(orr.data.snapshot.version, 3);
      assert.equal(orr.data.snapshot._metadata?.rolled_back_to_version, 1);
      assert.equal(orr.data.snapshot.pre_context?.parsed?.learning_style, 'mixed');

      const snapshotPath = path.join(cwd, '.workflow/learn/profiles/snapshots/p1.json');
      assert.equal(existsSync(snapshotPath), true);
      const snapshotOnDisk = JSON.parse(readFileSync(snapshotPath, 'utf8'));
      assert.equal(snapshotOnDisk.version, 3);

      // History is preserved (3 events).
      const eventsPath = path.join(cwd, '.workflow/learn/profiles/events/p1.ndjson');
      const lines = readFileSync(eventsPath, 'utf8').trim().split(/\r?\n/);
      assert.equal(lines.length, 3);
      assert.equal(JSON.parse(lines[2]).type, 'ROLLBACK_TO_VERSION');
    } finally {
      rmSync(cwd, { recursive: true, force: true });
    }
  });
});

