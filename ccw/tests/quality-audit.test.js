import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import crypto from 'node:crypto';

import {
  BoilerplateDetector,
  DQSScorer,
  KeywordDensityAnalyzer,
  LineCountAnalyzer,
  SourceHashVerifier,
  auditDocuments,
  computeDocumentStats,
} from '../../scripts/quality-audit.ts';

function sha256Hex(buffer) {
  return crypto.createHash('sha256').update(buffer).digest('hex');
}

describe('quality-audit analyzers', () => {
  it('LineCountAnalyzer flags shallow docs (<50 lines)', async () => {
    const analyzer = new LineCountAnalyzer(50);
    const content = Array.from({ length: 10 }, (_, i) => `line ${i + 1}`).join('\n');
    const result = await analyzer.analyze({ filePath: 'doc.md', content }, { repoRoot: process.cwd() });
    assert.equal(result.analyzer, 'LineCountAnalyzer');
    assert.equal(result.metrics.isShallow, true);
    assert.ok(result.issues.some((i) => i.code === 'line_count.too_short'));
  });

  it('KeywordDensityAnalyzer counts mermaid/graph/json/example', async () => {
    const analyzer = new KeywordDensityAnalyzer();
    const content = [
      '# Title',
      '',
      'Example: show json output',
      '',
      '```mermaid',
      'graph TD;',
      '```',
    ].join('\n');

    const result = await analyzer.analyze({ filePath: 'doc.md', content }, { repoRoot: process.cwd() });
    assert.equal(result.analyzer, 'KeywordDensityAnalyzer');
    assert.equal(result.metrics.counts.mermaid, 1);
    assert.equal(result.metrics.counts.graph, 1);
    assert.equal(result.metrics.counts.json, 1);
    assert.equal(result.metrics.counts.example, 1);
  });

  it('BoilerplateDetector detects placeholders', async () => {
    const analyzer = new BoilerplateDetector();
    const content = 'Usage: <arguments>\n\n[TODO]\n\n*Auto-generated*';
    const result = await analyzer.analyze({ filePath: 'doc.md', content }, { repoRoot: process.cwd() });
    assert.equal(result.analyzer, 'BoilerplateDetector');
    assert.ok(result.issues.some((i) => i.code === 'boilerplate.arguments'));
  });

  it('SourceHashVerifier verifies source-path/source-hash (sha256 prefix allowed)', async () => {
    const repoRoot = mkdtempSync(join(tmpdir(), 'ccw-quality-audit-'));
    try {
      const sourcePath = join(repoRoot, 'src.txt');
      const sourceContent = Buffer.from('hello world\n', 'utf-8');
      writeFileSync(sourcePath, sourceContent);

      const hash = sha256Hex(sourceContent);
      const doc = `<!-- source-path: src.txt -->\n<!-- source-hash: ${hash.slice(0, 12)} -->\n`;

      const analyzer = new SourceHashVerifier();
      const result = await analyzer.analyze({ filePath: 'doc.md', content: doc }, { repoRoot });
      assert.equal(result.analyzer, 'SourceHashVerifier');
      assert.equal(result.metrics.status, 'verified');
      assert.equal(result.metrics.algorithm, 'sha256');
    } finally {
      rmSync(repoRoot, { recursive: true, force: true });
    }
  });
});

describe('quality-audit scoring', () => {
  it('DQSScorer produces 0..100 and respects Q5 verified=10', () => {
    const scorer = new DQSScorer();
    const content = [
      '# Title',
      '',
      'Example: do something',
      '',
      '```json',
      '{ "a": 1 }',
      '```',
      '',
      '```mermaid',
      'graph TD;',
      '```',
      '',
      '<!-- source-path: src.txt -->',
      '<!-- source-hash: deadbeefdead -->',
    ].join('\n');

    const stats = computeDocumentStats(content);
    const analyzerResults = [
      { analyzer: 'LineCountAnalyzer', metrics: { isShallow: false }, issues: [] },
      { analyzer: 'KeywordDensityAnalyzer', metrics: { counts: { mermaid: 1, graph: 1, json: 1, example: 1 }, totalHits: 4 }, issues: [] },
      { analyzer: 'BoilerplateDetector', metrics: { matches: { '<arguments>': 0, '[TODO]': 0 } }, issues: [] },
      { analyzer: 'SourceHashVerifier', metrics: { status: 'verified', algorithm: 'sha256', deltaDays: 0 }, issues: [] },
    ];

    const { dqs } = scorer.score({ filePath: 'doc.md', content }, stats, analyzerResults);
    assert.ok(dqs.score >= 0 && dqs.score <= 100);
    assert.equal(dqs.breakdown.q5_timeliness, 10);
    assert.equal(
      dqs.breakdown.q1_structure +
        dqs.breakdown.q2_logic +
        dqs.breakdown.q3_scenarios +
        dqs.breakdown.q4_context +
        dqs.breakdown.q5_timeliness,
      dqs.score
    );
  });

  it('auditDocuments aggregates scores and failBelow pass flag', async () => {
    const repoRoot = mkdtempSync(join(tmpdir(), 'ccw-quality-audit-run-'));
    try {
      writeFileSync(join(repoRoot, 'a.md'), '# A\n\nExample\n\n```json\n{}\n```\n');
      writeFileSync(join(repoRoot, 'b.md'), 'short\n');

      const report = await auditDocuments({
        repoRoot,
        files: ['a.md', 'b.md'],
        output: 'json',
        failBelow: 100,
      });

      assert.equal(report.fileCount, 2);
      assert.ok(report.overallScore >= 0 && report.overallScore <= 100);
      assert.equal(report.pass, false);
    } finally {
      rmSync(repoRoot, { recursive: true, force: true });
    }
  });
});
