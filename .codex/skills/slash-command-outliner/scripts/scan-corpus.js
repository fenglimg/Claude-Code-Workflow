import fs from 'node:fs';
import path from 'node:path';

import { readCommandFile, toPosixPath } from './lib/command-md.js';

function usage() {
  // Keep this script dependency-free (no commander).
  console.log(
    [
      'Usage:',
      '  node .codex/skills/slash-command-outliner/scripts/scan-corpus.js --root=.claude/commands --out=corpus.json',
      '',
      'Notes:',
      '  - Excludes node_modules/ and _disabled/ directories',
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

function isExcludedDir(name) {
  return name === 'node_modules' || name === '_disabled';
}

function walkMdFiles(rootDir) {
  const out = [];
  const stack = [rootDir];
  while (stack.length) {
    const dir = stack.pop();
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const e of entries) {
      if (e.isDirectory()) {
        if (isExcludedDir(e.name)) continue;
        stack.push(path.join(dir, e.name));
        continue;
      }
      if (!e.isFile()) continue;
      if (!e.name.endsWith('.md')) continue;
      out.push(path.join(dir, e.name));
    }
  }
  out.sort();
  return out;
}

function inferGroup(commandsRootAbs, fileAbs, header) {
  if (header?.group && String(header.group).trim().length > 0) return String(header.group).trim();
  const rel = path.relative(commandsRootAbs, fileAbs);
  const parts = rel.split(path.sep);
  // If inside a subfolder, use the first segment as group.
  return parts.length >= 2 ? parts[0] : '';
}

function computeSlash(group, name) {
  return group ? `/${group}:${name}` : `/${name}`;
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args['--help']) {
    usage();
    process.exit(0);
  }

  const root = args['--root'] ? String(args['--root']) : '.claude/commands';
  const outPath = args['--out'] ? String(args['--out']) : null;

  if (!outPath) {
    usage();
    process.exit(2);
  }

  const repoRoot = process.cwd();
  const commandsRootAbs = path.resolve(repoRoot, root);
  if (!fs.existsSync(commandsRootAbs)) {
    console.error(`ERROR: commands root not found: ${commandsRootAbs}`);
    process.exit(2);
  }

  const mdFiles = walkMdFiles(commandsRootAbs);
  const commands = [];
  let ordinal = 0;
  for (const f of mdFiles) {
    ordinal += 1;
    const { header } = readCommandFile(f);
    const name = (header?.name && String(header.name).trim().length > 0)
      ? String(header.name).trim()
      : path.basename(f, '.md');
    const group = inferGroup(commandsRootAbs, f, header);
    const slash = computeSlash(group, name);
    const description = header?.description ? String(header.description) : '';
    commands.push({
      ordinal,
      name,
      group,
      slash,
      description,
      file_path: toPosixPath(path.relative(repoRoot, f)),
    });
  }

  const result = {
    schema_version: '1.0.0',
    generated_at: new Date().toISOString(),
    slash_commands_root: root,
    total_commands: commands.length,
    commands,
  };

  fs.mkdirSync(path.dirname(path.resolve(repoRoot, outPath)), { recursive: true });
  fs.writeFileSync(path.resolve(repoRoot, outPath), JSON.stringify(result, null, 2), 'utf8');

  console.log(`Wrote ${commands.length} commands -> ${outPath}`);
}

main();

