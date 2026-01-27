import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import { callAgentJson, callBashJsonWithRetry } from '../../.claude/commands/learn/_internal/agent-caller.js';

describe('learn/_internal/agent-caller', () => {
  it('prefers Task() when available and parses JSON output', async () => {
    let bashCalled = false;
    const taskFn = async () => ['noise', '{"ok":true,"data":{"x":1}}'].join('\n');
    const bashFn = () => {
      bashCalled = true;
      return '{"ok":false}';
    };

    const res = await callAgentJson(
      { subagent_type: 'learn-planning-agent', prompt: 'PROMPT', prefer_task: true },
      { taskFn, bashFn }
    );
    assert.equal(res.method, 'task');
    assert.equal(res.attempts_used, 1);
    assert.deepEqual(res.json, { ok: true, data: { x: 1 } });
    assert.equal(bashCalled, false);
  });

  it('falls back to Bash() and retries when Task() fails', async () => {
    const calls = [];
    const taskFn = async () => {
      throw new Error('Task unavailable');
    };

    function bashFn(command, opts) {
      calls.push({ command, opts });
      if (calls.length === 1) return 'not json';
      return '{"ok":true}';
    }

    const res = await callAgentJson(
      {
        subagent_type: 'learn-planning-agent',
        prompt: 'PROMPT',
        prefer_task: true,
        max_attempts: 3,
        timeout_ms: 12345
      },
      { taskFn, bashFn }
    );

    assert.equal(res.method, 'cli');
    assert.equal(res.attempts_used, 2);
    assert.deepEqual(res.json, { ok: true });
    assert.equal(calls.length, 2);
    assert.ok(String(calls[0].command).includes('ccw cli -p'));
    assert.equal(calls[0].opts.timeout, 12345);
  });

  it('supports Bash({command,...}) call style when Bash() accepts a single object arg', async () => {
    const calls = [];
    const bashFn = (input) => {
      calls.push(input);
      return { stdout: '{"ok":true}' };
    };

    const res = await callAgentJson(
      {
        subagent_type: 'learn-planning-agent',
        prompt: 'PROMPT',
        prefer_task: false,
        timeout_ms: 2000
      },
      { bashFn }
    );

    assert.equal(res.method, 'cli');
    assert.equal(res.attempts_used, 1);
    assert.deepEqual(res.json, { ok: true });
    assert.equal(calls.length, 1);
    assert.ok(typeof calls[0] === 'object' && typeof calls[0].command === 'string');
    assert.equal(calls[0].timeout, 2000);
  });

  it('callBashJsonWithRetry retries and returns parsed JSON', async () => {
    const calls = [];
    const bashFn = (input) => {
      calls.push(input);
      if (calls.length === 1) return 'no json';
      return { stdout: '{"ok":true}' };
    };

    const res = await callBashJsonWithRetry(
      { command: 'ccw cli -p \"X\" --tool gemini --mode write --cd .', max_attempts: 2, timeout_ms: 1000, backoff_ms: 0 },
      { bashFn }
    );

    assert.deepEqual(res.json, { ok: true });
    assert.equal(res.attempts_used, 2);
    assert.equal(calls.length, 2);
    assert.equal(calls[0].timeout, 1000);
  });
});
