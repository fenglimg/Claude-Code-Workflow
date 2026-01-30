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
import { existsSync, mkdirSync, readFileSync, writeFileSync, renameSync, copyFileSync, unlinkSync, openSync, closeSync, realpathSync, readdirSync } from 'fs';
import { dirname, join, resolve } from 'path';
import AjvModule from 'ajv';
import addFormatsModule from 'ajv-formats';
import type { ErrorObject } from 'ajv';
import { validatePath } from '../utils/path-validator.js';
import { getPackageRoot } from '../utils/project-root.js';

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

interface SetActiveProfileOptions extends BaseOptions {
  profileId?: string;
}

interface ReadSessionOptions extends BaseOptions {
  sessionId?: string;
}

interface UpdateProgressOptions extends BaseOptions {
  sessionId?: string;
  topicId?: string;
  status?: string;
  evidence?: string;
}

const PROJECT_ROOT = (() => {
  const raw = process.env.CCW_PROJECT_ROOT || getPackageRoot();
  const absolute = resolve(raw);
  // Normalize through realpath so validatePath doesn't reject /var -> /private/var (macOS).
  try {
    return realpathSync(absolute);
  } catch {
    return absolute;
  }
})();
const LEARN_ROOT = join(PROJECT_ROOT, '.workflow', 'learn');
const STATE_PATH = join(LEARN_ROOT, 'state.json');
const STATE_PATH_FALLBACK = join(LEARN_ROOT, 'state.v2.json');
const PROFILES_DIR = join(LEARN_ROOT, 'profiles');
const SESSIONS_DIR = join(LEARN_ROOT, 'sessions');
const LOCK_PATH = join(LEARN_ROOT, '.lock');
const SCHEMA_DIR = join(PROJECT_ROOT, '.claude', 'workflows', 'cli-templates', 'schemas');

const PROFILE_ID_RE = /^[a-zA-Z0-9_-]+$/;
const SESSION_ID_RE = /^LS-\d{8}-\d{3}$/;
const TOPIC_ID_RE = /^KP-\d+$/;

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
  await validatePath(LEARN_ROOT, { allowedDirectories: [PROJECT_ROOT] });
}

function loadJsonFile(filePath: string): any {
  return JSON.parse(readFileSync(filePath, 'utf8'));
}

function isAccessDenied(err: any): boolean {
  return err?.code === 'EPERM' || err?.code === 'EACCES';
}

function resolveStatePathForRead(): string {
  // Some environments may deny access to state.json due to external locks/ACLs.
  // Prefer state.json, but fall back to state.v2.json when access is denied.
  if (existsSync(STATE_PATH)) {
    try {
      readFileSync(STATE_PATH, 'utf8');
      return STATE_PATH;
    } catch (err: any) {
      if (isAccessDenied(err)) return STATE_PATH_FALLBACK;
      throw err;
    }
  }
  return STATE_PATH;
}

function resolveStatePathForWrite(primaryPath: string, err: any): string | null {
  // If we failed to write state.json due to access restrictions, retry with the fallback path.
  if (primaryPath === STATE_PATH && isAccessDenied(err)) return STATE_PATH_FALLBACK;
  return null;
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
let validatePlan: ((data: any) => boolean) | null = null;

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

function getPlanValidator(): (data: any) => boolean {
  if (validatePlan) return validatePlan;
  const schemaPath = join(SCHEMA_DIR, 'learn-plan.schema.json');
  const schema = loadJsonFile(schemaPath);
  validatePlan = ajv.compile(schema);
  return validatePlan!;
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

function safeSessionIdOrThrow(sessionId: string): string {
  // Strict session id format keeps session path traversal-proof.
  if (!SESSION_ID_RE.test(sessionId) || sessionId.includes('/') || sessionId.includes('\\') || sessionId.includes('..')) {
    throw Object.assign(new Error('Invalid session id'), { code: 'INVALID_ARGS', details: { session_id: sessionId } });
  }
  return sessionId;
}

function safeTopicIdOrThrow(topicId: string): string {
  if (!TOPIC_ID_RE.test(topicId) || topicId.includes('/') || topicId.includes('\\') || topicId.includes('..')) {
    throw Object.assign(new Error('Invalid topic id'), { code: 'INVALID_ARGS', details: { topic_id: topicId } });
  }
  return topicId;
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

  const sleepSync = (ms: number) => {
    // Best-effort sync sleep for short Windows retry windows (Atomics.wait is available in Node).
    try {
      Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);
    } catch {
      // ignore
    }
  };

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
    // Windows can fail to replace an existing file due to transient locks (EPERM/EBUSY) OR restrictive ACLs
    // that allow in-place writes but deny rename/unlink. Retry briefly, then fall back to in-place write.
    for (let attempt = 0; ; attempt += 1) {
      try {
        renameSync(tmpPath, targetPath);
        break;
      } catch (err: any) {
        const code = err?.code;
        const isWin = process.platform === 'win32';
        const isWinRetryable = isWin && (code === 'EPERM' || code === 'EBUSY' || code === 'EEXIST');
        if (!isWinRetryable) throw err;

        if (attempt >= 10) {
          // Last resort: write content directly to targetPath (non-atomic) for environments where rename is denied.
          writeFileSync(targetPath, readFileSync(tmpPath, 'utf8'), 'utf8');
          break;
        }

        // Try to remove the destination if it exists (some environments block replace-existing).
        if (existsSync(targetPath)) {
          try {
            unlinkSync(targetPath);
          } catch {
            // ignore (file may be transiently locked / ACL denies delete)
          }
        }
        sleepSync(25);
      }
    }
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
      const statePath = resolveStatePathForRead();
      if (!existsSync(statePath)) {
        const st = defaultState();
        try {
          atomicWriteJson(statePath, st, getStateValidator());
        } catch (err: any) {
          const fallback = resolveStatePathForWrite(statePath, err);
          if (fallback) atomicWriteJson(fallback, st, getStateValidator());
          else throw err;
        }
        return st;
      }

      const st = loadJsonFile(statePath);
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

export async function learnReadSessionCommand(options: ReadSessionOptions): Promise<void> {
  const sessionId = options.sessionId;
  if (!sessionId) fail(options, { code: 'INVALID_ARGS', message: 'Missing --session-id' });

  try {
    const id = safeSessionIdOrThrow(sessionId);

    const session = await withLearnLock(async () => {
      const sessionDir = join(SESSIONS_DIR, id);
      const planPath = join(sessionDir, 'plan.json');
      const progressPath = join(sessionDir, 'progress.json');

      if (!existsSync(planPath)) {
        throw Object.assign(new Error(`Session not found: ${id}`), { code: 'NOT_FOUND' });
      }

      const plan = loadJsonFile(planPath);
      const ok = getPlanValidator()(plan);
      if (!ok) {
        throw Object.assign(new Error('Plan schema validation failed'), {
          code: 'SCHEMA_INVALID',
          details: formatAjvErrors((getPlanValidator() as any).errors)
        });
      }
      const progress = existsSync(progressPath) ? loadJsonFile(progressPath) : {};

      return { session_id: id, plan, progress };
    });

    print(options, { ok: true, data: session });
  } catch (err: any) {
    if (err?._exitCode === 2) {
      fail(options, { code: err.code ?? 'LOCKED', message: err.message ?? 'Locked', details: err.details }, 2);
    }
    fail(options, { code: err.code ?? 'IO_ERROR', message: err.message ?? String(err), details: err.details });
  }
}

export async function learnUpdateProgressCommand(options: UpdateProgressOptions): Promise<void> {
  const sessionId = options.sessionId;
  const topicId = options.topicId;
  const status = options.status;
  const evidenceStr = options.evidence;

  if (!sessionId) fail(options, { code: 'INVALID_ARGS', message: 'Missing --session-id' });
  if (!topicId) fail(options, { code: 'INVALID_ARGS', message: 'Missing --topic-id' });
  if (!status) fail(options, { code: 'INVALID_ARGS', message: 'Missing --status' });

  let evidence: any = null;
  if (evidenceStr !== undefined) {
    try {
      evidence = JSON.parse(evidenceStr);
    } catch (err: any) {
      fail(options, { code: 'INVALID_ARGS', message: 'Invalid JSON for --evidence', details: err.message ?? String(err) });
    }
  }

  try {
    const id = safeSessionIdOrThrow(sessionId);
    const kpId = safeTopicIdOrThrow(topicId);

    const updated = await withLearnLock(async () => {
      const sessionDir = join(SESSIONS_DIR, id);
      const planPath = join(sessionDir, 'plan.json');
      const progressPath = join(sessionDir, 'progress.json');

      if (!existsSync(planPath)) {
        throw Object.assign(new Error(`Session not found: ${id}`), { code: 'NOT_FOUND' });
      }

      const plan = loadJsonFile(planPath);
      const planOk = getPlanValidator()(plan);
      if (!planOk) {
        throw Object.assign(new Error('Plan schema validation failed'), {
          code: 'SCHEMA_INVALID',
          details: formatAjvErrors((getPlanValidator() as any).errors)
        });
      }

      const kps = Array.isArray(plan?.knowledge_points) ? plan.knowledge_points : [];
      const kp = kps.find((p: any) => p?.id === kpId);
      if (!kp) {
        throw Object.assign(new Error(`Unknown knowledge point: ${kpId}`), { code: 'NOT_FOUND' });
      }

      const now = nowIso();
      const progress: any = existsSync(progressPath) ? loadJsonFile(progressPath) : { session_id: id };

      // Ensure expected containers exist.
      if (!progress.session_id) progress.session_id = id;
      if (!progress.knowledge_point_progress || typeof progress.knowledge_point_progress !== 'object') {
        progress.knowledge_point_progress = {};
      }
      if (!Array.isArray(progress.completed_knowledge_points)) progress.completed_knowledge_points = [];
      if (!Array.isArray(progress.in_progress_knowledge_points)) progress.in_progress_knowledge_points = [];

      progress.knowledge_point_progress[kpId] = { status, evidence, updated_at: now };

      // Keep convenience arrays in sync when present.
      const remove = (arr: any[], value: string) => arr.filter((v) => v !== value);
      const addUnique = (arr: any[], value: string) => (arr.includes(value) ? arr : [...arr, value]);

      if (status === 'completed') {
        progress.completed_knowledge_points = addUnique(remove(progress.completed_knowledge_points, kpId), kpId);
        progress.in_progress_knowledge_points = remove(progress.in_progress_knowledge_points, kpId);
      } else if (status === 'in_progress') {
        progress.in_progress_knowledge_points = addUnique(remove(progress.in_progress_knowledge_points, kpId), kpId);
        progress.completed_knowledge_points = remove(progress.completed_knowledge_points, kpId);
      }

      progress._metadata = progress._metadata || {};
      progress._metadata.last_updated = now;

      // Keep plan KP status in sync with progress updates (atomic + validated).
      kp.status = status;
      plan._metadata = plan._metadata || {};
      plan._metadata.updated_at = now;
      atomicWriteJson(planPath, plan, getPlanValidator());

      // We don't have a dedicated progress schema yet, but we still want atomic writes + backup.
      atomicWriteJson(progressPath, progress, () => true);
      return progress;
    });

    print(options, { ok: true, data: updated });
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

  if (!['active_profile_id', 'active_session_id', 'current_phase'].includes(field)) {
    fail(options, { code: 'INVALID_ARGS', message: `Unsupported state field: ${field}` });
  }

  let value: any;
  if (rawValue === 'null') {
    value = null;
  } else if (field === 'current_phase') {
    const n = Number(rawValue);
    if (!Number.isInteger(n) || n < 1) {
      fail(options, { code: 'INVALID_ARGS', message: 'Invalid current_phase (must be integer >= 1 or null)' });
    }
    value = n;
  } else {
    value = rawValue;
  }

  try {
    const updated = await withLearnLock(async () => {
      const statePath = resolveStatePathForRead();
      const current = existsSync(statePath) ? loadJsonFile(statePath) : defaultState();
      current[field] = value;
      current._metadata = current._metadata || {};
      current._metadata.last_updated = nowIso();

      try {
        atomicWriteJson(statePath, current, getStateValidator());
      } catch (err: any) {
        const fallback = resolveStatePathForWrite(statePath, err);
        if (fallback) atomicWriteJson(fallback, current, getStateValidator());
        else throw err;
      }
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
      // experience_level is optional (may be omitted/null) to avoid forcing a self-rating during init.

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

export async function learnListProfilesCommand(options: BaseOptions): Promise<void> {
  try {
    await ensureLearnDirs();

    const entries = readdirSync(PROFILES_DIR, { withFileTypes: true });
    const files = entries
      .filter((e) => e.isFile() && e.name.endsWith('.json'))
      .map((e) => e.name)
      .sort((a, b) => a.localeCompare(b));

    const summaries = files.map((fileName) => {
      const profileId = fileName.replace(/\.json$/, '');
      safeProfileIdOrThrow(profileId);
      const profilePath = join(PROFILES_DIR, fileName);

      const profile = loadJsonFile(profilePath);
      const ok = getProfileValidator()(profile);
      if (!ok) {
        throw Object.assign(new Error('Profile schema validation failed'), {
          code: 'SCHEMA_INVALID',
          details: formatAjvErrors((getProfileValidator() as any).errors)
        });
      }

      const knownTopicsCount = Array.isArray(profile?.known_topics) ? profile.known_topics.length : 0;

      return {
        profile_id: profile.profile_id ?? profileId,
        experience_level: profile?.experience_level ?? null,
        known_topics_count: knownTopicsCount,
        updated_at: profile?._metadata?.updated_at ?? null
      };
    });

    print(options, { ok: true, data: summaries });
  } catch (err: any) {
    fail(options, { code: err.code ?? 'IO_ERROR', message: err.message ?? String(err), details: err.details });
  }
}

export async function learnSetActiveProfileCommand(options: SetActiveProfileOptions): Promise<void> {
  const profileId = options.profileId;
  if (!profileId) fail(options, { code: 'INVALID_ARGS', message: 'Missing --profile-id' });

  try {
    const updated = await withLearnLock(async () => {
      const id = safeProfileIdOrThrow(profileId);
      const profilePath = join(PROFILES_DIR, `${id}.json`);

      if (!existsSync(profilePath)) {
        throw Object.assign(new Error(`Profile not found: ${id}`), { code: 'NOT_FOUND' });
      }

      const profile = loadJsonFile(profilePath);
      const ok = getProfileValidator()(profile);
      if (!ok) {
        throw Object.assign(new Error('Profile schema validation failed'), {
          code: 'SCHEMA_INVALID',
          details: formatAjvErrors((getProfileValidator() as any).errors)
        });
      }

      const statePath = resolveStatePathForRead();
      const current = existsSync(statePath) ? loadJsonFile(statePath) : defaultState();
      current.active_profile_id = id;
      current._metadata = current._metadata || {};
      current._metadata.last_updated = nowIso();

      try {
        atomicWriteJson(statePath, current, getStateValidator());
      } catch (err: any) {
        const fallback = resolveStatePathForWrite(statePath, err);
        if (fallback) atomicWriteJson(fallback, current, getStateValidator());
        else throw err;
      }
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
