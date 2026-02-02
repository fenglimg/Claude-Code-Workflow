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

describe('learn/profile.md invariants', () => {
  it('documents Topic V0 + Gemini packs and avoids show/select flows in Cycle-5', () => {
    const content = readFileSync(path.join(repoRoot, '.claude/commands/learn/profile.md'), 'utf8');

    const execSection = getSection(content, '## Execution Process');
    assert.ok(execSection.includes('Topic V0'));
    assert.ok(execSection.includes('t_<sha1(normalized_label)>'));
    assert.ok(execSection.includes('ccw learn:ensure-pack'));

    // Cycle-5 decision: remove show/select branches from the main interaction.
    assert.ok(!content.includes('/learn:profile show'));
    assert.ok(!content.includes('/learn:profile select'));
    assert.ok(!content.includes('function showFlow'));
    assert.ok(!content.includes('function selectFlow'));
  });
});

