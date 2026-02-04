import fs from 'node:fs';
import path from 'node:path';

import {
  computeGapReport,
  deriveSpecFromCommandFile,
  renderOutlineFromSpec,
  writeJson,
  writeText,
} from './lib/pipeline.js';
import { findImplementationHints } from './lib/implementation-hints.js';
import { enforceSnapshotGate, ensureDir } from './lib/snapshots.js';

function usage() {
  console.log(
    [
      'Usage:',
      '  node .claude/skills/slash-command-outliner/scripts/regress-all.js --cycle-id=<id>',
      '',
      'Behavior:',
      '  - Reads corpus manifest from .workflow/.cycle/<id>.progress/corpus/corpus-manifest.json',
      '  - For each command: derive spec (headings-only), generate outline, produce gap-report',
      '  - Writes outputs under the cycle progress folder',
      '',
      'Options:',
      '  --cycle-id=<id>           required',
      '  --limit=<n>               optional (for smoke runs)',
      '  --update-expected         optional (overwrite expected snapshots when they differ)',
      '  --no-gate                 optional (generate diffs but do not fail the run)',
    ].join('\n')
  );
}

function parseArgs(argv) {
  const args = {};
  for (const a of argv) {
    if (!a.startsWith('--')) continue;
    const [k, v] = a.split('=');
    args[k] = v ?? true;
  }
  return args;
}

function normalizeManifestPath(p) {
  // manifest may contain Windows backslashes
  return String(p).replaceAll('\\', '/');
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args['--help']) {
    usage();
    process.exit(0);
  }

  const cycleId = args['--cycle-id'] ? String(args['--cycle-id']) : null;
  const limit = args['--limit'] ? Number(args['--limit']) : null;
  const updateExpected = Boolean(args['--update-expected']);
  const gateEnabled = !Boolean(args['--no-gate']);
  if (!cycleId) {
    usage();
    process.exit(2);
  }
  if (limit !== null && (!Number.isFinite(limit) || limit <= 0)) {
    console.error('ERROR: --limit must be a positive number');
    process.exit(2);
  }

  const repoRoot = process.cwd();
  const cycleDir = path.resolve(repoRoot, '.workflow/.cycle', `${cycleId}.progress`);
  const corpusManifestPath = path.join(cycleDir, 'corpus', 'corpus-manifest.json');
  const toolingManifestPath = path.join(cycleDir, 'corpus', 'tooling-manifest.json');

  if (!fs.existsSync(corpusManifestPath)) {
    console.error(`ERROR: corpus manifest not found: ${corpusManifestPath}`);
    process.exit(2);
  }
  if (!fs.existsSync(toolingManifestPath)) {
    console.error(`ERROR: tooling manifest not found: ${toolingManifestPath}`);
    process.exit(2);
  }

  const corpus = JSON.parse(fs.readFileSync(corpusManifestPath, 'utf8'));
  const tooling = JSON.parse(fs.readFileSync(toolingManifestPath, 'utf8'));

  const reportsDir = path.join(cycleDir, 'reports');
  const derivedSpecsDir = path.join(cycleDir, 'specs', 'derived');
  const regressionDir = path.join(cycleDir, 'regression');
  const currentDir = path.join(regressionDir, 'current');
  const expectedDir = path.join(regressionDir, 'expected');
  const diffDir = path.join(regressionDir, 'diff');
  fs.mkdirSync(reportsDir, { recursive: true });
  fs.mkdirSync(derivedSpecsDir, { recursive: true });
  fs.mkdirSync(currentDir, { recursive: true });
  fs.mkdirSync(expectedDir, { recursive: true });
  fs.mkdirSync(diffDir, { recursive: true });

  const commands = corpus?.corpus?.commands || [];
  const runCount = limit ? Math.min(limit, commands.length) : commands.length;

  let totalP0 = 0;
  let totalP1 = 0;
  let snapshotInitialized = 0;
  let snapshotDiffs = 0;
  let snapshotGateFailures = 0;

  for (let i = 0; i < runCount; i++) {
    const c = commands[i];
    const ordinal = Number(c.ordinal);
    const id = `CMD-${String(ordinal).padStart(3, '0')}`;

    const refRel = normalizeManifestPath(c.file_path);
    const refAbs = path.resolve(repoRoot, refRel);

    const spec = deriveSpecFromCommandFile(repoRoot, refRel);

    // Enrich spec with deterministic "implementation pointers" based on the tooling corpus.
    spec.implementation = spec.implementation || {};
    spec.implementation.command_doc = spec.implementation.command_doc || refRel;
    spec.implementation.code_pointers = findImplementationHints({
      repoRoot,
      derivedFrom: spec.derived_from,
      command: spec.command,
      toolingManifest: tooling,
      maxResults: 10,
    });

    const specOutRel = path.relative(repoRoot, path.join(derivedSpecsDir, `${id}.spec.json`)).replaceAll('\\', '/');
    writeJson(repoRoot, specOutRel, spec);

    const outlineMd = renderOutlineFromSpec(spec);
    const outlineOutRel = path.relative(repoRoot, path.join(currentDir, `${id}.outline.md`)).replaceAll('\\', '/');
    writeText(repoRoot, outlineOutRel, outlineMd);

    const refMd = fs.readFileSync(refAbs, 'utf8');
    const { p0, p1, implementationHints } = computeGapReport(repoRoot, spec, outlineMd, refMd, tooling);
    totalP0 += p0.length;
    totalP1 += p1.length;

    // Snapshot gate (expected vs current)
    const expectedAbs = path.join(expectedDir, `${id}.outline.md`);
    const currentAbs = path.resolve(repoRoot, outlineOutRel);
    const diffAbs = path.join(diffDir, `${id}.diff.txt`);
    ensureDir(path.dirname(expectedAbs));
    ensureDir(path.dirname(diffAbs));

    const gateResult = enforceSnapshotGate({
      expectedAbs,
      currentAbs,
      diffAbs,
      updateExpected,
    });
    if (gateResult.initialized) snapshotInitialized += 1;
    if (gateResult.changed) snapshotDiffs += 1;
    if (gateEnabled && gateResult.changed && !gateResult.updatedExpected) snapshotGateFailures += 1;

    const reportLines = [];
    reportLines.push(`# ${id} Gap Report`);
    reportLines.push('');
    reportLines.push(`- Command: ${c.slash}`);
    reportLines.push(`- Reference: \`${refRel}\``);
    reportLines.push(`- Outline (current): \`${outlineOutRel}\``);
    reportLines.push(
      `- Snapshot (expected): \`${path.relative(repoRoot, expectedAbs).replaceAll('\\', '/')}\``
    );
    reportLines.push('');
    reportLines.push('## P0');
    reportLines.push(p0.length ? p0.map((x) => `- ${x}`).join('\n') : '- None');
    reportLines.push('');
    reportLines.push('## P1');
    reportLines.push(p1.length ? p1.map((x) => `- ${x}`).join('\n') : '- None');
    reportLines.push('');
    reportLines.push('## Implementation Hints (Tooling/Server)');
    reportLines.push('');
    reportLines.push(implementationHints.length ? implementationHints.map((x) => `- \`${x}\``).join('\n') : '- None');
    reportLines.push('');

    const reportOutRel = path
      .relative(repoRoot, path.join(reportsDir, `${id}.gap.md`))
      .replaceAll('\\', '/');
    writeText(repoRoot, reportOutRel, reportLines.join('\n'));

    // Update in-memory status (write back at the end)
    c.iterations = Number(c.iterations || 0) + 1;
    c.regression = c.regression || {};
    c.regression.p0_gaps = p0.length;
    c.regression.expected_snapshot = path.relative(repoRoot, expectedAbs).replaceAll('\\', '/');
    c.regression.last_regression_at = new Date().toISOString();
    c.regression.snapshot_changed = Boolean(gateResult.changed);
    // Conservative: only mark completed when P0 is zero (P1 can be iterated later).
    if (p0.length === 0) c.status = 'completed';
  }

  corpus.generated_at = new Date().toISOString();
  writeJson(repoRoot, path.relative(repoRoot, corpusManifestPath).replaceAll('\\', '/'), corpus);

  const summary = {
    cycle_id: cycleId,
    generated_at: new Date().toISOString(),
    commands_processed: runCount,
    total_commands: commands.length,
    total_p0_gaps: totalP0,
    total_p1_gaps: totalP1,
    snapshot_initialized: snapshotInitialized,
    snapshot_diffs: snapshotDiffs,
    gate_enabled: gateEnabled,
    gate_passed: gateEnabled ? snapshotGateFailures === 0 : true,
    completed_commands: commands.filter((c) => c.status === 'completed').length,
  };
  const summaryOutRel = path
    .relative(repoRoot, path.join(cycleDir, 'reports', 'SUMMARY.json'))
    .replaceAll('\\', '/');
  writeJson(repoRoot, summaryOutRel, summary);

  console.log(
    `Done: processed=${runCount}/${commands.length} completed=${summary.completed_commands} P0=${totalP0} P1=${totalP1} snapshot_init=${snapshotInitialized} snapshot_diffs=${snapshotDiffs}`
  );

  if (gateEnabled && snapshotGateFailures > 0) {
    console.error(`ERROR: snapshot gate failed (diffs=${snapshotGateFailures}). Re-run with --update-expected to accept.`);
    process.exit(1);
  }
}

main();
