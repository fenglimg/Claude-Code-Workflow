import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, '../..');

const ccwBin = path.join(repoRoot, 'ccw/bin/ccw.js');

function setupSandboxWithKeywordDict() {
  const dir = mkdtempSync(path.join(tmpdir(), 'ccw-learn-bg-'));
  const dictDir = path.join(dir, '.workflow/learn/tech-stack');
  mkdirSync(dictDir, { recursive: true });

  const src = path.join(repoRoot, '.workflow/learn/tech-stack/KeywordDictionary.json');
  const dst = path.join(dictDir, 'KeywordDictionary.json');
  writeFileSync(dst, readFileSync(src, 'utf8'), 'utf8');

  return dir;
}

function runCcw(args, cwd, env = {}) {
  const finalEnv = { ...process.env, ...env, CCW_PROJECT_ROOT: cwd };
  const res = spawnSync(process.execPath, [ccwBin, ...args], { cwd, env: finalEnv, encoding: 'utf8' });
  const stdout = (res.stdout || '').trim();
  const out = stdout ? JSON.parse(stdout) : null;
  return { res, out };
}

describe('ccw learn:parse-background', () => {
  it('returns inferred skills for a simple background string', () => {
    const cwd = setupSandboxWithKeywordDict();
    try {
      const { res, out } = runCcw(['learn:parse-background', '--text', 'React + Node.js', '--json'], cwd);
      assert.equal(res.status, 0);
      assert.equal(out.ok, true);
      assert.ok(Array.isArray(out.data.skills));
      assert.ok(out.data.skills.length >= 1);
      assert.ok(out.data.skills.every((s) => typeof s.topic_id === 'string' && s.topic_id === s.topic_id.toLowerCase()));
    } finally {
      rmSync(cwd, { recursive: true, force: true });
    }
  });

  it('returns ok=false when keyword dictionary is missing', () => {
    const cwd = mkdtempSync(path.join(tmpdir(), 'ccw-learn-bg-missing-'));
    try {
      const { res, out } = runCcw(['learn:parse-background', '--text', 'React + Node.js', '--json'], cwd);
      assert.equal(res.status, 1);
      assert.equal(out.ok, false);
      assert.equal(out.error.code, 'NOT_FOUND');
    } finally {
      rmSync(cwd, { recursive: true, force: true });
    }
  });
});

