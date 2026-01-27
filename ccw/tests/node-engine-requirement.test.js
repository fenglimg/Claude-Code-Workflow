/**
 * Guard test to prevent lowering the minimum Node version below what CCW relies on.
 *
 * Rationale:
 * - CCW tests run with `--experimental-strip-types`
 * - Some workflows (e.g. learn tool-verification) use Node's permission model (`--permission`)
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { getPackageRoot } from '../dist/utils/project-root.js';

describe('runtime: minimum Node engine', () => {
  it('package.json engines.node requires >=22', () => {
    const root = getPackageRoot();
    const pkg = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'));
    assert.ok(pkg.engines && typeof pkg.engines.node === 'string', 'package.json should declare engines.node');
    assert.ok(pkg.engines.node.includes('>=22'), 'engines.node should include \">=22\"');
  });
});

