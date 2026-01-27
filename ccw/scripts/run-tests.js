import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { globSync } from 'glob';

// Cross-platform test runner:
// - Avoids shell glob expansion issues on Windows (npm scripts run via cmd.exe).
// - Keeps the default unit test scope narrow (ccw/tests/*.test.js).
const repoRoot = path.resolve(process.cwd());
const pattern = path.join('ccw', 'tests', '*.test.js');

const files = globSync(pattern, { cwd: repoRoot, windowsPathsNoEscape: true });

if (!files.length) {
  // Match Node's default behavior of failing when the requested pattern yields nothing.
  // Keep message concise for CI logs.
  console.error(`No test files matched: ${pattern}`);
  process.exit(1);
}

const res = spawnSync(process.execPath, ['--test', ...files], { stdio: 'inherit' });
process.exit(res.status ?? 1);

