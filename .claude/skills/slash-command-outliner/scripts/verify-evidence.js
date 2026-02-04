import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export function usage() {
  console.log(
    [
      'Usage:',
      '  node .claude/skills/slash-command-outliner/scripts/verify-evidence.js --file=<path.md> [--file=<path2.md> ...]',
      '',
      'Behavior:',
      '  - Extracts evidence tables from markdown (gap-report and/or outline)',
      '  - Enforces evidence-based gates:',
      '    - Each row must label Status as Existing or Planned',
      '    - Evidence must include BOTH docs and ts anchors:',
      '      - docs: .claude/commands/**.md / <section heading>',
      '      - ts: ccw/src/** / <function|case|pattern>',
      '    - Existing rows must point to verifiable pointers (paths must exist when pointer looks like a path)',
      '',
      'Notes:',
      '  - This script does NOT execute the Verify commands. It performs safe checks (exists + text contains).',
    ].join('\n')
  );
}

export function parseArgs(argv) {
  const args = { files: [] };
  for (const a of argv) {
    if (!a.startsWith('--')) continue;
    const [k, v] = a.split('=');
    if (k === '--file' && v) args.files.push(String(v));
    if (k === '--help') args.help = true;
  }
  return args;
}

export function stripBackticks(s) {
  return String(s || '').trim().replace(/^`+|`+$/g, '');
}

export function normalizeStatus(s) {
  const v = String(s || '').trim().toLowerCase();
  if (v === 'existing') return 'Existing';
  if (v === 'planned') return 'Planned';
  return null;
}

export function looksLikePath(s) {
  const v = String(s || '').trim();
  if (!v) return false;
  // Avoid treating slash-commands as file paths (e.g. "/issue:new").
  if (/^\/[a-z0-9_-]+:[a-z0-9_-]+$/i.test(v)) return false;

  // Prefer repo-relative pointers (what we can safely verify).
  if (
    v.startsWith('.claude/') ||
    v.startsWith('ccw/') ||
    v.startsWith('.workflow/') ||
    v.startsWith('./') ||
    v.startsWith('../')
  ) {
    return true;
  }

  // file-ish token, e.g. foo.ts / bar.md
  return /\.[A-Za-z0-9]{1,6}$/.test(v);
}

export function safeResolve(repoRoot, relOrAbs) {
  const abs = path.resolve(repoRoot, relOrAbs);
  const rel = path.relative(repoRoot, abs);
  if (rel.startsWith('..') || path.isAbsolute(rel)) return null;
  return abs;
}

export function fileExists(repoRoot, relPath) {
  const abs = safeResolve(repoRoot, relPath);
  if (!abs) return false;
  return fs.existsSync(abs) && fs.statSync(abs).isFile();
}

export function pathExists(repoRoot, relPath) {
  const abs = safeResolve(repoRoot, relPath);
  if (!abs) return false;
  return fs.existsSync(abs);
}

export function readText(repoRoot, relPath) {
  const abs = safeResolve(repoRoot, relPath);
  if (!abs) return null;
  if (!fs.existsSync(abs)) return null;
  try {
    return fs.readFileSync(abs, 'utf8');
  } catch {
    return null;
  }
}

export function extractHeadings(markdown) {
  const headings = [];
  for (const line of String(markdown || '').split(/\r?\n/)) {
    const m = line.match(/^(#{1,6})\s+(.+?)\s*$/);
    if (!m) continue;
    headings.push(m[2].trim());
  }
  return headings;
}

export function findHeading(markdown, headingText) {
  const target = String(headingText || '').trim().replace(/^#+\s*/, '');
  if (!target) return false;
  const headings = extractHeadings(markdown);
  const t = target.toLowerCase();
  return headings.some((h) => h.toLowerCase() === t || h.toLowerCase().includes(t));
}

export function parseEvidenceCell(evidenceCell) {
  const text = String(evidenceCell || '');
  const lower = text.toLowerCase();

  function takePart(key) {
    const idx = lower.indexOf(`${key}:`);
    if (idx === -1) return null;
    const after = text.slice(idx + key.length + 1);
    // stop at next key or line break / semicolon
    const stop = after.search(/(?:\bdocs:|\bts:|;|\r?\n)/i);
    const part = (stop === -1 ? after : after.slice(0, stop)).trim();
    return part.length ? part : null;
  }

  function parsePart(part) {
    if (!part) return null;
    const cleaned = stripBackticks(part).trim();
    // Delimiter is " / " (spaces matter). This avoids splitting POSIX paths like "ccw/src/foo.ts".
    const segs = cleaned.split(/\s+\/\s+/);
    const file = stripBackticks(segs[0] || '').trim();
    const anchor = stripBackticks(segs.slice(1).join(' / ') || '').trim();
    return { file, anchor };
  }

  return {
    docs: parsePart(takePart('docs')),
    ts: parsePart(takePart('ts')),
  };
}

export function splitTableRow(line) {
  // Markdown table row: | a | b | c |
  const raw = String(line || '').trim();
  if (!raw.startsWith('|')) return null;
  const parts = raw.split('|');
  // Support both forms:
  // - with trailing pipe: "| a | b |"
  // - without trailing pipe: "| a | b"
  const sliceEnd = raw.endsWith('|') ? -1 : undefined;
  const cells = parts
    .slice(1, sliceEnd)
    .map((c) => String(c).trim());
  return cells;
}

export function isSeparatorRow(cells) {
  return cells.every((c) => /^:?-{3,}:?$/.test(c));
}

export function findEvidenceTables(lines) {
  const tables = [];
  for (let i = 0; i < lines.length; i++) {
    const cells = splitTableRow(lines[i]);
    if (!cells) continue;
    const normalized = cells.map((c) => c.toLowerCase());
    const pointerIdx = normalized.findIndex((c) => c.includes('pointer'));
    const statusIdx = normalized.findIndex((c) => c.includes('status'));
    const evidenceIdx = normalized.findIndex((c) => c.includes('evidence'));
    const verifyIdx = normalized.findIndex((c) => c.includes('verify'));
    if (pointerIdx === -1 || statusIdx === -1 || evidenceIdx === -1 || verifyIdx === -1) continue;

    // next line should be separator
    const sepCells = splitTableRow(lines[i + 1] || '');
    if (!sepCells || !isSeparatorRow(sepCells)) continue;

    const rows = [];
    let j = i + 2;
    for (; j < lines.length; j++) {
      const rowCells = splitTableRow(lines[j]);
      if (!rowCells) break;
      if (rowCells.length < Math.max(pointerIdx, statusIdx, evidenceIdx, verifyIdx) + 1) break;
      rows.push({ lineNo: j + 1, cells: rowCells });
    }

    tables.push({
      headerLineNo: i + 1,
      columns: { pointerIdx, statusIdx, evidenceIdx, verifyIdx },
      rows,
    });
    i = j - 1;
  }
  return tables;
}

export function validateEvidenceRow({ repoRoot, mdPath, row, columns }) {
  const errors = [];
  const pointerRaw = stripBackticks(row.cells[columns.pointerIdx] || '');
  const statusRaw = stripBackticks(row.cells[columns.statusIdx] || '');
  const evidenceRaw = row.cells[columns.evidenceIdx] || '';
  const verifyRaw = stripBackticks(row.cells[columns.verifyIdx] || '');

  if (!pointerRaw || pointerRaw.toUpperCase() === 'TBD' || pointerRaw.includes('{{')) {
    errors.push('Pointer is missing or placeholder (TBD/template).');
  }

  // Enforce "one row per pointer"
  if (pointerRaw.includes(',') || pointerRaw.includes('\n')) {
    errors.push('Pointer must be one-per-row (no commas/newlines in pointer cell).');
  }

  const status = normalizeStatus(statusRaw);
  if (!status) {
    errors.push(`Invalid Status: "${statusRaw}" (expected Existing or Planned).`);
  }

  const ev = parseEvidenceCell(evidenceRaw);
  if (!ev.docs?.file || !ev.docs?.anchor) {
    errors.push('Evidence must include docs: <file> / <section heading>.');
  }
  if (!ev.ts?.file || !ev.ts?.anchor) {
    errors.push('Evidence must include ts: <file> / <function|case|pattern>.');
  }

  // Verify docs evidence
  if (ev.docs?.file) {
    if (!ev.docs.file.startsWith('.claude/commands/') || !ev.docs.file.endsWith('.md')) {
      errors.push(`Docs evidence must be under .claude/commands/**.md (got: ${ev.docs.file})`);
    }
    if (!fileExists(repoRoot, ev.docs.file)) {
      errors.push(`Docs evidence file not found: ${ev.docs.file}`);
    } else {
      const docText = readText(repoRoot, ev.docs.file) || '';
      if (ev.docs.anchor && !findHeading(docText, ev.docs.anchor)) {
        errors.push(`Docs evidence heading not found: ${ev.docs.file} / ${ev.docs.anchor}`);
      }
    }
  }

  // Verify ts evidence
  if (ev.ts?.file) {
    if (!ev.ts.file.startsWith('ccw/src/')) {
      errors.push(`TS evidence must be under ccw/src/** (got: ${ev.ts.file})`);
    } else if (!/\.(ts|tsx|js)$/.test(ev.ts.file)) {
      errors.push(`TS evidence file must be .ts/.tsx/.js (got: ${ev.ts.file})`);
    }
    if (!fileExists(repoRoot, ev.ts.file)) {
      errors.push(`TS evidence file not found: ${ev.ts.file}`);
    } else {
      const tsText = readText(repoRoot, ev.ts.file) || '';
      if (ev.ts.anchor && !tsText.includes(ev.ts.anchor)) {
        errors.push(`TS evidence anchor not found (literal match): ${ev.ts.file} / ${ev.ts.anchor}`);
      }
    }
  }

  // Existing pointers should be verifiable
  if (status === 'Existing') {
    if (!verifyRaw) errors.push('Existing row must include a concrete Verify command.');
    if (looksLikePath(pointerRaw)) {
      if (!pathExists(repoRoot, pointerRaw)) {
        errors.push(`Existing pointer path not found: ${pointerRaw}`);
      }
    }
  }

  if (errors.length) {
    return {
      ok: false,
      mdPath,
      lineNo: row.lineNo,
      pointer: pointerRaw,
      status: statusRaw,
      errors,
    };
  }

  return { ok: true };
}

export function verifyEvidenceMarkdown({ repoRoot, mdPath, markdown }) {
  const failures = [];
  const lines = String(markdown || '').split(/\r?\n/);
  const tables = findEvidenceTables(lines);
  for (const t of tables) {
    for (const row of t.rows) {
      const res = validateEvidenceRow({ repoRoot, mdPath, row, columns: t.columns });
      if (!res.ok) failures.push(res);
    }
  }
  return { tablesFound: tables.length, failures };
}

export function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    usage();
    process.exit(0);
  }

  if (!args.files.length) {
    usage();
    process.exit(2);
  }

  const repoRoot = process.cwd();
  let tablesFound = 0;
  const failures = [];

  for (const f of args.files) {
    const abs = path.resolve(repoRoot, f);
    if (!fs.existsSync(abs)) {
      failures.push({ ok: false, mdPath: f, lineNo: 0, pointer: '', status: '', errors: [`File not found: ${f}`] });
      continue;
    }
    const md = fs.readFileSync(abs, 'utf8');
    const res = verifyEvidenceMarkdown({ repoRoot, mdPath: f, markdown: md });
    tablesFound += res.tablesFound;
    failures.push(...res.failures);
  }

  if (tablesFound === 0) {
    console.error('ERROR: no evidence tables found. Expected a markdown table with columns: Pointer | Status | Evidence | Verify | ...');
    process.exit(2);
  }

  if (failures.length) {
    console.error(`ERROR: evidence verification failed (${failures.length} issue(s))`);
    for (const x of failures) {
      const loc = x.lineNo ? `${x.mdPath}:${x.lineNo}` : x.mdPath;
      console.error(`- ${loc}`);
      if (x.pointer) console.error(`  pointer: ${x.pointer}`);
      if (x.status) console.error(`  status: ${x.status}`);
      for (const e of x.errors) console.error(`  - ${e}`);
    }
    process.exit(1);
  }

  console.log('OK: evidence verification passed');
}

const isEntrypoint = (() => {
  try {
    const invoked = process.argv[1] ? path.resolve(process.argv[1]) : '';
    const self = path.resolve(fileURLToPath(import.meta.url));
    return invoked === self;
  } catch {
    return false;
  }
})();

if (isEntrypoint) main();
