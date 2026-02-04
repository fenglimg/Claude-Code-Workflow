import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

import { verifyEvidenceMarkdown } from '../../.claude/skills/slash-command-outliner/scripts/verify-evidence.js';

function getRepoRoot() {
  const here = path.dirname(fileURLToPath(import.meta.url));
  return path.resolve(here, '..', '..');
}

function ensureDir(p) {
  mkdirSync(p, { recursive: true });
}

test('verifyEvidenceMarkdown: accepts canonical docs+ts evidence and existing pointer', () => {
  const repoRoot = getRepoRoot();

  const docRel = '.claude/commands/issue/new.md';
  const tsRel = 'ccw/src/commands/issue.ts';

  const md = [
    '| Pointer | Status | Evidence | Verify | Notes |',
    '|---|---|---|---|---|',
    `| \`${tsRel}\` | Existing | docs: \`${docRel}\` / Implementation ; ts: \`${tsRel}\` / export function readIssues | Test-Path \`${tsRel}\` | ok |`,
    '',
  ].join('\n');

  const res = verifyEvidenceMarkdown({ repoRoot, mdPath: 'fixture.md', markdown: md });
  assert.equal(res.tablesFound, 1);
  assert.equal(res.failures.length, 0);
});

test('verify-evidence.js CLI: exits 0 on valid evidence table', () => {
  const repoRoot = getRepoRoot();
  const scratch = path.join(repoRoot, '.workflow', '.scratchpad', 'verify-evidence-cli-fixtures');
  ensureDir(scratch);

  const docRel = '.claude/commands/issue/new.md';
  const tsRel = 'ccw/src/commands/issue.ts';

  const md = [
    '| Pointer | Status | Evidence | Verify | Notes |',
    '|---|---|---|---|---|',
    `| \`${tsRel}\` | Existing | docs: \`${docRel}\` / Implementation ; ts: \`${tsRel}\` / export function readIssues | Test-Path \`${tsRel}\` | ok |`,
    '',
  ].join('\n');

  const mdAbs = path.join(scratch, 'ok.md');
  writeFileSync(mdAbs, md, 'utf8');
  const mdRel = path.relative(repoRoot, mdAbs).replaceAll('\\', '/');

  const scriptAbs = path.join(
    repoRoot,
    '.claude',
    'skills',
    'slash-command-outliner',
    'scripts',
    'verify-evidence.js'
  );

  const proc = spawnSync(process.execPath, [scriptAbs, `--file=${mdRel}`], {
    cwd: repoRoot,
    encoding: 'utf8',
  });

  assert.equal(proc.status, 0, proc.stderr || proc.stdout);
});

test('verify-evidence.js CLI: exits 2 when no evidence tables exist', () => {
  const repoRoot = getRepoRoot();
  const scratch = path.join(repoRoot, '.workflow', '.scratchpad', 'verify-evidence-cli-fixtures');
  ensureDir(scratch);

  const mdAbs = path.join(scratch, 'no-tables.md');
  writeFileSync(mdAbs, '# Title\n\nNo tables here.\n', 'utf8');
  const mdRel = path.relative(repoRoot, mdAbs).replaceAll('\\', '/');

  const scriptAbs = path.join(
    repoRoot,
    '.claude',
    'skills',
    'slash-command-outliner',
    'scripts',
    'verify-evidence.js'
  );

  const proc = spawnSync(process.execPath, [scriptAbs, `--file=${mdRel}`], {
    cwd: repoRoot,
    encoding: 'utf8',
  });

  assert.equal(proc.status, 2);
  assert.match(proc.stderr, /no evidence tables found/i);
});

