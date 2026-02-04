import { deriveSpecFromCommandFile, writeJson } from './lib/pipeline.js';

function usage() {
  console.log(
    [
      'Usage:',
      '  node .claude/skills/slash-command-outliner/scripts/derive-spec.js --command=.claude/commands/workflow/plan.md --out=spec.json',
      '',
      'Produces a minimal, non-leaky spec JSON (frontmatter + headings only).',
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

  const commandPath = args['--command'] ? String(args['--command']) : null;
  const outPath = args['--out'] ? String(args['--out']) : null;

  if (!commandPath || !outPath) {
    usage();
    process.exit(2);
  }

  const repoRoot = process.cwd();
  const spec = deriveSpecFromCommandFile(repoRoot, commandPath);
  writeJson(repoRoot, outPath, spec);
  console.log(`Wrote spec -> ${outPath}`);
}

main();
