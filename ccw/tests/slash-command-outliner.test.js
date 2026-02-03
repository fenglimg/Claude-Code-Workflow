import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';

import { enforceSnapshotGate, readTextIfExists, writeText } from '../../.claude/skills/slash-command-outliner/scripts/lib/snapshots.js';
import { findImplementationHints } from '../../.claude/skills/slash-command-outliner/scripts/lib/implementation-hints.js';

test('enforceSnapshotGate initializes expected when missing', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'sco-snap-'));
  const expectedAbs = path.join(dir, 'expected.md');
  const currentAbs = path.join(dir, 'current.md');
  const diffAbs = path.join(dir, 'diff.txt');

  writeText(currentAbs, 'hello\n');

  const res = enforceSnapshotGate({ expectedAbs, currentAbs, diffAbs, updateExpected: false });
  assert.equal(res.initialized, true);
  assert.equal(res.changed, false);
  assert.equal(readTextIfExists(expectedAbs), 'hello\n');
  assert.equal(readTextIfExists(diffAbs), null);
});

test('enforceSnapshotGate writes diff and blocks unless updateExpected', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'sco-snap-'));
  const expectedAbs = path.join(dir, 'expected.md');
  const currentAbs = path.join(dir, 'current.md');
  const diffAbs = path.join(dir, 'diff.txt');

  writeText(expectedAbs, 'a\n');
  writeText(currentAbs, 'b\n');

  const res1 = enforceSnapshotGate({ expectedAbs, currentAbs, diffAbs, updateExpected: false });
  assert.equal(res1.initialized, false);
  assert.equal(res1.changed, true);
  assert.equal(res1.updatedExpected, false);
  assert.ok(readTextIfExists(diffAbs));
  assert.equal(readTextIfExists(expectedAbs), 'a\n');

  const res2 = enforceSnapshotGate({ expectedAbs, currentAbs, diffAbs, updateExpected: true });
  assert.equal(res2.changed, true);
  assert.equal(res2.updatedExpected, true);
  assert.equal(readTextIfExists(expectedAbs), 'b\n');
});

test('findImplementationHints ranks likely files by token matches', () => {
  const repoRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'sco-repo-'));

  const fileA = path.join(repoRoot, 'ccw', 'src', 'commands', 'workflow.ts');
  const fileB = path.join(repoRoot, 'ccw', 'src', 'tools', 'unrelated.ts');

  fs.mkdirSync(path.dirname(fileA), { recursive: true });
  fs.mkdirSync(path.dirname(fileB), { recursive: true });
  fs.writeFileSync(fileA, 'export const COMMAND = "/workflow:plan";\n', 'utf8');
  fs.writeFileSync(fileB, 'export const x = 1;\n', 'utf8');

  const toolingManifest = {
    files: ['ccw\\src\\commands\\workflow.ts', 'ccw\\src\\tools\\unrelated.ts'],
  };

  const hints = findImplementationHints({
    repoRoot,
    derivedFrom: '.claude/commands/workflow/plan.md',
    command: { group: 'workflow', name: 'plan', description: 'Plan workflow execution' },
    toolingManifest,
    maxResults: 5,
  });

  assert.ok(hints.length >= 1);
  assert.equal(hints[0], 'ccw/src/commands/workflow.ts');
});

test('findImplementationHints extracts ccw tool exec + referenced slash command docs', () => {
  const repoRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'sco-repo-'));

  const toolFile = path.join(repoRoot, 'ccw', 'src', 'tools', 'get-modules-by-depth.ts');
  fs.mkdirSync(path.dirname(toolFile), { recursive: true });
  fs.writeFileSync(toolFile, 'export const name = "get_modules_by_depth";\n', 'utf8');

  const referencedDoc = path.join(repoRoot, '.claude', 'commands', 'workflow', 'test-gen.md');
  fs.mkdirSync(path.dirname(referencedDoc), { recursive: true });
  fs.writeFileSync(referencedDoc, '# /workflow:test-gen\n', 'utf8');

  const thisDoc = path.join(repoRoot, '.claude', 'commands', 'cli', 'cli-init.md');
  fs.mkdirSync(path.dirname(thisDoc), { recursive: true });
  fs.writeFileSync(
    thisDoc,
    [
      '---',
      'name: cli-init',
      'description: demo',
      'allowed-tools: Bash(*)',
      'group: cli',
      '---',
      '',
      'Runs `get_modules_by_depth.sh` and then:',
      '```bash',
      'bash(ccw tool exec get_modules_by_depth \'{"format":"json"}\')',
      '```',
      'Also calls /workflow:test-gen',
      '',
    ].join('\n'),
    'utf8'
  );

  const toolingManifest = {
    files: ['ccw\\src\\tools\\get-modules-by-depth.ts'],
  };

  const hints = findImplementationHints({
    repoRoot,
    derivedFrom: '.claude/commands/cli/cli-init.md',
    command: { group: 'cli', name: 'cli-init', description: 'demo' },
    toolingManifest,
    maxResults: 10,
  });

  assert.ok(hints.includes('ccw/src/tools/get-modules-by-depth.ts'));
  assert.ok(hints.includes('.claude/commands/workflow/test-gen.md'));
});
