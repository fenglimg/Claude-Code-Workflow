import { spawnSync } from 'node:child_process';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

function sha256(text) {
  return crypto.createHash('sha256').update(String(text), 'utf8').digest('hex');
}

function toPosixPath(p) {
  return String(p).replaceAll(path.sep, '/');
}

export function ensureDir(absDir) {
  fs.mkdirSync(absDir, { recursive: true });
}

export function readTextIfExists(absPath) {
  if (!fs.existsSync(absPath)) return null;
  return fs.readFileSync(absPath, 'utf8');
}

export function writeText(absPath, text) {
  ensureDir(path.dirname(absPath));
  fs.writeFileSync(absPath, text, 'utf8');
}

function gitDiffNoIndex(expectedAbs, currentAbs) {
  const res = spawnSync(
    'git',
    ['diff', '--no-index', '--', expectedAbs, currentAbs],
    { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }
  );
  // git diff returns exit code 1 when files differ (which is the common case here).
  const ok = res.status === 0 || res.status === 1;
  if (!ok) return null;
  const out = String(res.stdout || '');
  return out.trim().length ? out : null;
}

function fallbackDiff(expectedAbs, currentAbs, expectedText, currentText) {
  const expectedHash = sha256(expectedText);
  const currentHash = sha256(currentText);
  return [
    `# Snapshot Diff (fallback)`,
    '',
    `- expected: ${toPosixPath(expectedAbs)}`,
    `- current:   ${toPosixPath(currentAbs)}`,
    `- expected_sha256: ${expectedHash}`,
    `- current_sha256:  ${currentHash}`,
    '',
    '--- expected',
    expectedText,
    '--- current',
    currentText,
    '',
  ].join('\n');
}

export function diffSnapshots(expectedAbs, currentAbs) {
  const expectedText = fs.readFileSync(expectedAbs, 'utf8');
  const currentText = fs.readFileSync(currentAbs, 'utf8');
  const diff = gitDiffNoIndex(expectedAbs, currentAbs) ?? fallbackDiff(expectedAbs, currentAbs, expectedText, currentText);
  return { equal: expectedText === currentText, diff };
}

/**
 * Snapshot gate:
 * - If expected is missing, initialize it from current.
 * - If expected differs, write a diff file and (optionally) update expected.
 */
export function enforceSnapshotGate({
  expectedAbs,
  currentAbs,
  diffAbs,
  updateExpected,
}) {
  const currentText = fs.readFileSync(currentAbs, 'utf8');
  const expectedText = readTextIfExists(expectedAbs);

  if (expectedText === null) {
    writeText(expectedAbs, currentText);
    return { initialized: true, changed: false, updatedExpected: false };
  }

  if (expectedText === currentText) {
    return { initialized: false, changed: false, updatedExpected: false };
  }

  const { diff } = diffSnapshots(expectedAbs, currentAbs);
  writeText(diffAbs, diff);

  if (updateExpected) {
    writeText(expectedAbs, currentText);
    return { initialized: false, changed: true, updatedExpected: true };
  }

  return { initialized: false, changed: true, updatedExpected: false };
}

