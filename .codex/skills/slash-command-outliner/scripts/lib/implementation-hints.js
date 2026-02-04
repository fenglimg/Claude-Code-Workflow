import fs from 'node:fs';
import path from 'node:path';

function normalizeManifestPath(p) {
  // tooling-manifest may contain Windows backslashes
  return String(p).replaceAll('\\', '/');
}

function unique(arr) {
  return Array.from(new Set(arr.filter(Boolean)));
}

function tokenize(s) {
  return String(s || '')
    .split(/[^A-Za-z0-9:_/-]+/g)
    .map((t) => t.trim())
    .filter(Boolean);
}

function normalizeDocText(s) {
  return String(s || '').replaceAll('\r\n', '\n');
}

function readCommandDocText(repoRoot, derivedFrom) {
  if (!derivedFrom) return null;
  const abs = path.resolve(repoRoot, derivedFrom);
  if (!fs.existsSync(abs)) return null;
  try {
    return normalizeDocText(fs.readFileSync(abs, 'utf8'));
  } catch {
    return null;
  }
}

function extractAllMatches(text, re, groupIndex = 1) {
  const out = [];
  const s = normalizeDocText(text);
  const regex = new RegExp(re.source, re.flags.includes('g') ? re.flags : `${re.flags}g`);
  let m;
  while ((m = regex.exec(s))) {
    out.push(m[groupIndex] ?? m[0]);
  }
  return out;
}

function extractCcwToolExecNames(text) {
  return extractAllMatches(text, /\bccw\s+tool\s+exec\s+([A-Za-z0-9_-]+)\b/gi, 1);
}

function extractShellScriptToolNames(text) {
  // e.g. get_modules_by_depth.sh -> get_modules_by_depth
  return extractAllMatches(text, /\b([A-Za-z0-9_]+)\.sh\b/gi, 1);
}

function extractSlashCommands(text) {
  // Capture both /group:name and multi-colon forms like /workflow:tools:test-context-gather
  const raw = extractAllMatches(text, /\/[A-Za-z0-9_-]+(?::[A-Za-z0-9_/-]+)+/g, 0);
  // Also include simple /name forms (no colon) when they look like command names.
  const simple = extractAllMatches(text, /\/[A-Za-z0-9_-]{2,}/g, 0);
  return unique([...raw, ...simple]);
}

function slashToCommandDocPath(repoRoot, slash) {
  const s = String(slash || '').trim();
  if (!s.startsWith('/')) return null;
  // Strip trailing punctuation (common in prose)
  const cleaned = s.replace(/[).,;:!?]+$/g, '');
  const parts = cleaned.slice(1).split(':').filter(Boolean);
  if (parts.length === 0) return null;

  if (parts.length === 1) {
    const p = `.claude/commands/${parts[0]}.md`;
    return fs.existsSync(path.resolve(repoRoot, p)) ? p : null;
  }

  const group = parts[0];
  const rest = parts.slice(1).join(':'); // may include slashes
  const restParts = rest.split('/').filter(Boolean);
  const rel = `.claude/commands/${group}/${restParts.join('/')}.md`;
  return fs.existsSync(path.resolve(repoRoot, rel)) ? rel : null;
}

function extractBacktickedPaths(text) {
  const candidates = extractAllMatches(text, /`([^`]+)`/g, 1)
    .map((x) => String(x).trim())
    .filter(Boolean);
  return candidates.filter((x) => /[\\/]/.test(x) || /\.[A-Za-z0-9]{1,4}$/.test(x));
}

function normalizeCandidatePath(p) {
  const s = String(p || '').trim().replaceAll('\\', '/');
  // Strip quotes and trailing punctuation
  return s.replace(/^["']|["']$/g, '').replace(/[).,;!?]+$/g, '');
}

function isInRepoFile(repoRoot, relPath) {
  const abs = path.resolve(repoRoot, relPath);
  const rel = path.relative(repoRoot, abs);
  if (rel.startsWith('..')) return false;
  if (!fs.existsSync(abs)) return false;
  try {
    return fs.statSync(abs).isFile();
  } catch {
    return false;
  }
}

function extractExplicitRepoPaths(repoRoot, text) {
  const raw = extractBacktickedPaths(text).map(normalizeCandidatePath);
  const out = [];
  for (const p of raw) {
    // Ignore obvious non-file tokens
    if (!p || p.includes(' ')) continue;
    if (p.startsWith('http://') || p.startsWith('https://')) continue;
    // Keep pointers focused on "implementation" locations (code + command/skill docs).
    if (!p.startsWith('ccw/') && !p.startsWith('.claude/')) continue;
    if (isInRepoFile(repoRoot, p)) out.push(p);
  }
  return unique(out);
}

function countOccurrences(haystack, needle) {
  if (!needle) return 0;
  let i = 0;
  let count = 0;
  while (true) {
    const idx = haystack.indexOf(needle, i);
    if (idx === -1) break;
    count += 1;
    i = idx + needle.length;
  }
  return count;
}

function scoreFile(relPath, contentLower, tokensLower) {
  const relLower = relPath.toLowerCase();
  let score = 0;
  for (const t of tokensLower) {
    // Stronger weight for filename/path matches.
    score += countOccurrences(relLower, t) * 3;
    // Content matches are helpful but noisier.
    score += Math.min(5, countOccurrences(contentLower, t)) * 1;
  }
  return score;
}

function fileExists(repoRoot, rel) {
  const abs = path.resolve(repoRoot, rel);
  return fs.existsSync(abs);
}

function prependKnownEntrypoints(repoRoot, command) {
  const candidates = [];
  if (command?.group) candidates.push(`ccw/src/commands/${command.group}.ts`);
  if (command?.name) candidates.push(`ccw/src/commands/${command.name}.ts`);
  candidates.push('ccw/src/tools/command-registry.ts');
  candidates.push('ccw/src/tools/cli-executor.ts');

  return unique(candidates.filter((p) => fileExists(repoRoot, p)));
}

function toolNameToFileCandidates(toolName) {
  const base = String(toolName || '')
    .trim()
    .toLowerCase()
    .replaceAll(':', '-')
    .replaceAll('_', '-');
  if (!base) return [];
  const stem = `ccw/src/tools/${base}`;
  return [`${stem}.ts`, `${stem}.js`, `${stem}.mjs`];
}

function inferToolFilesFromCommandDoc(repoRoot, docText) {
  if (!docText) return [];
  const toolNames = unique([...extractCcwToolExecNames(docText), ...extractShellScriptToolNames(docText)]);
  const out = [];
  for (const tn of toolNames) {
    for (const candidate of toolNameToFileCandidates(tn)) {
      if (fileExists(repoRoot, candidate)) {
        out.push(candidate);
        break;
      }
    }
  }
  return unique(out);
}

function inferReferencedCommandDocs(repoRoot, docText, derivedFrom) {
  if (!docText) return [];
  const slashes = extractSlashCommands(docText);
  const docPaths = [];
  for (const s of slashes) {
    const p = slashToCommandDocPath(repoRoot, s);
    if (p) docPaths.push(p);
  }
  const self = derivedFrom ? String(derivedFrom).replaceAll('\\', '/') : null;
  return unique(docPaths).filter((p) => (self ? p !== self : true));
}

export function findImplementationHints({
  repoRoot,
  derivedFrom,
  command,
  toolingManifest,
  maxResults = 10,
}) {
  const toolingFiles = toolingManifest?.files || [];
  const slash = command?.group ? `/${command.group}:${command.name}` : `/${command.name}`;

  const entrypoints = prependKnownEntrypoints(repoRoot, command);
  const docText = readCommandDocText(repoRoot, derivedFrom);
  const docToolNames = docText
    ? unique([...extractCcwToolExecNames(docText), ...extractShellScriptToolNames(docText)])
    : [];
  const docSlashes = docText ? extractSlashCommands(docText) : [];
  const inferredToolFiles = inferToolFilesFromCommandDoc(repoRoot, docText);
  const referencedCommandDocs = inferReferencedCommandDocs(repoRoot, docText, derivedFrom);
  const explicitRepoPaths = extractExplicitRepoPaths(repoRoot, docText);

  const tokens = unique([
    command?.group,
    command?.name,
    slash,
    ...tokenize(command?.description).slice(0, 8),
    ...tokenize(derivedFrom),
    ...docToolNames,
    ...docSlashes,
    ...explicitRepoPaths,
    ...explicitRepoPaths.map((p) => path.posix.basename(String(p).replaceAll('\\', '/'))),
  ]);
  const tokensLower = tokens.map((t) => String(t).toLowerCase());

  const scored = [];
  for (const f of toolingFiles) {
    const rel = normalizeManifestPath(f);
    const abs = path.resolve(repoRoot, rel);
    if (!fs.existsSync(abs)) continue;
    let content = '';
    try {
      content = fs.readFileSync(abs, 'utf8');
    } catch {
      // Ignore unreadable files (should be rare in our tooling corpus).
      continue;
    }
    const s = scoreFile(rel, content.toLowerCase(), tokensLower);
    if (s > 0) scored.push({ file: rel, score: s });
  }

  scored.sort((a, b) => b.score - a.score || a.file.localeCompare(b.file));
  const ranked = scored.map((x) => x.file);
  const merged = unique([
    ...entrypoints,
    ...inferredToolFiles,
    ...referencedCommandDocs,
    ...explicitRepoPaths,
    ...ranked,
  ]).slice(0, maxResults);
  return merged;
}
