import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

import { writeJson, writeText } from './lib/pipeline.js';

function usage() {
  console.log(
    [
      'Usage:',
      '  node .codex/skills/slash-command-outliner/scripts/llm-regress-all.js --cycle-id=<id> [--limit=<n>] [--only=pending|failed|all]',
      '    [--llm-tool=claude|codex] [--model=<model-alias>] [--permission-mode=bypassPermissions] [--timeout-ms=600000]',
      '    [--skill-root=.claude/skills/slash-command-outliner|.codex/skills/slash-command-outliner]',
      '',
      'Behavior:',
      '  - For each command in corpus-manifest.json:',
      '    - Runs an LLM (Claude Code or Codex CLI) to execute the slash-command-outliner workflow',
      '    - Writes outputs under: .workflow/.cycle/<id>.progress/llm/CMD-###/specs/outputs/*',
      '    - Runs deterministic evidence gate (verify-evidence.js) on the generated outline + gap-report',
      '    - Updates TODO_LIST.md + corpus-manifest.json with pass/fail status',
      '',
      'Prerequisites:',
      '  - Cycle initialized with init-cycle.js (creates corpus manifests + requirements).',
      '',
      'Notes:',
      '  - This is an LLM regression loop. It is NOT deterministic and may cost API budget.',
      '  - Use --limit for small batches and rerun with --only=failed to iterate.',
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

function toPosixPath(p) {
  return String(p || '').replaceAll('\\', '/');
}

function cmdIdFromOrdinal(ordinal) {
  return `CMD-${String(Number(ordinal)).padStart(3, '0')}`;
}

function readJson(repoRoot, relPath) {
  const abs = path.resolve(repoRoot, relPath);
  return JSON.parse(fs.readFileSync(abs, 'utf8'));
}

function ensureDir(p) {
  fs.mkdirSync(p, { recursive: true });
}

function fileExists(repoRoot, relPath) {
  return fs.existsSync(path.resolve(repoRoot, relPath));
}

function renderTodoList({ cycleId, commands }) {
  const lines = [];
  lines.push(`# TODO_LIST (slash-command-outliner LLM regression)`);
  lines.push('');
  lines.push(`- Cycle: \`${cycleId}\``);
  lines.push(`- Updated at: ${new Date().toISOString()}`);
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

function buildSkillPrompt({ cycleId, cmdId, reqRel, outDirRel }) {
  // Keep this prompt strict about outputs + evidence gate.
  // This prompt is intentionally conservative: it should favor "Planned" over unverifiable "Existing".
  return [
    `Use the repo skill: slash-command-outliner (path: {{SKILL_ROOT}}).`,
    ``,
    `Cycle: ${cycleId}`,
    `Command: ${cmdId}`,
    ``,
    `Input requirement doc (non-leaky): \`${reqRel}\``,
    ``,
    `Write the following output files (create directories as needed) under \`${outDirRel}\`:`,
    `- \`${outDirRel}/spec.json\``,
    `- \`${outDirRel}/references.json\``,
    `- \`${outDirRel}/generated-slash-outline.md\``,
    `- \`${outDirRel}/generated-agent-outline.md\``,
    `- \`${outDirRel}/gap-report.md\``,
    `- \`${outDirRel}/fix-plan.md\``,
    ``,
    `Hard rules (P0):`,
    `- Follow templates: {{SKILL_ROOT}}/templates/*`,
    `- Follow gates: {{SKILL_ROOT}}/specs/quality-gates.md`,
    `- Evidence tables MUST pass: node {{SKILL_ROOT}}/scripts/verify-evidence.js`,
    `- Never label a pointer as Existing unless it is verifiable in the repo now.`,
    `- For ANY pointer row, provide dual-source evidence:`,
    `  - docs: .claude/commands/**.md / <real heading text>`,
    `  - ts: ccw/src/** / <literal anchor string present in file>`,
    `- Avoid placeholders like TBD/N/A in evidence rows; if unsure, mark as Planned and add Verify steps.`,
    ``,
    `Keep the written files concise; do not write extra files unless necessary.`,
    ``,
  ].join('\n');
}

function resolveClaudeCli() {
  // On Windows, `claude` is often a PowerShell wrapper. For reliable non-interactive execution
  // from Node, run the underlying CLI JS entrypoint via `node`.
  if (process.platform !== 'win32') return { bin: 'claude', argsPrefix: [] };

  try {
    const whereRes = spawnSync('where.exe', ['claude.cmd'], { encoding: 'utf8' });
    const first = String(whereRes.stdout || '')
      .split(/\r?\n/)
      .map((s) => s.trim())
      .filter(Boolean)[0];
    if (!first) return null;
    const baseDir = path.dirname(first);
    const cliJs = path.join(baseDir, 'node_modules', '@anthropic-ai', 'claude-code', 'cli.js');
    if (!fs.existsSync(cliJs)) return null;
    return { bin: process.execPath, argsPrefix: [cliJs] };
  } catch {
    return null;
  }
}

function runClaude({ prompt, model, permissionMode, timeoutMs }) {
  const resolved = resolveClaudeCli();
  if (!resolved) {
    return { status: null, stdout: '', stderr: '', error: new Error('Unable to resolve Claude Code CLI on Windows') };
  }

  const args = [...resolved.argsPrefix, '-p', prompt, '--permission-mode', permissionMode, '--output-format', 'text'];
  if (model) args.push('--model', model);
  const res = spawnSync(resolved.bin, args, {
    encoding: 'utf8',
    timeout: timeoutMs,
  });
  return res;
}

function resolveCodexCli() {
  // On Windows, `codex` is commonly a .cmd wrapper. For reliable non-interactive execution
  // from Node, run the underlying CLI JS entrypoint via `node`.
  if (process.platform !== 'win32') return { bin: 'codex', argsPrefix: [] };

  try {
    const whereRes = spawnSync('where.exe', ['codex.cmd'], { encoding: 'utf8' });
    const first = String(whereRes.stdout || '')
      .split(/\r?\n/)
      .map((s) => s.trim())
      .filter(Boolean)[0];
    if (!first) return null;
    const baseDir = path.dirname(first);
    const cliJs = path.join(baseDir, 'node_modules', '@openai', 'codex', 'bin', 'codex.js');
    if (!fs.existsSync(cliJs)) return null;
    return { bin: process.execPath, argsPrefix: [cliJs] };
  } catch {
    return null;
  }
}

function runCodex({ prompt, model, timeoutMs }) {
  const resolved = resolveCodexCli();
  if (!resolved) {
    return { status: null, stdout: '', stderr: '', error: new Error('Unable to resolve Codex CLI on Windows') };
  }

  const args = [
    ...resolved.argsPrefix,
    'exec',
    '--dangerously-bypass-approvals-and-sandbox',
    '--skip-git-repo-check',
  ];
  if (model) args.push('-m', model);

  // Provide prompt via stdin to avoid escaping issues on Windows.
  const res = spawnSync(resolved.bin, args, {
    encoding: 'utf8',
    timeout: timeoutMs,
    input: prompt,
  });
  return res;
}

function runEvidenceGate({ repoRoot, verifyScript, files }) {
  const args = [verifyScript, ...files.map((f) => `--file=${f}`)];
  const res = spawnSync('node', args, {
    cwd: repoRoot,
    encoding: 'utf8',
    timeout: 120000,
  });
  return res;
}

function countEvidenceFailures(stderr) {
  // verify-evidence prints "- <loc>" per failure and "  - <error>" per error line.
  // We'll count failure blocks by counting "- <loc>" lines.
  const lines = String(stderr || '').split(/\r?\n/);
  return lines.filter((l) => /^- \S+/.test(l.trim())).length;
}

function extractTopErrorKinds(stderr) {
  const lines = String(stderr || '').split(/\r?\n/);
  const counts = new Map();
  for (const l of lines) {
    // verify-evidence prints error lines with 2-space indent: "  - <error>"
    const m = l.match(/^\s{2}-\s+(.*)$/);
    if (!m) continue;
    const msg = m[1].trim();
    if (!msg) continue;
    counts.set(msg, (counts.get(msg) || 0) + 1);
  }
  const sorted = Array.from(counts.entries()).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
  return sorted.slice(0, 20).map(([kind, count]) => ({ kind, count }));
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args['--help']) {
    usage();
    process.exit(0);
  }

  const cycleId = args['--cycle-id'] ? String(args['--cycle-id']) : null;
  const limit = args['--limit'] ? Number(args['--limit']) : null;
  const only = args['--only'] ? String(args['--only']) : 'pending';
  const llmTool = args['--llm-tool'] ? String(args['--llm-tool']).toLowerCase() : 'claude';
  const model = args['--model'] ? String(args['--model']) : null;
  const permissionMode = args['--permission-mode'] ? String(args['--permission-mode']) : 'bypassPermissions';
  const timeoutMs = args['--timeout-ms'] ? Number(args['--timeout-ms']) : 600000;
  const skillRootArg = args['--skill-root'] ? String(args['--skill-root']) : null;

  if (!cycleId) {
    usage();
    process.exit(2);
  }
  if (limit !== null && (!Number.isFinite(limit) || limit <= 0)) {
    console.error('ERROR: --limit must be a positive number');
    process.exit(2);
  }
  if (!['pending', 'failed', 'all'].includes(only)) {
    console.error('ERROR: --only must be pending|failed|all');
    process.exit(2);
  }
  if (!['claude', 'codex'].includes(llmTool)) {
    console.error('ERROR: --llm-tool must be claude|codex');
    process.exit(2);
  }
  if (!Number.isFinite(timeoutMs) || timeoutMs <= 0) {
    console.error('ERROR: --timeout-ms must be a positive number');
    process.exit(2);
  }

  const repoRoot = process.cwd();
  const selfAbs = path.resolve(fileURLToPath(import.meta.url));
  const selfDirAbs = path.dirname(selfAbs);
  const defaultSkillRootAbs = path.resolve(selfDirAbs, '..');
  const defaultSkillRootRel = toPosixPath(path.relative(repoRoot, defaultSkillRootAbs));
  const skillRoot = skillRootArg || defaultSkillRootRel;
  const verifyScript = toPosixPath(path.join(skillRoot, 'scripts', 'verify-evidence.js'));
  if (!fileExists(repoRoot, verifyScript)) {
    console.error(`ERROR: verify-evidence.js not found at: ${verifyScript}`);
    process.exit(2);
  }

  const cycleDir = path.resolve(repoRoot, '.workflow/.cycle', `${cycleId}.progress`);
  const corpusManifestRel = toPosixPath(path.relative(repoRoot, path.join(cycleDir, 'corpus', 'corpus-manifest.json')));
  const reqDir = path.join(cycleDir, 'requirements');
  const llmDir = path.join(cycleDir, 'llm');
  const reportsDir = path.join(cycleDir, 'reports');
  ensureDir(llmDir);
  ensureDir(reportsDir);

  if (!fs.existsSync(path.resolve(repoRoot, corpusManifestRel))) {
    console.error(`ERROR: corpus manifest not found: ${corpusManifestRel}`);
    console.error(`Hint: run init-cycle.js first to create manifests.`);
    process.exit(2);
  }

  const manifest = readJson(repoRoot, corpusManifestRel);
  const commands = manifest?.corpus?.commands || [];
  const runCandidates = [];
  for (const c of commands) {
    const st = c.llm?.status || 'pending';
    if (only === 'all') runCandidates.push(c);
    else if (only === 'pending' && st === 'pending') runCandidates.push(c);
    else if (only === 'failed' && st === 'failed') runCandidates.push(c);
  }
  const runList = limit ? runCandidates.slice(0, limit) : runCandidates;

  let processed = 0;
  let passed = 0;
  let failed = 0;
  const failureKinds = new Map();

  for (const c of runList) {
    processed += 1;
    const cmdId = cmdIdFromOrdinal(c.ordinal);
    const reqRel = toPosixPath(path.relative(repoRoot, path.join(reqDir, `${cmdId}.requirements.md`)));
    if (!fileExists(repoRoot, reqRel)) {
      c.llm = c.llm || {};
      c.llm.status = 'failed';
      c.llm.last_error = `missing requirement doc: ${reqRel}`;
      failed += 1;
      continue;
    }

    const runOutDirAbs = path.join(llmDir, cmdId, 'specs', 'outputs');
    ensureDir(runOutDirAbs);
    const outDirRel = toPosixPath(path.relative(repoRoot, runOutDirAbs));

    const prompt = buildSkillPrompt({ cycleId, cmdId, reqRel, outDirRel }).replaceAll('{{SKILL_ROOT}}', skillRoot);
    const llmRes = llmTool === 'codex'
      ? runCodex({ prompt, model, timeoutMs })
      : runClaude({ prompt, model, permissionMode, timeoutMs });

    const runRootAbs = path.join(llmDir, cmdId);
    ensureDir(runRootAbs);
    writeText(repoRoot, toPosixPath(path.relative(repoRoot, path.join(runRootAbs, `${llmTool}.stdout.txt`))), llmRes.stdout || '');
    const spawnErr = llmRes.error ? String(llmRes.error?.message || llmRes.error) : '';
    writeText(
      repoRoot,
      toPosixPath(path.relative(repoRoot, path.join(runRootAbs, `${llmTool}.stderr.txt`))),
      [llmRes.stderr || '', spawnErr ? `\n[spawn_error] ${spawnErr}\n` : ''].join('')
    );

    const required = [
      `${outDirRel}/spec.json`,
      `${outDirRel}/references.json`,
      `${outDirRel}/generated-slash-outline.md`,
      `${outDirRel}/generated-agent-outline.md`,
      `${outDirRel}/gap-report.md`,
      `${outDirRel}/fix-plan.md`,
    ];
    const missing = required.filter((p) => !fileExists(repoRoot, p));

    const gateFiles = [`${outDirRel}/gap-report.md`, `${outDirRel}/generated-slash-outline.md`];
    const gateRes = missing.length
      ? null
      : runEvidenceGate({ repoRoot, verifyScript, files: gateFiles });

    const llmOk = llmRes.status === 0 && !llmRes.error && !llmRes.signal;
    const gateOk = gateRes ? gateRes.status === 0 : false;

    c.llm = c.llm || {};
    c.llm.last_run_at = new Date().toISOString();
    c.llm.outputs = { out_dir: outDirRel };
    c.llm.tool = llmTool;
    c.llm[llmTool] = {
      exit_code: llmRes.status,
      timed_out: Boolean(llmRes.error && String(llmRes.error).includes('ETIMEDOUT')),
      signal: llmRes.signal || '',
      spawn_error: llmRes.error ? String(llmRes.error?.code || llmRes.error?.message || llmRes.error) : '',
    };

    if (!llmOk) {
      c.llm.status = 'failed';
      c.llm.last_error = `${llmTool} exit code ${llmRes.status}`;
      failed += 1;
      continue;
    }
    if (missing.length) {
      c.llm.status = 'failed';
      c.llm.last_error = `missing outputs: ${missing.join(', ')}`;
      failed += 1;
      continue;
    }

    if (!gateRes) {
      c.llm.status = 'failed';
      c.llm.last_error = `evidence gate not executed (missing outputs)`;
      failed += 1;
      continue;
    }

    writeText(repoRoot, toPosixPath(path.relative(repoRoot, path.join(runRootAbs, 'verify-evidence.stdout.txt'))), gateRes.stdout || '');
    writeText(repoRoot, toPosixPath(path.relative(repoRoot, path.join(runRootAbs, 'verify-evidence.stderr.txt'))), gateRes.stderr || '');

    c.llm.evidence_gate = {
      exit_code: gateRes.status,
      failures: gateOk ? 0 : countEvidenceFailures(gateRes.stderr),
      top_error_kinds: gateOk ? [] : extractTopErrorKinds(gateRes.stderr),
    };

    if (gateOk) {
      c.llm.status = 'passed';
      c.llm.last_error = '';
      passed += 1;
      continue;
    }

    c.llm.status = 'failed';
    c.llm.last_error = `evidence gate failed (${c.llm.evidence_gate.failures} failures)`;
    failed += 1;

    for (const ek of c.llm.evidence_gate.top_error_kinds || []) {
      failureKinds.set(ek.kind, (failureKinds.get(ek.kind) || 0) + ek.count);
    }
  }

  // persist updated manifest
  manifest.generated_at = new Date().toISOString();
  writeJson(repoRoot, corpusManifestRel, manifest);

  // TODO list
  writeText(repoRoot, toPosixPath(path.relative(repoRoot, path.join(cycleDir, 'TODO_LIST.md'))), renderTodoList({ cycleId, commands }));

  const topKindsSorted = Array.from(failureKinds.entries())
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, 30)
    .map(([kind, count]) => ({ kind, count }));

  const summary = {
    cycle_id: cycleId,
    generated_at: new Date().toISOString(),
    processed_commands: processed,
    total_commands: commands.length,
    passed,
    failed,
    only,
    limit,
    llm_tool: llmTool,
    model: model || '',
    permission_mode: permissionMode,
    skill_root: skillRoot,
    top_failure_kinds: topKindsSorted,
  };

  const summaryRel = toPosixPath(path.relative(repoRoot, path.join(reportsDir, 'LLM_SUMMARY.json')));
  writeJson(repoRoot, summaryRel, summary);

  console.log(`Done: processed=${processed}/${commands.length} passed=${passed} failed=${failed}`);
  console.log(`- wrote: ${summaryRel}`);

  // CI-friendly default: fail the run when any processed command fails.
  if (failed > 0) process.exit(1);
}

main();

