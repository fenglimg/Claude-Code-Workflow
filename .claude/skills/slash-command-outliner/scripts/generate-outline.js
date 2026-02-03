import fs from 'node:fs';
import path from 'node:path';

import { renderOutlineFromSpec, writeText } from './lib/pipeline.js';
import { findImplementationHints } from './lib/implementation-hints.js';

function usage() {
  console.log(
    [
      'Usage:',
      '  node .claude/skills/slash-command-outliner/scripts/generate-outline.js --spec=spec.json --out=outline.md',
      '    [--tooling-manifest=tooling.json]',
      '',
      'Generates a CCW-aligned slash command outline deterministically (no LLM).',
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
  const outPath = args['--out'] ? String(args['--out']) : null;
  const toolingManifestPath = args['--tooling-manifest'] ? String(args['--tooling-manifest']) : null;
  if (!specPath || !outPath) {
    usage();
    process.exit(2);
  }

  const repoRoot = process.cwd();
  const spec = JSON.parse(fs.readFileSync(path.resolve(repoRoot, specPath), 'utf8'));
  if (!spec?.command?.name) {
    console.error('ERROR: invalid spec: missing command.name');
    process.exit(2);
  }

  if (toolingManifestPath) {
    const tooling = JSON.parse(fs.readFileSync(path.resolve(repoRoot, toolingManifestPath), 'utf8'));
    spec.implementation = spec.implementation || {};
    spec.implementation.command_doc = spec.implementation.command_doc || spec.derived_from || 'TBD';
    spec.implementation.code_pointers = findImplementationHints({
      repoRoot,
      derivedFrom: spec.derived_from,
      command: spec.command,
      toolingManifest: tooling,
      maxResults: 10,
    });
  }

  const md = renderOutlineFromSpec(spec);
  writeText(repoRoot, outPath, md);
  console.log(`Wrote outline -> ${outPath}`);
}

main();
