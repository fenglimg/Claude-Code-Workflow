import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, '../..');

const mcpRunnerPath = path.join(repoRoot, '.claude/commands/learn/_internal/mcp-runner.js');
const fixtureTsPath = path.join(
  repoRoot,
  '.claude/commands/learn/_internal/fixtures/typescript-first-element.mjs'
);

function runMcp(codePath, fixturePath, extraArgs = []) {
  const res = spawnSync(process.execPath, [mcpRunnerPath, codePath, fixturePath, ...extraArgs], {
    encoding: 'utf8'
  });
  assert.equal(res.error, undefined);
  assert.equal(typeof res.stdout, 'string');
  const out = JSON.parse(res.stdout.trim());
  return { out, res };
}

describe('mcp-runner', () => {
  it('passes fixture-backed tests for valid TypeScript solution', () => {
    const dir = mkdtempSync(path.join(tmpdir(), 'ccw-mcp-runner-test-'));
    try {
      const codePath = path.join(dir, 'solution.ts');
      writeFileSync(
        codePath,
        [
          'export function first<T>(arr: T[]): T | undefined {',
          '  return arr[0];',
          '}',
          ''
        ].join('\n'),
        'utf8'
      );

      const { out } = runMcp(codePath, fixtureTsPath, ['--timeout-ms=2000']);
      assert.equal(out.tests_total, 3);
      assert.equal(out.tests_passed, 3);
      assert.equal(out.score, 1);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it('fails fixture-backed tests for invalid solution', () => {
    const dir = mkdtempSync(path.join(tmpdir(), 'ccw-mcp-runner-test-'));
    try {
      const codePath = path.join(dir, 'solution.ts');
      writeFileSync(codePath, 'export const notFirst = () => 123;\n', 'utf8');

      const { out } = runMcp(codePath, fixtureTsPath, ['--timeout-ms=2000']);
      assert.equal(out.tests_total, 3);
      assert.equal(out.tests_passed, 0);
      assert.equal(out.score, 0);
      assert.ok(Array.isArray(out.failures));
      assert.ok(out.failures.length >= 1);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it('enforces a timeout for non-terminating code', () => {
    const dir = mkdtempSync(path.join(tmpdir(), 'ccw-mcp-runner-test-'));
    try {
      const codePath = path.join(dir, 'solution.ts');
      writeFileSync(
        codePath,
        [
          'export function first(arr) {',
          '  // Busy loop to trigger the runner timeout',
          '  // eslint-disable-next-line no-constant-condition',
          '  while (true) {}',
          '}',
          ''
        ].join('\n'),
        'utf8'
      );

      const { out } = runMcp(codePath, fixtureTsPath, ['--timeout-ms=50']);
      assert.equal(out.tests_passed, 0);
      assert.equal(out.score, 0);
      assert.ok(out.failures?.some((f) => f?.error?.name === 'TimeoutError'));
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it('blocks filesystem access outside the sandbox directory', () => {
    const dir = mkdtempSync(path.join(tmpdir(), 'ccw-mcp-runner-test-'));
    try {
      const codePath = path.join(dir, 'solution.ts');
      writeFileSync(
        codePath,
        [
          "import fs from 'node:fs';",
          'export function first(arr) {',
          "  // Attempt to read outside sandbox; should throw under Node's permission system.",
          "  fs.readFileSync('/etc/passwd', 'utf8');",
          '  return arr[0];',
          '}',
          ''
        ].join('\n'),
        'utf8'
      );

      const fixturePath = path.join(dir, 'fixture.mjs');
      writeFileSync(
        fixturePath,
        [
          "import assert from 'node:assert/strict';",
          'export const meta = { tests_total: 1 };',
          'export const tests = [{',
          "  name: 'calling first should fail due to fs permission',",
          '  run: async (solution) => {',
          '    assert.throws(() => solution.first([1]));',
          '  }',
          '}];',
          ''
        ].join('\n'),
        'utf8'
      );

      const { out } = runMcp(codePath, fixturePath, ['--timeout-ms=2000']);
      assert.equal(out.tests_total, 1);
      assert.equal(out.tests_passed, 1);
      assert.equal(out.score, 1);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});

