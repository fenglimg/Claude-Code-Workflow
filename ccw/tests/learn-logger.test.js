import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import { Logger } from '../../.claude/commands/learn/_internal/logger.js';

describe('learn/_internal/logger', () => {
  it('appends JSONL entries via injected Read/Write', () => {
    let writtenPath = null;
    let writtenContent = null;

    const logger = new Logger('LS-TEST-001', {
      readFn: () => '',
      writeFn: (p, c) => {
        writtenPath = p;
        writtenContent = c;
      },
      printFn: () => {}
    });

    logger.info('Profile loaded', { profile_id: 'p1' });

    assert.equal(writtenPath, '.workflow/learn/sessions/LS-TEST-001/execution.log');
    assert.equal(typeof writtenContent, 'string');
    const lines = writtenContent.trim().split('\n');
    assert.equal(lines.length, 1);
    const parsed = JSON.parse(lines[0]);
    assert.equal(parsed.session_id, 'LS-TEST-001');
    assert.equal(parsed.level, 'info');
    assert.equal(parsed.message, 'Profile loaded');
    assert.deepEqual(parsed.data, { profile_id: 'p1' });
  });

  it('never throws when file IO hooks are missing', () => {
    const logger = new Logger('LS-TEST-002', { printFn: () => {} });
    logger.warn('hello');
  });
});

