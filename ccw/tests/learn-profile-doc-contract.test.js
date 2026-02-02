import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, '../..');

function getSection(content, heading) {
  const start = content.indexOf(heading);
  assert.ok(start !== -1, `Missing heading: ${heading}`);
  const rest = content.slice(start);
  const nextHeadingMatch = rest.slice(heading.length).match(/\n###\s+/);
  const end = nextHeadingMatch ? start + heading.length + nextHeadingMatch.index : content.length;
  return content.slice(start, end);
}

describe('learn/profile.md contract', () => {
  it('keeps Cycle-5 contract: no show/select flows; create/update only', () => {
    const content = readFileSync(path.join(repoRoot, '.claude/commands/learn/profile.md'), 'utf8');

    assert.ok(content.includes('Usage: /learn:profile create|update'));
    assert.ok(!content.includes("case 'select'"));
    assert.ok(!content.includes("case 'show'"));
    assert.ok(!content.includes('function selectFlow'));
    assert.ok(!content.includes('function showFlow'));
  });

  it('keeps --goal update helper consistent (extractKeywords)', () => {
    const content = readFileSync(path.join(repoRoot, '.claude/commands/learn/profile.md'), 'utf8');

    const references = content.includes('extractKeywords(');
    const defines = content.includes('function extractKeywords') || content.includes('const extractKeywords');
    if (references) assert.ok(defines, 'profile.md references extractKeywords() but does not define it');
  });

  it('uses a deterministic scratch-file flow for tool-verified challenges (no placeholders)', () => {
    const content = readFileSync(path.join(repoRoot, '.claude/commands/learn/profile.md'), 'utf8');

    assert.ok(!content.includes("codeContent = '/* user-provided code */';"));
    assert.ok(!content.includes('/* user-provided code */'));
    assert.ok(content.includes('.workflow/.scratchpad/learn-challenges'));
  });

  it('avoids brittle JSON.parse(raw) for mcp-runner output', () => {
    const content = readFileSync(path.join(repoRoot, '.claude/commands/learn/profile.md'), 'utf8');

    assert.ok(!content.includes('challengeResult = JSON.parse(raw)'));
    assert.ok(content.includes('challengeResult = lastJsonObjectFromText(raw)'));
  });
});

