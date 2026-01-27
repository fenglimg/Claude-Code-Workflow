export type EvidenceItem =
  | string
  | {
      evidence_type: 'self-report' | 'conceptual' | 'tool-verified';
      kind: string;
      timestamp: string;
      summary?: string;
      data?: Record<string, any>;
      verification_metadata?: Record<string, any>;
    };

export interface KeywordDictionary {
  version?: string;
  aliases?: Record<string, string>;
  categories: Record<string, Record<string, string[]>>;
}

export interface ParseBackgroundOptions {
  /**
   * Hard cap to avoid pathological inputs. Defaults to 20k chars.
   * (We keep the parsing rules simple; truncation is a safe, predictable fallback.)
   */
  maxChars?: number;

  /**
   * Optional external extractor (e.g. LLM). Should return a list of raw entities/skills.
   * Must not throw (caller can wrap).
   */
  llmExtractEntities?: (args: { text: string }) => Promise<string[]>;

  /**
   * Optional external level inference (e.g. LLM). Should return per-topic scores.
   */
  llmInferLevels?: (args: {
    text: string;
    topics: string[];
  }) => Promise<Record<string, { proficiency?: number; confidence?: number; summary?: string }>>;
}

export interface InferredSkill {
  topic_id: string;
  proficiency: number;
  confidence: number;
  evidence: EvidenceItem[];
}

export interface ParseBackgroundResult {
  truncated: boolean;
  skills: InferredSkill[];
  entities: string[];
}

function nowIso(): string {
  return new Date().toISOString();
}

function clamp01(n: number): number {
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(1, n));
}

/**
 * Normalization used for dictionary lookup.
 *
 * Goals:
 * - Make "ReactJS", "react.js", "react@18", "react v18" match "react"
 * - Keep "c#" stable ("c#" => "c#")
 * - Preserve word boundaries for multi-word phrases (e.g. "machine learning")
 */
export function normalizeForLookup(input: string): string {
  const raw = String(input ?? '').toLowerCase();
  return raw
    .replace(/@v?\d+(?:\.\d+)*/g, ' ')
    .replace(/\bv?\d+(?:\.\d+)*\b/g, ' ')
    .replace(/[._]/g, '') // "node.js" -> "nodejs"
    .replace(/[^a-z0-9+#]+/g, ' ')
    .trim()
    .replace(/\s+/g, ' ');
}

function tokenizeForNgrams(text: string): string[] {
  const normalized = normalizeForLookup(text);
  if (!normalized) return [];
  return normalized.split(' ');
}

export interface KeywordIndex {
  /** normalized phrase -> canonical topic_id */
  byNormalized: Map<string, { topic_id: string; match_kind: 'direct' | 'alias' }>;
}

export function buildKeywordIndex(dict: KeywordDictionary): KeywordIndex {
  const byNormalized = new Map<string, { topic_id: string; match_kind: 'direct' | 'alias' }>();

  // Canonical topics from categories
  for (const category of Object.values(dict.categories ?? {})) {
    for (const items of Object.values(category ?? {})) {
      if (!Array.isArray(items)) continue;
      for (const topic of items) {
        const norm = normalizeForLookup(topic);
        if (!norm) continue;
        if (!byNormalized.has(norm)) byNormalized.set(norm, { topic_id: topic, match_kind: 'direct' });
      }
    }
  }

  // Aliases (explicitly override direct keys if needed)
  for (const [alias, topic_id] of Object.entries(dict.aliases ?? {})) {
    const norm = normalizeForLookup(alias);
    if (!norm) continue;
    byNormalized.set(norm, { topic_id, match_kind: 'alias' });
  }

  return { byNormalized };
}

export interface ExtractedEntity {
  entity: string;
  normalized: string;
}

/**
 * Layer 1: rule-based extraction.
 *
 * We do a conservative n-gram scan (3..1) against the dictionary index.
 */
export function extractEntities(text: string, index: KeywordIndex): ExtractedEntity[] {
  const words = tokenizeForNgrams(text);
  if (words.length === 0) return [];

  const out: ExtractedEntity[] = [];
  const seen = new Set<string>();

  for (let i = 0; i < words.length; i += 1) {
    let matched = false;

    for (const size of [3, 2, 1]) {
      if (i + size > words.length) continue;
      const phrase = words.slice(i, i + size).join(' ');
      const hit = index.byNormalized.get(phrase);
      if (!hit) continue;

      const key = `${hit.topic_id}::${phrase}`;
      if (!seen.has(key)) {
        out.push({ entity: hit.topic_id, normalized: phrase });
        seen.add(key);
      }

      i += size - 1;
      matched = true;
      break;
    }

    if (matched) continue;
  }

  return out;
}

export interface NormalizedMatch {
  topic_id: string;
  match_kind: 'direct' | 'alias';
  mentions: string[];
}

/**
 * Layer 2: normalize / dedupe extracted entities using the dictionary index.
 */
export function normalizeSkills(entities: string[], dict: KeywordDictionary): NormalizedMatch[] {
  const index = buildKeywordIndex(dict);
  const topicToMentions = new Map<string, { match_kind: 'direct' | 'alias'; mentions: Set<string> }>();

  for (const raw of entities) {
    const norm = normalizeForLookup(raw);
    if (!norm) continue;
    const hit = index.byNormalized.get(norm);
    const topic_id = hit?.topic_id ?? raw.toLowerCase();
    const match_kind = hit?.match_kind ?? 'direct';

    const entry = topicToMentions.get(topic_id) ?? { match_kind, mentions: new Set<string>() };
    // Prefer direct when mixed.
    entry.match_kind = entry.match_kind === 'direct' || match_kind === 'direct' ? 'direct' : 'alias';
    entry.mentions.add(raw);
    topicToMentions.set(topic_id, entry);
  }

  return [...topicToMentions.entries()]
    .map(([topic_id, v]) => ({ topic_id, match_kind: v.match_kind, mentions: [...v.mentions] }))
    .sort((a, b) => a.topic_id.localeCompare(b.topic_id));
}

function yearsToProficiency(years: number): number {
  if (!Number.isFinite(years) || years <= 0) return 0.4;
  if (years <= 1) return 0.45;
  if (years <= 3) return 0.55;
  if (years <= 6) return 0.7;
  return 0.85;
}

function estimateYears(text: string): number | null {
  const raw = String(text ?? '');
  const m = raw.match(/(\d{1,2})\s*\+?\s*(?:years?|yrs?|年)\b/i);
  if (!m) return null;
  const n = Number(m[1]);
  return Number.isFinite(n) ? n : null;
}

function keywordBoost(text: string): number {
  const t = normalizeForLookup(text);
  if (!t) return 0;

  // Lightweight signal only; intended to keep the default conservative.
  const high = ['lead', 'leading', 'architect', 'designed', 'owned', 'shipped', 'production'];
  const low = ['basic', 'beginner', 'learning', 'familiar', 'heard'];
  const hasHigh = high.some((k) => t.includes(k));
  const hasLow = low.some((k) => t.includes(k));
  if (hasHigh && !hasLow) return 0.12;
  if (hasLow && !hasHigh) return -0.12;
  return 0;
}

/**
 * Layer 3: infer proficiency + confidence from background text.
 * Rules-only path is deterministic and testable.
 */
export function inferLevels(args: {
  text: string;
  matches: NormalizedMatch[];
}): Array<NormalizedMatch & { proficiency: number; confidence: number; evidence: EvidenceItem[] }> {
  const { text, matches } = args;
  const ts = nowIso();

  const years = estimateYears(text);
  const base = yearsToProficiency(years ?? 0);
  const boost = keywordBoost(text);

  return matches.map((m) => {
    const mentionCount = m.mentions.length;
    const kindBoost = m.match_kind === 'direct' ? 0.08 : 0.04;
    const mentionBoost = Math.min(0.12, mentionCount * 0.04);

    const proficiency = clamp01(base + boost + kindBoost);
    const confidence = clamp01(0.55 + mentionBoost + (m.match_kind === 'direct' ? 0.06 : 0.02));

    const evidence: EvidenceItem[] = [
      {
        evidence_type: 'self-report',
        kind: 'background_inference',
        timestamp: ts,
        summary: 'Inferred from user-provided background text (rules-based).',
        data: {
          mentions: m.mentions,
          match_kind: m.match_kind,
          years_hint: years,
          truncated: text.length > 20000
        }
      }
    ];

    return { ...m, proficiency, confidence, evidence };
  });
}

export async function parseBackground(
  text: string,
  dict: KeywordDictionary,
  opts: ParseBackgroundOptions = {}
): Promise<ParseBackgroundResult> {
  const maxChars = Number.isFinite(opts.maxChars) && (opts.maxChars ?? 0) > 0 ? (opts.maxChars as number) : 20000;
  const raw = String(text ?? '');
  const truncated = raw.length > maxChars;
  const clipped = truncated ? raw.slice(0, maxChars) : raw;

  const index = buildKeywordIndex(dict);
  const extracted = extractEntities(clipped, index);
  const entities = extracted.map((e) => e.normalized);

  // Optional LLM extraction (merged, but never required).
  if (opts.llmExtractEntities) {
    try {
      const llm = await opts.llmExtractEntities({ text: clipped });
      if (Array.isArray(llm)) entities.push(...llm.map((v) => String(v)));
    } catch {
      // ignore: graceful degradation
    }
  }

  const normalizedMatches = normalizeSkills(entities, dict);
  const rules = inferLevels({ text: clipped, matches: normalizedMatches });

  // Optional LLM levels (combined).
  let llmLevels: Record<string, { proficiency?: number; confidence?: number; summary?: string }> | null = null;
  if (opts.llmInferLevels && normalizedMatches.length > 0) {
    try {
      llmLevels = await opts.llmInferLevels({ text: clipped, topics: normalizedMatches.map((m) => m.topic_id) });
    } catch {
      llmLevels = null;
    }
  }

  const skills: InferredSkill[] = rules
    .map((r) => {
      const llm = llmLevels?.[r.topic_id];
      const llmProf = clamp01(Number(llm?.proficiency ?? 0));
      const llmConf = clamp01(Number(llm?.confidence ?? 0));

      const proficiency = llmLevels ? clamp01(llmProf * 0.7 + r.proficiency * 0.3) : r.proficiency;
      const confidence = llmLevels ? clamp01(Math.min(llmConf || 1, r.confidence)) : r.confidence;

      const evidence = [...r.evidence];
      if (llmLevels && llm) {
        evidence.push({
          evidence_type: 'self-report',
          kind: 'background_inference_llm',
          timestamp: nowIso(),
          summary: llm.summary ?? 'LLM-assisted inference.',
          data: { topic_id: r.topic_id, proficiency: llmProf, confidence: llmConf }
        });
      }

      return {
        topic_id: r.topic_id,
        proficiency,
        confidence,
        evidence
      };
    })
    .filter((s) => s.topic_id && Number.isFinite(s.proficiency));

  return { truncated, skills, entities };
}

