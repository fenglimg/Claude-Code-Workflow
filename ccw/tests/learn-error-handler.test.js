import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';

import { safeExecJson, safeReadJson } from '../../.claude/commands/learn/_internal/error-handler.js';

describe('learn/_internal/error-handler', () => {
  it('safeReadJson reads and parses JSON via injected Read()', () => {
    const dir = mkdtempSync(path.join(tmpdir(), 'ccw-learn-err-'));
    try {
      const p = path.join(dir, 'a.json');
      writeFileSync(p, JSON.stringify({ a: 1 }), 'utf8');

      const v = safeReadJson(p, undefined, { readFn: (fp) => readFileSync(fp, 'utf8') });
      assert.deepEqual(v, { a: 1 });
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it('safeReadJson returns default value on read/parse failure', () => {
    const v = safeReadJson('missing.json', { ok: true }, { readFn: () => { throw new Error('ENOENT'); } });
    assert.deepEqual(v, { ok: true });
  });

  it('safeReadJson throws when no default is provided', () => {
    const prev = globalThis.Read;
    try {
      globalThis.Read = () => { throw new Error('ENOENT'); };
      assert.throws(() => safeReadJson('missing.json'), /Failed to read JSON/);
    } finally {
      globalThis.Read = prev;
    }
  });

  it('safeExecJson parses last JSON object from noisy output', () => {
    const out = safeExecJson('echo ok', 'test', {
      bashFn: () => ['warning', '{"ok":false}', '{"ok":true,"data":{"x":1}}'].join('\n')
    });
    assert.deepEqual(out, { ok: true, data: { x: 1 } });
  });

  it('safeExecJson throws with contextual message on failure', () => {
    assert.throws(
      () => safeExecJson('bad', 'my step', { bashFn: () => 'no json here' }),
      /Failed to execute my step/
    );
  });
});
