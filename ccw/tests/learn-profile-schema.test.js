import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import Ajv from 'ajv';
import addFormats from 'ajv-formats';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, '../..');

const schemaPath = path.join(repoRoot, '.claude/workflows/cli-templates/schemas/learn-profile.schema.json');

function compileSchema() {
  const schema = JSON.parse(readFileSync(schemaPath, 'utf8'));
  const ajv = new Ajv({ allErrors: true, strict: false });
  addFormats(ajv);
  return ajv.compile(schema);
}

describe('learn-profile.schema.json', () => {
  it('accepts structured evidence objects (new format)', () => {
    const validate = compileSchema();
    const now = new Date().toISOString();

    const profile = {
      profile_id: 'profile-test',
      experience_level: 'beginner',
      known_topics: [
        {
          topic_id: 'typescript',
          proficiency: 0.5,
          confidence: 0.7,
          last_updated: now,
          evidence: [
            {
              evidence_type: 'tool-verified',
              kind: 'real_mcp',
              timestamp: now,
              data: { type: 'real_mcp', score: 1 },
              verification_metadata: {
                method: 'mcp-runner',
                timestamp: now,
                test_results: { tests_passed: 3, tests_total: 3, score: 1, execution_time_ms: 50 },
                confidence_source: 'tool-verified'
              }
            }
          ]
        }
      ]
    };

    const ok = validate(profile);
    assert.equal(ok, true, JSON.stringify(validate.errors, null, 2));
  });

  it('accepts legacy evidence strings (backward compatibility)', () => {
    const validate = compileSchema();
    const now = new Date().toISOString();

    const profile = {
      profile_id: 'profile-legacy',
      experience_level: 'beginner',
      known_topics: [
        {
          topic_id: 'javascript',
          proficiency: 0.2,
          last_updated: now,
          evidence: ['{\"type\":\"self_assessment\",\"score\":0.2}']
        }
      ]
    };

    const ok = validate(profile);
    assert.equal(ok, true, JSON.stringify(validate.errors, null, 2));
  });

  it('accepts adaptive assessment evidence payloads (round history)', () => {
    const validate = compileSchema();
    const now = new Date().toISOString();

    const profile = {
      profile_id: 'profile-adaptive',
      experience_level: 'beginner',
      known_topics: [
        {
          topic_id: 'typescript',
          proficiency: 0.6,
          confidence: 0.6,
          last_updated: now,
          evidence: [
            {
              evidence_type: 'self-report',
              kind: 'adaptive_assessment',
              timestamp: now,
              data: {
                rounds: [
                  {
                    round_index: 0,
                    target_difficulty: 0.5,
                    question_count: 4,
                    score_mean: 0.75,
                    range_after: { min: 0.4, max: 0.6 },
                    confidence_after: 0.4
                  }
                ],
                range_after: { min: 0.4, max: 0.6 },
                confidence_after: 0.4,
                target_difficulty: 0.5
              }
            }
          ]
        }
      ]
    };

    const ok = validate(profile);
    assert.equal(ok, true, JSON.stringify(validate.errors, null, 2));
  });
});

describe('KeywordDictionary.json', () => {
  it('is valid JSON and contains categories + aliases', () => {
    const dictPath = path.join(repoRoot, '.workflow/learn/tech-stack/KeywordDictionary.json');
    const dict = JSON.parse(readFileSync(dictPath, 'utf8'));

    assert.equal(typeof dict, 'object');
    assert.equal(typeof dict.categories, 'object');
    assert.equal(typeof dict.aliases, 'object');

    const aliasKeys = Object.keys(dict.aliases);
    assert.ok(aliasKeys.length >= 10, 'Expected at least 10 alias mappings');
    assert.ok(aliasKeys.every(k => k === k.toLowerCase()), 'Alias keys must be lowercase');
  });
});

