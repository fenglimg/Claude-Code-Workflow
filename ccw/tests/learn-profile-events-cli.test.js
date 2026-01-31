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
  const dir = mkdtempSync(path.join(tmpdir(), 'ccw-learn-events-'));
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

describe('ccw learn:* profile/telemetry events (NDJSON)', () => {
  it('learn:append-profile-event appends immutable events with monotonic version', () => {
    const cwd = setupSandboxProject();
    try {
      const profile = { known_topics: [], experience_level: null };
      const { res: r0, out: o0 } = runCcw(
        ['learn:write-profile', '--profile-id', 'p1', '--data', JSON.stringify(profile), '--json'],
        cwd
      );
      assert.equal(r0.status, 0);
      assert.equal(o0.ok, true);

      const { res: r1, out: o1 } = runCcw(
        [
          'learn:append-profile-event',
          '--profile-id',
          'p1',
          '--type',
          'PRECONTEXT_CAPTURED',
          '--actor',
          'user',
          '--payload',
          JSON.stringify({
            template_version: 'pre_context_v1.3',
            pre_context: {
              raw: { pre_q1_style: 'mixed' },
              parsed: { learning_style: 'mixed' },
              provenance: {
                template_version: 'pre_context_v1.3',
                captured_at: '2026-01-01T00:00:00.000Z',
                asked_vs_reused: 'asked',
                gating_reason: 'test'
              }
            }
          }),
          '--json'
        ],
        cwd
      );
      assert.equal(r1.status, 0);
      assert.equal(o1.ok, true);
      assert.equal(o1.data.profile_id, 'p1');
      assert.equal(o1.data.type, 'PRECONTEXT_CAPTURED');
      assert.equal(o1.data.actor, 'user');
      assert.equal(o1.data.version, 1);

      const { res: r2, out: o2 } = runCcw(
        [
          'learn:append-profile-event',
          '--profile-id',
          'p1',
          '--type',
          'FIELD_SET',
          '--payload',
          JSON.stringify({ field_path: 'pre_context.parsed.learning_style', new_value: 'mixed' }),
          '--json'
        ],
        cwd
      );
      assert.equal(r2.status, 0);
      assert.equal(o2.ok, true);
      assert.equal(o2.data.version, 2);

      const eventsPath = path.join(cwd, '.workflow/learn/profiles/events/p1.ndjson');
      assert.equal(existsSync(eventsPath), true);
      const lines = readFileSync(eventsPath, 'utf8').trim().split(/\r?\n/);
      assert.equal(lines.length, 2);
      const last = JSON.parse(lines[1]);
      assert.equal(last.type, 'FIELD_SET');
      assert.equal(last.version, 2);

      const snapshotPath = path.join(cwd, '.workflow/learn/profiles/snapshots/p1.json');
      assert.equal(existsSync(snapshotPath), true);
      const snapshot = JSON.parse(readFileSync(snapshotPath, 'utf8'));
      assert.equal(snapshot.profile_id, 'p1');
      assert.equal(snapshot.version, 2);
      assert.equal(snapshot.pre_context?.parsed?.learning_style, 'mixed');
    } finally {
      rmSync(cwd, { recursive: true, force: true });
    }
  });

  it('learn:append-telemetry-event appends to telemetry/events.ndjson', () => {
    const cwd = setupSandboxProject();
    try {
      const { res, out } = runCcw(
        [
          'learn:append-telemetry-event',
          '--event',
          'PROFILE_INIT_COMPLETED',
          '--profile-id',
          'p1',
          '--payload',
          JSON.stringify({ source: 'test' }),
          '--json'
        ],
        cwd
      );
      assert.equal(res.status, 0);
      assert.equal(out.ok, true);
      assert.equal(out.data.event, 'PROFILE_INIT_COMPLETED');

      const telemetryPath = path.join(cwd, '.workflow/learn/telemetry/events.ndjson');
      assert.equal(existsSync(telemetryPath), true);
      const line = readFileSync(telemetryPath, 'utf8').trim().split(/\r?\n/)[0];
      const parsed = JSON.parse(line);
      assert.equal(parsed.event, 'PROFILE_INIT_COMPLETED');
      assert.equal(parsed.profile_id, 'p1');
    } finally {
      rmSync(cwd, { recursive: true, force: true });
    }
  });
});
