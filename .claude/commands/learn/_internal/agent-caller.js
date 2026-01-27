import { lastJsonObjectFromText } from './json-parser.js';

function extractStdout(raw) {
  if (raw == null) return '';
  if (typeof raw === 'string') return raw;
  if (typeof raw === 'object') {
    if (typeof raw.stdout === 'string') return raw.stdout;
    if (typeof raw.output === 'string') return raw.output;
    if (typeof raw.result === 'string') return raw.result;
  }
  return String(raw);
}

function escapeForSingleQuotes(text) {
  // Safe for: ccw cli -p '<...>'
  return String(text ?? '').replace(/'/g, "'\\''");
}

async function sleep(ms) {
  if (!Number.isFinite(ms) || ms <= 0) return;
  await new Promise((r) => setTimeout(r, ms));
}

function callBash(bashFn, command, timeoutMs) {
  const timeout = Number(timeoutMs);
  if (!Number.isFinite(timeout) || timeout <= 0) return bashFn(String(command));

  const opts = { timeout, run_in_background: false };
  // Support both Bash(cmd, opts) and Bash({ command, ...opts }) styles.
  if (bashFn.length >= 2) return bashFn(String(command), opts);
  return bashFn({ command: String(command), ...opts });
}

/**
 * Call an agent and parse its output as JSON.
 *
 * Strategy:
 * 1) Prefer Task() if available (native agent execution)
 * 2) Fallback to `ccw cli` via Bash() with retries + timeout
 *
 * @param {{
 *   subagent_type: string,
 *   prompt: string,
 *   description?: string,
 *   prefer_task?: boolean,
 *   cli_tool?: string,
 *   cli_mode?: string,
 *   cli_cd?: string,
 *   max_attempts?: number,
 *   timeout_ms?: number,
 *   backoff_ms?: number
 * }} args
 * @param {{
 *   taskFn?: (input: any) => any,
 *   bashFn?: (...args: any[]) => any
 * }} [opts]
 * @returns {Promise<{ json: any, method: 'task'|'cli', attempts_used: number }>}
 */
export async function callAgentJson(args, opts = {}) {
  const taskFn = opts.taskFn ?? globalThis.Task;
  const bashFn = opts.bashFn ?? globalThis.Bash;

  const subagent_type = String(args?.subagent_type ?? '');
  if (!subagent_type) throw new Error('callAgentJson: missing subagent_type');

  const prompt = String(args?.prompt ?? '');
  if (!prompt) throw new Error('callAgentJson: missing prompt');

  const maxAttempts = Number.isFinite(Number(args?.max_attempts)) ? Math.max(1, Math.floor(Number(args.max_attempts))) : 3;
  const timeoutMs = Number.isFinite(Number(args?.timeout_ms)) ? Math.max(1000, Math.floor(Number(args.timeout_ms))) : 300000;
  const backoffMs = Number.isFinite(Number(args?.backoff_ms)) ? Math.max(0, Math.floor(Number(args.backoff_ms))) : 2000;

  const preferTask = args?.prefer_task !== false;
  if (preferTask && typeof taskFn === 'function') {
    try {
      const raw = await Promise.resolve(
        taskFn({
          subagent_type,
          run_in_background: false,
          description: args?.description ?? `Call agent: ${subagent_type}`,
          prompt
        })
      );
      const json = lastJsonObjectFromText(extractStdout(raw));
      return { json, method: 'task', attempts_used: 1 };
    } catch {
      // best-effort fallback to CLI
    }
  }

  if (typeof bashFn !== 'function') {
    throw new Error('callAgentJson: missing Bash() implementation for CLI fallback');
  }

  const cliTool = String(args?.cli_tool ?? 'gemini');
  const cliMode = String(args?.cli_mode ?? 'write');
  const cliCd = String(args?.cli_cd ?? '.');
  const escapedPrompt = escapeForSingleQuotes(prompt);
  const cmd = `ccw cli -p '${escapedPrompt}' --tool ${cliTool} --mode ${cliMode} --cd ${cliCd}`;

  let lastErr = null;
  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      const raw = await Promise.resolve(callBash(bashFn, cmd, timeoutMs));
      const json = lastJsonObjectFromText(extractStdout(raw));
      return { json, method: 'cli', attempts_used: attempt };
    } catch (err) {
      lastErr = err;
      if (attempt < maxAttempts) {
        // Exponential backoff.
        await sleep(backoffMs * Math.pow(2, attempt - 1));
      }
    }
  }

  const msg = lastErr?.message ?? String(lastErr);
  throw new Error(`callAgentJson: failed after ${maxAttempts} attempts (${msg})`);
}

/**
 * Execute a Bash command that prints JSON and return the parsed payload.
 *
 * Intended for markdown command docs that want to:
 * - keep an explicit `ccw cli -p '...'` command in the doc (auditability)
 * - centralize retries, timeouts, and robust JSON parsing
 *
 * @param {{
 *   command: string,
 *   description?: string,
 *   max_attempts?: number,
 *   timeout_ms?: number,
 *   backoff_ms?: number
 * }} args
 * @param {{ bashFn?: (...args: any[]) => any }} [opts]
 * @returns {Promise<{ json: any, attempts_used: number }>}
 */
export async function callBashJsonWithRetry(args, opts = {}) {
  const bashFn = opts.bashFn ?? globalThis.Bash;
  if (typeof bashFn !== 'function') throw new Error('callBashJsonWithRetry: missing Bash() implementation');

  const command = String(args?.command ?? '');
  if (!command) throw new Error('callBashJsonWithRetry: missing command');

  const maxAttempts = Number.isFinite(Number(args?.max_attempts)) ? Math.max(1, Math.floor(Number(args.max_attempts))) : 3;
  const timeoutMs = Number.isFinite(Number(args?.timeout_ms)) ? Math.max(1000, Math.floor(Number(args.timeout_ms))) : 300000;
  const backoffMs = Number.isFinite(Number(args?.backoff_ms)) ? Math.max(0, Math.floor(Number(args.backoff_ms))) : 2000;

  let lastErr = null;
  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      const raw = await Promise.resolve(callBash(bashFn, command, timeoutMs));
      const json = lastJsonObjectFromText(extractStdout(raw));
      return { json, attempts_used: attempt };
    } catch (err) {
      lastErr = err;
      if (attempt < maxAttempts) {
        await sleep(backoffMs * Math.pow(2, attempt - 1));
      }
    }
  }

  const msg = lastErr?.message ?? String(lastErr);
  const label = args?.description ? ` (${args.description})` : '';
  throw new Error(`callBashJsonWithRetry: failed after ${maxAttempts} attempts${label}: ${msg}`);
}
