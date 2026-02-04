import assert from 'node:assert/strict';
import test from 'node:test';

import { readFileSync } from 'node:fs';
import path from 'node:path';

import { verifyEvidenceMarkdown } from './verify-evidence.js';

test('passes when docs heading + ts anchor are present (canonical paths)', () => {
  const repoRoot = process.cwd();
  const docRel = '.claude/commands/issue/new.md';
  const tsRel = 'ccw/src/commands/issue.ts';

  const md = [
    '| Pointer | Status | Evidence | Verify | Notes |',
    '|---|---|---|---|---|',
    `| \`${tsRel}\` | Existing | docs: \`${docRel}\` / Implementation ; ts: \`${tsRel}\` / export function readIssues | Test-Path \`${tsRel}\` | ok |`,
    '',
  ].join('\n');

  // Sanity: fixtures exist.
  assert.ok(readFileSync(path.resolve(repoRoot, docRel), 'utf8').includes('## Implementation'));
  assert.ok(readFileSync(path.resolve(repoRoot, tsRel), 'utf8').includes('export function readIssues'));

  const res = verifyEvidenceMarkdown({ repoRoot, mdPath: 'fixture.md', markdown: md });
  assert.equal(res.tablesFound, 1);
  assert.equal(res.failures.length, 0);
});

test('fails when Existing pointer path is missing', () => {
  const repoRoot = process.cwd();
  const docRel = '.claude/commands/issue/new.md';
  const tsRel = 'ccw/src/commands/issue.ts';

  const md = [
    '| Pointer | Status | Evidence | Verify | Notes |',
    '|---|---|---|---|---|',
    '| `ccw/src/commands/DOES_NOT_EXIST.ts` | Existing | docs: `'.concat(docRel, '` / Implementation ; ts: `', tsRel, '` / createAction | Test-Path `ccw/src/commands/DOES_NOT_EXIST.ts` | should fail |'),
    '',
  ].join('\n');

  const res = verifyEvidenceMarkdown({ repoRoot, mdPath: 'fixture.md', markdown: md });
  assert.equal(res.tablesFound, 1);
  assert.ok(res.failures.length >= 1);
});
