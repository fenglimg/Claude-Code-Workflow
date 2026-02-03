import fs from 'node:fs';
import path from 'node:path';

import { extractHeadings, parseYamlHeader, readCommandFile, toPosixPath } from './command-md.js';
import { findImplementationHints } from './implementation-hints.js';

export function splitCsv(s) {
  return String(s || '')
    .split(',')
    .map((x) => x.trim())
    .filter(Boolean);
}

function inferGroupFromCommandPath(commandPath, headerGroup) {
  if (headerGroup && String(headerGroup).trim().length > 0) return String(headerGroup).trim();
  const p = toPosixPath(String(commandPath || ''));
  const marker = '.claude/commands/';
  const idx = p.indexOf(marker);
  if (idx === -1) return '';
  const rel = p.slice(idx + marker.length);
  const parts = rel.split('/').filter(Boolean);
  return parts.length >= 2 ? parts[0] : '';
}

export function deriveSpecFromCommandFile(repoRoot, commandPath) {
  const abs = path.resolve(repoRoot, commandPath);
  const { header, headings } = readCommandFile(abs);

  const name = header?.name ? String(header.name).trim() : path.basename(abs, '.md');
  const group = inferGroupFromCommandPath(commandPath, header?.group);
  const description = header?.description ? String(header.description) : 'TBD';
  const argumentHint = header?.['argument-hint'] ? String(header['argument-hint']) : '';
  const allowedTools = splitCsv(header?.['allowed-tools']);
  // Some legacy/non-standard command docs lack allowed-tools; keep output CCW-aligned by forcing a minimal placeholder.
  const allowedToolsFinal = allowedTools.length ? allowedTools : ['Read(*)', 'Write(*)'];

  return {
    schema_version: '1.0.0',
    derived_from: commandPath,
    created_at: new Date().toISOString(),
    command: {
      group,
      name,
      description,
      argument_hint: argumentHint,
      allowed_tools: allowedToolsFinal,
    },
    implementation: {
      command_doc: commandPath,
      code_pointers: [],
    },
    structure_hints: {
      headings: headings.map((h) => ({ level: h.level, text: h.text })),
    },
  };
}

function csv(list) {
  return list.join(', ');
}

function renderFrontmatter(cmd) {
  const lines = ['---'];
  lines.push(`name: ${cmd.name}`);
  if (cmd.description) lines.push(`description: ${cmd.description}`);
  if (cmd.argument_hint) lines.push(`argument-hint: \"${cmd.argument_hint.replaceAll('\"', '\\\\\"')}\"`);
  if (cmd.allowed_tools?.length) lines.push(`allowed-tools: ${csv(cmd.allowed_tools)}`);
  if (cmd.group) lines.push(`group: ${cmd.group}`);
  lines.push('---');
  return lines.join('\n');
}

function slash(cmd) {
  return cmd.group ? `/${cmd.group}:${cmd.name}` : `/${cmd.name}`;
}

export function renderOutlineFromSpec(spec) {
  const cmd = spec.command;
  const title = cmd.group ? `${cmd.group}:${cmd.name}` : cmd.name;
  const impl = spec.implementation || {};
  const implDoc = impl.command_doc || spec.derived_from || 'TBD';
  const implPointers = Array.isArray(impl.code_pointers) ? impl.code_pointers : [];

  // Core P0 sections + minimal CCW-standard scaffolding.
  const body = [
    `# ${title}`,
    '',
    '## Overview',
    '',
    `- Goal: ${spec.intent?.primary_user_value || 'TBD'}`,
    `- Command: \`${slash(cmd)}\``,
    '',
    '## Usage',
    '',
    '```bash',
    `${slash(cmd)} ${spec.command?.usage_args || ''}`.trimEnd(),
    '```',
    '',
    '## Inputs',
    '',
    '- Required:',
    '  - TBD',
    '- Optional:',
    '  - TBD',
    '',
    '## Outputs / Artifacts',
    '',
    '- Writes:',
    ...(spec.artifacts?.writes?.length ? spec.artifacts.writes.map((p) => `  - \`${p}\``) : ['  - TBD']),
    '- Reads:',
    ...(spec.artifacts?.reads?.length ? spec.artifacts.reads.map((p) => `  - \`${p}\``) : ['  - TBD']),
    '',
    '## Implementation Pointers',
    '',
    `- Command doc: \`${implDoc}\``,
    '- Likely code locations:',
    ...(implPointers.length ? implPointers.map((p) => `  - \`${p}\``) : ['  - TBD']),
    '',
    '## Execution Process',
    '',
    '1. TBD',
    '',
    '## Error Handling',
    '',
    '- TBD',
    '',
    '## Examples',
    '',
    '- TBD',
    '',
  ].join('\n');

  return `${renderFrontmatter(cmd)}\n\n${body}\n`;
}

function unique(arr) {
  return Array.from(new Set(arr));
}

function headingSet(headings, level) {
  return new Set(headings.filter((h) => h.level === level).map((h) => h.text));
}

export function computeGapReport(repoRoot, spec, outlineMd, referenceMd, toolingManifest) {
  const outlineParsed = parseYamlHeader(outlineMd);
  const refParsed = parseYamlHeader(referenceMd);
  const outlineHeadings = extractHeadings(outlineParsed.body);
  const refHeadings = extractHeadings(refParsed.body);

  const p0 = [];
  for (const k of ['name', 'description', 'allowed-tools']) {
    if (!outlineParsed.header?.[k] || String(outlineParsed.header[k]).trim().length === 0) {
      p0.push(`Missing frontmatter key: \`${k}\``);
    }
  }

  const outlineTools = splitCsv(outlineParsed.header?.['allowed-tools']);
  const refTools = splitCsv(refParsed.header?.['allowed-tools']);
  if (refTools.length > 0) {
    const missing = refTools.filter((t) => !outlineTools.includes(t));
    const extra = outlineTools.filter((t) => !refTools.includes(t));
    if (missing.length || extra.length) {
      p0.push(`allowed-tools mismatch vs reference: missing=[${missing.join(', ')}] extra=[${extra.join(', ')}]`);
    }
  }

  const h2 = headingSet(outlineHeadings, 2);
  for (const required of ['Overview', 'Usage', 'Execution Process', 'Error Handling']) {
    if (!h2.has(required)) p0.push(`Missing core section: \`## ${required}\``);
  }

  const refH2 = Array.from(headingSet(refHeadings, 2));
  const missingH2 = refH2.filter((t) => !h2.has(t));
  const extraH2 = Array.from(h2).filter((t) => !refH2.includes(t));

  const p1 = [];
  if (missingH2.length) p1.push(`Missing reference H2 sections: ${missingH2.map((t) => `\`${t}\``).join(', ')}`);
  if (extraH2.length) p1.push(`Extra H2 sections (not in reference): ${extraH2.map((t) => `\`${t}\``).join(', ')}`);

  const derivedFrom = spec?.derived_from || '';
  const implementationHints = findImplementationHints({
    repoRoot,
    derivedFrom,
    command: spec?.command,
    toolingManifest,
    maxResults: 10,
  });

  return { p0, p1, implementationHints };
}

export function writeJson(repoRoot, outPath, value) {
  fs.mkdirSync(path.dirname(path.resolve(repoRoot, outPath)), { recursive: true });
  fs.writeFileSync(path.resolve(repoRoot, outPath), JSON.stringify(value, null, 2), 'utf8');
}

export function writeText(repoRoot, outPath, value) {
  fs.mkdirSync(path.dirname(path.resolve(repoRoot, outPath)), { recursive: true });
  fs.writeFileSync(path.resolve(repoRoot, outPath), value, 'utf8');
}

export function normalizeRelPath(repoRoot, p) {
  const abs = path.resolve(repoRoot, p);
  return toPosixPath(path.relative(repoRoot, abs));
}
