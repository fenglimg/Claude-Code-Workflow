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
import { spawn, spawnSync } from 'child_process';
import { existsSync, mkdirSync, readFileSync, writeFileSync, renameSync, copyFileSync, unlinkSync, openSync, closeSync, realpathSync, readdirSync } from 'fs';
import { dirname, join, resolve } from 'path';
import { createHash, randomBytes } from 'crypto';
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

interface AppendProfileEventsBatchOptions extends BaseOptions {
  profileId?: string;
  // JSON array of { type, actor?, payload? }.
  events?: string;
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

interface ProposeInferredSkillOptions extends BaseOptions {
  profileId?: string;
  topicId?: string;
  proficiency?: string;
  confidence?: string;
  evidence?: string;
  actor?: string;
}

interface ConfirmInferredSkillOptions extends BaseOptions {
  profileId?: string;
  topicId?: string;
  actor?: string;
}

interface RejectInferredSkillOptions extends BaseOptions {
  profileId?: string;
  topicId?: string;
  reason?: string;
  actor?: string;
}

interface ResolvePackKeyOptions extends BaseOptions {
  topicId?: string;
  taxonomyVersion?: string;
  rubricVersion?: string;
  questionBankVersion?: string;
  language?: string;
}

interface ReadPackOptions extends BaseOptions {
  // Either provide --pack-key JSON or provide the individual fields.
  packKey?: string;
  topicId?: string;
  taxonomyVersion?: string;
  rubricVersion?: string;
  questionBankVersion?: string;
  language?: string;
}

interface WritePackOptions extends BaseOptions {
  // Full pack JSON (must contain pack_key).
  pack?: string;
}

interface PackStatusOptions extends BaseOptions {
  // Either provide --pack-key JSON or provide the individual fields.
  packKey?: string;
  topicId?: string;
  taxonomyVersion?: string;
  rubricVersion?: string;
  questionBankVersion?: string;
  language?: string;
}

interface EnsurePackOptions extends BaseOptions {
  topicId?: string;
  mode?: string; // auto|seed|full
  language?: string;
  seedQuestions?: string;
  force?: boolean;
}

interface ResolveTopicOptions extends BaseOptions {
  rawTopicLabel?: string;
}

interface EnsureTopicOptions extends BaseOptions {
  rawTopicLabel?: string;
  actor?: string;
}

interface TaxonomyAliasOptions extends BaseOptions {
  topicId?: string;
  alias?: string;
  actor?: string;
}

interface TaxonomyRedirectOptions extends BaseOptions {
  fromTopicId?: string;
  toTopicId?: string;
  actor?: string;
}

interface TaxonomyPromoteOptions extends BaseOptions {
  topicId?: string;
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
const PACKS_DIR = join(LEARN_ROOT, 'packs');
const TAXONOMY_DIR = join(LEARN_ROOT, 'taxonomy');
const TAXONOMY_INDEX_PATH = join(TAXONOMY_DIR, 'index.json');
const TAXONOMY_CHANGES_PATH = join(TAXONOMY_DIR, 'changes.ndjson');
const SCHEMA_DIR = join(PROJECT_ROOT, '.claude', 'workflows', 'cli-templates', 'schemas');

const PROFILE_ID_RE = /^[a-zA-Z0-9_-]+$/;
const SESSION_ID_RE = /^LS-\d{8}-\d{3}$/;
const TOPIC_ID_RE = /^KP-\d+$/;

function nowIso(): string {
  // Allow deterministic timestamps in tests.
  const forced = process.env.CCW_NOW_ISO;
  if (forced && forced.trim()) return forced.trim();
  return new Date().toISOString();
}

function nowMs(): number {
  const ms = Date.parse(nowIso());
  if (!Number.isFinite(ms)) {
    throw Object.assign(new Error('Invalid CCW_NOW_ISO (expected ISO date-time)'), {
      code: 'INVALID_ARGS',
      details: { CCW_NOW_ISO: process.env.CCW_NOW_ISO }
    });
  }
  return ms;
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
  mkdirSync(PACKS_DIR, { recursive: true });
  mkdirSync(TAXONOMY_DIR, { recursive: true });
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

const INFERRED_SKILL_ID_RE = /^[a-zA-Z0-9][a-zA-Z0-9_-]{0,127}$/;

function safeInferredSkillIdOrThrow(topicIdRaw: string): string {
  const topicId = String(topicIdRaw || '').trim().toLowerCase();
  if (!INFERRED_SKILL_ID_RE.test(topicId) || topicId.includes('/') || topicId.includes('\\') || topicId.includes('..')) {
    throw Object.assign(new Error('Invalid inferred skill topic id'), {
      code: 'INVALID_ARGS',
      details: { topic_id: topicIdRaw }
    });
  }
  return topicId;
}

type PackKey = {
  topic_id: string;
  taxonomy_version: string;
  rubric_version: string;
  question_bank_version: string;
  language: string;
};

function normalizeLanguageOrDefault(raw: any): string {
  const v = String(raw ?? '').trim();
  // Keep language tags stable; default to zh-CN for this project.
  return v ? v : 'zh-CN';
}

type TaxonomyTopicStatus = 'provisional' | 'active' | 'redirect';

type TaxonomyTopic = {
  topic_id: string; // canonical
  status: TaxonomyTopicStatus;
  aliases: string[];
  redirect_to_topic_id: string | null;
  // Versioning for pack_key derivation (assessment-relevant).
  taxonomy_version: string;
  rubric_version: string;
  display_name_zh?: string | null;
  display_name_en?: string | null;
  created_at: string;
  updated_at: string;
};

type TaxonomyIndex = {
  schema_version: '1.0.0';
  updated_at: string;
  topics: TaxonomyTopic[];
};

function normalizeTopicLabelForMatch(raw: string): string {
  // Similar intent to background-parser.normalizeForLookup, but local + minimal.
  // Goal: stable matching across punctuation/case/version noise.
  return String(raw ?? '')
    .toLowerCase()
    .replace(/@v?\d+(?:\.\d+)*/g, ' ')
    .replace(/\bv?\d+(?:\.\d+)*\b/g, ' ')
    .replace(/[._]/g, ' ')
    .replace(/[^a-z0-9+#]+/g, ' ')
    .trim()
    .replace(/\s+/g, ' ');
}

function topicIdCandidateFromRawLabel(raw: string): string {
  const n = normalizeTopicLabelForMatch(raw);
  if (!n) return '';
  // Convert to a safe inferred_skill id segment style (underscores for spaces).
  const id = n.replace(/\s+/g, '_');
  try {
    return safeInferredSkillIdOrThrow(id);
  } catch {
    return '';
  }
}

function defaultTaxonomyIndex(): TaxonomyIndex {
  return {
    schema_version: '1.0.0',
    updated_at: nowIso(),
    topics: []
  };
}

function validateTaxonomyIndexOrThrow(index: any): TaxonomyIndex {
  if (!index || typeof index !== 'object') {
    throw Object.assign(new Error('Taxonomy index must be an object'), { code: 'SCHEMA_INVALID' });
  }
  if (index.schema_version !== '1.0.0') {
    throw Object.assign(new Error('Unsupported taxonomy schema_version'), {
      code: 'SCHEMA_INVALID',
      details: { schema_version: index.schema_version }
    });
  }
  if (!Array.isArray(index.topics)) {
    throw Object.assign(new Error('Taxonomy index must include topics[]'), { code: 'SCHEMA_INVALID' });
  }

  const topics: TaxonomyTopic[] = [];
  for (const t of index.topics) {
    if (!t || typeof t !== 'object') {
      throw Object.assign(new Error('Invalid topic entry'), { code: 'SCHEMA_INVALID', details: { topic: t } });
    }
    const topic_id = safeInferredSkillIdOrThrow(String((t as any).topic_id ?? ''));
    const status = String((t as any).status ?? '') as TaxonomyTopicStatus;
    if (!['provisional', 'active', 'redirect'].includes(status)) {
      throw Object.assign(new Error('Invalid topic status'), { code: 'SCHEMA_INVALID', details: { topic_id, status } });
    }

    const aliasesRaw = (t as any).aliases;
    const aliases = Array.isArray(aliasesRaw) ? aliasesRaw.map((a: any) => String(a)).filter(Boolean) : [];
    const redirect_to_topic_id =
      (t as any).redirect_to_topic_id === null || (t as any).redirect_to_topic_id === undefined
        ? null
        : safeInferredSkillIdOrThrow(String((t as any).redirect_to_topic_id));

    if (status === 'redirect' && !redirect_to_topic_id) {
      throw Object.assign(new Error('redirect topics must include redirect_to_topic_id'), {
        code: 'SCHEMA_INVALID',
        details: { topic_id }
      });
    }

    const taxonomy_version = normalizeVersionOrDefault((t as any).taxonomy_version, 'v0');
    const rubric_version = normalizeVersionOrDefault((t as any).rubric_version, 'v0');
    const created_at = String((t as any).created_at ?? nowIso());
    const updated_at = String((t as any).updated_at ?? nowIso());

    topics.push({
      topic_id,
      status,
      aliases,
      redirect_to_topic_id,
      taxonomy_version,
      rubric_version,
      display_name_zh: (t as any).display_name_zh ?? null,
      display_name_en: (t as any).display_name_en ?? null,
      created_at,
      updated_at
    });
  }

  return {
    schema_version: '1.0.0',
    updated_at: String(index.updated_at ?? nowIso()),
    topics
  };
}

function loadTaxonomyIndex(): TaxonomyIndex {
  if (!existsSync(TAXONOMY_INDEX_PATH)) return defaultTaxonomyIndex();
  const raw = loadJsonFile(TAXONOMY_INDEX_PATH);
  return validateTaxonomyIndexOrThrow(raw);
}

function atomicWriteTaxonomyIndex(index: TaxonomyIndex): void {
  // We reuse atomicWriteJson with a lightweight validator wrapper.
  atomicWriteJson(TAXONOMY_INDEX_PATH, index, (d) => {
    try {
      validateTaxonomyIndexOrThrow(d);
      return true;
    } catch {
      return false;
    }
  });
}

function appendTaxonomyChange(entry: any): void {
  mkdirSync(dirname(TAXONOMY_CHANGES_PATH), { recursive: true });
  appendNdjsonLine(TAXONOMY_CHANGES_PATH, { timestamp: nowIso(), ...entry });
}

type TopicResolveResult =
  | {
      found: true;
      topic_id: string;
      taxonomy_version: string;
      rubric_version: string;
      resolution_source: 'topic_id' | 'alias' | 'redirect' | 'provisional';
      matched_topic_id: string;
      matched_alias: string | null;
      redirect_chain: string[];
      status: TaxonomyTopicStatus;
    }
  | {
      found: false;
      ambiguous: boolean;
      candidates: Array<{ topic_id: string; status: TaxonomyTopicStatus; match_on: 'alias' | 'display_name' }>;
    };

function resolveTopicFromIndex(index: TaxonomyIndex, rawTopicLabel: string): TopicResolveResult {
  const raw = String(rawTopicLabel ?? '').trim();
  if (!raw) {
    return { found: false, ambiguous: false, candidates: [] };
  }

  const norm = normalizeTopicLabelForMatch(raw);

  // 1) Direct canonical topic_id hit (best-effort).
  const directId = (() => {
    try {
      return safeInferredSkillIdOrThrow(raw);
    } catch {
      return null;
    }
  })();

  const byId = new Map(index.topics.map((t) => [t.topic_id, t] as const));
  if (directId && byId.has(directId)) {
    const hit = byId.get(directId)!;
    return resolveRedirectChain(index, hit.topic_id, 'topic_id', null);
  }

  // 2) Alias/display name match (may be ambiguous).
  const candidates: Array<{ topic: TaxonomyTopic; match_on: 'alias' | 'display_name'; matched_alias: string | null }> = [];
  for (const t of index.topics) {
    // aliases
    for (const a of t.aliases || []) {
      if (normalizeTopicLabelForMatch(a) === norm) {
        candidates.push({ topic: t, match_on: 'alias', matched_alias: a });
        break;
      }
    }
    // display names (fallback)
    if (candidates.some((c) => c.topic.topic_id === t.topic_id)) continue;
    const dn = (t.display_name_zh || t.display_name_en || '').trim();
    if (dn && normalizeTopicLabelForMatch(dn) === norm) {
      candidates.push({ topic: t, match_on: 'display_name', matched_alias: null });
    }
  }

  if (candidates.length === 0) {
    return { found: false, ambiguous: false, candidates: [] };
  }
  if (candidates.length > 1) {
    return {
      found: false,
      ambiguous: true,
      candidates: candidates.map((c) => ({ topic_id: c.topic.topic_id, status: c.topic.status, match_on: c.match_on }))
    };
  }

  const only = candidates[0];
  return resolveRedirectChain(index, only.topic.topic_id, only.match_on === 'alias' ? 'alias' : 'alias', only.matched_alias);
}

function resolveRedirectChain(
  index: TaxonomyIndex,
  startTopicId: string,
  initialSource: 'topic_id' | 'alias',
  matchedAlias: string | null
): TopicResolveResult {
  const byId = new Map(index.topics.map((t) => [t.topic_id, t] as const));
  const redirect_chain: string[] = [];
  let curId = startTopicId;
  let source: 'topic_id' | 'alias' | 'redirect' | 'provisional' = initialSource;

  for (let i = 0; i < 8; i += 1) {
    const t = byId.get(curId);
    if (!t) break;
    if (t.status !== 'redirect') {
      return {
        found: true,
        topic_id: t.topic_id,
        taxonomy_version: t.taxonomy_version,
        rubric_version: t.rubric_version,
        resolution_source: source,
        matched_topic_id: startTopicId,
        matched_alias: matchedAlias,
        redirect_chain,
        status: t.status
      };
    }

    // Follow redirects.
    const next = t.redirect_to_topic_id;
    if (!next) {
      throw Object.assign(new Error('Invalid redirect entry (missing redirect_to_topic_id)'), {
        code: 'SCHEMA_INVALID',
        details: { topic_id: t.topic_id }
      });
    }
    redirect_chain.push(t.topic_id);
    if (redirect_chain.includes(next)) {
      throw Object.assign(new Error('Redirect loop detected'), {
        code: 'SCHEMA_INVALID',
        details: { start: startTopicId, loop: [...redirect_chain, next] }
      });
    }
    curId = next;
    source = 'redirect';
  }

  throw Object.assign(new Error('Redirect chain too deep'), { code: 'SCHEMA_INVALID', details: { start: startTopicId } });
}

function normalizeVersionOrDefault(raw: any, fallback: string): string {
  const v = String(raw ?? '').trim();
  return v ? v : fallback;
}

function packKeyHash(key: PackKey): string {
  // Stable, short hash for logs/ids (do not use for security).
  return createHash('sha256').update(JSON.stringify(key)).digest('hex').slice(0, 12);
}

function sanitizePackFileSegment(raw: string): string {
  // Keep it filesystem-safe while staying readable.
  return String(raw ?? '').replace(/[^a-zA-Z0-9._-]+/g, '_');
}

function packPathForKey(key: PackKey): string {
  const topic = sanitizePackFileSegment(key.topic_id);
  const tv = sanitizePackFileSegment(key.taxonomy_version);
  const rv = sanitizePackFileSegment(key.rubric_version);
  const qv = sanitizePackFileSegment(key.question_bank_version);
  const lang = sanitizePackFileSegment(key.language);
  return join(PACKS_DIR, topic, `pack.${tv}.${rv}.${qv}.${lang}.json`);
}

type PackSubpointPriority = 'must' | 'core' | 'nice';
type PackSubpoint = { id: string; label: string; priority: PackSubpointPriority; min_evidence: number };
type PackQuestion = {
  id: string;
  prompt: string;
  level: number; // 1..5 (adaptive)
  // vNext+ (Cycle-4): optional continuous metadata (cross-domain).
  difficulty?: number; // 0..1
  capability_node?: 'see' | 'explain' | 'apply' | 'debug';
  common_mistakes?: string[];
  grading_notes?: string;
  subpoint_ids: string[];
};

type PackVNext = {
  pack_key: PackKey;
  topic_id: string;
  taxonomy_version: string;
  rubric_version: string;
  question_bank_version: string;
  language: string;
  created_at: string;
  pack_kind?: 'seed' | 'full';
  taxonomy?: { subpoints: PackSubpoint[] };
  questions: PackQuestion[];
  regression_cases?: Array<{ id: string; note?: string }>;
  regression_cases_count?: number;
  _metadata?: any;
};

type PackStatusVNext = {
  found: boolean;
  pack_key: PackKey;
  pack_key_hash: string;
  path: string | null;
  pack_kind: 'seed' | 'full' | 'unknown';
  question_count: number;
  regression_cases_count: number;
  has_taxonomy: boolean;
  has_question_bank: boolean;
  has_regression_skeleton: boolean;
  must_total: number;
  core_total: number;
  must_covered: number;
  core_covered: number;
  full_completeness: boolean;
};

function computePackStatusVNext(pack_key: PackKey, packPath: string, pack: any): PackStatusVNext {
  const questions: any[] = Array.isArray(pack?.questions) ? pack.questions : [];
  const subpoints: any[] = Array.isArray(pack?.taxonomy?.subpoints) ? pack.taxonomy.subpoints : [];
  const has_taxonomy = subpoints.length > 0 && subpoints.every((s) => s && typeof s === 'object' && typeof s.id === 'string');
  const has_question_bank =
    questions.length > 0 &&
    questions.every((q) => q && typeof q === 'object' && typeof q.id === 'string' && Array.isArray(q.subpoint_ids));

  const regressionCases = Array.isArray(pack?.regression_cases) ? pack.regression_cases : [];
  const regression_cases_count =
    regressionCases.length > 0 ? regressionCases.length : Number(pack?.regression_cases_count ?? 0) || 0;
  const has_regression_skeleton = regression_cases_count > 0;

  const mustIds = new Set<string>();
  const coreIds = new Set<string>();
  for (const s of subpoints) {
    const p = String(s?.priority ?? '');
    const id = String(s?.id ?? '');
    if (!id) continue;
    if (p === 'must') mustIds.add(id);
    if (p === 'core') coreIds.add(id);
  }

  const covered = new Set<string>();
  for (const q of questions) {
    for (const sid of q?.subpoint_ids || []) covered.add(String(sid));
  }

  const must_covered = [...mustIds].filter((id) => covered.has(id)).length;
  const core_covered = [...coreIds].filter((id) => covered.has(id)).length;

  const full_completeness =
    has_taxonomy &&
    has_question_bank &&
    has_regression_skeleton &&
    must_covered === mustIds.size &&
    core_covered === coreIds.size;

  const pack_kind = pack?.pack_kind === 'seed' || pack?.pack_kind === 'full' ? pack.pack_kind : 'unknown';

  return {
    found: true,
    pack_key,
    pack_key_hash: packKeyHash(pack_key),
    path: packPath,
    pack_kind,
    question_count: questions.length,
    regression_cases_count,
    has_taxonomy,
    has_question_bank,
    has_regression_skeleton,
    must_total: mustIds.size,
    core_total: coreIds.size,
    must_covered,
    core_covered,
    full_completeness
  };
}

function defaultSubpointsForTopic(topic_id: string): PackSubpoint[] {
  // P0 deterministic taxonomy. Later this can be replaced by a curated taxonomy per topic.
  const base = safeInferredSkillIdOrThrow(topic_id);
  const make = (suffix: string, priority: PackSubpointPriority, label: string, min: number): PackSubpoint => ({
    id: `${base}:${suffix}`,
    priority,
    label,
    min_evidence: min
  });
  return [
    make('must:core_concepts', 'must', '核心概念', 1),
    make('must:pitfalls', 'must', '常见坑/边界情况', 1),
    make('core:syntax', 'core', '基础语法/结构', 1),
    make('core:types', 'core', '类型/抽象', 1),
    make('core:debugging', 'core', '调试与定位', 1),
    make('core:practice', 'core', '实战应用', 1),
    make('nice:ecosystem', 'nice', '生态/工具链', 1),
    make('nice:best_practices', 'nice', '最佳实践', 1)
  ];
}

function buildSeedPackVNext(pack_key: PackKey, seedCount: number): PackVNext {
  const topic_id = pack_key.topic_id;
  const subpoints = defaultSubpointsForTopic(topic_id);
  const ts = nowIso();
  // Cycle-4: seed is a fixed 4-question discriminative set (cross-domain).
  const N = 4;
  const must = subpoints.filter((s) => s.priority === 'must');
  const core = subpoints.filter((s) => s.priority === 'core');
  const picks: PackSubpoint[] = [
    ...(must.slice(0, 2).length > 0 ? must.slice(0, 2) : core.slice(0, 2)),
    ...core.slice(0, Math.max(0, N - Math.min(2, must.length)))
  ].slice(0, N);

  const capabilityNodes: Array<NonNullable<PackQuestion['capability_node']>> = ['see', 'explain', 'apply', 'debug'];
  const difficulties = [0.25, 0.45, 0.65, 0.85];

  const questions: PackQuestion[] = Array.from({ length: N }, (_, i) => {
    const sp = picks[i] ?? picks[picks.length - 1] ?? subpoints[0];
    const capability_node = capabilityNodes[i] ?? 'explain';
    const difficulty = difficulties[i] ?? 0.45;
    const level = Math.max(1, Math.min(5, 1 + Math.round(difficulty * 4)));

    const prompt = (() => {
      if (capability_node === 'see') {
        return `【${topic_id}｜识别】看到「${sp.label}」时，你会如何判断自己是否理解/见过？请用一句话给出定义，并给一个最小例子。`;
      }
      if (capability_node === 'apply') {
        return (
          `【${topic_id}｜应用】给定一个具体场景（你自选一个真实场景），说明你会如何使用「${sp.label}」解决问题：` +
          `\\n- 输入/约束是什么？\\n- 关键步骤是什么？\\n- 输出/验收是什么？\\n并提一个常见坑/边界条件。`
        );
      }
      if (capability_node === 'debug') {
        return (
          `【${topic_id}｜诊断】假设你在使用「${sp.label}」时遇到失败/效果不符合预期：` +
          `\\n1) 你会如何定位原因（步骤）？` +
          `\\n2) 你会优先排查哪 3 类可能性？` +
          `\\n3) 你会如何选择修复方案并解释取舍？`
        );
      }
      // explain
      return (
        `【${topic_id}｜解释】用自己的话解释「${sp.label}」的机制/因果链：` +
        `\\n- 为什么它这样工作？` +
        `\\n- 给一个具体例子` +
        `\\n- 提一个常见坑/边界条件`
      );
    })();

    return {
      id: `seed-q${i + 1}`,
      level,
      difficulty,
      capability_node,
      subpoint_ids: sp ? [sp.id] : [],
      common_mistakes: [
        '只背定义，不给可检验的例子/场景',
        '忽略约束/边界条件导致答案不可用',
        '把相关概念混为一谈（概念漂移）'
      ],
      grading_notes: '评分关注：是否给出可检验的定义/例子；是否包含推理链或步骤；是否明确边界/取舍。',
      prompt
    };
  });

  return {
    pack_key,
    topic_id,
    taxonomy_version: pack_key.taxonomy_version,
    rubric_version: pack_key.rubric_version,
    question_bank_version: pack_key.question_bank_version,
    language: pack_key.language,
    created_at: ts,
    pack_kind: 'seed',
    taxonomy: { subpoints },
    questions,
    regression_cases: [],
    _metadata: {
      generator: 'deterministic',
      seed_spec: { version: 'cycle-4', N, capability_nodes: capabilityNodes, difficulties }
    }
  };
}

function buildFullPackVNext(pack_key: PackKey): PackVNext {
  const topic_id = pack_key.topic_id;
  const subpoints = defaultSubpointsForTopic(topic_id);
  const ts = nowIso();

  // Ensure must/core are covered, with multiple levels for adaptive selection.
  const mustCore = subpoints.filter((s) => s.priority === 'must' || s.priority === 'core');
  const questions: PackQuestion[] = [];
  let qn = 1;
  for (const sp of mustCore) {
    for (const level of [2, 3, 4, 5]) {
      const difficulty = Math.max(0, Math.min(1, (level - 1) / 4));
      const capability_node: NonNullable<PackQuestion['capability_node']> =
        level <= 2 ? 'see' : level === 3 ? 'explain' : 'debug';
      questions.push({
        id: `q${qn++}`,
        level,
        difficulty,
        capability_node,
        subpoint_ids: [sp.id],
        common_mistakes: [
          '只给结论不给例子/步骤',
          '忽略边界条件与前提假设',
          '把概念说得很大但无法落地'
        ],
        grading_notes: '评分关注：定义/机制是否清晰；例子是否可检验；是否指出边界/坑；高难度题需体现取舍与诊断步骤。',
        prompt:
          `【${topic_id}｜L${level}】围绕「${sp.label}」回答：` +
          `\\n1) 给出定义/原理\\n2) 给出一个真实例子\\n3) 提到一个常见坑/边界情况`
      });
    }
  }

  // Add a small number of nice-to-have questions (keeps the bank >= 20 even for small taxonomies).
  const nice = subpoints.filter((s) => s.priority === 'nice');
  for (const sp of nice) {
    questions.push({
      id: `q${qn++}`,
      level: 3,
      difficulty: 0.5,
      capability_node: 'apply',
      subpoint_ids: [sp.id],
      common_mistakes: ['只讲概念不讲为什么有用', '例子与主题不相关'],
      grading_notes: '加分题：看重是否能联系到真实使用场景与个人经验。',
      prompt: `【${topic_id}｜加分项】请简述「${sp.label}」并给出一个你实际会用到的例子。`
    });
  }

  // Add a few mixed-coverage questions.
  const mixed = mustCore.slice(0, 3).map((s) => s.id);
  questions.push({
    id: `q${qn++}`,
    level: 3,
    difficulty: 0.55,
    capability_node: 'apply',
    subpoint_ids: mixed,
    common_mistakes: ['只列点不串联', '缺少具体场景导致不可检验'],
    grading_notes: '综合题：看重能否把多个点串成一个可运行的方案。',
    prompt: `【${topic_id}｜综合】请用一个小案例串联：${mixed.join('、')}。`
  });
  questions.push({
    id: `q${qn++}`,
    level: 4,
    difficulty: 0.75,
    capability_node: 'debug',
    subpoint_ids: mixed,
    common_mistakes: ['只给一个方案不讨论 tradeoff', '忽略约束导致方案不可用'],
    grading_notes: 'L4 综合题：看重取舍、边界、诊断与反事实思考。',
    prompt: `【${topic_id}｜综合 L4】请给出一个复杂一点的场景，并解释你会如何权衡/取舍。`
  });
  questions.push({
    id: `q${qn++}`,
    level: 2,
    difficulty: 0.35,
    capability_node: 'explain',
    subpoint_ids: mixed,
    common_mistakes: ['定义含糊', '例子不可检验'],
    grading_notes: 'L2 综合题：看重是否能用简单语言讲清楚并给出最小例子。',
    prompt: `【${topic_id}｜综合 L2】用最简单的话解释这几个点分别是什么，并给出一个最小例子。`
  });

  const regression_cases = Array.from({ length: 30 }, (_, i) => ({ id: `reg-${i + 1}`, note: 'skeleton' }));

  return {
    pack_key,
    topic_id,
    taxonomy_version: pack_key.taxonomy_version,
    rubric_version: pack_key.rubric_version,
    question_bank_version: pack_key.question_bank_version,
    language: pack_key.language,
    created_at: ts,
    pack_kind: 'full',
    taxonomy: { subpoints },
    questions,
    regression_cases
  };
}

function resolvePackKeyFromOptionsOrThrow(opts: {
  topicId?: string;
  taxonomyVersion?: string;
  rubricVersion?: string;
  questionBankVersion?: string;
  language?: string;
}): PackKey {
  const topic_id = safeInferredSkillIdOrThrow(String(opts.topicId ?? ''));
  const taxonomy_version = normalizeVersionOrDefault(opts.taxonomyVersion, 'v0');
  const rubric_version = normalizeVersionOrDefault(opts.rubricVersion, 'v0');
  const language = normalizeLanguageOrDefault(opts.language);
  const question_bank_version = normalizeVersionOrDefault(opts.questionBankVersion, taxonomy_version);

  // Strong binding: question bank version must match taxonomy version (Cycle-1 rule).
  if (question_bank_version !== taxonomy_version) {
    throw Object.assign(new Error('question_bank_version must match taxonomy_version'), {
      code: 'INVALID_ARGS',
      details: { taxonomy_version, question_bank_version }
    });
  }

  return { topic_id, taxonomy_version, rubric_version, question_bank_version, language };
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

  if (field === 'active_profile_id' && value !== null) {
    const v = String(value);
    if (v.startsWith('p-e2e-')) {
      fail(options, {
        code: 'FORBIDDEN_TEST_PROFILE',
        message: 'p-e2e-* profiles are isolated and cannot become active_profile_id',
        details: { active_profile_id: v }
      });
    }
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
      // Permanently hide/isolated E2E test profiles from normal UX.
      .filter((e) => !e.name.startsWith('p-e2e-'))
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
      if (id.startsWith('p-e2e-')) {
        throw Object.assign(new Error('p-e2e-* profiles are isolated and cannot be activated'), {
          code: 'FORBIDDEN_TEST_PROFILE',
          details: { profile_id: id }
        });
      }
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

function sha256Hex(input: string): string {
  return createHash('sha256').update(input, 'utf8').digest('hex');
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

function safeInferredSkillTopicId(payload: any): string | null {
  const raw = payload?.topic_id;
  if (typeof raw !== 'string') return null;
  const topicId = raw.trim().toLowerCase();
  if (!topicId) return null;
  if (topicId.includes('/') || topicId.includes('\\') || topicId.includes('..')) return null;
  if (!INFERRED_SKILL_ID_RE.test(topicId)) return null;
  return topicId;
}

function inferredMapFromSnapshot(snapshot: any): Map<string, any> {
  const map = new Map<string, any>();
  const arr = Array.isArray(snapshot?.skills?.inferred) ? snapshot.skills.inferred : [];
  for (const item of arr) {
    const topicId = typeof item?.topic_id === 'string' ? item.topic_id : '';
    if (!topicId) continue;
    map.set(topicId, cloneJson(item));
  }
  return map;
}

function writeInferredMapToSnapshot(snapshot: any, map: Map<string, any>): void {
  if (!snapshot.skills || typeof snapshot.skills !== 'object') snapshot.skills = {};
  const next = Array.from(map.values()).sort((a, b) => String(a?.topic_id || '').localeCompare(String(b?.topic_id || '')));
  snapshot.skills.inferred = next;
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

  if (type === 'INFERRED_SKILL_PROPOSED') {
    const topicId = safeInferredSkillTopicId(payload);
    if (!topicId) return snapshot;
    const proficiency = typeof payload?.proficiency === 'number' ? payload.proficiency : Number(payload?.proficiency);
    const confidenceVal = payload?.confidence;
    const confidence =
      confidenceVal === undefined || confidenceVal === null
        ? null
        : (typeof confidenceVal === 'number' ? confidenceVal : Number(confidenceVal));
    const evidenceHash = typeof payload?.evidence_hash === 'string' ? payload.evidence_hash : null;

    if (!Number.isFinite(proficiency)) return snapshot;
    if (confidence !== null && !Number.isFinite(confidence)) return snapshot;

    const map = inferredMapFromSnapshot(snapshot);
    const cur = map.get(topicId);

    // Do not override confirmed skills without an explicit supersede; track as pending for review.
    if (cur && String(cur.status) === 'confirmed') {
      cur._metadata = cur._metadata || {};
      cur._metadata.pending_proposal = {
        event_id: evt?.event_id ?? null,
        version: evt?.version ?? null,
        actor: evt?.actor ?? null,
        proposed_at: evt?.created_at ?? null,
        proficiency,
        confidence: confidence ?? null,
        evidence: cloneJson(payload?.evidence ?? null),
        evidence_hash: evidenceHash
      };
      map.set(topicId, cur);
      writeInferredMapToSnapshot(snapshot, map);
      snapshot.updated_at = evt.created_at ?? snapshot.updated_at;
      return snapshot;
    }

    map.set(topicId, {
      topic_id: topicId,
      status: 'proposed',
      proficiency,
      confidence,
      evidence: cloneJson(payload?.evidence ?? null),
      evidence_hash: evidenceHash,
      last_updated: evt.created_at ?? null
    });
    writeInferredMapToSnapshot(snapshot, map);
    snapshot.updated_at = evt.created_at ?? snapshot.updated_at;
    return snapshot;
  }

  if (type === 'INFERRED_SKILL_CONFIRMED') {
    if (String(evt?.actor || '') !== 'user') return snapshot;
    const topicId = safeInferredSkillTopicId(payload);
    if (!topicId) return snapshot;
    const map = inferredMapFromSnapshot(snapshot);
    const cur = map.get(topicId);
    if (!cur || String(cur.status) !== 'proposed') return snapshot;
    cur.status = 'confirmed';
    cur.last_updated = evt.created_at ?? cur.last_updated ?? null;
    cur._metadata = cur._metadata || {};
    cur._metadata.confirmed_at = evt.created_at ?? null;
    cur._metadata.confirmed_event_id = evt?.event_id ?? null;
    map.set(topicId, cur);
    writeInferredMapToSnapshot(snapshot, map);
    snapshot.updated_at = evt.created_at ?? snapshot.updated_at;
    return snapshot;
  }

  if (type === 'INFERRED_SKILL_REJECTED') {
    if (String(evt?.actor || '') !== 'user') return snapshot;
    const topicId = safeInferredSkillTopicId(payload);
    if (!topicId) return snapshot;
    const reason = payload?.reason ?? null;
    const rejectedEvidenceHash =
      typeof payload?.rejected_evidence_hash === 'string'
        ? payload.rejected_evidence_hash
        : (typeof payload?.evidence_hash === 'string' ? payload.evidence_hash : null);

    const map = inferredMapFromSnapshot(snapshot);
    const cur = map.get(topicId) ?? { topic_id: topicId };
    cur.status = 'rejected';
    cur.last_updated = evt.created_at ?? cur.last_updated ?? null;
    cur._metadata = cur._metadata || {};
    cur._metadata.rejected_at = evt.created_at ?? null;
    cur._metadata.rejected_event_id = evt?.event_id ?? null;
    if (reason !== null) cur._metadata.rejection_reason = reason;
    if (rejectedEvidenceHash) cur._metadata.rejected_evidence_hash = rejectedEvidenceHash;
    if (cur._metadata.pending_proposal) delete cur._metadata.pending_proposal;
    map.set(topicId, cur);
    writeInferredMapToSnapshot(snapshot, map);
    snapshot.updated_at = evt.created_at ?? snapshot.updated_at;
    return snapshot;
  }

  if (type === 'INFERRED_SKILL_SUPERSEDED') {
    const topicId = safeInferredSkillTopicId(payload);
    if (!topicId) return snapshot;
    const supersededBy = typeof payload?.superseded_by_topic_id === 'string' ? payload.superseded_by_topic_id : null;
    const map = inferredMapFromSnapshot(snapshot);
    const cur = map.get(topicId) ?? { topic_id: topicId };
    cur.status = 'superseded';
    cur.last_updated = evt.created_at ?? cur.last_updated ?? null;
    cur._metadata = cur._metadata || {};
    cur._metadata.superseded_at = evt.created_at ?? null;
    cur._metadata.superseded_event_id = evt?.event_id ?? null;
    if (supersededBy) cur._metadata.superseded_by_topic_id = supersededBy;
    if (cur._metadata.pending_proposal) delete cur._metadata.pending_proposal;
    map.set(topicId, cur);
    writeInferredMapToSnapshot(snapshot, map);
    snapshot.updated_at = evt.created_at ?? snapshot.updated_at;
    return snapshot;
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

const ALLOWED_PROFILE_EVENT_TYPES = new Set([
  // Profile/core events
  'PROFILE_CREATED',
  'PRECONTEXT_CAPTURED',
  'FIELD_SET',
  'ASSERTED_SKILL_ADDED',
  'ASSERTED_SKILL_REMOVED',
  'INFERRED_SKILL_PROPOSED',
  'INFERRED_SKILL_UPDATED',
  'INFERRED_SKILL_CONFIRMED',
  'INFERRED_SKILL_REJECTED',
  'INFERRED_SKILL_SUPERSEDED',
  'ROLLBACK_TO_VERSION',
  // Assessment events (append-only, snapshot ignores them in Cycle-1)
  'ASSESSMENT_SESSION_STARTED',
  'ASSESSMENT_QUESTION_ASKED',
  'ASSESSMENT_ANSWER_RECORDED',
  'ASSESSMENT_SCORED',
  'ASSESSMENT_LEVEL_CHANGED',
  'ASSESSMENT_SESSION_SUMMARIZED'
]);

function assertAllowedProfileEventType(options: BaseOptions, type: string): void {
  if (ALLOWED_PROFILE_EVENT_TYPES.has(String(type))) return;
  fail(options, {
    code: 'INVALID_EVENT_TYPE',
    message: 'Unsupported event type (explicit whitelist enforced)',
    details: { type, allowed: Array.from(ALLOWED_PROFILE_EVENT_TYPES.values()).sort() }
  });
}

export async function learnAppendProfileEventCommand(options: AppendProfileEventOptions): Promise<void> {
  const profileId = options.profileId;
  const type = options.type;
  const actor = options.actor || 'user';
  const payloadStr = options.payload;

  if (!profileId) fail(options, { code: 'INVALID_ARGS', message: 'Missing --profile-id' });
  if (!type) fail(options, { code: 'INVALID_ARGS', message: 'Missing --type' });
  assertAllowedProfileEventType(options, String(type));

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

export async function learnAppendProfileEventsBatchCommand(options: AppendProfileEventsBatchOptions): Promise<void> {
  const profileId = options.profileId;
  const eventsStr = options.events;
  if (!profileId) fail(options, { code: 'INVALID_ARGS', message: 'Missing --profile-id' });
  if (!eventsStr) fail(options, { code: 'INVALID_ARGS', message: 'Missing --events' });

  let input: any;
  try {
    input = JSON.parse(String(eventsStr));
  } catch (err: any) {
    fail(options, { code: 'INVALID_ARGS', message: 'Invalid JSON for --events', details: err.message ?? String(err) });
  }

  const rawEvents = Array.isArray(input) ? input : null;
  if (!rawEvents) {
    fail(options, { code: 'INVALID_ARGS', message: '--events must be a JSON array', details: { got: typeof input } });
  }
  if (rawEvents.length === 0) {
    fail(options, { code: 'INVALID_ARGS', message: '--events must not be empty' });
  }

  const normalized = rawEvents.map((e, i) => {
    if (!e || typeof e !== 'object') {
      fail(options, { code: 'INVALID_ARGS', message: `events[${i}] must be an object` });
    }
    const type = String((e as any).type || '').trim();
    if (!type) fail(options, { code: 'INVALID_ARGS', message: `events[${i}].type is required` });
    assertAllowedProfileEventType(options, type);
    const actor = String((e as any).actor || 'user');
    const payload = (e as any).payload === undefined ? {} : (e as any).payload;
    if (payload !== null && typeof payload !== 'object') {
      fail(options, { code: 'INVALID_ARGS', message: `events[${i}].payload must be an object`, details: { got: typeof payload } });
    }
    return { type, actor, payload: payload ?? {} };
  });

  try {
    const result = await withLearnLock(async () => {
      const id = safeProfileIdOrThrow(profileId);
      const profilePath = join(PROFILES_DIR, `${id}.json`);
      if (!existsSync(profilePath)) throw Object.assign(new Error(`Profile not found: ${id}`), { code: 'NOT_FOUND' });

      const eventsPath = join(PROFILE_EVENTS_DIR, `${id}.ndjson`);
      const existingEvents = loadProfileEvents(id);
      const lastVersion = Number(existingEvents.length > 0 ? existingEvents[existingEvents.length - 1]?.version : 0);
      let nextVersion = Number.isFinite(lastVersion) && lastVersion > 0 ? lastVersion + 1 : 1;

      const appended: any[] = [];
      for (const e of normalized) {
        const evt = {
          event_id: generateId('evt'),
          profile_id: id,
          version: nextVersion++,
          type: e.type,
          actor: e.actor,
          created_at: nowIso(),
          payload: e.payload
        };
        appendNdjsonLine(eventsPath, evt);
        appended.push(evt);
      }

      // Update snapshot once for the entire batch (best-effort but inside lock).
      try {
        const snapshot = foldSnapshotFromEvents(id, [...existingEvents, ...appended]);
        persistSnapshot(id, snapshot);
      } catch (e: any) {
        // eslint-disable-next-line no-console
        console.warn('⚠️ Failed to update profile snapshot (batch):', e?.message || e);
      }

      return {
        ok: true,
        appended_count: appended.length,
        first_version: appended[0]?.version ?? null,
        last_version: appended.length > 0 ? appended[appended.length - 1]?.version : null
      };
    });

    print(options, { ok: true, data: result });
  } catch (err: any) {
    if (err?._exitCode === 2) {
      fail(options, { code: err.code ?? 'LOCKED', message: err.message ?? 'Locked', details: err.details }, 2);
    }
    fail(options, { code: err.code ?? 'IO_ERROR', message: err.message ?? String(err), details: err.details });
  }
}

export async function learnProposeInferredSkillCommand(options: ProposeInferredSkillOptions): Promise<void> {
  const profileId = options.profileId;
  const topicIdRaw = options.topicId;
  const proficiencyRaw = options.proficiency;
  const confidenceRaw = options.confidence;
  const evidence = options.evidence;
  const actor = options.actor || 'agent';

  if (!profileId) fail(options, { code: 'INVALID_ARGS', message: 'Missing --profile-id' });
  if (!topicIdRaw) fail(options, { code: 'INVALID_ARGS', message: 'Missing --topic-id' });
  if (proficiencyRaw === undefined) fail(options, { code: 'INVALID_ARGS', message: 'Missing --proficiency' });
  if (!evidence) fail(options, { code: 'INVALID_ARGS', message: 'Missing --evidence' });

  const proficiency = Number(proficiencyRaw);
  if (!Number.isFinite(proficiency) || proficiency < 0 || proficiency > 1) {
    fail(options, { code: 'INVALID_ARGS', message: 'Invalid --proficiency (expected 0..1)', details: { proficiency: proficiencyRaw } });
  }

  const confidence = confidenceRaw === undefined ? null : Number(confidenceRaw);
  if (confidence !== null && (!Number.isFinite(confidence) || confidence < 0 || confidence > 1)) {
    fail(options, { code: 'INVALID_ARGS', message: 'Invalid --confidence (expected 0..1)', details: { confidence: confidenceRaw } });
  }

  const evidenceHash = sha256Hex(evidence);

  try {
    const event = await withLearnLock(async () => {
      const id = safeProfileIdOrThrow(profileId);
      const topicId = safeInferredSkillIdOrThrow(topicIdRaw);
      const profilePath = join(PROFILES_DIR, `${id}.json`);
      if (!existsSync(profilePath)) throw Object.assign(new Error(`Profile not found: ${id}`), { code: 'NOT_FOUND' });

      const events = loadProfileEvents(id);

      // Enforce gating relative to current folded view (respects rollback view changes).
      const view = foldSnapshotFromEvents(id, events);
      const inferred = Array.isArray(view?.skills?.inferred) ? view.skills.inferred : [];
      const cur = inferred.find((s: any) => String(s?.topic_id || '') === topicId) ?? null;
      if (cur && String(cur.status) === 'rejected') {
        const rejectedAtIso = cur?._metadata?.rejected_at ?? cur?.last_updated ?? null;
        const rejectedAtMs = rejectedAtIso ? Date.parse(String(rejectedAtIso)) : NaN;
        const delta = Number.isFinite(rejectedAtMs) ? nowMs() - rejectedAtMs : Number.POSITIVE_INFINITY;
        const cooldownMs = 30 * 24 * 60 * 60 * 1000;
        if (delta < cooldownMs) {
          throw Object.assign(new Error('Cannot re-propose within cooldown window'), {
            code: 'COOLDOWN_ACTIVE',
            details: { topic_id: topicId, cooldown_days: 30, rejected_at: rejectedAtIso, now: nowIso() }
          });
        }
        const lastHash = typeof cur?._metadata?.rejected_evidence_hash === 'string' ? cur._metadata.rejected_evidence_hash : null;
        if (lastHash && lastHash === evidenceHash) {
          throw Object.assign(new Error('Cannot re-propose without new evidence'), {
            code: 'EVIDENCE_NOT_NEW',
            details: { topic_id: topicId, rejected_evidence_hash: lastHash }
          });
        }
      }

      const lastVersion = Number(events.length > 0 ? events[events.length - 1]?.version : 0);
      const nextVersion = Number.isFinite(lastVersion) && lastVersion > 0 ? lastVersion + 1 : 1;

      const createdAt = nowIso();
      const evt = {
        event_id: generateId('evt'),
        profile_id: id,
        version: nextVersion,
        type: 'INFERRED_SKILL_PROPOSED',
        actor,
        created_at: createdAt,
        payload: {
          topic_id: topicId,
          proficiency,
          confidence,
          evidence: [
            {
              evidence_type: 'text',
              kind: 'inferred_skill_proposal',
              timestamp: createdAt,
              summary: evidence,
              data: { topic_id: topicId }
            }
          ],
          evidence_hash: evidenceHash
        }
      };

      const eventsPath = join(PROFILE_EVENTS_DIR, `${id}.ndjson`);
      appendNdjsonLine(eventsPath, evt);

      // Update snapshot (read model) deterministically from events (best-effort but inside lock).
      try {
        const nextEvents = [...events, evt];
        const snapshot = foldSnapshotFromEvents(id, nextEvents);
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

export async function learnConfirmInferredSkillCommand(options: ConfirmInferredSkillOptions): Promise<void> {
  const profileId = options.profileId;
  const topicIdRaw = options.topicId;
  const actor = options.actor || 'user';

  if (!profileId) fail(options, { code: 'INVALID_ARGS', message: 'Missing --profile-id' });
  if (!topicIdRaw) fail(options, { code: 'INVALID_ARGS', message: 'Missing --topic-id' });
  if (actor !== 'user') fail(options, { code: 'INVALID_ARGS', message: 'Confirm must use --actor user' });

  try {
    const event = await withLearnLock(async () => {
      const id = safeProfileIdOrThrow(profileId);
      const topicId = safeInferredSkillIdOrThrow(topicIdRaw);
      const profilePath = join(PROFILES_DIR, `${id}.json`);
      if (!existsSync(profilePath)) throw Object.assign(new Error(`Profile not found: ${id}`), { code: 'NOT_FOUND' });

      const events = loadProfileEvents(id);
      const view = foldSnapshotFromEvents(id, events);
      const inferred = Array.isArray(view?.skills?.inferred) ? view.skills.inferred : [];
      const cur = inferred.find((s: any) => String(s?.topic_id || '') === topicId) ?? null;
      if (!cur || String(cur.status) !== 'proposed') {
        throw Object.assign(new Error('Cannot confirm inferred skill (expected proposed state)'), {
          code: 'INVALID_STATE',
          details: { topic_id: topicId, status: cur?.status ?? null }
        });
      }

      const lastVersion = Number(events.length > 0 ? events[events.length - 1]?.version : 0);
      const nextVersion = Number.isFinite(lastVersion) && lastVersion > 0 ? lastVersion + 1 : 1;

      const evt = {
        event_id: generateId('evt'),
        profile_id: id,
        version: nextVersion,
        type: 'INFERRED_SKILL_CONFIRMED',
        actor: 'user',
        created_at: nowIso(),
        payload: { topic_id: topicId }
      };

      const eventsPath = join(PROFILE_EVENTS_DIR, `${id}.ndjson`);
      appendNdjsonLine(eventsPath, evt);

      try {
        const nextEvents = [...events, evt];
        const snapshot = foldSnapshotFromEvents(id, nextEvents);
        persistSnapshot(id, snapshot);
      } catch (e: any) {
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

export async function learnRejectInferredSkillCommand(options: RejectInferredSkillOptions): Promise<void> {
  const profileId = options.profileId;
  const topicIdRaw = options.topicId;
  const reason = options.reason ?? null;
  const actor = options.actor || 'user';

  if (!profileId) fail(options, { code: 'INVALID_ARGS', message: 'Missing --profile-id' });
  if (!topicIdRaw) fail(options, { code: 'INVALID_ARGS', message: 'Missing --topic-id' });
  if (actor !== 'user') fail(options, { code: 'INVALID_ARGS', message: 'Reject must use --actor user' });

  try {
    const event = await withLearnLock(async () => {
      const id = safeProfileIdOrThrow(profileId);
      const topicId = safeInferredSkillIdOrThrow(topicIdRaw);
      const profilePath = join(PROFILES_DIR, `${id}.json`);
      if (!existsSync(profilePath)) throw Object.assign(new Error(`Profile not found: ${id}`), { code: 'NOT_FOUND' });

      const events = loadProfileEvents(id);
      const view = foldSnapshotFromEvents(id, events);
      const inferred = Array.isArray(view?.skills?.inferred) ? view.skills.inferred : [];
      const cur = inferred.find((s: any) => String(s?.topic_id || '') === topicId) ?? null;
      const status = cur ? String(cur.status || '') : '';
      if (!cur || (status !== 'proposed' && status !== 'confirmed')) {
        throw Object.assign(new Error('Cannot reject inferred skill (expected proposed/confirmed state)'), {
          code: 'INVALID_STATE',
          details: { topic_id: topicId, status: cur?.status ?? null }
        });
      }

      const rejectedEvidenceHash =
        typeof cur?.evidence_hash === 'string'
          ? cur.evidence_hash
          : (typeof cur?._metadata?.pending_proposal?.evidence_hash === 'string' ? cur._metadata.pending_proposal.evidence_hash : null);

      const lastVersion = Number(events.length > 0 ? events[events.length - 1]?.version : 0);
      const nextVersion = Number.isFinite(lastVersion) && lastVersion > 0 ? lastVersion + 1 : 1;

      const evt = {
        event_id: generateId('evt'),
        profile_id: id,
        version: nextVersion,
        type: 'INFERRED_SKILL_REJECTED',
        actor: 'user',
        created_at: nowIso(),
        payload: {
          topic_id: topicId,
          reason,
          rejected_evidence_hash: rejectedEvidenceHash
        }
      };

      const eventsPath = join(PROFILE_EVENTS_DIR, `${id}.ndjson`);
      appendNdjsonLine(eventsPath, evt);

      try {
        const nextEvents = [...events, evt];
        const snapshot = foldSnapshotFromEvents(id, nextEvents);
        persistSnapshot(id, snapshot);
      } catch (e: any) {
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

export async function learnResolvePackKeyCommand(options: ResolvePackKeyOptions): Promise<void> {
  const topicId = options.topicId;
  if (!topicId) fail(options, { code: 'INVALID_ARGS', message: 'Missing --topic-id' });

  try {
    await ensureLearnDirs();

    const pack_key = resolvePackKeyFromOptionsOrThrow({
      topicId,
      taxonomyVersion: options.taxonomyVersion,
      rubricVersion: options.rubricVersion,
      questionBankVersion: options.questionBankVersion,
      language: options.language
    });

    print(options, { ok: true, data: { pack_key, pack_key_hash: packKeyHash(pack_key) } });
  } catch (err: any) {
    fail(options, { code: err.code ?? 'IO_ERROR', message: err.message ?? String(err), details: err.details });
  }
}

export async function learnReadPackCommand(options: ReadPackOptions): Promise<void> {
  try {
    await ensureLearnDirs();

    let pack_key: PackKey;
    if (options.packKey) {
      try {
        const parsed = JSON.parse(String(options.packKey));
        pack_key = resolvePackKeyFromOptionsOrThrow({
          topicId: parsed?.topic_id,
          taxonomyVersion: parsed?.taxonomy_version,
          rubricVersion: parsed?.rubric_version,
          questionBankVersion: parsed?.question_bank_version,
          language: parsed?.language
        });
      } catch (err: any) {
        fail(options, { code: 'INVALID_ARGS', message: 'Invalid JSON for --pack-key', details: err.message ?? String(err) });
      }
    } else {
      if (!options.topicId) fail(options, { code: 'INVALID_ARGS', message: 'Missing --topic-id (or provide --pack-key)' });
      pack_key = resolvePackKeyFromOptionsOrThrow({
        topicId: options.topicId,
        taxonomyVersion: options.taxonomyVersion,
        rubricVersion: options.rubricVersion,
        questionBankVersion: options.questionBankVersion,
        language: options.language
      });
    }

    const packPath = packPathForKey(pack_key);
    mkdirSync(dirname(packPath), { recursive: true });

    if (!existsSync(packPath)) {
      print(options, { ok: true, data: { found: false, pack_key, pack_key_hash: packKeyHash(pack_key) } });
      return;
    }

    const pack = loadJsonFile(packPath);
    print(options, { ok: true, data: { found: true, pack_key, pack_key_hash: packKeyHash(pack_key), path: packPath, pack } });
  } catch (err: any) {
    fail(options, { code: err.code ?? 'IO_ERROR', message: err.message ?? String(err), details: err.details });
  }
}

export async function learnWritePackCommand(options: WritePackOptions): Promise<void> {
  const packStr = options.pack;
  if (!packStr) fail(options, { code: 'INVALID_ARGS', message: 'Missing --pack' });

  let pack: any;
  try {
    pack = JSON.parse(String(packStr));
  } catch (err: any) {
    fail(options, { code: 'INVALID_ARGS', message: 'Invalid JSON for --pack', details: err.message ?? String(err) });
  }

  try {
    await ensureLearnDirs();

    const key = pack?.pack_key ?? null;
    if (!key || typeof key !== 'object') {
      fail(options, { code: 'INVALID_ARGS', message: 'Pack must include pack_key object', details: { pack_key: key } });
    }

    const pack_key = resolvePackKeyFromOptionsOrThrow({
      topicId: key?.topic_id,
      taxonomyVersion: key?.taxonomy_version,
      rubricVersion: key?.rubric_version,
      questionBankVersion: key?.question_bank_version,
      language: key?.language
    });

    // Minimal shape checks (Cycle-1).
    if (!Array.isArray(pack?.questions)) {
      fail(options, { code: 'INVALID_ARGS', message: 'Pack must include questions[] array', details: { questions: pack?.questions } });
    }

    const packPath = packPathForKey(pack_key);
    mkdirSync(dirname(packPath), { recursive: true });

    // Best-effort atomic write (no schema for packs yet).
    atomicWriteJson(packPath, { ...pack, pack_key }, () => true);

    print(options, {
      ok: true,
      data: {
        pack_key,
        pack_key_hash: packKeyHash(pack_key),
        path: packPath
      }
    });
  } catch (err: any) {
    fail(options, { code: err.code ?? 'IO_ERROR', message: err.message ?? String(err), details: err.details });
  }
}

export async function learnPackStatusCommand(options: PackStatusOptions): Promise<void> {
  try {
    await ensureLearnDirs();

    let pack_key: PackKey;
    if (options.packKey) {
      let parsed: any = null;
      try {
        parsed = JSON.parse(String(options.packKey));
      } catch (err: any) {
        fail(options, { code: 'INVALID_ARGS', message: 'Invalid JSON for --pack-key', details: err.message ?? String(err) });
      }
      pack_key = resolvePackKeyFromOptionsOrThrow({
        topicId: parsed?.topic_id,
        taxonomyVersion: parsed?.taxonomy_version,
        rubricVersion: parsed?.rubric_version,
        questionBankVersion: parsed?.question_bank_version,
        language: parsed?.language
      });
    } else {
      if (!options.topicId) fail(options, { code: 'INVALID_ARGS', message: 'Missing --topic-id (or provide --pack-key)' });
      pack_key = resolvePackKeyFromOptionsOrThrow({
        topicId: options.topicId,
        taxonomyVersion: options.taxonomyVersion,
        rubricVersion: options.rubricVersion,
        questionBankVersion: options.questionBankVersion,
        language: options.language
      });
    }

    const packPath = packPathForKey(pack_key);
    mkdirSync(dirname(packPath), { recursive: true });

    if (!existsSync(packPath)) {
      print(options, {
        ok: true,
        data: {
          found: false,
          pack_key,
          pack_key_hash: packKeyHash(pack_key),
          path: packPath
        }
      });
      return;
    }

    const pack = loadJsonFile(packPath);
    const status = computePackStatusVNext(pack_key, packPath, pack);
    print(options, { ok: true, data: status });
  } catch (err: any) {
    fail(options, { code: err.code ?? 'IO_ERROR', message: err.message ?? String(err), details: err.details });
  }
}

export async function learnEnsurePackCommand(options: EnsurePackOptions): Promise<void> {
  const topicIdRaw = options.topicId;
  if (!topicIdRaw) fail(options, { code: 'INVALID_ARGS', message: 'Missing --topic-id' });

  const modeRaw = String(options.mode ?? 'auto').trim().toLowerCase();
  const mode = modeRaw === 'seed' || modeRaw === 'full' ? modeRaw : 'auto';
  const language = normalizeLanguageOrDefault(options.language);
  const seedCount = (() => {
    const n = Number(options.seedQuestions ?? 4);
    return Number.isFinite(n) && n > 0 ? Math.floor(n) : 4;
  })();
  const force = Boolean(options.force);
  const isFullJobRunner = process.env.CCW_LEARN_FULL_PACK_JOB === '1';

  type FullPackJobStatus = {
    pack_key_hash: string;
    topic_id: string;
    status: 'pending' | 'running' | 'done' | 'failed';
    created_at: string;
    updated_at: string;
    started_at?: string | null;
    completed_at?: string | null;
    attempts: number;
    error?: { code?: string; message: string } | null;
  };

  const fullPackJobStatusPath = (topic_id: string, pack_key_hash: string) =>
    join(PACKS_DIR, topic_id, 'jobs', `${pack_key_hash}.full.json`);

  const validateJob = (d: any): boolean => {
    if (!d || typeof d !== 'object') return false;
    if (typeof d.pack_key_hash !== 'string' || !d.pack_key_hash) return false;
    if (typeof d.topic_id !== 'string' || !d.topic_id) return false;
    if (!['pending', 'running', 'done', 'failed'].includes(String(d.status))) return false;
    if (typeof d.created_at !== 'string' || typeof d.updated_at !== 'string') return false;
    if (typeof d.attempts !== 'number' || !Number.isFinite(d.attempts) || d.attempts < 0) return false;
    return true;
  };

  const loadJob = (p: string): FullPackJobStatus | null => {
    try {
      if (!existsSync(p)) return null;
      const v = loadJsonFile(p);
      return validateJob(v) ? (v as FullPackJobStatus) : null;
    } catch {
      return null;
    }
  };

  const writeJob = (p: string, job: FullPackJobStatus): void => {
    mkdirSync(dirname(p), { recursive: true });
    atomicWriteJson(p, job, validateJob);
  };

  const parseJsonFromText = (raw: string): any => {
    const s = String(raw ?? '').trim();
    if (!s) throw new Error('Empty generator output');
    try {
      return JSON.parse(s);
    } catch {
      // continue
    }
    const fence = s.match(/```(?:json)?\s*([\s\S]*?)```/i);
    if (fence) return JSON.parse(fence[1].trim());
    const objStart = s.indexOf('{');
    const objEnd = s.lastIndexOf('}');
    if (objStart >= 0 && objEnd > objStart) {
      try {
        return JSON.parse(s.slice(objStart, objEnd + 1));
      } catch {
        // ignore
      }
    }
    const arrStart = s.indexOf('[');
    const arrEnd = s.lastIndexOf(']');
    if (arrStart >= 0 && arrEnd > arrStart) {
      try {
        return JSON.parse(s.slice(arrStart, arrEnd + 1));
      } catch {
        // ignore
      }
    }
    throw new Error('Failed to parse JSON from generator output');
  };

  const learnPackGeneratorMode = (): 'gemini' | 'deterministic' => {
    const raw = String(process.env.CCW_LEARN_PACK_GENERATOR ?? 'gemini').trim().toLowerCase();
    if (raw === 'deterministic' || raw === 'off' || raw === 'none') return 'deterministic';
    return 'gemini';
  };

  const runGeminiJson = (prompt: string, timeoutMs: number): any => {
    const ccwScript = process.argv[1];
    const res = spawnSync(
      process.execPath,
      [
        ccwScript,
        'cli',
        '--tool',
        'gemini',
        '--mode',
        'analysis',
        '--category',
        'internal',
        '--raw',
        '--final',
        '-p',
        prompt
      ],
      { cwd: PROJECT_ROOT, env: process.env, encoding: 'utf8', timeout: timeoutMs }
    );
    if (res.error) throw res.error;
    if (res.status !== 0) {
      throw Object.assign(new Error(`Gemini CLI failed (status=${res.status})`), {
        code: 'GEMINI_FAILED',
        details: { stdout: res.stdout, stderr: res.stderr }
      });
    }
    return parseJsonFromText(String(res.stdout || res.stderr || ''));
  };

  try {
    await ensureLearnDirs();
    const topic_id = safeInferredSkillIdOrThrow(String(topicIdRaw));

    // Derive pack_key from taxonomy topic entry when available; otherwise fall back to v0 defaults.
    const index = loadTaxonomyIndex();
    const topic = index.topics.find((t) => t.topic_id === topic_id) ?? null;
    const taxonomy_version = topic?.taxonomy_version ?? 'v0';
    const rubric_version = topic?.rubric_version ?? 'v0';

    const pack_key = resolvePackKeyFromOptionsOrThrow({
      topicId: topic_id,
      taxonomyVersion: taxonomy_version,
      rubricVersion: rubric_version,
      questionBankVersion: taxonomy_version,
      language
    });

    const pack_key_hash = packKeyHash(pack_key);
    const packPath = packPathForKey(pack_key);
    mkdirSync(dirname(packPath), { recursive: true });

    const desiredKind: 'seed' | 'full' = (() => {
      if (mode === 'seed') return 'seed';
      if (mode === 'full') return 'full';
      // auto
      if (topic && topic.status !== 'provisional') return 'full';
      return 'seed';
    })();

    // Fast path: read existing status under lock.
    const existingStatus = await withLearnLock(async () => {
      if (!existsSync(packPath)) return null;
      const existing = loadJsonFile(packPath);
      return computePackStatusVNext(pack_key, packPath, existing);
    });

    const shouldWrite = (() => {
      if (force) return true;
      if (!existingStatus) return true;
      if (desiredKind === 'seed') return false;
      // desired full
      return !existingStatus.full_completeness;
    })();

    const generatorMode = learnPackGeneratorMode();

    // Helper: minimal pack shape validation.
    const validatePackWrite = (d: any): boolean => {
      try {
        const key = (d as any)?.pack_key;
        resolvePackKeyFromOptionsOrThrow({
          topicId: key?.topic_id,
          taxonomyVersion: key?.taxonomy_version,
          rubricVersion: key?.rubric_version,
          questionBankVersion: key?.question_bank_version,
          language: key?.language
        });
        return Array.isArray((d as any)?.questions);
      } catch {
        return false;
      }
    };

    const validateSeedPackOrThrow = (pack: any): void => {
      if (!pack || typeof pack !== 'object') throw new Error('seed pack: expected object');
      if (pack.pack_kind !== 'seed') throw new Error('seed pack: pack_kind must be seed');
      const qs = Array.isArray(pack.questions) ? pack.questions : null;
      if (!qs || qs.length !== 4) throw new Error('seed pack: questions must be length=4');
      const required = [0.25, 0.45, 0.65, 0.85];
      const got = new Set<number>();
      for (const q of qs) {
        if (!q || typeof q !== 'object') throw new Error('seed pack: question must be object');
        if (typeof q.prompt !== 'string' || !q.prompt.trim()) throw new Error('seed pack: question.prompt required');
        if (typeof q.difficulty !== 'number' || !Number.isFinite(q.difficulty)) throw new Error('seed pack: question.difficulty required');
        got.add(Number(q.difficulty));
        if (!['see', 'explain', 'apply', 'debug'].includes(String(q.capability_node))) {
          throw new Error('seed pack: question.capability_node invalid');
        }
        if (!Array.isArray(q.common_mistakes) || q.common_mistakes.length === 0) {
          throw new Error('seed pack: question.common_mistakes[] required');
        }
        if (typeof q.grading_notes !== 'string' || !q.grading_notes.trim()) {
          throw new Error('seed pack: question.grading_notes required');
        }
      }
      // Difficulty set must match (order may differ).
      for (const d of required) {
        const found = Array.from(got.values()).some((x) => Math.abs(x - d) < 1e-6);
        if (!found) throw new Error(`seed pack: missing difficulty ${d}`);
      }

      // If taxonomy exists, require >=2 must subpoints covered.
      const sps = Array.isArray(pack?.taxonomy?.subpoints) ? pack.taxonomy.subpoints : [];
      const mustIds = new Set<string>(
        sps
          .filter((sp: any) => sp?.priority === 'must')
          .map((sp: any) => String(sp?.id || '').trim())
          .filter((x: string) => Boolean(x))
      );
      if (mustIds.size > 0) {
        const covered = new Set<string>();
        for (const q of qs) for (const sid of q?.subpoint_ids || []) covered.add(String(sid));
        const mustCovered = [...mustIds].filter((id) => covered.has(id)).length;
        if (mustCovered < 2) throw new Error(`seed pack: must coverage too low (mustCovered=${mustCovered})`);
      }
    };

    const generateSeedPackGemini = (): PackVNext => {
      const subpoints = defaultSubpointsForTopic(topic_id);
      const prompt =
        `You are generating a seed assessment pack for cross-domain skill evaluation.\\n` +
        `Return ONLY valid JSON (no markdown).\\n\\n` +
        `TOPIC_ID: ${topic_id}\\nLANGUAGE: ${language}\\n` +
        `PACK_KEY: ${JSON.stringify(pack_key)}\\n` +
        `TAXONOMY_SUBPOINTS: ${JSON.stringify(subpoints)}\\n\\n` +
        `REQUIREMENTS:\\n` +
        `- Output a Pack object with pack_kind='seed' and pack_key exactly matching PACK_KEY.\\n` +
        `- questions must be exactly 4.\\n` +
        `- capability_node set: ['see','explain','apply','debug'] (each used once).\\n` +
        `- difficulty set: [0.25,0.45,0.65,0.85] (each used once, order can vary).\\n` +
        `- each question MUST include: id, prompt, level (1..5), difficulty (0..1), capability_node, subpoint_ids, common_mistakes (non-empty array), grading_notes (non-empty string).\\n` +
        `- if must subpoints exist, ensure at least 2 must subpoints are covered across the 4 questions.\\n\\n` +
        `OUTPUT_SCHEMA (example keys only):\\n` +
        `{ \"pack_key\": PACK_KEY, \"topic_id\": \"${topic_id}\", \"taxonomy_version\": \"${taxonomy_version}\", \"rubric_version\": \"${rubric_version}\", \"question_bank_version\": \"${taxonomy_version}\", \"language\": \"${language}\", \"created_at\": \"ISO\", \"pack_kind\": \"seed\", \"taxonomy\": {\"subpoints\": TAXONOMY_SUBPOINTS}, \"questions\": [ ... ], \"regression_cases\": [], \"_metadata\": {\"generator\":\"gemini\"} }\\n`;

      const out = runGeminiJson(prompt, Number(process.env.CCW_LEARN_SEED_GEMINI_TIMEOUT_MS ?? 45000));
      validateSeedPackOrThrow(out);
      return out as PackVNext;
    };

    const validateFullPackOrThrow = (pack: any): void => {
      if (!pack || typeof pack !== 'object') throw new Error('full pack: expected object');
      if (pack.pack_kind !== 'full') throw new Error('full pack: pack_kind must be full');
      const qs = Array.isArray(pack.questions) ? pack.questions : null;
      if (!qs || qs.length < 8) throw new Error('full pack: questions must be a non-trivial array');
      const regs = Array.isArray(pack.regression_cases) ? pack.regression_cases : null;
      if (!regs || regs.length < 30) throw new Error('full pack: regression_cases must be >=30');

      const sps = Array.isArray(pack?.taxonomy?.subpoints) ? pack.taxonomy.subpoints : [];
      const mustIds = new Set<string>(
        sps
          .filter((sp: any) => sp?.priority === 'must')
          .map((sp: any) => String(sp?.id || '').trim())
          .filter((x: string) => Boolean(x))
      );
      const coreIds = new Set<string>(
        sps
          .filter((sp: any) => sp?.priority === 'core')
          .map((sp: any) => String(sp?.id || '').trim())
          .filter((x: string) => Boolean(x))
      );
      if (mustIds.size === 0 || coreIds.size === 0) throw new Error('full pack: taxonomy must include must/core subpoints');

      const covered = new Set<string>();
      for (const q of qs) for (const sid of q?.subpoint_ids || []) covered.add(String(sid));
      const mustCovered = [...mustIds].filter((id) => covered.has(id)).length;
      const coreCovered = [...coreIds].filter((id) => covered.has(id)).length;
      if (mustCovered !== mustIds.size) throw new Error('full pack: must subpoints not 100% covered by questions');
      if (coreCovered !== coreIds.size) throw new Error('full pack: core subpoints not 100% covered by questions');
    };

    const generateFullPackGemini = (): PackVNext => {
      const subpoints = defaultSubpointsForTopic(topic_id);
      const prompt =
        `You are generating a FULL assessment pack for cross-domain skill evaluation.\\n` +
        `Return ONLY valid JSON (no markdown).\\n\\n` +
        `TOPIC_ID: ${topic_id}\\nLANGUAGE: ${language}\\n` +
        `PACK_KEY: ${JSON.stringify(pack_key)}\\n` +
        `TAXONOMY_SUBPOINTS: ${JSON.stringify(subpoints)}\\n\\n` +
        `REQUIREMENTS:\\n` +
        `- Output a Pack object with pack_kind='full' and pack_key exactly matching PACK_KEY.\\n` +
        `- Include taxonomy.subpoints exactly as TAXONOMY_SUBPOINTS (or a superset, but must keep must/core).\\n` +
        `- questions[] MUST cover 100% of must+core subpoint ids via subpoint_ids.\\n` +
        `- Provide multiple difficulties per important subpoint when possible.\\n` +
        `- regression_cases[] must be >= 30 (skeleton ok).\\n` +
        `- Each question should include id, prompt, level (1..5), difficulty (0..1), capability_node, subpoint_ids.\\n\\n` +
        `OUTPUT_SCHEMA (example keys only):\\n` +
        `{ \"pack_key\": PACK_KEY, \"topic_id\": \"${topic_id}\", \"taxonomy_version\": \"${taxonomy_version}\", \"rubric_version\": \"${rubric_version}\", \"question_bank_version\": \"${taxonomy_version}\", \"language\": \"${language}\", \"created_at\": \"ISO\", \"pack_kind\": \"full\", \"taxonomy\": {\"subpoints\": TAXONOMY_SUBPOINTS}, \"questions\": [ ... ], \"regression_cases\": [ ... ], \"_metadata\": {\"generator\":\"gemini\"} }\\n`;

      const out = runGeminiJson(prompt, Number(process.env.CCW_LEARN_FULL_GEMINI_TIMEOUT_MS ?? 180000));
      validateFullPackOrThrow(out);
      return out as PackVNext;
    };

    const writePack = async (pack: PackVNext): Promise<void> => {
      await withLearnLock(async () => {
        atomicWriteJson(packPath, pack, validatePackWrite);
      });
    };

    const readFinalStatus = async () => {
      return await withLearnLock(async () => {
        const finalPack = loadJsonFile(packPath);
        return computePackStatusVNext(pack_key, packPath, finalPack);
      });
    };

    let job: FullPackJobStatus | null = null;

    // Full pack async job path (non-blocking).
    if (desiredKind === 'full' && generatorMode === 'gemini' && !isFullJobRunner) {
      const jobPath = fullPackJobStatusPath(topic_id, pack_key_hash);
      const existingJob = loadJob(jobPath);

      // If full already complete, return immediately (and mark job done if needed).
      if (existingStatus?.full_completeness) {
        if (!existingJob || existingJob.status !== 'done') {
          const ts = nowIso();
          writeJob(jobPath, {
            pack_key_hash,
            topic_id,
            status: 'done',
            created_at: existingJob?.created_at ?? ts,
            updated_at: ts,
            started_at: existingJob?.started_at ?? null,
            completed_at: ts,
            attempts: existingJob?.attempts ?? 0,
            error: null
          });
        }
        const status = await readFinalStatus();
        print(options, {
          ok: true,
          data: { ok: true, changed: false, desired_kind: desiredKind, pack_key, pack_key_hash, path: packPath, status, job: loadJob(jobPath) }
        });
        return;
      }

      // Start job if not running.
      if (existingJob && (existingJob.status === 'running' || existingJob.status === 'pending')) {
        job = existingJob;
      } else {
        const ts = nowIso();
        job = {
          pack_key_hash,
          topic_id,
          status: 'running',
          created_at: existingJob?.created_at ?? ts,
          updated_at: ts,
          started_at: ts,
          completed_at: null,
          attempts: (existingJob?.attempts ?? 0) + 1,
          error: null
        };
        writeJob(jobPath, job);

        // Spawn detached job runner (calls ensure-pack full with CCW_LEARN_FULL_PACK_JOB=1).
        const ccwScript = process.argv[1];
        const child = spawn(
          process.execPath,
          [
            ccwScript,
            'learn:ensure-pack',
            '--topic-id',
            topic_id,
            '--mode',
            'full',
            '--language',
            language,
            '--force',
            '--json'
          ],
          {
            cwd: PROJECT_ROOT,
            env: { ...process.env, CCW_LEARN_FULL_PACK_JOB: '1' },
            detached: true,
            stdio: 'ignore'
          }
        );
        child.unref();
      }

      // Non-blocking return: keep existing pack as-is (seed/incomplete).
      const status = existingStatus ?? (existsSync(packPath) ? await readFinalStatus() : null);
      print(options, {
        ok: true,
        data: {
          ok: true,
          changed: false,
          desired_kind: desiredKind,
          pack_key,
          pack_key_hash,
          path: packPath,
          status,
          job
        }
      });
      return;
    }

    // Synchronous write path (seed always blocking; full only when deterministic or when running as job runner).
    if (shouldWrite) {
      const desired = desiredKind;
      if (desired === 'seed') {
        let pack: PackVNext;
        if (generatorMode === 'gemini') {
          try {
            pack = generateSeedPackGemini();
          } catch (e: any) {
            pack = buildSeedPackVNext(pack_key, seedCount);
            pack._metadata = { ...(pack._metadata || {}), generator: 'deterministic_fallback', error: e?.message || String(e) };
          }
        } else {
          pack = buildSeedPackVNext(pack_key, seedCount);
        }
        await writePack(pack);
      } else {
        // full (blocking only if deterministic OR job runner)
        let pack: PackVNext;
        if (generatorMode === 'gemini') {
          try {
            pack = generateFullPackGemini();
          } catch (e: any) {
            pack = buildFullPackVNext(pack_key);
            pack._metadata = { ...(pack._metadata || {}), generator: 'deterministic_fallback', error: e?.message || String(e) };
          }
        } else {
          pack = buildFullPackVNext(pack_key);
        }
        await writePack(pack);

        // If we are the job runner (or deterministic full), mark job done.
        const jobPath = fullPackJobStatusPath(topic_id, pack_key_hash);
        const existingJob = loadJob(jobPath);
        const ts = nowIso();
        writeJob(jobPath, {
          pack_key_hash,
          topic_id,
          status: 'done',
          created_at: existingJob?.created_at ?? ts,
          updated_at: ts,
          started_at: existingJob?.started_at ?? (isFullJobRunner ? ts : null),
          completed_at: ts,
          attempts: existingJob?.attempts ?? (isFullJobRunner ? 1 : 0),
          error: null
        });
      }
    }

    const status = await readFinalStatus();
    if (desiredKind === 'full' && generatorMode === 'gemini' && isFullJobRunner) {
      // best-effort: ensure job status exists even if pack write succeeded earlier
      const jobPath = fullPackJobStatusPath(topic_id, pack_key_hash);
      job = loadJob(jobPath);
    }

    print(options, {
      ok: true,
      data: { ok: true, changed: shouldWrite, desired_kind: desiredKind, pack_key, pack_key_hash, path: packPath, status, job }
    });
  } catch (err: any) {
    if (err?._exitCode === 2) {
      fail(options, { code: err.code ?? 'LOCKED', message: err.message ?? 'Locked', details: err.details }, 2);
    }
    fail(options, { code: err.code ?? 'IO_ERROR', message: err.message ?? String(err), details: err.details });
  }
}

export async function learnResolveTopicCommand(options: ResolveTopicOptions): Promise<void> {
  const rawTopicLabel = options.rawTopicLabel;
  if (!rawTopicLabel) fail(options, { code: 'INVALID_ARGS', message: 'Missing --raw-topic-label' });

  try {
    await ensureLearnDirs();
    const index = loadTaxonomyIndex();
    const result = resolveTopicFromIndex(index, String(rawTopicLabel));
    print(options, { ok: true, data: result });
  } catch (err: any) {
    fail(options, { code: err.code ?? 'IO_ERROR', message: err.message ?? String(err), details: err.details });
  }
}

export async function learnEnsureTopicCommand(options: EnsureTopicOptions): Promise<void> {
  const rawTopicLabel = options.rawTopicLabel;
  const actor = options.actor || 'agent';
  if (!rawTopicLabel) fail(options, { code: 'INVALID_ARGS', message: 'Missing --raw-topic-label' });

  try {
    await ensureLearnDirs();

    const out = await withLearnLock(async () => {
      const index = loadTaxonomyIndex();
      const resolved = resolveTopicFromIndex(index, String(rawTopicLabel));
      if (resolved.found) return { created: false, ...resolved };
      if (resolved.ambiguous) {
        throw Object.assign(new Error('Ambiguous topic label (requires user decision)'), {
          code: 'AMBIGUOUS_TOPIC',
          details: { raw_topic_label: rawTopicLabel, candidates: resolved.candidates }
        });
      }

      const base = topicIdCandidateFromRawLabel(String(rawTopicLabel));
      if (!base) {
        throw Object.assign(new Error('Cannot derive topic_id from raw_topic_label'), {
          code: 'INVALID_ARGS',
          details: { raw_topic_label: rawTopicLabel }
        });
      }

      const byId = new Map(index.topics.map((t) => [t.topic_id, t] as const));
      const takenAliasNorm = new Set<string>();
      for (const t of index.topics) {
        for (const a of t.aliases || []) takenAliasNorm.add(normalizeTopicLabelForMatch(a));
      }

      let topic_id = base;
      for (let i = 2; byId.has(topic_id) || takenAliasNorm.has(normalizeTopicLabelForMatch(topic_id)); i += 1) {
        topic_id = safeInferredSkillIdOrThrow(`${base}_${i}`);
      }

      const ts = nowIso();
      const topic: TaxonomyTopic = {
        topic_id,
        status: 'provisional',
        aliases: [String(rawTopicLabel), topic_id],
        redirect_to_topic_id: null,
        taxonomy_version: 'v0',
        rubric_version: 'v0',
        display_name_zh: String(rawTopicLabel),
        display_name_en: String(rawTopicLabel),
        created_at: ts,
        updated_at: ts
      };

      const next: TaxonomyIndex = {
        ...index,
        updated_at: ts,
        topics: [...index.topics, topic]
      };

      atomicWriteTaxonomyIndex(next);
      appendTaxonomyChange({ action: 'ENSURE_TOPIC_CREATED', actor, topic_id, raw_topic_label: rawTopicLabel });

      // Return with the same structure as resolve-topic (created provisional).
      return {
        created: true,
        found: true,
        topic_id,
        taxonomy_version: topic.taxonomy_version,
        rubric_version: topic.rubric_version,
        resolution_source: 'provisional' as const,
        matched_topic_id: topic_id,
        matched_alias: null,
        redirect_chain: [],
        status: topic.status
      };
    });

    print(options, { ok: true, data: out });
  } catch (err: any) {
    if (err?._exitCode === 2) {
      fail(options, { code: err.code ?? 'LOCKED', message: err.message ?? 'Locked', details: err.details }, 2);
    }
    fail(options, { code: err.code ?? 'IO_ERROR', message: err.message ?? String(err), details: err.details });
  }
}

export async function learnTaxonomyAliasCommand(options: TaxonomyAliasOptions): Promise<void> {
  const topicIdRaw = options.topicId;
  const aliasRaw = options.alias;
  const actor = options.actor || 'agent';
  if (!topicIdRaw) fail(options, { code: 'INVALID_ARGS', message: 'Missing --topic-id' });
  if (!aliasRaw) fail(options, { code: 'INVALID_ARGS', message: 'Missing --alias' });

  try {
    await ensureLearnDirs();
    const result = await withLearnLock(async () => {
      const topic_id = safeInferredSkillIdOrThrow(String(topicIdRaw));
      const alias = String(aliasRaw);

      const index = loadTaxonomyIndex();
      const byId = new Map(index.topics.map((t) => [t.topic_id, t] as const));
      const topic = byId.get(topic_id);
      if (!topic) throw Object.assign(new Error(`Topic not found: ${topic_id}`), { code: 'NOT_FOUND' });

      const aliasNorm = normalizeTopicLabelForMatch(alias);
      for (const t of index.topics) {
        if (t.topic_id === topic_id) continue;
        if ((t.aliases || []).some((a) => normalizeTopicLabelForMatch(a) === aliasNorm)) {
          throw Object.assign(new Error('Alias already used by another topic'), {
            code: 'ALIAS_CONFLICT',
            details: { alias, existing_topic_id: t.topic_id }
          });
        }
      }

      const nextAliases = Array.from(new Set([...(topic.aliases || []), alias]));
      const ts = nowIso();
      const nextTopics = index.topics.map((t) =>
        t.topic_id === topic_id ? { ...t, aliases: nextAliases, updated_at: ts } : t
      );
      const next: TaxonomyIndex = { ...index, updated_at: ts, topics: nextTopics };
      atomicWriteTaxonomyIndex(next);
      appendTaxonomyChange({ action: 'ADD_ALIAS', actor, topic_id, alias });
      return { ok: true, topic_id, alias, aliases_count: nextAliases.length };
    });

    print(options, { ok: true, data: result });
  } catch (err: any) {
    if (err?._exitCode === 2) {
      fail(options, { code: err.code ?? 'LOCKED', message: err.message ?? 'Locked', details: err.details }, 2);
    }
    fail(options, { code: err.code ?? 'IO_ERROR', message: err.message ?? String(err), details: err.details });
  }
}

export async function learnTaxonomyRedirectCommand(options: TaxonomyRedirectOptions): Promise<void> {
  const fromRaw = options.fromTopicId;
  const toRaw = options.toTopicId;
  const actor = options.actor || 'agent';
  if (!fromRaw) fail(options, { code: 'INVALID_ARGS', message: 'Missing --from-topic-id' });
  if (!toRaw) fail(options, { code: 'INVALID_ARGS', message: 'Missing --to-topic-id' });

  try {
    await ensureLearnDirs();
    const result = await withLearnLock(async () => {
      const from = safeInferredSkillIdOrThrow(String(fromRaw));
      const to = safeInferredSkillIdOrThrow(String(toRaw));
      if (from === to) {
        throw Object.assign(new Error('Cannot redirect a topic to itself'), { code: 'INVALID_ARGS' });
      }

      const index = loadTaxonomyIndex();
      const byId = new Map(index.topics.map((t) => [t.topic_id, t] as const));
      if (!byId.has(from)) throw Object.assign(new Error(`Topic not found: ${from}`), { code: 'NOT_FOUND' });
      if (!byId.has(to)) throw Object.assign(new Error(`Topic not found: ${to}`), { code: 'NOT_FOUND' });

      // Prevent redirect loops by attempting resolution through the new mapping.
      const ts = nowIso();
      const nextTopics = index.topics.map((t) => {
        if (t.topic_id !== from) return t;
        return { ...t, status: 'redirect' as const, redirect_to_topic_id: to, updated_at: ts };
      });
      const next: TaxonomyIndex = { ...index, updated_at: ts, topics: nextTopics };

      // Validate that the redirect chain is sane (no loops).
      resolveRedirectChain(next, from, 'topic_id', null);

      atomicWriteTaxonomyIndex(next);
      appendTaxonomyChange({ action: 'REDIRECT', actor, from_topic_id: from, to_topic_id: to });
      return { ok: true, from_topic_id: from, to_topic_id: to };
    });

    print(options, { ok: true, data: result });
  } catch (err: any) {
    if (err?._exitCode === 2) {
      fail(options, { code: err.code ?? 'LOCKED', message: err.message ?? 'Locked', details: err.details }, 2);
    }
    fail(options, { code: err.code ?? 'IO_ERROR', message: err.message ?? String(err), details: err.details });
  }
}

export async function learnTaxonomyPromoteCommand(options: TaxonomyPromoteOptions): Promise<void> {
  const topicIdRaw = options.topicId;
  const actor = options.actor || 'agent';
  if (!topicIdRaw) fail(options, { code: 'INVALID_ARGS', message: 'Missing --topic-id' });

  try {
    await ensureLearnDirs();
    const result = await withLearnLock(async () => {
      const topic_id = safeInferredSkillIdOrThrow(String(topicIdRaw));
      const index = loadTaxonomyIndex();
      const byId = new Map(index.topics.map((t) => [t.topic_id, t] as const));
      const topic = byId.get(topic_id);
      if (!topic) throw Object.assign(new Error(`Topic not found: ${topic_id}`), { code: 'NOT_FOUND' });
      if (topic.status === 'active') return { ok: true, topic_id, status: 'active', promoted: false };
      if (topic.status !== 'provisional') {
        throw Object.assign(new Error('Only provisional topics can be promoted'), {
          code: 'INVALID_ARGS',
          details: { topic_id, status: topic.status }
        });
      }

      // Gate: regression cases >= 30.
      // We intentionally tie this to the current default pack_key derived from the topic's versions.
      const pack_key = resolvePackKeyFromOptionsOrThrow({
        topicId: topic.topic_id,
        taxonomyVersion: topic.taxonomy_version,
        rubricVersion: topic.rubric_version,
        questionBankVersion: topic.taxonomy_version,
        language: 'zh-CN'
      });
      const packPath = packPathForKey(pack_key);
      if (!existsSync(packPath)) {
        throw Object.assign(new Error('Cannot promote without a pack'), {
          code: 'PACK_NOT_FOUND',
          details: { topic_id, pack_path: packPath, pack_key }
        });
      }
      const pack = loadJsonFile(packPath);
      const regressionCount = Array.isArray(pack?.regression_cases) ? pack.regression_cases.length : Number(pack?.regression_cases_count ?? 0);
      if (!Number.isFinite(regressionCount) || regressionCount < 30) {
        throw Object.assign(new Error('Promotion requires regression cases >= 30'), {
          code: 'PROMOTION_GATE',
          details: { topic_id, regression_cases: regressionCount, required: 30 }
        });
      }

      const ts = nowIso();
      const nextTopics = index.topics.map((t) =>
        t.topic_id === topic_id ? { ...t, status: 'active' as const, updated_at: ts } : t
      );
      const next: TaxonomyIndex = { ...index, updated_at: ts, topics: nextTopics };
      atomicWriteTaxonomyIndex(next);
      appendTaxonomyChange({ action: 'PROMOTE', actor, topic_id });
      return { ok: true, topic_id, status: 'active', promoted: true };
    });

    print(options, { ok: true, data: result });
  } catch (err: any) {
    if (err?._exitCode === 2) {
      fail(options, { code: err.code ?? 'LOCKED', message: err.message ?? 'Locked', details: err.details }, 2);
    }
    fail(options, { code: err.code ?? 'IO_ERROR', message: err.message ?? String(err), details: err.details });
  }
}
