import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

import { writeJson, writeText } from './lib/pipeline.js';

function usage() {
  console.log(
    [
      'Usage:',
      '  node .codex/skills/slash-command-outliner/scripts/llm-run-until-done.js --cycle-id=<id>',
      '    [--llm-tool=claude|codex] [--model=<model-alias>] [--permission-mode=bypassPermissions]',
      '    [--skill-root=.claude/skills/slash-command-outliner|.codex/skills/slash-command-outliner]',
      '    [--batch-size=10] [--max-batches=200] [--max-failed-retries=3]',
      '    [--pending-timeout-ms=1200000] [--failed-timeout-ms=2400000]',
      '',
      'Behavior:',
      '  - Repeatedly runs llm-regress-all.js over pending commands in batches until TODO_LIST.md is fully checked.',
      '  - If failures occur, retries failed commands with a higher timeout.',
      '',
      'Prerequisites:',
      '  - Cycle initialized with init-cycle.js (creates TODO_LIST.md + corpus manifests).',
      '',
      'Exit codes:',
      '  - 0: completed (all commands checked)',
      '  - 1: stopped early (no progress or exceeded limits)',
      '  - 2: invalid args or missing files',
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

function ensureDir(p) {
  fs.mkdirSync(p, { recursive: true });
}

function readTextFile(absPath) {
  try {
    return fs.readFileSync(absPath, 'utf8');
  } catch {
    return null;
  }
}

function parseTodoStats(todoMarkdown) {
  const s = String(todoMarkdown || '');
  const checked = (s.match(/^- \[x\]/gim) || []).length;
  const total = (s.match(/^- \[[ x]\]/gim) || []).length;
  const failed = (s.match(/^  - failed:/gim) || []).length;
  return {
    checked,
    total,
    remaining: Math.max(0, total - checked),
    failed,
  };
}

function resolveSelfSkillRoot(repoRoot) {
  const selfAbs = path.resolve(fileURLToPath(import.meta.url));
  const selfDirAbs = path.dirname(selfAbs);
  const skillRootAbs = path.resolve(selfDirAbs, '..');
  return toPosixPath(path.relative(repoRoot, skillRootAbs));
}

function runNodeScript({ repoRoot, scriptRel, args, timeoutMs }) {
  const res = spawnSync(process.execPath, [scriptRel, ...args], {
    cwd: repoRoot,
    encoding: 'utf8',
    timeout: timeoutMs,
    maxBuffer: 20 * 1024 * 1024,
  });
  return res;
}

function isFatalRunnerFailure(res) {
  if (!res) return true;
  // res.status can be null when the process is terminated by a signal or fails to spawn.
  if (res.status === null || res.status === undefined) return true;
  // Treat argument/config errors as fatal (llm-regress-all uses exit code 2 for invalid args/missing files).
  if (res.status === 2) return true;
  return false;
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args['--help']) {
    usage();
    process.exit(0);
  }

  const cycleId = args['--cycle-id'] ? String(args['--cycle-id']) : null;
  const llmTool = args['--llm-tool'] ? String(args['--llm-tool']).toLowerCase() : 'codex';
  const model = args['--model'] ? String(args['--model']) : null;
  const permissionMode = args['--permission-mode'] ? String(args['--permission-mode']) : 'bypassPermissions';
  const skillRootArg = args['--skill-root'] ? String(args['--skill-root']) : null;

  const batchSize = args['--batch-size'] ? Number(args['--batch-size']) : 10;
  const maxBatches = args['--max-batches'] ? Number(args['--max-batches']) : 200;
  const maxFailedRetries = args['--max-failed-retries'] ? Number(args['--max-failed-retries']) : 3;
  const pendingTimeoutMs = args['--pending-timeout-ms'] ? Number(args['--pending-timeout-ms']) : 1_200_000;
  const failedTimeoutMs = args['--failed-timeout-ms'] ? Number(args['--failed-timeout-ms']) : 2_400_000;

  if (!cycleId) {
    usage();
    process.exit(2);
  }
  if (!['claude', 'codex'].includes(llmTool)) {
    console.error('ERROR: --llm-tool must be claude|codex');
    process.exit(2);
  }
  for (const [name, v] of [
    ['--batch-size', batchSize],
    ['--max-batches', maxBatches],
    ['--max-failed-retries', maxFailedRetries],
    ['--pending-timeout-ms', pendingTimeoutMs],
    ['--failed-timeout-ms', failedTimeoutMs],
  ]) {
    if (!Number.isFinite(v) || v <= 0) {
      console.error(`ERROR: ${name} must be a positive number`);
      process.exit(2);
    }
  }

  const repoRoot = process.cwd();
  const skillRoot = skillRootArg || resolveSelfSkillRoot(repoRoot);
  const llmRegressScript = toPosixPath(path.join(skillRoot, 'scripts', 'llm-regress-all.js'));
  const cycleDir = path.resolve(repoRoot, '.workflow/.cycle', `${cycleId}.progress`);
  const todoAbs = path.join(cycleDir, 'TODO_LIST.md');
  const reportsDirAbs = path.join(cycleDir, 'reports');
  ensureDir(reportsDirAbs);

  if (!fs.existsSync(path.resolve(repoRoot, llmRegressScript))) {
    console.error(`ERROR: llm-regress-all.js not found at: ${llmRegressScript}`);
    process.exit(2);
  }
  if (!fs.existsSync(todoAbs)) {
    console.error(`ERROR: TODO_LIST.md not found: ${toPosixPath(path.relative(repoRoot, todoAbs))}`);
    console.error('Hint: run init-cycle.js first.');
    process.exit(2);
  }

  const timeline = [];

  for (let batch = 1; batch <= maxBatches; batch++) {
    const todoBefore = readTextFile(todoAbs);
    if (todoBefore === null) {
      console.error(`ERROR: failed to read TODO_LIST.md: ${toPosixPath(path.relative(repoRoot, todoAbs))}`);
      process.exit(2);
    }
    const s0 = parseTodoStats(todoBefore);
    timeline.push({ batch, phase: 'before', stats: s0, at: new Date().toISOString() });
    console.log(`[Batch ${batch}] checked=${s0.checked}/${s0.total} remaining=${s0.remaining} failed=${s0.failed}`);

    if (s0.remaining <= 0) {
      const summary = {
        cycle_id: cycleId,
        completed: true,
        generated_at: new Date().toISOString(),
        llm_tool: llmTool,
        model: model || '',
        permission_mode: permissionMode,
        skill_root: skillRoot,
        timeline,
        final: s0,
      };
      const outRel = toPosixPath(path.relative(repoRoot, path.join(reportsDirAbs, 'LLM_UNTIL_DONE.json')));
      writeJson(repoRoot, outRel, summary);
      console.log('OK: all commands completed');
      process.exit(0);
    }

    const pendingLimit = Math.min(batchSize, s0.remaining);
    const pendingArgs = [
      `--cycle-id=${cycleId}`,
      `--llm-tool=${llmTool}`,
      `--only=pending`,
      `--limit=${pendingLimit}`,
      `--timeout-ms=${pendingTimeoutMs}`,
      `--skill-root=${skillRoot}`,
      ...(model ? [`--model=${model}`] : []),
      ...(llmTool === 'claude' ? [`--permission-mode=${permissionMode}`] : []),
    ];

    const pendingRes = runNodeScript({
      repoRoot,
      scriptRel: llmRegressScript,
      args: pendingArgs,
      // allow the child to manage its own per-command timeout; keep a generous wrapper ceiling
      timeoutMs: pendingTimeoutMs + 120_000,
    });
    timeline.push({
      batch,
      phase: 'pending',
      exit_code: pendingRes.status,
      at: new Date().toISOString(),
    });
    if (isFatalRunnerFailure(pendingRes)) {
      const report = {
        cycle_id: cycleId,
        completed: false,
        generated_at: new Date().toISOString(),
        reason: 'runner_fatal_error',
        llm_tool: llmTool,
        model: model || '',
        permission_mode: permissionMode,
        skill_root: skillRoot,
        runner: {
          status: pendingRes?.status ?? null,
          signal: pendingRes?.signal ?? '',
          error: pendingRes?.error ? String(pendingRes.error?.message || pendingRes.error) : '',
        },
        timeline,
      };
      const outRel = toPosixPath(path.relative(repoRoot, path.join(reportsDirAbs, 'LLM_UNTIL_DONE.json')));
      writeJson(repoRoot, outRel, report);
      console.error('[STOP] Fatal runner error during pending batch.');
      process.exit(1);
    }

    const todoAfterPending = readTextFile(todoAbs) || '';
    const s1 = parseTodoStats(todoAfterPending);
    console.log(`[After pending] checked=${s1.checked}/${s1.total} remaining=${s1.remaining} failed=${s1.failed}`);
    timeline.push({ batch, phase: 'after_pending', stats: s1, at: new Date().toISOString() });

    // Retry failures with higher timeout.
    if (s1.failed > 0) {
      for (let retry = 1; retry <= maxFailedRetries; retry++) {
        console.log(`[Retry failed ${retry}] failed=${s1.failed}`);
        const failedArgs = [
          `--cycle-id=${cycleId}`,
          `--llm-tool=${llmTool}`,
          `--only=failed`,
          `--limit=${batchSize}`,
          `--timeout-ms=${failedTimeoutMs}`,
          `--skill-root=${skillRoot}`,
          ...(model ? [`--model=${model}`] : []),
          ...(llmTool === 'claude' ? [`--permission-mode=${permissionMode}`] : []),
        ];
        const failedRes = runNodeScript({
          repoRoot,
          scriptRel: llmRegressScript,
          args: failedArgs,
          timeoutMs: failedTimeoutMs + 120_000,
        });
        timeline.push({
          batch,
          phase: `retry_failed_${retry}`,
          exit_code: failedRes.status,
          at: new Date().toISOString(),
        });
        if (isFatalRunnerFailure(failedRes)) {
          const report = {
            cycle_id: cycleId,
            completed: false,
            generated_at: new Date().toISOString(),
            reason: 'runner_fatal_error',
            llm_tool: llmTool,
            model: model || '',
            permission_mode: permissionMode,
            skill_root: skillRoot,
            runner: {
              status: failedRes?.status ?? null,
              signal: failedRes?.signal ?? '',
              error: failedRes?.error ? String(failedRes.error?.message || failedRes.error) : '',
            },
            timeline,
          };
          const outRel = toPosixPath(path.relative(repoRoot, path.join(reportsDirAbs, 'LLM_UNTIL_DONE.json')));
          writeJson(repoRoot, outRel, report);
          console.error('[STOP] Fatal runner error during failed retry.');
          process.exit(1);
        }

        const todoAfterRetry = readTextFile(todoAbs) || '';
        s1.failed = parseTodoStats(todoAfterRetry).failed;
        const sx = parseTodoStats(todoAfterRetry);
        console.log(`[After retry ${retry}] checked=${sx.checked}/${sx.total} remaining=${sx.remaining} failed=${sx.failed}`);
        timeline.push({ batch, phase: `after_retry_${retry}`, stats: sx, at: new Date().toISOString() });
        if (sx.failed === 0) break;
      }
    }

    const todoEnd = readTextFile(todoAbs) || '';
    const sEnd = parseTodoStats(todoEnd);

    // Stop if no progress to avoid infinite loops.
    if (sEnd.checked <= s0.checked) {
      const report = {
        cycle_id: cycleId,
        completed: false,
        generated_at: new Date().toISOString(),
        reason: 'no_progress',
        llm_tool: llmTool,
        model: model || '',
        permission_mode: permissionMode,
        skill_root: skillRoot,
        timeline,
        final: sEnd,
      };
      const outRel = toPosixPath(path.relative(repoRoot, path.join(reportsDirAbs, 'LLM_UNTIL_DONE.json')));
      writeJson(repoRoot, outRel, report);
      console.error(`[STOP] No progress in batch ${batch} (checked did not increase).`);
      process.exit(1);
    }
  }

  const todoFinal = readTextFile(todoAbs) || '';
  const sF = parseTodoStats(todoFinal);
  const report = {
    cycle_id: cycleId,
    completed: sF.remaining === 0,
    generated_at: new Date().toISOString(),
    reason: 'max_batches_exceeded',
    llm_tool: llmTool,
    model: model || '',
    permission_mode: permissionMode,
    skill_root: skillRoot,
    timeline,
    final: sF,
  };
  const outRel = toPosixPath(path.relative(repoRoot, path.join(reportsDirAbs, 'LLM_UNTIL_DONE.json')));
  writeJson(repoRoot, outRel, report);
  writeText(repoRoot, outRel.replace(/\.json$/i, '.md'), `# LLM Until Done Report\n\n\`\`\`json\n${JSON.stringify(report, null, 2)}\n\`\`\`\n`);
  console.error('[STOP] Max batches exceeded.');
  process.exit(1);
}

main();
