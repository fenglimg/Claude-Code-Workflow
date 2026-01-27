/**
 * Learn State Commands - Internal validated state API for learn workflow.
 *
 * Implements:
 * - ccw learn:read-state
 * - ccw learn:update-state
 * - ccw learn:read-profile
 * - ccw learn:write-profile
 *
 * Design goals:
 * - No direct agent file edits: provide a stable CLI API with schema validation
 * - Atomic writes + backup/recovery
 * - Coarse-grained lock for concurrent access protection
 */

import chalk from 'chalk';
import { existsSync, mkdirSync, readFileSync, writeFileSync, renameSync, copyFileSync, unlinkSync, openSync, closeSync } from 'fs';
import { dirname, join, resolve } from 'path';
import AjvModule from 'ajv';
import addFormatsModule from 'ajv-formats';
import type { ErrorObject } from 'ajv';
import { validatePath } from '../utils/path-validator.js';

// Handle EPIPE errors gracefully (occurs when piping to head/jq that closes early)
process.stdout.on('error', (err: NodeJS.ErrnoException) => {
  if (err.code === 'EPIPE') process.exit(0);
  throw err;
});

type ResultOk<T> = { ok: true; data: T };
type ResultErr = { ok: false; error: { code: string; message: string; details?: any } };
type Result<T> = ResultOk<T> | ResultErr;

interface BaseOptions {
  json?: boolean;
}

interface UpdateStateOptions extends BaseOptions {
  field?: string;
  value?: string;
}

interface ReadProfileOptions extends BaseOptions {
  profileId?: string;
}

interface WriteProfileOptions extends BaseOptions {
  profileId?: string;
  data?: string;
}

const LEARN_ROOT = '.workflow/learn';
const STATE_PATH = join(LEARN_ROOT, 'state.json');
const PROFILES_DIR = join(LEARN_ROOT, 'profiles');
const LOCK_PATH = join(LEARN_ROOT, '.lock');
const SCHEMA_DIR = '.claude/workflows/cli-templates/schemas';

const PROFILE_ID_RE = /^[a-zA-Z0-9_-]+$/;

function nowIso(): string {
  return new Date().toISOString();
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

function print<T>(options: BaseOptions, payload: Result<T>): void {
  if (options.json) {
    // Compact JSON for machine consumption.
    // eslint-disable-next-line no-console
    console.log(JSON.stringify(payload));
    return;
  }

  if (payload.ok) {
    // eslint-disable-next-line no-console
    console.log(chalk.green('✓ OK'));
    // eslint-disable-next-line no-console
    console.log(chalk.gray(JSON.stringify(payload.data, null, 2)));
  } else {
    // eslint-disable-next-line no-console
    console.error(chalk.red(`✗ ${payload.error.code}: ${payload.error.message}`));
    if (payload.error.details) {
      // eslint-disable-next-line no-console
      console.error(chalk.gray(JSON.stringify(payload.error.details, null, 2)));
    }
  }
}

function fail<T>(options: BaseOptions, error: ResultErr['error'], exitCode: 1 | 2 = 1): never {
  print(options, { ok: false, error } as Result<T>);
  process.exit(exitCode);
}

async function ensureLearnDirs(): Promise<void> {
  mkdirSync(PROFILES_DIR, { recursive: true });
  // Validate that resolved paths stay under project root.
  await validatePath(LEARN_ROOT, { allowedDirectories: [resolve(process.cwd())] });
}

function loadJsonFile(filePath: string): any {
  return JSON.parse(readFileSync(filePath, 'utf8'));
}

function formatAjvErrors(errors: ErrorObject[] | null | undefined): any[] {
  if (!errors) return [];
  return errors.map((e) => ({
    instancePath: e.instancePath,
    schemaPath: e.schemaPath,
    keyword: e.keyword,
    message: e.message,
    params: e.params
  }));
}

const Ajv = (AjvModule as any).default ?? (AjvModule as any);
const addFormats = (addFormatsModule as any).default ?? (addFormatsModule as any);

const ajv = (() => {
  const a = new Ajv({ allErrors: true, strict: false });
  addFormats(a);
  return a;
})();

let validateState: ((data: any) => boolean) | null = null;
let validateProfile: ((data: any) => boolean) | null = null;

function getStateValidator(): (data: any) => boolean {
  if (validateState) return validateState;
  const schemaPath = join(SCHEMA_DIR, 'learn-state.schema.json');
  const schema = loadJsonFile(schemaPath);
  validateState = ajv.compile(schema);
  return validateState!;
}

function getProfileValidator(): (data: any) => boolean {
  if (validateProfile) return validateProfile;
  const schemaPath = join(SCHEMA_DIR, 'learn-profile.schema.json');
  const schema = loadJsonFile(schemaPath);
  validateProfile = ajv.compile(schema);
  return validateProfile!;
}

async function withLearnLock<T>(fn: () => Promise<T>): Promise<T> {
  await ensureLearnDirs();

  const lockHoldMs = Number(process.env.CCW_LEARN_LOCK_HOLD_MS ?? '0');
  const timeoutMs = 2000;
  const start = Date.now();

  // Acquire lock using an exclusive lock file.
  // This is coarse-grained but sufficient for preventing concurrent corruption.
  while (true) {
    try {
      const fd = openSync(LOCK_PATH, 'wx');
      try {
        writeFileSync(fd, JSON.stringify({ pid: process.pid, created_at: nowIso() }), 'utf8');
      } catch {
        // ignore
      }

      try {
        if (Number.isFinite(lockHoldMs) && lockHoldMs > 0) {
          await sleep(lockHoldMs);
        }
        return await fn();
      } finally {
        try {
          closeSync(fd);
        } catch {
          // ignore
        }
        try {
          unlinkSync(LOCK_PATH);
        } catch {
          // ignore
        }
      }
    } catch (err: any) {
      if (err?.code !== 'EEXIST') throw err;
      if (Date.now() - start > timeoutMs) {
        const lockInfo = (() => {
          try {
            return loadJsonFile(LOCK_PATH);
          } catch {
            return null;
          }
        })();
        const lockError: any = { code: 'LOCKED', message: 'Learn state is locked by another process', details: lockInfo };
        (lockError as any)._exitCode = 2;
        throw lockError;
      }
      await sleep(50);
    }
  }
}

function safeProfileIdOrThrow(profileId: string): string {
  if (!PROFILE_ID_RE.test(profileId) || profileId.includes('/') || profileId.includes('..')) {
    throw Object.assign(new Error('Invalid profile id'), { code: 'INVALID_ARGS', details: { profile_id: profileId } });
  }
  return profileId;
}

function defaultState(): any {
  return {
    active_profile_id: null,
    active_session_id: null,
    version: '1.0.0',
    _metadata: { last_updated: nowIso() }
  };
}

function atomicWriteJson(targetPath: string, data: any, validate: (d: any) => boolean): { backupPath: string | null } {
  const dir = dirname(targetPath);
  mkdirSync(dir, { recursive: true });

  const tmpPath = `${targetPath}.${process.pid}.${Date.now()}.tmp`;
  const ts = new Date().toISOString().replace(/[:.]/g, '-');
  const fileName = targetPath.split(/[/\\\\]/).pop();
  const backupPath = existsSync(targetPath) ? join(dir, `.${fileName}.${ts}.bak`) : null;

  if (backupPath) {
    copyFileSync(targetPath, backupPath);
  }

  try {
    // Validate *before* writing the final file.
    const ok = validate(data);
    if (!ok) {
      const errors = formatAjvErrors((validate as any).errors);
      throw Object.assign(new Error('Schema validation failed'), { code: 'SCHEMA_INVALID', details: errors });
    }

    writeFileSync(tmpPath, JSON.stringify(data, null, 2), 'utf8');
    // Basic verification: tmp parses as JSON.
    JSON.parse(readFileSync(tmpPath, 'utf8'));
    renameSync(tmpPath, targetPath);
    return { backupPath };
  } catch (err) {
    // Best-effort recovery.
    try {
      if (backupPath && existsSync(backupPath)) copyFileSync(backupPath, targetPath);
    } catch {
      // ignore
    }
    throw err;
  } finally {
    try {
      if (existsSync(tmpPath)) unlinkSync(tmpPath);
    } catch {
      // ignore
    }
  }
}

export async function learnReadStateCommand(options: BaseOptions): Promise<void> {
  try {
    const state = await withLearnLock(async () => {
      if (!existsSync(STATE_PATH)) {
        const st = defaultState();
        atomicWriteJson(STATE_PATH, st, getStateValidator());
        return st;
      }

      const st = loadJsonFile(STATE_PATH);
      const ok = getStateValidator()(st);
      if (!ok) {
        throw Object.assign(new Error('State schema validation failed'), {
          code: 'SCHEMA_INVALID',
          details: formatAjvErrors((getStateValidator() as any).errors)
        });
      }
      return st;
    });

    print(options, { ok: true, data: state });
  } catch (err: any) {
    if (err?._exitCode === 2) {
      fail(options, { code: err.code ?? 'LOCKED', message: err.message ?? 'Locked', details: err.details }, 2);
    }
    fail(options, { code: err.code ?? 'IO_ERROR', message: err.message ?? String(err), details: err.details });
  }
}

export async function learnUpdateStateCommand(options: UpdateStateOptions): Promise<void> {
  const field = options.field;
  const rawValue = options.value;
  if (!field) fail(options, { code: 'INVALID_ARGS', message: 'Missing --field' });
  if (rawValue === undefined) fail(options, { code: 'INVALID_ARGS', message: 'Missing --value' });

  if (!['active_profile_id', 'active_session_id'].includes(field)) {
    fail(options, { code: 'INVALID_ARGS', message: `Unsupported state field: ${field}` });
  }

  const value = rawValue === 'null' ? null : rawValue;

  try {
    const updated = await withLearnLock(async () => {
      const current = existsSync(STATE_PATH) ? loadJsonFile(STATE_PATH) : defaultState();
      current[field] = value;
      current._metadata = current._metadata || {};
      current._metadata.last_updated = nowIso();

      atomicWriteJson(STATE_PATH, current, getStateValidator());
      return current;
    });

    print(options, { ok: true, data: updated });
  } catch (err: any) {
    if (err?._exitCode === 2) {
      fail(options, { code: err.code ?? 'LOCKED', message: err.message ?? 'Locked', details: err.details }, 2);
    }
    fail(options, { code: err.code ?? 'IO_ERROR', message: err.message ?? String(err), details: err.details });
  }
}

export async function learnReadProfileCommand(options: ReadProfileOptions): Promise<void> {
  const profileId = options.profileId;
  if (!profileId) fail(options, { code: 'INVALID_ARGS', message: 'Missing --profile-id' });

  try {
    const id = safeProfileIdOrThrow(profileId);
    await ensureLearnDirs();

    const profilePath = join(PROFILES_DIR, `${id}.json`);
    if (!existsSync(profilePath)) {
      fail(options, { code: 'NOT_FOUND', message: `Profile not found: ${id}` });
    }

    const profile = loadJsonFile(profilePath);
    const ok = getProfileValidator()(profile);
    if (!ok) {
      fail(options, {
        code: 'SCHEMA_INVALID',
        message: 'Profile schema validation failed',
        details: formatAjvErrors((getProfileValidator() as any).errors)
      });
    }

    print(options, { ok: true, data: profile });
  } catch (err: any) {
    fail(options, { code: err.code ?? 'IO_ERROR', message: err.message ?? String(err), details: err.details });
  }
}

export async function learnWriteProfileCommand(options: WriteProfileOptions): Promise<void> {
  const profileId = options.profileId;
  const dataStr = options.data;
  if (!profileId) fail(options, { code: 'INVALID_ARGS', message: 'Missing --profile-id' });
  if (!dataStr) fail(options, { code: 'INVALID_ARGS', message: 'Missing --data (JSON string)' });

  let data: any;
  try {
    data = JSON.parse(dataStr);
  } catch (err: any) {
    fail(options, { code: 'INVALID_ARGS', message: 'Invalid JSON for --data', details: err.message });
  }

  try {
    const id = safeProfileIdOrThrow(profileId);

    const written = await withLearnLock(async () => {
      const profilePath = join(PROFILES_DIR, `${id}.json`);
      // Ensure profile_id is stable and matches the file name.
      if (data.profile_id && data.profile_id !== id) {
        throw Object.assign(new Error('profile_id mismatch'), {
          code: 'INVALID_ARGS',
          details: { expected: id, got: data.profile_id }
        });
      }
      data.profile_id = id;

      // Ensure required fields exist for a minimally valid profile.
      if (!Array.isArray(data.known_topics)) data.known_topics = [];
      if (!data.experience_level) {
        throw Object.assign(new Error('Missing required field: experience_level'), { code: 'INVALID_ARGS' });
      }

      atomicWriteJson(profilePath, data, getProfileValidator());
      return data;
    });

    print(options, { ok: true, data: written });
  } catch (err: any) {
    if (err?._exitCode === 2) {
      fail(options, { code: err.code ?? 'LOCKED', message: err.message ?? 'Locked', details: err.details }, 2);
    }
    fail(options, { code: err.code ?? 'IO_ERROR', message: err.message ?? String(err), details: err.details });
  }
}
