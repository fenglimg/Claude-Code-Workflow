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
import { randomBytes } from 'crypto';
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

interface AppendProfileEventOptions extends BaseOptions {
  profileId?: string;
  type?: string;
  actor?: string;
  payload?: string;
}

interface AppendTelemetryEventOptions extends BaseOptions {
  event?: string;
  profileId?: string;
  sessionId?: string;
  payload?: string;
}

interface ReadProfileSnapshotOptions extends BaseOptions {
  profileId?: string;
}

interface RebuildProfileSnapshotOptions extends BaseOptions {
  profileId?: string;
  targetVersion?: string;
  persist?: boolean;
}

interface RollbackProfileOptions extends BaseOptions {
  profileId?: string;
  targetVersion?: string;
  actor?: string;
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
const PROFILE_EVENTS_DIR = join(PROFILES_DIR, 'events');
const PROFILE_SNAPSHOTS_DIR = join(PROFILES_DIR, 'snapshots');
const TELEMETRY_DIR = join(LEARN_ROOT, 'telemetry');
const TELEMETRY_EVENTS_PATH = join(TELEMETRY_DIR, 'events.ndjson');
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
  mkdirSync(LEARN_ROOT, { recursive: true });
  mkdirSync(PROFILES_DIR, { recursive: true });
  mkdirSync(SESSIONS_DIR, { recursive: true });
  mkdirSync(PROFILE_EVENTS_DIR, { recursive: true });
  mkdirSync(PROFILE_SNAPSHOTS_DIR, { recursive: true });
  mkdirSync(TELEMETRY_DIR, { recursive: true });
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
let validateSnapshot: ((data: any) => boolean) | null = null;
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

function getSnapshotValidator(): (data: any) => boolean {
  if (validateSnapshot) return validateSnapshot;
  const schemaPath = join(SCHEMA_DIR, 'learn-profile-snapshot.schema.json');
  const schema = loadJsonFile(schemaPath);
  validateSnapshot = ajv.compile(schema);
  return validateSnapshot!;
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

function generateId(prefix: string): string {
  const timestamp = new Date().toISOString().replace(/[-:]/g, '').split('.')[0];
  const random = randomBytes(4).toString('hex');
  return `${prefix}-${timestamp}-${random}`;
}

function readLastNdjsonObject(filePath: string): any | null {
  if (!existsSync(filePath)) return null;
  const content = readFileSync(filePath, 'utf8');
  const lines = content.split(/\r?\n/).filter(Boolean);
  for (let i = lines.length - 1; i >= 0; i--) {
    try {
      return JSON.parse(lines[i]);
    } catch {
      // ignore malformed trailing line(s)
    }
  }
  return null;
}

function appendNdjsonLine(filePath: string, obj: any): void {
  mkdirSync(dirname(filePath), { recursive: true });
  const fd = openSync(filePath, 'a');
  try {
    writeFileSync(fd, `${JSON.stringify(obj)}\n`, 'utf8');
  } finally {
    closeSync(fd);
  }
}

function safeIntegerOrThrow(value: unknown, name: string): number {
  const n = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(n) || !Number.isInteger(n) || n < 0) {
    throw Object.assign(new Error(`Invalid ${name}`), { code: 'INVALID_ARGS', details: { [name]: value } });
  }
  return n;
}

function loadProfileEvents(profileId: string): any[] {
  const eventsPath = join(PROFILE_EVENTS_DIR, `${profileId}.ndjson`);
  if (!existsSync(eventsPath)) return [];
  const content = readFileSync(eventsPath, 'utf8');
  const lines = content.split(/\r?\n/).filter(Boolean);
  const events: any[] = [];
  for (const line of lines) {
    try {
      const evt = JSON.parse(line);
      if (evt && typeof evt === 'object') events.push(evt);
    } catch {
      // ignore bad lines (append-only log may have partial writes in rare cases)
    }
  }
  events.sort((a, b) => Number(a?.version || 0) - Number(b?.version || 0));
  return events;
}

function cloneJson<T>(value: T): T {
  // Events are immutable. When folding into a snapshot we must avoid mutating event payload objects
  // through shared references (e.g. snapshot.pre_context = evt.payload.pre_context).
  if (value === null || value === undefined) return value;
  return JSON.parse(JSON.stringify(value)) as T;
}

function defaultSnapshot(profileId: string): any {
  return {
    $schema: '../schemas/learn-profile-snapshot.schema.json',
    profile_id: profileId,
    version: 0,
    updated_at: null,
    pre_context: null,
    skills: { asserted: [], inferred: [] },
    _metadata: { schema_version: '1.0.0' }
  };
}

function setPathValue(obj: any, pathStr: string, value: any): void {
  const parts = pathStr.split('.').filter(Boolean);
  if (parts.length === 0) return;

  // Disallow rewriting raw evidence via FIELD_SET.
  if (parts.includes('raw')) {
    throw Object.assign(new Error('FIELD_SET cannot modify raw evidence'), { code: 'INVALID_ARGS', details: { field_path: pathStr } });
  }

  const root = parts[0];
  if (root !== 'pre_context' && root !== 'skills') {
    throw Object.assign(new Error('FIELD_SET can only modify pre_context or skills'), { code: 'INVALID_ARGS', details: { field_path: pathStr } });
  }

  let cur = obj;
  for (let i = 0; i < parts.length - 1; i++) {
    const key = parts[i];
    if (cur[key] === null || cur[key] === undefined || typeof cur[key] !== 'object') cur[key] = {};
    cur = cur[key];
  }
  cur[parts[parts.length - 1]] = value;
}

function applyEventToSnapshot(snapshot: any, evt: any, events: any[]): any {
  const type = String(evt?.type || '');
  const payload = evt?.payload ?? {};

  if (type === 'PROFILE_CREATED') {
    const profile = payload?.profile ?? null;
    const snapshotPayload = payload?.snapshot ?? null;
    const base = snapshotPayload && typeof snapshotPayload === 'object' ? snapshotPayload : null;

    if (base) {
      snapshot.pre_context = cloneJson(base.pre_context ?? snapshot.pre_context);
      snapshot.skills = cloneJson(base.skills ?? snapshot.skills);
    } else if (profile && typeof profile === 'object') {
      snapshot.pre_context = cloneJson(profile.pre_context ?? snapshot.pre_context);
      if (Array.isArray(profile.known_topics)) {
        snapshot.skills.asserted = cloneJson(profile.known_topics);
      }
    }
    snapshot.updated_at = evt.created_at ?? snapshot.updated_at;
    return snapshot;
  }

  if (type === 'PRECONTEXT_CAPTURED') {
    if (payload?.pre_context !== undefined) snapshot.pre_context = cloneJson(payload.pre_context);
    snapshot.updated_at = evt.created_at ?? snapshot.updated_at;
    return snapshot;
  }

  if (type === 'FIELD_SET') {
    const fieldPath = String(payload?.field_path || '');
    if (!fieldPath) return snapshot;
    setPathValue(snapshot, fieldPath, payload?.new_value ?? null);
    snapshot.updated_at = evt.created_at ?? snapshot.updated_at;
    return snapshot;
  }

  if (type === 'ASSERTED_SKILL_ADDED') {
    const skill = payload?.skill;
    if (skill && typeof skill === 'object') snapshot.skills.asserted.push(cloneJson(skill));
    snapshot.updated_at = evt.created_at ?? snapshot.updated_at;
    return snapshot;
  }

  if (type === 'ASSERTED_SKILL_REMOVED') {
    const topicId = payload?.topic_id;
    if (typeof topicId === 'string') {
      snapshot.skills.asserted = (snapshot.skills.asserted || []).filter((s: any) => String(s?.topic_id) !== topicId);
    }
    snapshot.updated_at = evt.created_at ?? snapshot.updated_at;
    return snapshot;
  }

  if (type === 'ROLLBACK_TO_VERSION') {
    const target = safeIntegerOrThrow(payload?.target_version, 'target_version');
    const rolled = foldSnapshotFromEvents(snapshot.profile_id, events, target);
    rolled._metadata = rolled._metadata || {};
    rolled._metadata.rolled_back_to_version = target;
    rolled._metadata.rolled_back_at_version = evt.version;
    rolled.updated_at = evt.created_at ?? rolled.updated_at;
    // Snapshot version tracks head event version (append-only log), not the target fold point.
    rolled.version = safeIntegerOrThrow(evt.version, 'version');
    return rolled;
  }

  // Unknown event types: ignore (forward compatibility).
  return snapshot;
}

function foldSnapshotFromEvents(profileId: string, events: any[], targetVersion?: number): any {
  let snapshot: any = defaultSnapshot(profileId);
  for (const evt of events) {
    const version = Number(evt?.version || 0);
    if (targetVersion !== undefined && version > targetVersion) break;
    snapshot.version = version;
    snapshot = applyEventToSnapshot(snapshot, evt, events);
  }
  return snapshot;
}

function persistSnapshot(profileId: string, snapshot: any): void {
  const snapshotPath = join(PROFILE_SNAPSHOTS_DIR, `${profileId}.json`);
  const ok = getSnapshotValidator()(snapshot);
  if (!ok) {
    throw Object.assign(new Error('Snapshot schema validation failed'), {
      code: 'SCHEMA_INVALID',
      details: formatAjvErrors((getSnapshotValidator() as any).errors)
    });
  }
  atomicWriteJson(snapshotPath, snapshot, getSnapshotValidator());
}

export async function learnAppendProfileEventCommand(options: AppendProfileEventOptions): Promise<void> {
  const profileId = options.profileId;
  const type = options.type;
  const actor = options.actor || 'user';
  const payloadStr = options.payload;

  if (!profileId) fail(options, { code: 'INVALID_ARGS', message: 'Missing --profile-id' });
  if (!type) fail(options, { code: 'INVALID_ARGS', message: 'Missing --type' });

  let payload: any = {};
  if (payloadStr !== undefined) {
    try {
      payload = JSON.parse(payloadStr);
    } catch (err: any) {
      fail(options, { code: 'INVALID_ARGS', message: 'Invalid JSON for --payload', details: err.message ?? String(err) });
    }
  }

  try {
    const event = await withLearnLock(async () => {
      const id = safeProfileIdOrThrow(profileId);
      const profilePath = join(PROFILES_DIR, `${id}.json`);
      if (!existsSync(profilePath)) throw Object.assign(new Error(`Profile not found: ${id}`), { code: 'NOT_FOUND' });

      const eventsPath = join(PROFILE_EVENTS_DIR, `${id}.ndjson`);
      const last = readLastNdjsonObject(eventsPath);
      const lastVersion = Number(last?.version || 0);
      const nextVersion = Number.isFinite(lastVersion) && lastVersion > 0 ? lastVersion + 1 : 1;

      const evt = {
        event_id: generateId('evt'),
        profile_id: id,
        version: nextVersion,
        type,
        actor,
        created_at: nowIso(),
        payload
      };

      appendNdjsonLine(eventsPath, evt);

      // Update snapshot (read model) deterministically from events (best-effort but inside lock).
      try {
        const events = loadProfileEvents(id);
        const snapshot = foldSnapshotFromEvents(id, events);
        persistSnapshot(id, snapshot);
      } catch (e: any) {
        // Snapshot is a derived read model; event append must succeed even if snapshot update fails.
        // eslint-disable-next-line no-console
        console.warn('⚠️ Failed to update profile snapshot:', e?.message || e);
      }
      return evt;
    });

    print(options, { ok: true, data: event });
  } catch (err: any) {
    if (err?._exitCode === 2) {
      fail(options, { code: err.code ?? 'LOCKED', message: err.message ?? 'Locked', details: err.details }, 2);
    }
    fail(options, { code: err.code ?? 'IO_ERROR', message: err.message ?? String(err), details: err.details });
  }
}

export async function learnAppendTelemetryEventCommand(options: AppendTelemetryEventOptions): Promise<void> {
  const event = options.event;
  const profileId = options.profileId ?? null;
  const sessionId = options.sessionId ?? null;
  const payloadStr = options.payload;

  if (!event) fail(options, { code: 'INVALID_ARGS', message: 'Missing --event' });

  let payload: any = {};
  if (payloadStr !== undefined) {
    try {
      payload = JSON.parse(payloadStr);
    } catch (err: any) {
      fail(options, { code: 'INVALID_ARGS', message: 'Invalid JSON for --payload', details: err.message ?? String(err) });
    }
  }

  try {
    const record = await withLearnLock(async () => {
      const evt = {
        event_id: generateId('telemetry'),
        event,
        profile_id: profileId,
        session_id: sessionId,
        created_at: nowIso(),
        payload
      };

      appendNdjsonLine(TELEMETRY_EVENTS_PATH, evt);
      return evt;
    });

    print(options, { ok: true, data: record });
  } catch (err: any) {
    if (err?._exitCode === 2) {
      fail(options, { code: err.code ?? 'LOCKED', message: err.message ?? 'Locked', details: err.details }, 2);
    }
    fail(options, { code: err.code ?? 'IO_ERROR', message: err.message ?? String(err), details: err.details });
  }
}

export async function learnReadProfileSnapshotCommand(options: ReadProfileSnapshotOptions): Promise<void> {
  const profileId = options.profileId;
  if (!profileId) fail(options, { code: 'INVALID_ARGS', message: 'Missing --profile-id' });

  try {
    await ensureLearnDirs();
    const id = safeProfileIdOrThrow(profileId);
    const snapshotPath = join(PROFILE_SNAPSHOTS_DIR, `${id}.json`);

    if (!existsSync(snapshotPath)) {
      print(options, { ok: true, data: defaultSnapshot(id) });
      return;
    }

    const snapshot = loadJsonFile(snapshotPath);
    const ok = getSnapshotValidator()(snapshot);
    if (!ok) {
      fail(options, {
        code: 'SCHEMA_INVALID',
        message: 'Snapshot schema validation failed',
        details: formatAjvErrors((getSnapshotValidator() as any).errors)
      });
    }

    print(options, { ok: true, data: snapshot });
  } catch (err: any) {
    fail(options, { code: err.code ?? 'IO_ERROR', message: err.message ?? String(err), details: err.details });
  }
}

export async function learnRebuildProfileSnapshotCommand(options: RebuildProfileSnapshotOptions): Promise<void> {
  const profileId = options.profileId;
  const targetVersionRaw = options.targetVersion;
  // Commander sets boolean option default true when using `--no-persist`.
  const persist = options.persist !== false;

  if (!profileId) fail(options, { code: 'INVALID_ARGS', message: 'Missing --profile-id' });

  try {
    const snapshot = await withLearnLock(async () => {
      const id = safeProfileIdOrThrow(profileId);
      const profilePath = join(PROFILES_DIR, `${id}.json`);
      if (!existsSync(profilePath)) throw Object.assign(new Error(`Profile not found: ${id}`), { code: 'NOT_FOUND' });

      const targetVersion = targetVersionRaw !== undefined ? safeIntegerOrThrow(targetVersionRaw, 'target_version') : undefined;
      const events = loadProfileEvents(id);
      const next = foldSnapshotFromEvents(id, events, targetVersion);
      if (persist) persistSnapshot(id, next);
      return next;
    });

    print(options, { ok: true, data: snapshot });
  } catch (err: any) {
    if (err?._exitCode === 2) {
      fail(options, { code: err.code ?? 'LOCKED', message: err.message ?? 'Locked', details: err.details }, 2);
    }
    fail(options, { code: err.code ?? 'IO_ERROR', message: err.message ?? String(err), details: err.details });
  }
}

export async function learnRollbackProfileCommand(options: RollbackProfileOptions): Promise<void> {
  const profileId = options.profileId;
  const targetVersionRaw = options.targetVersion;
  const actor = options.actor || 'user';

  if (!profileId) fail(options, { code: 'INVALID_ARGS', message: 'Missing --profile-id' });
  if (targetVersionRaw === undefined) fail(options, { code: 'INVALID_ARGS', message: 'Missing --target-version' });

  try {
    const result = await withLearnLock(async () => {
      const id = safeProfileIdOrThrow(profileId);
      const profilePath = join(PROFILES_DIR, `${id}.json`);
      if (!existsSync(profilePath)) throw Object.assign(new Error(`Profile not found: ${id}`), { code: 'NOT_FOUND' });

      const targetVersion = safeIntegerOrThrow(targetVersionRaw, 'target_version');

      const eventsPath = join(PROFILE_EVENTS_DIR, `${id}.ndjson`);
      const last = readLastNdjsonObject(eventsPath);
      const lastVersion = Number(last?.version || 0);
      if (Number.isFinite(lastVersion) && lastVersion >= 0 && targetVersion > lastVersion) {
        throw Object.assign(new Error('Invalid target_version (beyond head)'), {
          code: 'INVALID_ARGS',
          details: { target_version: targetVersion, head_version: lastVersion }
        });
      }

      const nextVersion = Number.isFinite(lastVersion) && lastVersion > 0 ? lastVersion + 1 : 1;
      const evt = {
        event_id: generateId('evt'),
        profile_id: id,
        version: nextVersion,
        type: 'ROLLBACK_TO_VERSION',
        actor,
        created_at: nowIso(),
        payload: { target_version: targetVersion }
      };

      appendNdjsonLine(eventsPath, evt);

      // Rebuild & persist the snapshot at the head (the rollback event folds to target_version).
      const events = loadProfileEvents(id);
      const snapshot = foldSnapshotFromEvents(id, events);
      persistSnapshot(id, snapshot);

      return { event: evt, snapshot };
    });

    print(options, { ok: true, data: result });
  } catch (err: any) {
    if (err?._exitCode === 2) {
      fail(options, { code: err.code ?? 'LOCKED', message: err.message ?? 'Locked', details: err.details }, 2);
    }
    fail(options, { code: err.code ?? 'IO_ERROR', message: err.message ?? String(err), details: err.details });
  }
}
