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

describe('learn/profile.md invariants (select/show)', () => {
  it('contains select/show implementation blocks that use ccw learn:* APIs', () => {
    const content = readFileSync(path.join(repoRoot, '.claude/commands/learn/profile.md'), 'utf8');

    const selectSection = getSection(content, '### Phase 4: Profile Selection Flow (select)');
    assert.ok(selectSection.includes('ccw learn:read-state --json'));
    assert.ok(selectSection.includes('ccw learn:update-state --field active_profile_id'));

    const showSection = getSection(content, '### Phase 5: Profile Display Flow (show)');
    assert.ok(showSection.includes('ccw learn:read-state --json'));
    assert.ok(showSection.includes('ccw learn:read-profile'));
  });
});

