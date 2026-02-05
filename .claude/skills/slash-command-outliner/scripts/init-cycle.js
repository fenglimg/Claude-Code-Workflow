import fs from 'node:fs';
import path from 'node:path';

import { readCommandFile, toPosixPath } from './lib/command-md.js';
import { writeJson, writeText } from './lib/pipeline.js';

function usage() {
  console.log(
    [
      'Usage:',
      '  node .claude/skills/slash-command-outliner/scripts/init-cycle.js --cycle-id=<id> [--commands-root=.claude/commands]',
      '',
      'Behavior:',
      '  - Scans the slash-command corpus (.claude/commands/**/*.md)',
      '  - Creates cycle folder: .workflow/.cycle/<id>.progress/',
      '  - Writes:',
      '    - corpus/corpus-manifest.json (shape expected by regress-all.js)',
      '    - corpus/tooling-manifest.json (ccw/src tooling/server corpus file list)',
      '    - requirements/CMD-###.requirements.md (non-leaky per-command requirement)',
      '    - TODO_LIST.md (checkbox list, driven by corpus-manifest)',
      '',
      'Notes:',
      '  - This is deterministic and does NOT call any LLM.',
      '  - Re-running will overwrite manifests and regenerate requirements/TODO list.',
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

function listToolingFiles(repoRoot, roots) {
  const files = [];
  for (const r of roots) {
    const abs = path.resolve(repoRoot, r);
    if (!fs.existsSync(abs)) continue;
    const stack = [abs];
    while (stack.length) {
      const dir = stack.pop();
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      for (const e of entries) {
        const p = path.join(dir, e.name);
        if (e.isDirectory()) {
          stack.push(p);
          continue;
        }
        if (!e.isFile()) continue;
        files.push(p);
      }
    }
  }
  files.sort();
  return files.map((abs) => toPosixPath(path.relative(repoRoot, abs)));
}

function cmdIdFromOrdinal(ordinal) {
  return `CMD-${String(Number(ordinal)).padStart(3, '0')}`;
}

function renderRequirementDoc({ command, sourceFile, headings }) {
  const lines = [];
  lines.push(`# Requirement (non-leaky): ${command.slash}`);
  lines.push('');
  lines.push('## Source');
  lines.push('');
  lines.push(`- Command doc (oracle, do not paste full contents into spec): \`${sourceFile}\``);
  lines.push('');
  lines.push('## Command Identity');
  lines.push('');
  lines.push(`- group: ${command.group || '(none)'}`);
  lines.push(`- name: ${command.name}`);
  lines.push(`- description: ${command.description || 'TBD'}`);
  lines.push(`- argument-hint: ${command.argument_hint || ''}`);
  lines.push(`- allowed-tools: ${command.allowed_tools_csv || 'TBD'}`);
  lines.push('');
  lines.push('## Structure Hints (Headings Only)');
  lines.push('');
  lines.push(
    headings?.length
      ? headings.map((h) => `${'  '.repeat(Math.max(0, h.level - 1))}- ${h.text}`).join('\n')
      : '- (none)'
  );
  lines.push('');
  lines.push('## Hard Constraints (P0)');
  lines.push('');
  lines.push('- Do not claim a pointer is `Existing` unless it is verifiable in the repo now.');
  lines.push('- Evidence must be dual-source: docs (.claude/commands/**.md) + ts (ccw/src/**).');
  lines.push('- If unsure, mark as `Planned` and add a concrete `Verify` step.');
  lines.push('');
  return lines.join('\n');
}

function renderTodoList({ cycleId, commands }) {
  const lines = [];
  lines.push(`# TODO_LIST (slash-command-outliner LLM regression)`);
  lines.push('');
  lines.push(`- Cycle: \`${cycleId}\``);
  lines.push(`- Generated at: ${new Date().toISOString()}`);
  lines.push('');
  for (const c of commands) {
    const id = cmdIdFromOrdinal(c.ordinal);
    const llmStatus = c.llm?.status || 'pending';
    const checked = llmStatus === 'passed' ? 'x' : ' ';
    lines.push(`- [${checked}] ${id} ${c.slash} (\`${c.file_path}\`)`);
    if (llmStatus !== 'passed') {
      const note = llmStatus === 'failed' ? `failed: ${c.llm?.last_error || 'see llm logs'}` : 'pending';
      lines.push(`  - ${note}`);
    }
  }
  lines.push('');
  return lines.join('\n');
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args['--help']) {
    usage();
    process.exit(0);
  }

  const cycleId = args['--cycle-id'] ? String(args['--cycle-id']) : null;
  const commandsRoot = args['--commands-root'] ? String(args['--commands-root']) : '.claude/commands';
  if (!cycleId) {
    usage();
    process.exit(2);
  }

  const repoRoot = process.cwd();
  const cycleDir = path.resolve(repoRoot, '.workflow/.cycle', `${cycleId}.progress`);
  const corpusDir = path.join(cycleDir, 'corpus');
  const reqDir = path.join(cycleDir, 'requirements');
  fs.mkdirSync(corpusDir, { recursive: true });
  fs.mkdirSync(reqDir, { recursive: true });

  const commandsRootAbs = path.resolve(repoRoot, commandsRoot);
  if (!fs.existsSync(commandsRootAbs)) {
    console.error(`ERROR: commands root not found: ${commandsRootAbs}`);
    process.exit(2);
  }

  const mdFiles = walkMdFiles(commandsRootAbs);
  const commands = [];
  let ordinal = 0;
  for (const f of mdFiles) {
    ordinal += 1;
    const { header, headings } = readCommandFile(f);
    const name =
      header?.name && String(header.name).trim().length > 0 ? String(header.name).trim() : path.basename(f, '.md');
    const group = inferGroup(commandsRootAbs, f, header);
    const slash = computeSlash(group, name);
    const description = header?.description ? String(header.description) : '';
    const argumentHint = header?.['argument-hint'] ? String(header['argument-hint']) : '';
    const allowedToolsCsv = header?.['allowed-tools'] ? String(header['allowed-tools']) : '';

    const rel = toPosixPath(path.relative(repoRoot, f));
    const cmd = {
      ordinal,
      name,
      group,
      slash,
      description,
      file_path: rel,
      argument_hint: argumentHint,
      allowed_tools_csv: allowedToolsCsv,
      status: 'pending',
      llm: { status: 'pending' },
    };
    commands.push(cmd);

    const id = cmdIdFromOrdinal(ordinal);
    const reqRel = path.relative(repoRoot, path.join(reqDir, `${id}.requirements.md`)).replaceAll('\\', '/');
    const reqMd = renderRequirementDoc({
      command: cmd,
      sourceFile: rel,
      headings: headings.map((h) => ({ level: h.level, text: h.text })),
    });
    writeText(repoRoot, reqRel, reqMd);
  }

  const corpus = {
    schema_version: '1.0.0',
    generated_at: new Date().toISOString(),
    slash_commands_root: commandsRoot,
    total_commands: commands.length,
    commands,
  };

  const corpusManifest = {
    schema_version: '1.0.0',
    generated_at: new Date().toISOString(),
    corpus,
  };

  const toolingRoots = [
    'ccw/src/server/routes',
    'ccw/src/mcp-server',
    'ccw/src/tools',
    'ccw/src/commands',
  ];
  const toolingManifest = {
    schema_version: '1.0.0',
    generated_at: new Date().toISOString(),
    roots: toolingRoots,
    files: listToolingFiles(repoRoot, toolingRoots),
  };

  writeJson(repoRoot, toPosixPath(path.relative(repoRoot, path.join(corpusDir, 'corpus-manifest.json'))), corpusManifest);
  writeJson(
    repoRoot,
    toPosixPath(path.relative(repoRoot, path.join(corpusDir, 'tooling-manifest.json'))),
    toolingManifest
  );
  writeText(repoRoot, toPosixPath(path.relative(repoRoot, path.join(cycleDir, 'TODO_LIST.md'))), renderTodoList({ cycleId, commands }));

  console.log(`OK: initialized cycle -> ${toPosixPath(path.relative(repoRoot, cycleDir))}`);
  console.log(`- commands: ${commands.length}`);
  console.log(`- wrote: corpus/corpus-manifest.json`);
  console.log(`- wrote: corpus/tooling-manifest.json`);
  console.log(`- wrote: requirements/CMD-###.requirements.md`);
  console.log(`- wrote: TODO_LIST.md`);
}

main();

