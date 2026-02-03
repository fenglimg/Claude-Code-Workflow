import fs from 'node:fs';
import path from 'node:path';

import { computeGapReport, writeText } from './lib/pipeline.js';

function usage() {
  console.log(
    [
      'Usage:',
      '  node .codex/skills/slash-command-outliner/scripts/gap-report.js \\',
      '    --spec=spec.json --outline=outline.md --reference=.claude/commands/workflow/plan.md \\',
      '    --tooling-manifest=tooling.json --out=gap-report.md',
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

function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args['--help']) {
    usage();
    process.exit(0);
  }

  const specPath = args['--spec'] ? String(args['--spec']) : null;
  const outlinePath = args['--outline'] ? String(args['--outline']) : null;
  const referencePath = args['--reference'] ? String(args['--reference']) : null;
  const toolingManifestPath = args['--tooling-manifest'] ? String(args['--tooling-manifest']) : null;
  const outPath = args['--out'] ? String(args['--out']) : null;

  if (!specPath || !outlinePath || !referencePath || !toolingManifestPath || !outPath) {
    usage();
    process.exit(2);
  }

  const repoRoot = process.cwd();
  const spec = JSON.parse(fs.readFileSync(path.resolve(repoRoot, specPath), 'utf8'));

  const outlineMd = fs.readFileSync(path.resolve(repoRoot, outlinePath), 'utf8');
  const refMd = fs.readFileSync(path.resolve(repoRoot, referencePath), 'utf8');
  const tooling = JSON.parse(fs.readFileSync(path.resolve(repoRoot, toolingManifestPath), 'utf8'));
  const { p0, p1, implementationHints } = computeGapReport(repoRoot, spec, outlineMd, refMd, tooling);

  const lines = [];
  lines.push(`# Gap Report: ${spec?.command?.group ? `${spec.command.group}:` : ''}${spec?.command?.name || ''}`);
  lines.push('');
  lines.push('## Reference');
  lines.push('');
  lines.push(`- Reference file: \`${referencePath}\``);
  lines.push('');
  lines.push('## P0 Gaps (Must Fix)');
  lines.push('');
  lines.push(p0.length ? p0.map((x) => `- ${x}`).join('\n') : '- None');
  lines.push('');
  lines.push('## P1 Gaps (Should Fix)');
  lines.push('');
  lines.push(p1.length ? p1.map((x) => `- ${x}`).join('\n') : '- None');
  lines.push('');
  lines.push('## Implementation Hints (Tooling/Server)');
  lines.push('');
  lines.push(implementationHints.length ? implementationHints.map((f) => `- \`${f}\``).join('\n') : '- None');
  lines.push('');
  writeText(repoRoot, outPath, lines.join('\n'));
  console.log(`Wrote gap-report -> ${outPath}`);
}

main();
