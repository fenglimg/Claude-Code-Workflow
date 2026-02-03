import fs from 'node:fs';
import path from 'node:path';

/**
 * Parse the first YAML frontmatter block (--- ... ---) into a simple key/value map.
 * This intentionally supports only the subset used by CCW command markdown files.
 */
export function parseYamlHeader(markdown) {
  const match = markdown.match(/^---\s*\r?\n([\s\S]*?)\r?\n---\s*\r?\n/);
  if (!match) return { header: null, body: markdown };

  const raw = match[1];
  const header = {};
  for (const line of raw.split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Za-z0-9_-]+)\s*:\s*(.*?)\s*$/);
    if (!m) continue;
    const key = m[1];
    let value = m[2];
    // strip surrounding quotes
    const q = value.match(/^"(.*)"$/);
    if (q) value = q[1];
    header[key] = value;
  }

  return { header, body: markdown.slice(match[0].length) };
}

export function extractHeadings(markdown) {
  const headings = [];
  for (const line of markdown.split(/\r?\n/)) {
    const m = line.match(/^(#{1,6})\s+(.+?)\s*$/);
    if (!m) continue;
    const level = m[1].length;
    const text = m[2].trim();
    headings.push({ level, text });
  }
  return headings;
}

export function readCommandFile(absPath) {
  const markdown = fs.readFileSync(absPath, 'utf8');
  const { header, body } = parseYamlHeader(markdown);
  const headings = extractHeadings(body);
  return { absPath, markdown, header, body, headings };
}

export function toPosixPath(p) {
  return p.split(path.sep).join('/');
}

