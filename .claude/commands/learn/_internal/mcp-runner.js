#!/usr/bin/env node

/**
 * Execute user-submitted code against a fixture test module in an isolated Node process.
 *
 * Usage:
 *   node .claude/commands/learn/_internal/mcp-runner.js <code-file> <fixture-file> [--timeout-ms=2000] [--pretty]
 *
 * Output (stdout):
 *   JSON: { tests_passed, tests_total, score, execution_time_ms, failures? }
 */

import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { performance } from 'node:perf_hooks';

const DEFAULT_TIMEOUT_MS = 2000;

function parseArgs(argv) {
  const positional = [];
  const flags = new Map();

  for (const arg of argv) {
    if (arg.startsWith('--')) {
      const [k, v] = arg.split('=');
      flags.set(k, v ?? true);
    } else {
      positional.push(arg);
    }
  }

  const codeFile = positional[0];
  const fixtureFile = positional[1];
  const timeoutMsRaw = flags.get('--timeout-ms');
  const timeoutMs = Number(timeoutMsRaw ?? DEFAULT_TIMEOUT_MS);

  return {
    codeFile,
    fixtureFile,
    timeoutMs: Number.isFinite(timeoutMs) && timeoutMs > 0 ? timeoutMs : DEFAULT_TIMEOUT_MS,
    pretty: Boolean(flags.get('--pretty'))
  };
}

function usageAndExit(code = 1) {
  // eslint-disable-next-line no-console
  console.error('Usage: node mcp-runner.js <code-file> <fixture-file> [--timeout-ms=2000] [--pretty]');
  process.exit(code);
}

function lastJsonObjectFromStdout(stdout) {
  const lines = stdout.trim().split('\n').filter(Boolean);
  for (let i = lines.length - 1; i >= 0; i -= 1) {
    try {
      return JSON.parse(lines[i]);
    } catch {
      // continue scanning backwards
    }
  }
  return null;
}

function tryKill(child, signal) {
  try {
    return typeof signal === 'string' ? child.kill(signal) : child.kill();
  } catch {
    return false;
  }
}

function waitForExit(child, timeoutMs) {
  if (child.exitCode !== null) return Promise.resolve(true);

  return new Promise((resolve) => {
    const timer = setTimeout(() => {
      child.removeListener('exit', onExit);
      resolve(false);
    }, timeoutMs);

    function onExit() {
      clearTimeout(timer);
      resolve(true);
    }

    child.once('exit', onExit);
  });
}

async function terminateChild(child) {
  if (!child || child.exitCode !== null) return;

  // Prefer graceful termination first.
  if (process.platform === 'win32') {
    tryKill(child);
  } else {
    if (!tryKill(child, 'SIGTERM')) tryKill(child);
  }

  if (await waitForExit(child, 100)) return;

  // Escalate if still running.
  if (process.platform === 'win32') {
    tryKill(child);
    await waitForExit(child, 100);
    return;
  }

  if (!tryKill(child, 'SIGKILL')) tryKill(child);
  await waitForExit(child, 100);
}

async function main() {
  const startedAt = performance.now();
  const { codeFile, fixtureFile, timeoutMs, pretty } = parseArgs(process.argv.slice(2));
  if (!codeFile || !fixtureFile) usageAndExit(1);
  if (!existsSync(codeFile)) throw new Error(`Code file not found: ${codeFile}`);
  if (!existsSync(fixtureFile)) throw new Error(`Fixture file not found: ${fixtureFile}`);

  const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'ccw-mcp-'));
  try {
    const codeExt = path.extname(codeFile) || '.js';
    const fixtureExt = path.extname(fixtureFile) || '.mjs';

    const tmpCodePath = path.join(tmpDir, `solution${codeExt}`);
    const tmpFixturePath = path.join(tmpDir, `fixture${fixtureExt}`);

    await fs.copyFile(codeFile, tmpCodePath);
    await fs.copyFile(fixtureFile, tmpFixturePath);

    const preloadSrc = new URL('./sandbox-preload.mjs', import.meta.url);
    const tmpPreloadPath = path.join(tmpDir, 'sandbox-preload.mjs');
    await fs.copyFile(preloadSrc, tmpPreloadPath);

    const tmpRunnerPath = path.join(tmpDir, 'execute-tests.mjs');
    await fs.writeFile(
      tmpRunnerPath,
      `import { pathToFileURL } from 'node:url';\n` +
        `import { performance } from 'node:perf_hooks';\n` +
        `\n` +
        `const [solutionPath, fixturePath] = process.argv.slice(2);\n` +
        `const startedAt = performance.now();\n` +
        `\n` +
        `function asError(err) {\n` +
        `  if (err instanceof Error) return { name: err.name, message: err.message };\n` +
        `  return { name: 'Error', message: String(err) };\n` +
        `}\n` +
        `\n` +
        `const solution = await import(pathToFileURL(solutionPath).href);\n` +
        `const fixture = await import(pathToFileURL(fixturePath).href);\n` +
        `const tests = Array.isArray(fixture.tests) ? fixture.tests : [];\n` +
        `const total = typeof fixture.meta?.tests_total === 'number' ? fixture.meta.tests_total : tests.length;\n` +
        `\n` +
        `let passed = 0;\n` +
        `const failures = [];\n` +
        `for (const t of tests) {\n` +
        `  try {\n` +
        `    const run = t?.run;\n` +
        `    if (typeof run !== 'function') throw new Error('Invalid test: missing run()');\n` +
        `    await run(solution);\n` +
        `    passed += 1;\n` +
        `  } catch (err) {\n` +
        `    failures.push({ name: t?.name ?? 'unnamed', error: asError(err) });\n` +
        `  }\n` +
        `}\n` +
        `const score = total > 0 ? passed / total : 0;\n` +
        `const execution_time_ms = Math.round(performance.now() - startedAt);\n` +
        `console.log(JSON.stringify({ tests_passed: passed, tests_total: total, score, execution_time_ms, failures }, null, 0));\n`,
      'utf8'
    );

    // Node's permission model may read/realpath symlinked temp locations on macOS
    // (e.g. /var/... -> /private/var/...). Include the minimal ancestor roots that
    // Node touches while loading the entrypoint.
    const realTmpDir = await fs.realpath(tmpDir);
    const readRoots = (() => {
      if (path.sep !== '/' || !path.isAbsolute(tmpDir)) return [tmpDir];

      const roots = new Set();
      const addRootsFor = (absPath) => {
        const parts = absPath.split('/').filter(Boolean);
        if (parts.length === 0) return;
        roots.add(`/${parts[0]}`); // e.g. /var, /private
        if (parts[0] === 'private' && parts.length >= 2) {
          roots.add(`/private/${parts[1]}`); // e.g. /private/var, /private/tmp
        }
        roots.add(absPath);
      };

      addRootsFor(tmpDir);
      addRootsFor(realTmpDir);
      return [...roots];
    })();

    const nodeArgs = [
      '--experimental-strip-types',
      '--permission',
      ...readRoots.map((p) => `--allow-fs-read=${p}`),
      `--allow-fs-write=${tmpDir}`,
      `--allow-fs-write=${realTmpDir}`,
      '--import',
      tmpPreloadPath,
      tmpRunnerPath,
      tmpCodePath,
      tmpFixturePath
    ];

    const child = spawn(process.execPath, nodeArgs, {
      cwd: tmpDir,
      stdio: ['ignore', 'pipe', 'pipe'],
      env: {
        // Keep environment minimal; the child doesn't need access to parent secrets.
        NODE_NO_WARNINGS: '1'
      }
    });

    let stdout = '';
    let stderr = '';
    child.stdout.setEncoding('utf8');
    child.stderr.setEncoding('utf8');
    child.stdout.on('data', (chunk) => {
      stdout += chunk;
    });
    child.stderr.on('data', (chunk) => {
      stderr += chunk;
    });

    const timedOut = await new Promise((resolve) => {
      let settled = false;
      let didTimeout = false;
      const finish = (value) => {
        if (settled) return;
        settled = true;
        resolve(value);
      };

      const timer = setTimeout(() => {
        didTimeout = true;
        terminateChild(child).finally(() => finish(true));
      }, timeoutMs);

      child.once('exit', () => {
        clearTimeout(timer);
        finish(didTimeout);
      });
    });

    const totalTime = Math.round(performance.now() - startedAt);

    if (timedOut) {
      const out = {
        tests_passed: 0,
        tests_total: 0,
        score: 0,
        execution_time_ms: totalTime,
        failures: [{ name: 'timeout', error: { name: 'TimeoutError', message: `Timed out after ${timeoutMs}ms` } }]
      };
      // eslint-disable-next-line no-console
      console.log(JSON.stringify(out, null, pretty ? 2 : 0));
      return;
    }

    const parsed = lastJsonObjectFromStdout(stdout);
    if (!parsed) {
      const out = {
        tests_passed: 0,
        tests_total: 0,
        score: 0,
        execution_time_ms: totalTime,
        failures: [
          {
            name: 'runner_error',
            error: {
              name: 'RunnerError',
              message: `Failed to parse runner output. stderr: ${stderr.trim() || '(empty)'}`
            }
          }
        ]
      };
      // eslint-disable-next-line no-console
      console.log(JSON.stringify(out, null, pretty ? 2 : 0));
      return;
    }

    // Normalize / extend with overall timing.
    const out = {
      tests_passed: Number(parsed.tests_passed ?? 0),
      tests_total: Number(parsed.tests_total ?? 0),
      score: Number(parsed.score ?? 0),
      execution_time_ms: totalTime,
      failures: Array.isArray(parsed.failures) ? parsed.failures : []
    };

    // eslint-disable-next-line no-console
    console.log(JSON.stringify(out, null, pretty ? 2 : 0));
  } finally {
    await fs.rm(tmpDir, { recursive: true, force: true });
  }
}

main().catch((err) => {
  const out = {
    tests_passed: 0,
    tests_total: 0,
    score: 0,
    execution_time_ms: 0,
    failures: [{ name: 'mcp_runner_error', error: { name: err?.name ?? 'Error', message: err?.message ?? String(err) } }]
  };
  // eslint-disable-next-line no-console
  console.log(JSON.stringify(out, null, 0));
  process.exitCode = 1;
});
