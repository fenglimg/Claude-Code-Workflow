import { lastJsonObjectFromText } from './json-parser.js';

/**
 * Read a JSON file via an injected Read() implementation with graceful fallback.
 *
 * This utility is intended for markdown command runtimes where Read() may throw
 * or return empty output. It provides consistent error messages and optional
 * defaulting behavior.
 *
 * @param {string} filePath
 * @param {any} defaultValue
 * @param {{ readFn?: (path: string) => any }} [opts]
 * @returns {any}
 */
export function safeReadJson(filePath, defaultValue, opts = {}) {
  const readFn = opts.readFn ?? globalThis.Read;
  if (typeof readFn !== 'function') {
    throw new Error('safeReadJson: missing Read() implementation (pass opts.readFn)');
  }

  try {
    const raw = readFn(String(filePath));
    const text = String(raw ?? '').trim();
    if (!text) {
      if (arguments.length >= 2) return defaultValue;
      throw new Error(`Empty read for: ${filePath}`);
    }

    try {
      return JSON.parse(text);
    } catch {
      // Fallback: tolerate noisy reads (rare) or fenced JSON blocks.
      return lastJsonObjectFromText(text);
    }
  } catch (err) {
    if (arguments.length >= 2) return defaultValue;
    const msg = err?.message ?? String(err);
    throw new Error(`Failed to read JSON (${filePath}): ${msg}`);
  }
}

/**
 * Execute a command via an injected Bash() implementation and parse the last JSON object.
 *
 * @param {string} command
 * @param {string} description - Human-readable context for error messages.
 * @param {{ bashFn?: (cmd: string) => any }} [opts]
 * @returns {any}
 */
export function safeExecJson(command, description, opts = {}) {
  const bashFn = opts.bashFn ?? globalThis.Bash;
  if (typeof bashFn !== 'function') {
    throw new Error('safeExecJson: missing Bash() implementation (pass opts.bashFn)');
  }

  const extractStdout = (raw) => {
    if (raw == null) return '';
    if (typeof raw === 'string') return raw;
    if (typeof raw === 'object') {
      if (typeof raw.stdout === 'string') return raw.stdout;
      if (typeof raw.output === 'string') return raw.output;
    }
    return String(raw);
  };

  const execBash = (cmd) => {
    const timeout = Number(opts.timeoutMs ?? opts.timeout_ms ?? opts.timeout);
    if (!Number.isFinite(timeout) || timeout <= 0) return bashFn(String(cmd));

    const runOpts = { timeout, run_in_background: false };
    // Support both Bash(cmd, opts) and Bash({ command, ...opts }) call styles.
    if (bashFn.length >= 2) return bashFn(String(cmd), runOpts);
    return bashFn({ command: String(cmd), ...runOpts });
  };

  try {
    const raw = execBash(command);
    return lastJsonObjectFromText(extractStdout(raw));
  } catch (err) {
    const msg = err?.message ?? String(err);
    throw new Error(`Failed to execute ${description}: ${msg}`);
  }
}
