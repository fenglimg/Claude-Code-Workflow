import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, '../..');
const ccwBin = path.join(repoRoot, 'ccw/bin/ccw.js');

function setupSandboxProject() {
  const dir = mkdtempSync(path.join(tmpdir(), 'ccw-learn-assess-vnext-'));
  const schemaDir = path.join(dir, '.claude/workflows/cli-templates/schemas');
  mkdirSync(schemaDir, { recursive: true });

  for (const name of ['learn-state.schema.json', 'learn-profile.schema.json', 'learn-profile-snapshot.schema.json']) {
    const src = path.join(repoRoot, '.claude/workflows/cli-templates/schemas', name);
    const dst = path.join(schemaDir, name);
    writeFileSync(dst, readFileSync(src, 'utf8'), 'utf8');
  }

  return dir;
}

function splitCommand(command) {
  const s = String(command || '');
  const out = [];
  let cur = '';
  let quote = null;

  for (let i = 0; i < s.length; i += 1) {
    const ch = s[i];
    if (!quote && /\s/.test(ch)) {
      if (cur) out.push(cur);
      cur = '';
      continue;
    }
    if ((ch === '"' || ch === "'") && !quote) {
      quote = ch;
      continue;
    }
    if (quote && ch === quote) {
      quote = null;
      continue;
    }
    if (ch === '\\' && quote === '"' && i + 1 < s.length) {
      // Minimal double-quote escaping.
      cur += s[i + 1];
      i += 1;
      continue;
    }
    cur += ch;
  }
  if (cur) out.push(cur);
  return out;
}

function makeBash(cwd) {
  return (command) => {
    const argv = splitCommand(command);
    assert.equal(argv[0], 'ccw', `Expected command to start with ccw, got: ${argv[0]}`);

    const res = spawnSync(process.execPath, [ccwBin, ...argv.slice(1)], {
      cwd,
      env: { ...process.env, CCW_PROJECT_ROOT: cwd, CCW_LEARN_PACK_GENERATOR: 'deterministic' },
      encoding: 'utf8'
    });
    // ccw prints JSON to stdout; bubble stderr for easier debugging.
    if (res.status !== 0) {
      throw new Error(`ccw command failed (${res.status}): ${command}\nstdout=${res.stdout}\nstderr=${res.stderr}`);
    }
    return String(res.stdout || '');
  };
}

function makeRead(cwd) {
  return (p) => {
    const rel = String(p || '').replace(/^[/\\]+/, '');
    const full = path.join(cwd, rel);
    if (!existsSync(full)) throw new Error(`Read: missing file: ${full}`);
    return readFileSync(full, 'utf8');
  };
}

function makeAskUserQuestionAlways(answerText) {
  return ({ questions }) => {
    const q = questions?.[0];
    if (!q || !q.key) return {};
    if (q.key === 'assessment_answer') return { [q.key]: answerText };
    if (q.key === 'assessment_submit_action') return { [q.key]: 'submit' };
    return { [q.key]: q.options?.[0]?.value ?? '' };
  };
}

function runCcw(args, cwd) {
  const res = spawnSync(process.execPath, [ccwBin, ...args], {
    cwd,
    env: { ...process.env, CCW_PROJECT_ROOT: cwd },
    encoding: 'utf8'
  });
  const stdout = (res.stdout || '').trim();
  const parsed = stdout ? JSON.parse(stdout) : null;
  return { res, out: parsed };
}

describe('learn/_internal/assess.js (Cycle-4 interval)', () => {
  it('writes ASSESSMENT_* events and can complete (sigma<=0.1) under rubric scoring', async () => {
    const cwd = setupSandboxProject();
    try {
      // Create a profile so append-profile-event works.
      const profile = { known_topics: [], experience_level: null };
      const { res: pRes } = runCcw(['learn:write-profile', '--profile-id', 'p1', '--data', JSON.stringify(profile), '--json'], cwd);
      assert.equal(pRes.status, 0);

      // Ensure topic exists (Cycle-4 assess does not auto ensure-topic).
      runCcw(['learn:ensure-topic', '--raw-topic-label', 'TypeScript', '--json'], cwd);

      const modUrl = pathToFileURL(path.join(repoRoot, '.claude/commands/learn/_internal/assess.js')).href;
      const { createAssess } = await import(modUrl);

      const assess = createAssess({
        AskUserQuestion: makeAskUserQuestionAlways('这是一个足够长的回答，包含定义、例子、步骤与边界条件，用于测试自动评分收敛。'),
        Bash: makeBash(cwd),
        Read: makeRead(cwd)
      });

      const result = assess.assessTopic({ profileId: 'p1', topicId: 'TypeScript', language: 'zh-CN' });
      assert.equal(result.ok, true);
      assert.equal(result.reused, false);
      assert.equal(result.topic_id, 'typescript');
      assert.equal(typeof result.session_id, 'string');
      assert.equal(result.question_count > 0, true);
      assert.equal(result.question_count <= 6, true);
      assert.equal(typeof result.stop_conditions, 'object');
      assert.equal(typeof result.algorithm_version, 'string');

      // Events file exists and includes a session summary.
      const eventsPath = path.join(cwd, '.workflow/learn/profiles/events/p1.ndjson');
      assert.equal(existsSync(eventsPath), true);
      const raw = readFileSync(eventsPath, 'utf8');
      assert.equal(raw.includes('ASSESSMENT_SESSION_SUMMARIZED'), true);
    } finally {
      rmSync(cwd, { recursive: true, force: true });
    }
  });

  it('second run with same pack_key is a noop (reused=true)', async () => {
    const cwd = setupSandboxProject();
    try {
      const profile = { known_topics: [], experience_level: null };
      const { res: pRes } = runCcw(['learn:write-profile', '--profile-id', 'p1', '--data', JSON.stringify(profile), '--json'], cwd);
      assert.equal(pRes.status, 0);

      runCcw(['learn:ensure-topic', '--raw-topic-label', 'TypeScript', '--json'], cwd);

      const modUrl = pathToFileURL(path.join(repoRoot, '.claude/commands/learn/_internal/assess.js')).href;
      const { createAssess } = await import(modUrl);

      const assess = createAssess({
        AskUserQuestion: makeAskUserQuestionAlways('这是一个足够长的回答，包含定义、例子、步骤与边界条件，用于测试自动评分收敛。'),
        Bash: makeBash(cwd),
        Read: makeRead(cwd)
      });

      const r1 = assess.assessTopic({ profileId: 'p1', topicId: 'TypeScript', language: 'zh-CN' });
      assert.equal(r1.ok, true);
      assert.equal(r1.reused, false);

      const r2 = assess.assessTopic({ profileId: 'p1', topicId: 'TypeScript', language: 'zh-CN' });
      assert.equal(r2.ok, true);
      assert.equal(r2.reused, true);
    } finally {
      rmSync(cwd, { recursive: true, force: true });
    }
  });
});
