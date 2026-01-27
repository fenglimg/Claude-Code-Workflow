import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, '../..');

const ccwBin = path.join(repoRoot, 'ccw/bin/ccw.js');

function runCcw(args, cwd) {
  const env = { ...process.env, CCW_PROJECT_ROOT: cwd };
  const res = spawnSync(process.execPath, [ccwBin, ...args], { cwd, env, encoding: 'utf8' });
  const stdout = (res.stdout || '').trim();
  const out = stdout ? JSON.parse(stdout) : null;
  return { res, out };
}

describe('ccw learn:adaptive-step', () => {
  it('returns should_continue=false when target confidence is already met', () => {
    const cwd = mkdtempSync(path.join(tmpdir(), 'ccw-learn-adaptive-'));
    try {
      const state = {
        range: { min: 0.45, max: 0.55 },
        confidence: 0.9,
        rounds: [{ round_index: 0 }, { round_index: 1 }, { round_index: 2 }],
        minRounds: 3
      };
      const round = { correct_ratio: 0.6, consistency: 1, question_count: 4, target_difficulty: 0.5 };

      const { res, out } = runCcw(
        ['learn:adaptive-step', '--state', JSON.stringify(state), '--round-result', JSON.stringify(round), '--json'],
        cwd
      );
      assert.equal(res.status, 0);
      assert.equal(out.ok, true);
      assert.equal(out.data.should_continue, false);
    } finally {
      rmSync(cwd, { recursive: true, force: true });
    }
  });

  it('stops when maxRounds is reached', () => {
    const cwd = mkdtempSync(path.join(tmpdir(), 'ccw-learn-adaptive-'));
    try {
      const state = {
        range: { min: 0, max: 1 },
        confidence: 0,
        rounds: [],
        minRounds: 1,
        maxRounds: 1
      };
      const round = { correct_ratio: 0.5, consistency: 1, question_count: 4, target_difficulty: 0.5 };

      const { out } = runCcw(
        ['learn:adaptive-step', '--state', JSON.stringify(state), '--round-result', JSON.stringify(round), '--json'],
        cwd
      );
      assert.equal(out.ok, true);
      assert.equal(out.data.should_continue, false);
    } finally {
      rmSync(cwd, { recursive: true, force: true });
    }
  });

  it('triggers expand+hard flag on all-correct misjudgment', () => {
    const cwd = mkdtempSync(path.join(tmpdir(), 'ccw-learn-adaptive-'));
    try {
      const state = {
        range: { min: 0, max: 0.5 },
        confidence: 0,
        rounds: [],
        expandCount: 0
      };
      const round = { correct_ratio: 1, consistency: 1, question_count: 4, target_difficulty: 0.25 };

      const { out } = runCcw(
        ['learn:adaptive-step', '--state', JSON.stringify(state), '--round-result', JSON.stringify(round), '--json'],
        cwd
      );
      assert.equal(out.ok, true);
      assert.equal(out.data.updated_state.hardNextRound, true);
      assert.ok(out.data.updated_state.expandCount >= 1);
      assert.ok(out.data.next_target_difficulty !== null);
    } finally {
      rmSync(cwd, { recursive: true, force: true });
    }
  });
});
