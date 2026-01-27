/**
 * Minimal JSONL logger for the learn workflow.
 *
 * Intended for markdown-command runtimes where:
 * - `Read(path)` returns file content (string) or throws
 * - `Write(path, content)` overwrites file content or throws
 *
 * The logger writes per-session logs to:
 *   .workflow/learn/sessions/<sessionId>/execution.log
 *
 * Failures to write logs must never break the main workflow.
 */

export class Logger {
  /**
   * @param {string} sessionId
   * @param {{
   *   logFile?: string,
   *   readFn?: (path: string) => any,
   *   writeFn?: (path: string, content: string) => any,
   *   printFn?: (line: string) => void
   * }} [opts]
   */
  constructor(sessionId, opts = {}) {
    this.sessionId = String(sessionId);
    this.logFile = opts.logFile ?? `.workflow/learn/sessions/${this.sessionId}/execution.log`;
    this.readFn = opts.readFn ?? globalThis.Read;
    this.writeFn = opts.writeFn ?? globalThis.Write;
    this.printFn = opts.printFn ?? ((line) => console.log(line));
  }

  /**
   * @param {'info'|'warn'|'error'|'debug'} level
   * @param {string} message
   * @param {any} [data]
   */
  log(level, message, data = null) {
    const timestamp = new Date().toISOString();
    const entry = {
      timestamp,
      level,
      session_id: this.sessionId,
      message: String(message ?? ''),
      data: data ?? null
    };

    // Console output (best-effort; keep it lightweight).
    const prefix =
      {
        info: 'INFO',
        warn: 'WARN',
        error: 'ERROR',
        debug: 'DEBUG'
      }[level] ?? 'LOG';

    try {
      this.printFn(`[${prefix}] ${entry.message}`);
    } catch {
      // ignore
    }

    // File output (append via read+overwrite).
    try {
      if (typeof this.readFn !== 'function' || typeof this.writeFn !== 'function') return;
      const existing = String(this.readFn(this.logFile) ?? '');
      this.writeFn(this.logFile, `${existing}${JSON.stringify(entry)}\n`);
    } catch {
      // ignore
    }
  }

  info(message, data) {
    this.log('info', message, data);
  }

  warn(message, data) {
    this.log('warn', message, data);
  }

  error(message, data) {
    this.log('error', message, data);
  }

  debug(message, data) {
    this.log('debug', message, data);
  }
}

