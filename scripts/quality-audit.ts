#!/usr/bin/env node
/**
 * 文档质量审计脚本（Document Quality Score，DQS）
 *
 * 功能：
 * - 对 Markdown 文档进行质量审计，并输出 DQS 评分（100 分制，5 个维度）
 * - 支持输出格式：console（彩色）、markdown、json
 * - 支持 CI 阈值：--fail-below <score>
 *
 * 运行示例：
 * - `npx ts-node scripts/quality-audit.ts`
 * - `npx ts-node scripts/quality-audit.ts "docs/(recursive)/*.md" --output markdown --fail-below 80`
 */

import * as crypto from 'node:crypto';
import * as fs from 'node:fs';
import * as path from 'node:path';
import assert from 'node:assert/strict';
import chalk from 'chalk';
import { glob } from 'glob';

export type OutputFormat = 'console' | 'markdown' | 'json';
export type IssueSeverity = 'info' | 'warn' | 'error';

export interface DocumentInput {
  filePath: string;
  content: string;
  absolutePath?: string;
}

export interface AnalyzerContext {
  repoRoot: string;
}

export interface DocumentIssue {
  analyzer: string;
  code: string;
  severity: IssueSeverity;
  message: string;
  evidence?: string;
}

export interface AnalyzerResult {
  analyzer: string;
  metrics: Record<string, unknown>;
  issues: DocumentIssue[];
}

export interface DocumentStats {
  lineCount: number;
  nonEmptyLineCount: number;
  wordCount: number;
  headingCount: number;
  codeFenceCount: number;
  linkCount: number;
  bulletLineCount: number;
  hasMermaidFence: boolean;
}

export interface DQSDimensionBreakdown {
  q1_structure: number; // 20
  q2_logic: number; // 30
  q3_scenarios: number; // 20
  q4_context: number; // 20
  q5_timeliness: number; // 10
}

export interface DQSResult {
  score: number; // 0..100
  breakdown: DQSDimensionBreakdown;
  grade: DQSGrade;
}

export type DQSGrade = 'A' | 'B' | 'C' | 'D' | 'F';

export interface FileAuditResult {
  filePath: string;
  category: string;
  stats: DocumentStats;
  analyzerResults: AnalyzerResult[];
  dqs: DQSResult;
  issues: DocumentIssue[];
}

export interface CategoryStats {
  fileCount: number;
  totalLines: number;
  avgLines: number;
  shallowCount: number;
  lowDensityCount: number;
  avgScore: number;
}

export interface AuditReport {
  timestamp: string;
  version: string;
  output: OutputFormat;
  failBelow?: number;
  fileCount: number;
  overallScore: number;
  pass: boolean;
  categories: Record<string, CategoryStats>;
  files: FileAuditResult[];
}

export interface Analyzer {
  readonly name: string;
  analyze(input: DocumentInput, ctx: AnalyzerContext): Promise<AnalyzerResult>;
}

function clamp01(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(1, value));
}

function roundInt(value: number): number {
  return Math.round(value);
}

function sha256Hex(buffer: Buffer): string {
  return crypto.createHash('sha256').update(buffer).digest('hex');
}

function normalizePath(inputPath: string): string {
  return inputPath.replace(/\\/g, '/');
}

export function computeDocumentStats(content: string): DocumentStats {
  const lines = content.split(/\r?\n/);
  const lineCount = lines.length;
  const nonEmptyLineCount = lines.filter((l) => l.trim().length > 0).length;

  const wordCount = content
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/[`*_#>[()\]-]/g, ' ')
    .split(/\s+/)
    .filter(Boolean).length;

  const headingCount = lines.filter((l) => /^\s{0,3}#{1,6}\s+\S/.test(l)).length;
  const codeFenceCount = lines.filter((l) => /^\s*```/.test(l)).length;
  const linkCount = (content.match(/\[[^\]]+]\(([^)]+)\)/g) || []).length;
  const bulletLineCount = lines.filter((l) => /^\s*(?:[-*+]\s+|\d+\.\s+)\S/.test(l)).length;
  const hasMermaidFence = /^\s*```mermaid\s*$/im.test(content);

  return {
    lineCount,
    nonEmptyLineCount,
    wordCount,
    headingCount,
    codeFenceCount,
    linkCount,
    bulletLineCount,
    hasMermaidFence,
  };
}

function makeIssue(params: Omit<DocumentIssue, 'analyzer'> & { analyzer: string }): DocumentIssue {
  return { ...params };
}

export interface LineCountResult {
  lineCount: number;
  nonEmptyLineCount: number;
  emptyLines: number;
  commentLines: number;
  isShallow: boolean;
}

export function analyzeLineCount(content: string, minLines = 50): LineCountResult {
  const lines = content.split(/\r?\n/);
  const emptyLines = lines.filter((l) => l.trim().length === 0).length;
  const commentLines = lines.filter((l) => /^\s*<!--/.test(l) || /^\s*\/\//.test(l)).length;
  const nonEmptyLineCount = lines.length - emptyLines;
  const effectiveLines = Math.max(0, nonEmptyLineCount - commentLines);
  const isShallow = effectiveLines < minLines;

  return {
    lineCount: lines.length,
    nonEmptyLineCount,
    emptyLines,
    commentLines,
    isShallow,
  };
}

/**
 * Analyzer 1: LineCountAnalyzer
 * 检测浅层文档（< 50 行）
 */
export class LineCountAnalyzer implements Analyzer {
  public readonly name = 'LineCountAnalyzer';
  private readonly minLines: number;

  /**
   * @param minLines 最小行数阈值，默认 50
   */
  constructor(minLines = 50) {
    this.minLines = minLines;
  }

  async analyze(input: DocumentInput): Promise<AnalyzerResult> {
    const res = analyzeLineCount(input.content, this.minLines);

    const issues: DocumentIssue[] = [];
    if (res.isShallow) {
      const effectiveLines = Math.max(0, res.nonEmptyLineCount - res.commentLines);
      issues.push(
        makeIssue({
          analyzer: this.name,
          code: 'line_count.too_short',
          severity: 'warn',
          message: `文档有效行数过少（${effectiveLines} 行），可能信息不足（阈值：${this.minLines} 行，空行/注释不计入）。`,
          evidence: `${input.filePath}`,
        })
      );
    }

    return {
      analyzer: this.name,
      metrics: { ...res, minLines: this.minLines },
      issues,
    };
  }
}

/**
 * Analyzer 2: KeywordDensityAnalyzer
 * 检测 mermaid/graph/json/example 关键词密度（用于推断结构化表达、示例与数据/图示）
 */
export class KeywordDensityAnalyzer implements Analyzer {
  public readonly name = 'KeywordDensityAnalyzer';
  private readonly keywords: readonly string[];

  constructor(keywords: readonly string[] = QUALITY_KEYWORDS) {
    this.keywords = keywords;
  }

  async analyze(input: DocumentInput): Promise<AnalyzerResult> {
    const stats = computeDocumentStats(input.content);
    const res = analyzeKeywordDensity(input.content, stats.wordCount, this.keywords);
    const issues: DocumentIssue[] = [];

    if (stats.wordCount >= 200 && res.isLowDensity) {
      issues.push(
        makeIssue({
          analyzer: this.name,
          code: 'keyword_density.low_density',
          severity: 'warn',
          message: `关键词密度偏低（${(res.density * 100).toFixed(2)}% < ${(LOW_DENSITY_THRESHOLD * 100).toFixed(2)}%），建议补充示例、图示或结构化表达。`,
          evidence: `${input.filePath}`,
        })
      );
    }

    return { analyzer: this.name, metrics: { ...res, keywords: this.keywords, wordCount: stats.wordCount }, issues };
  }
}

export const QUALITY_KEYWORDS = [
  'mermaid',
  'graph',
  'sequencediagram',
  'sequenceDiagram',
  'json',
  'example',
  'typescript',
  '```',
  '```mermaid',
  '```json',
  '```typescript',
] as const;

export const LOW_DENSITY_THRESHOLD = 0.02; // 2%

export interface KeywordDensityResult {
  keywordCount: number;
  density: number;
  isLowDensity: boolean;
  foundKeywords: string[];
  counts: Record<string, number>;
  totalHits: number;
}

export function analyzeKeywordDensity(
  content: string,
  wordCount: number,
  keywords: readonly string[] = QUALITY_KEYWORDS
): KeywordDensityResult {
  const contentLower = content.toLowerCase();
  const counts: Record<string, number> = {};
  for (const keyword of keywords) {
    const needle = keyword.toLowerCase();
    if (needle.startsWith('```')) {
      counts[keyword] = (contentLower.match(new RegExp(escapeRegExp(needle), 'g')) || []).length;
      continue;
    }
    const re = new RegExp(`\\b${escapeRegExp(needle)}\\b`, 'g');
    counts[keyword] = (contentLower.match(re) || []).length;
  }

  const totalHits = Object.values(counts).reduce((a, b) => a + b, 0);
  const density = wordCount > 0 ? totalHits / wordCount : 0;
  const foundKeywords = Object.entries(counts)
    .filter(([, v]) => v > 0)
    .map(([k]) => k)
    .sort();

  return {
    keywordCount: totalHits,
    density,
    isLowDensity: density < LOW_DENSITY_THRESHOLD,
    foundKeywords,
    counts,
    totalHits,
  };
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Analyzer 3: BoilerplateDetector
 * 检测常见占位符：<arguments>, [TODO], *Auto-generated*
 */
export class BoilerplateDetector implements Analyzer {
  public readonly name = 'BoilerplateDetector';

  async analyze(input: DocumentInput): Promise<AnalyzerResult> {
    const issues: DocumentIssue[] = [];
    const matches: Record<string, number> = {
      '<arguments>': (input.content.match(/<arguments>/gi) || []).length,
      '[TODO]': (input.content.match(/\[TODO\]/g) || []).length,
      'Auto-generated': (input.content.match(/auto-generated/gi) || []).length,
    };

    if (matches['<arguments>'] > 0) {
      issues.push(
        makeIssue({
          analyzer: this.name,
          code: 'boilerplate.arguments',
          severity: 'error',
          message: '检测到占位符 `<arguments>`，可能未替换为真实内容。',
        })
      );
    }
    if (matches['[TODO]'] > 0) {
      issues.push(
        makeIssue({
          analyzer: this.name,
          code: 'boilerplate.todo',
          severity: 'warn',
          message: '检测到占位符 `[TODO]`，建议补全或移除。',
        })
      );
    }
    if (matches['Auto-generated'] > 0) {
      issues.push(
        makeIssue({
          analyzer: this.name,
          code: 'boilerplate.autogenerated',
          severity: 'info',
          message: '检测到 `Auto-generated` 标记，建议配套 `source-path/source-hash` 确保同步。',
        })
      );
    }

    return {
      analyzer: this.name,
      metrics: { matches },
      issues,
    };
  }
}

export type SourceHashStatus = 'missing' | 'verified' | 'mismatch' | 'unverifiable';

export interface SourceHashMetrics {
  status: SourceHashStatus;
  sourcePath?: string;
  expectedHash?: string;
  actualHash?: string;
  docMtimeMs?: number;
  sourceMtimeMs?: number;
  deltaDays?: number;
  algorithm: 'sha256';
}

/**
 * Analyzer 4: SourceHashVerifier
 * 验证 `<!-- source-hash: xxx -->` 与 `<!-- source-path: path -->` 的同步状态。
 *
 * 约定：
 * - `source-path`：相对 repoRoot 的文件路径（支持带空格的引号包裹）
 * - `source-hash`：sha256 十六进制，可为前缀（>= 8 位）
 */
export class SourceHashVerifier implements Analyzer {
  public readonly name = 'SourceHashVerifier';

  async analyze(input: DocumentInput, ctx: AnalyzerContext): Promise<AnalyzerResult> {
    const issues: DocumentIssue[] = [];
    const metrics: SourceHashMetrics = { status: 'missing', algorithm: 'sha256' };

    const sourcePathRaw = extractHtmlCommentValue(input.content, 'source-path');
    const expectedHashRaw = extractHtmlCommentValue(input.content, 'source-hash');

    if (!sourcePathRaw && !expectedHashRaw) {
      return { analyzer: this.name, metrics, issues };
    }

    if (!sourcePathRaw || !expectedHashRaw) {
      metrics.status = 'unverifiable';
      if (sourcePathRaw) metrics.sourcePath = sourcePathRaw;
      if (expectedHashRaw) metrics.expectedHash = expectedHashRaw;
      issues.push(
        makeIssue({
          analyzer: this.name,
          code: 'source_hash.unverifiable',
          severity: 'warn',
          message: '检测到 `source-path/source-hash` 只存在其一，无法验证同步状态。',
          evidence: `${input.filePath}`,
        })
      );
      return { analyzer: this.name, metrics, issues };
    }

    const sourcePath = stripOptionalQuotes(sourcePathRaw.trim());
    const expectedHash = expectedHashRaw.trim().toLowerCase();
    metrics.sourcePath = sourcePath;
    metrics.expectedHash = expectedHash;

    const resolvedSource = path.resolve(ctx.repoRoot, sourcePath);
    if (!fs.existsSync(resolvedSource) || !fs.statSync(resolvedSource).isFile()) {
      metrics.status = 'unverifiable';
      issues.push(
        makeIssue({
          analyzer: this.name,
          code: 'source_hash.source_missing',
          severity: 'warn',
          message: `source-path 指向的文件不存在或不是文件：${normalizePath(sourcePath)}`,
          evidence: `${input.filePath}`,
        })
      );
      return { analyzer: this.name, metrics, issues };
    }

    try {
      if (input.absolutePath && fs.existsSync(input.absolutePath)) {
        metrics.docMtimeMs = fs.statSync(input.absolutePath).mtimeMs;
      }
      metrics.sourceMtimeMs = fs.statSync(resolvedSource).mtimeMs;
      if (metrics.docMtimeMs !== undefined && metrics.sourceMtimeMs !== undefined) {
        const diffMs = metrics.sourceMtimeMs - metrics.docMtimeMs;
        const deltaDays = diffMs > 0 ? Math.floor(diffMs / (24 * 60 * 60 * 1000)) : 0;
        metrics.deltaDays = deltaDays;
      }
    } catch {
      // ignore mtime failures; hash verification remains available
    }

    const actualHash = sha256Hex(fs.readFileSync(resolvedSource));
    metrics.actualHash = actualHash;

    const minPrefixLen = 8;
    if (expectedHash.length < minPrefixLen) {
      metrics.status = 'unverifiable';
      issues.push(
        makeIssue({
          analyzer: this.name,
          code: 'source_hash.hash_too_short',
          severity: 'warn',
          message: `source-hash 长度过短（${expectedHash.length}），至少需要 ${minPrefixLen} 位以进行前缀匹配。`,
          evidence: `${input.filePath}`,
        })
      );
      return { analyzer: this.name, metrics, issues };
    }

    const match = actualHash.startsWith(expectedHash);
    metrics.status = match ? 'verified' : 'mismatch';

    if (!match) {
      issues.push(
        makeIssue({
          analyzer: this.name,
          code: 'source_hash.mismatch',
          severity: 'error',
          message: `source-hash 不匹配（expected: ${expectedHash}，actual: ${actualHash.slice(0, expectedHash.length)}...）。`,
          evidence: `${input.filePath} -> ${normalizePath(sourcePath)}`,
        })
      );
    }

    return { analyzer: this.name, metrics, issues };
  }
}

function extractHtmlCommentValue(content: string, key: string): string | undefined {
  const re = new RegExp(`<!--\\s*${key}\\s*:\\s*([\\s\\S]*?)\\s*-->`, 'i');
  const match = content.match(re);
  if (!match) return undefined;
  return match[1]?.trim() || undefined;
}

function stripOptionalQuotes(value: string): string {
  if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
    return value.slice(1, -1);
  }
  return value;
}

/**
 * Analyzer 5: DQSScorer
 *
 * DQS 分数计算（100 分制，5 个维度）：
 * - Q1 结构：20 分
 * - Q2 逻辑：30 分
 * - Q3 场景：20 分
 * - Q4 上下文：20 分
 * - Q5 时效：10 分
 */
export class DQSScorer {
  public readonly name = 'DQSScorer';

  score(input: DocumentInput, stats: DocumentStats, analyzerResults: AnalyzerResult[]): { dqs: DQSResult; issues: DocumentIssue[] } {
    const issues: DocumentIssue[] = [];

    const lineAnalyzer = analyzerResults.find((r) => r.analyzer === 'LineCountAnalyzer');
    const keywordAnalyzer = analyzerResults.find((r) => r.analyzer === 'KeywordDensityAnalyzer');
    const boilerAnalyzer = analyzerResults.find((r) => r.analyzer === 'BoilerplateDetector');
    const sourceHashAnalyzer = analyzerResults.find((r) => r.analyzer === 'SourceHashVerifier');

    const shallow = Boolean(lineAnalyzer?.metrics?.isShallow ?? lineAnalyzer?.metrics?.shallow);
    const keywordCounts = ((keywordAnalyzer?.metrics?.counts as Record<string, number> | undefined) ?? {}) as Record<string, number>;
    const keywordTotalHits = Number((keywordAnalyzer?.metrics?.keywordCount as number | undefined) ?? (keywordAnalyzer?.metrics?.totalHits as number | undefined) ?? 0);
    const boilerMatches = ((boilerAnalyzer?.metrics?.matches as Record<string, number> | undefined) ?? {}) as Record<string, number>;
    const sourceMetrics = (sourceHashAnalyzer?.metrics as SourceHashMetrics | undefined);
    const sourceStatus = sourceMetrics?.status ?? 'missing';
    const deltaDays = sourceMetrics?.deltaDays;

    const q1 = this.scoreStructureBySections(input.content);
    const q2 = this.scoreLogicDepth(input.content, stats);
    const q3 = this.scoreScenarios(input.content, stats);
    const q4 = this.scoreContext(stats, sourceStatus);
    const q5 = this.scoreTimeliness(sourceStatus, deltaDays);

    const breakdown: DQSDimensionBreakdown = {
      q1_structure: q1,
      q2_logic: q2,
      q3_scenarios: q3,
      q4_context: q4,
      q5_timeliness: q5,
    };

    const score = q1 + q2 + q3 + q4 + q5;
    assert(score >= 0 && score <= 100, 'DQS score must be within 0..100');
    const grade = gradeFromScore(score);

    if (!shallow && (stats.lineCount >= 100 || stats.wordCount >= 400) && keywordTotalHits === 0) {
      issues.push(
        makeIssue({
          analyzer: this.name,
          code: 'dqs.low_structure_signals',
          severity: 'warn',
          message: '长文档缺少结构化信号（示例/图示/数据），可能影响可读性与可操作性。',
          evidence: `${input.filePath}`,
        })
      );
    }
    if (q1 < 10) {
      issues.push(
        makeIssue({
          analyzer: this.name,
          code: 'dqs.low_q1',
          severity: 'warn',
          message: 'Q1（结构）得分偏低，建议补充标题层级、清单与分段。',
          evidence: `${input.filePath}`,
        })
      );
    }
    if (q2 < 15) {
      issues.push(
        makeIssue({
          analyzer: this.name,
          code: 'dqs.low_q2',
          severity: 'warn',
          message: 'Q2（逻辑深度）得分偏低，建议补充 Mermaid 图、代码片段或阶段拆解。',
          evidence: `${input.filePath}`,
        })
      );
    }
    if (q3 < 10) {
      issues.push(
        makeIssue({
          analyzer: this.name,
          code: 'dqs.low_q3',
          severity: 'warn',
          message: 'Q3（场景）得分偏低，建议增加示例、用法或边界条件说明。',
          evidence: `${input.filePath}`,
        })
      );
    }
    if (q5 === 0 && sourceStatus !== 'missing') {
      issues.push(
        makeIssue({
          analyzer: this.name,
          code: 'dqs.q5_out_of_sync',
          severity: 'warn',
          message: 'Q5（时效）为 0：文档与源文件更新差距超过 7 天，或 source-hash 不匹配。',
          evidence: `${input.filePath}`,
        })
      );
    }

    return { dqs: { score, breakdown, grade }, issues };
  }

  private scoreStructureBySections(content: string): number {
    const sections: Array<{ key: string; patterns: RegExp[] }> = [
      { key: 'overview', patterns: [/^#{1,6}\s+overview\b/im, /^#{1,6}\s+概述\b/im] },
      { key: 'capabilities', patterns: [/^#{1,6}\s+capabilities\b/im, /^#{1,6}\s+核心能力\b/im] },
      { key: 'flow', patterns: [/^#{1,6}\s+flow\b/im, /^#{1,6}\s+流程\b/im, /^#{1,6}\s+工作流\b/im] },
      { key: 'scenarios', patterns: [/^#{1,6}\s+scenarios\b/im, /^#{1,6}\s+使用场景\b/im, /^#{1,6}\s+场景\b/im, /^#{1,6}\s+use cases?\b/im] },
      { key: 'best_practices', patterns: [/^#{1,6}\s+best practices\b/im, /^#{1,6}\s+最佳实践\b/im] },
    ];
    const present = sections.filter((s) => s.patterns.some((p) => p.test(content))).length;
    return present * 4; // 20
  }

  private scoreLogicDepth(content: string, stats: DocumentStats): number {
    const mermaid = stats.hasMermaidFence ? 10 : 0;
    const code = stats.codeFenceCount >= 4 ? 10 : stats.codeFenceCount >= 2 ? 7 : stats.codeFenceCount >= 1 ? 3 : 0;
    const hasPhaseSignals =
      /(^|\n)\s*(?:phase\s*\d+|阶段\s*\d+|step\s*\d+)\b/im.test(content) ||
      /^#{1,6}\s+.*(?:phase|阶段|步骤拆解|步骤|step)\b/im.test(content);
    const phaseScore = hasPhaseSignals ? 10 : stats.bulletLineCount >= 10 ? 6 : 0;
    return mermaid + code + phaseScore; // 30
  }

  private scoreScenarios(content: string, stats: DocumentStats): number {
    const scenarioSignals = countScenarioSignals(content);
    const scenarios = scenarioSignals >= 2 ? 10 : scenarioSignals >= 1 ? 5 : 0;
    const runnableExamples = hasRunnableExamples(content, stats.codeFenceCount) ? 10 : 0;
    return scenarios + runnableExamples; // 20
  }

  private scoreContext(stats: DocumentStats, sourceStatus: SourceHashStatus): number {
    const relatedLinks = stats.linkCount >= 3 ? 10 : stats.linkCount >= 1 ? 5 : 0;
    const sourceLinks = sourceStatus === 'verified' ? 10 : sourceStatus === 'mismatch' ? 0 : sourceStatus === 'unverifiable' ? 5 : 0;
    return relatedLinks + sourceLinks; // 20
  }

  private scoreTimeliness(status: SourceHashStatus, deltaDays?: number): number {
    if (status === 'mismatch') return 0;
    if (deltaDays === undefined) return 0;
    if (deltaDays <= 3) return 10;
    if (deltaDays <= 7) return 5;
    return 0;
  }
}

function gradeFromScore(score: number): DQSGrade {
  if (score >= 80) return 'A';
  if (score >= 70) return 'B';
  if (score >= 60) return 'C';
  if (score >= 50) return 'D';
  return 'F';
}

function countScenarioSignals(content: string): number {
  const headings = (content.match(/^#{1,6}\s+.*$/gm) || []).map((h) => h.toLowerCase());
  const headingSignals = headings.filter((h) => /(场景|scenario|use case)/.test(h)).length;
  const inlineSignals = (content.match(/场景\s*\d+/g) || []).length + (content.match(/\bscenario\s*\d+/gi) || []).length;
  return Math.max(headingSignals, inlineSignals);
}

function hasRunnableExamples(content: string, codeFenceCount: number): boolean {
  if (codeFenceCount <= 0) return false;
  return /\b(ccw|npm|npx|node|pnpm|yarn)\b\s+\S+/i.test(content);
}

function severityRank(sev: IssueSeverity): number {
  return sev === 'error' ? 3 : sev === 'warn' ? 2 : 1;
}

function colorizeScore(score: number): (text: string) => string {
  if (score >= 85) return chalk.green;
  if (score >= 70) return chalk.yellow;
  return chalk.red;
}

function formatConsole(report: AuditReport): string {
  const lines: string[] = [];
  const overallColor = colorizeScore(report.overallScore);

  lines.push(chalk.bold('DQS 文档质量审计报告'));
  lines.push(`- 时间：${report.timestamp}`);
  lines.push(`- 文件数：${report.fileCount}`);
  lines.push(`- 总分：${overallColor(String(report.overallScore))} / 100（${gradeFromScore(report.overallScore)}）`);
  if (report.failBelow !== undefined) {
    lines.push(`- 阈值：${report.failBelow}（${report.pass ? chalk.green('PASS') : chalk.red('FAIL')}）`);
  } else {
    lines.push(`- 状态：${chalk.cyan('INFO')}（未设置 --fail-below）`);
  }
  const categoryNames = Object.keys(report.categories).sort();
  if (categoryNames.length > 0) {
    lines.push(`- 分类：${categoryNames.join(', ')}`);
  }

  lines.push('');
  for (const file of report.files) {
    const fileColor = colorizeScore(file.dqs.score);
    lines.push(`${fileColor(String(file.dqs.score).padStart(3, ' '))}  ${normalizePath(file.filePath)}  ${chalk.dim(`(${file.dqs.grade})`)}`);
    lines.push(
      chalk.dim(
        `     Q1:${file.dqs.breakdown.q1_structure}/20 ` +
          `Q2:${file.dqs.breakdown.q2_logic}/30 ` +
          `Q3:${file.dqs.breakdown.q3_scenarios}/20 ` +
          `Q4:${file.dqs.breakdown.q4_context}/20 ` +
          `Q5:${file.dqs.breakdown.q5_timeliness}/10`
      )
    );

    const issues = file.issues
      .slice()
      .sort((a, b) => severityRank(b.severity) - severityRank(a.severity));
    for (const issue of issues.slice(0, 6)) {
      const tag =
        issue.severity === 'error' ? chalk.red('ERROR') :
        issue.severity === 'warn' ? chalk.yellow('WARN') :
        chalk.cyan('INFO');
      lines.push(`     - [${tag}] ${issue.analyzer}:${issue.code} ${issue.message}`);
    }
    if (issues.length > 6) {
      lines.push(chalk.dim(`     … 还有 ${issues.length - 6} 条问题未显示`));
    }
    lines.push('');
  }

  return lines.join('\n');
}

function formatMarkdown(report: AuditReport): string {
  const lines: string[] = [];
  lines.push('# DQS 文档质量审计报告', '');
  lines.push(`- 时间：${report.timestamp}`);
  lines.push(`- 文件数：${report.fileCount}`);
  lines.push(`- 总分：${report.overallScore} / 100（${gradeFromScore(report.overallScore)}）`);
  if (report.failBelow !== undefined) {
    lines.push(`- 阈值：${report.failBelow}（${report.pass ? 'PASS' : 'FAIL'}）`);
  }
  lines.push('');

  lines.push('## 分类汇总', '');
  lines.push('| 分类 | 文件数 | 平均行数 | 浅层文档 | 低密度 | 平均分 |');
  lines.push('|---|---:|---:|---:|---:|---:|');
  for (const [name, s] of Object.entries(report.categories).sort(([a], [b]) => a.localeCompare(b))) {
    lines.push(`| ${name} | ${s.fileCount} | ${s.avgLines} | ${s.shallowCount} | ${s.lowDensityCount} | ${s.avgScore} |`);
  }
  lines.push('');

  lines.push('## 文件汇总', '');
  lines.push('| 文件 | DQS | Q1 | Q2 | Q3 | Q4 | Q5 | 问题数 |');
  lines.push('|---|---:|---:|---:|---:|---:|---:|---:|');
  for (const file of report.files) {
    const b = file.dqs.breakdown;
    lines.push(
      `| ${normalizePath(file.filePath)} | ${file.dqs.score} (${file.dqs.grade}) | ${b.q1_structure} | ${b.q2_logic} | ${b.q3_scenarios} | ${b.q4_context} | ${b.q5_timeliness} | ${file.issues.length} |`
    );
  }
  lines.push('');

  lines.push('## 详情', '');
  for (const file of report.files) {
    const b = file.dqs.breakdown;
    lines.push(`### ${normalizePath(file.filePath)}`, '');
    lines.push(`- DQS：${file.dqs.score} / 100`);
    lines.push(`- 维度：Q1 ${b.q1_structure}/20，Q2 ${b.q2_logic}/30，Q3 ${b.q3_scenarios}/20，Q4 ${b.q4_context}/20，Q5 ${b.q5_timeliness}/10`);
    lines.push('');
    if (file.issues.length === 0) {
      lines.push('- ✅ 未发现问题', '');
      continue;
    }
    lines.push('| 严重性 | 分析器 | 代码 | 描述 |');
    lines.push('|---|---|---|---|');
    for (const issue of file.issues) {
      lines.push(`| ${issue.severity} | ${issue.analyzer} | ${issue.code} | ${escapeMarkdownTable(issue.message)} |`);
    }
    lines.push('');
  }
  return lines.join('\n');
}

function escapeMarkdownTable(text: string): string {
  return text.replace(/\|/g, '\\|').replace(/\r?\n/g, ' ');
}

function formatJson(report: AuditReport): string {
  return JSON.stringify(report, null, 2);
}

interface ParsedArgs {
  output: OutputFormat;
  failBelow?: number;
  inputs: string[];
  help: boolean;
  verbose: boolean;
}

function parseArgs(argv: string[]): ParsedArgs {
  let output: OutputFormat = 'console';
  let failBelow: number | undefined;
  const inputs: string[] = [];
  let help = false;
  let verbose = false;

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === '--help' || arg === '-h') {
      help = true;
      continue;
    }
    if (arg === '--verbose' || arg === '-v') {
      verbose = true;
      continue;
    }

    const eqIndex = arg.indexOf('=');
    const flag = eqIndex >= 0 ? arg.slice(0, eqIndex) : arg;
    const inlineValue = eqIndex >= 0 ? arg.slice(eqIndex + 1) : undefined;

    if (flag === '--output' || flag === '-o') {
      const value = inlineValue ?? argv[++i];
      if (!value) throw new Error('Missing value for --output');
      if (value !== 'console' && value !== 'markdown' && value !== 'json') {
        throw new Error(`Invalid --output value: ${value}`);
      }
      output = value;
      continue;
    }

    if (flag === '--fail-below') {
      const value = inlineValue ?? argv[++i];
      if (!value) throw new Error('Missing value for --fail-below');
      const parsed = Number(value);
      if (!Number.isFinite(parsed) || parsed < 0 || parsed > 100) {
        throw new Error(`Invalid --fail-below value: ${value} (expected 0..100)`);
      }
      failBelow = parsed;
      continue;
    }

    if (flag.startsWith('-')) {
      throw new Error(`Unknown option: ${flag}`);
    }

    inputs.push(arg);
  }

  return { output, failBelow, inputs, help, verbose };
}

function usage(): string {
  return [
    'Usage:',
    '  npx ts-node scripts/quality-audit.ts [inputs...] [--output console|markdown|json] [--fail-below <score>]',
    '',
    'Inputs:',
    '  - 支持文件路径、目录路径或 glob（例如 docs/**/*.md）。',
    '  - 若不提供 inputs，默认审计仓库根目录 *.md 与 docs/**/*.md（若存在）。',
    '',
    'Options:',
    '  --output, -o     输出格式（默认 console）',
    '  --fail-below     CI 阈值，若 overallScore < 阈值则退出码为 1',
    '  --help, -h       显示帮助',
    '  --verbose, -v    输出更多信息（未来扩展）',
    '',
  ].join('\n');
}

async function resolveTargetFiles(repoRoot: string, inputs: string[]): Promise<string[]> {
  const ignore = [
    '**/node_modules/**',
    '**/.git/**',
    '**/dist/**',
    '**/.next/**',
    '**/build/**',
    '**/coverage/**',
  ];

  const patterns: string[] = [];
  const addDefaultPatterns = () => {
    patterns.push('*.md', 'README*.md');
    if (fs.existsSync(path.join(repoRoot, 'docs')) && fs.statSync(path.join(repoRoot, 'docs')).isDirectory()) {
      patterns.push('docs/**/*.{md,mdx}');
    }
  };

  if (inputs.length === 0) {
    addDefaultPatterns();
  } else {
    for (const raw of inputs) {
      const candidate = path.resolve(repoRoot, raw);
      if (fs.existsSync(candidate) && fs.statSync(candidate).isDirectory()) {
        const rel = normalizePath(path.relative(repoRoot, candidate));
        patterns.push(`${rel}/**/*.{md,mdx}`);
        continue;
      }
      patterns.push(raw);
    }
  }

  const matches = await glob(patterns, { cwd: repoRoot, ignore, nodir: true, dot: true });
  const unique = Array.from(new Set(matches)).sort();
  return unique;
}

export async function auditDocuments(params: {
  repoRoot: string;
  files: string[];
  output: OutputFormat;
  failBelow?: number;
}): Promise<AuditReport> {
  const { repoRoot, files, output, failBelow } = params;
  const timestamp = new Date().toISOString();
  const version = '1.0.0';

  const ctx: AnalyzerContext = { repoRoot };
  const analyzers: Analyzer[] = [
    new LineCountAnalyzer(),
    new KeywordDensityAnalyzer(),
    new BoilerplateDetector(),
    new SourceHashVerifier(),
  ];
  const scorer = new DQSScorer();

  const results: FileAuditResult[] = [];
  const categories: Record<string, CategoryStats> = {};

  for (const filePath of files) {
    const absolutePath = path.resolve(repoRoot, filePath);
    let content = '';
    const fileIssues: DocumentIssue[] = [];

    try {
      content = fs.readFileSync(absolutePath, 'utf-8');
    } catch (err) {
      fileIssues.push(
        makeIssue({
          analyzer: 'Reader',
          code: 'reader.failed',
          severity: 'error',
          message: `读取文件失败：${err instanceof Error ? err.message : String(err)}`,
          evidence: normalizePath(filePath),
        })
      );
    }

    const stats = computeDocumentStats(content);
    const analyzerResults: AnalyzerResult[] = [];
    for (const analyzer of analyzers) {
      try {
        analyzerResults.push(await analyzer.analyze({ filePath, content, absolutePath }, ctx));
      } catch (err) {
        analyzerResults.push({
          analyzer: analyzer.name,
          metrics: { error: err instanceof Error ? err.message : String(err) },
          issues: [
            makeIssue({
              analyzer: analyzer.name,
              code: 'analyzer.failed',
              severity: 'error',
              message: `Analyzer 执行失败：${err instanceof Error ? err.message : String(err)}`,
              evidence: normalizePath(filePath),
            }),
          ],
        });
      }
    }

    const { dqs, issues: scoreIssues } = scorer.score({ filePath, content }, stats, analyzerResults);
    const issues = [...fileIssues, ...analyzerResults.flatMap((r) => r.issues), ...scoreIssues].sort(
      (a, b) => severityRank(b.severity) - severityRank(a.severity)
    );

    const category = categorizePath(filePath);
    const lineMetrics = analyzerResults.find((r) => r.analyzer === 'LineCountAnalyzer')?.metrics as
      | { nonEmptyLineCount?: number; commentLines?: number; isShallow?: boolean }
      | undefined;
    const keywordMetrics = analyzerResults.find((r) => r.analyzer === 'KeywordDensityAnalyzer')?.metrics as
      | { isLowDensity?: boolean }
      | undefined;

    const cat = categories[category] ?? {
      fileCount: 0,
      totalLines: 0,
      avgLines: 0,
      shallowCount: 0,
      lowDensityCount: 0,
      avgScore: 0,
    };
    cat.fileCount += 1;
    cat.totalLines += stats.lineCount;
    if (lineMetrics?.isShallow) cat.shallowCount += 1;
    if (keywordMetrics?.isLowDensity && stats.wordCount >= 200) cat.lowDensityCount += 1;
    cat.avgLines = roundInt(cat.totalLines / Math.max(1, cat.fileCount));
    categories[category] = cat;

    results.push({
      filePath,
      category,
      stats,
      analyzerResults,
      dqs,
      issues,
    });
  }

  const totalLines = results.reduce((sum, r) => sum + Math.max(1, r.stats.lineCount), 0);
  const overallScore = roundInt(
    results.reduce((sum, r) => sum + r.dqs.score * Math.max(1, r.stats.lineCount), 0) / Math.max(1, totalLines)
  );
  const pass = failBelow !== undefined ? overallScore >= failBelow : true;

  for (const [name, s] of Object.entries(categories)) {
    const filesInCategory = results.filter((r) => r.category === name);
    const weightedLines = filesInCategory.reduce((sum, r) => sum + Math.max(1, r.stats.lineCount), 0);
    const score = roundInt(
      filesInCategory.reduce((sum, r) => sum + r.dqs.score * Math.max(1, r.stats.lineCount), 0) / Math.max(1, weightedLines)
    );
    categories[name] = { ...s, avgScore: score, avgLines: s.avgLines };
  }

  return {
    timestamp,
    version,
    output,
    failBelow,
    fileCount: results.length,
    overallScore,
    pass,
    categories,
    files: results,
  };
}

function categorizePath(filePath: string): string {
  const p = normalizePath(filePath);
  const kb = p.match(/^docs\/knowledge-base\/([^/]+)\//);
  if (kb) return kb[1];
  if (p.startsWith('docs/')) return 'docs';
  return 'root';
}

async function main() {
  const repoRoot = process.cwd();
  process.stdout.on('error', (err: NodeJS.ErrnoException) => {
    if (err && err.code === 'EPIPE') {
      process.exit(0);
    }
  });
  const parsed = parseArgs(process.argv.slice(2));
  if (parsed.help) {
    console.log(usage());
    return;
  }

  const targetFiles = await resolveTargetFiles(repoRoot, parsed.inputs);
  if (targetFiles.length === 0) {
    console.error(chalk.red('未找到任何目标 Markdown 文件。'));
    console.error(usage());
    process.exitCode = 1;
    return;
  }

  const report = await auditDocuments({
    repoRoot,
    files: targetFiles,
    output: parsed.output,
    failBelow: parsed.failBelow,
  });

  try {
    fs.writeFileSync(path.join(repoRoot, 'scripts', 'quality-report.json'), formatJson(report));
    fs.writeFileSync(path.join(repoRoot, 'scripts', 'quality-report.md'), formatMarkdown(report));
  } catch (err) {
    process.stderr.write(`Warning: failed to write report files: ${err instanceof Error ? err.message : String(err)}\n`);
  }

  const outputText =
    parsed.output === 'json' ? formatJson(report) :
    parsed.output === 'markdown' ? formatMarkdown(report) :
    formatConsole(report);

  process.stdout.write(`${outputText}\n`);

  if (parsed.failBelow !== undefined && !report.pass) {
    process.stderr.write(`\n${chalk.red(`❌ DQS 低于阈值：${report.overallScore} < ${parsed.failBelow}`)}\n`);
    process.exitCode = 1;
  }
}

function isCliInvocation(): boolean {
  const scriptPath = path.resolve(process.cwd(), 'scripts', 'quality-audit.ts');
  const argv = process.argv.slice(0, 4).filter(Boolean).map((p) => path.resolve(p));
  return argv.includes(scriptPath);
}

if (isCliInvocation()) {
  main().catch((err) => {
    process.stderr.write(`Error: ${err instanceof Error ? err.message : String(err)}\n`);
    process.exit(1);
  });
}
