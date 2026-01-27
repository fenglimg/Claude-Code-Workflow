import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, '../..');

const dictPath = path.join(repoRoot, '.workflow/learn/tech-stack/KeywordDictionary.json');

describe('learn/background-parser', () => {
  it('normalizes versions and common punctuation', async () => {
    const { normalizeForLookup } = await import('../dist/learn/background-parser.js');
    assert.equal(normalizeForLookup('ReactJS'), 'reactjs');
    assert.equal(normalizeForLookup('Node.js v20'), 'nodejs');
    assert.equal(normalizeForLookup('react@18'), 'react');
    assert.equal(normalizeForLookup('React-Router'), 'react router');
    assert.equal(normalizeForLookup('C#'), 'c#');
  });

  it('parses background text into inferred skills (rules-only)', async () => {
    const dict = JSON.parse(readFileSync(dictPath, 'utf8'));
    const { parseBackground } = await import('../dist/learn/background-parser.js');

    const res = await parseBackground('ReactJS + Node.js v20, 3 years experience', dict);
    assert.equal(typeof res.truncated, 'boolean');
    assert.ok(Array.isArray(res.skills));
    assert.ok(res.skills.length >= 1);

    const topics = new Set(res.skills.map((s) => s.topic_id));
    assert.ok(topics.has('react'));
    assert.ok(topics.has('node'));

    for (const s of res.skills) {
      assert.equal(typeof s.topic_id, 'string');
      assert.equal(typeof s.proficiency, 'number');
      assert.ok(s.proficiency >= 0 && s.proficiency <= 1);
      assert.equal(typeof s.confidence, 'number');
      assert.ok(s.confidence >= 0 && s.confidence <= 1);
      assert.ok(Array.isArray(s.evidence));
      assert.ok(s.evidence.length >= 1);
    }
  });
});

