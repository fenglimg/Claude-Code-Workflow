#!/usr/bin/env node

/**
 * Learn plan validation (Layer 0 = schema).
 *
 * Usage:
 *   node .claude/commands/learn/_internal/learn-plan-validator.js <plan-json-path>
 *
 * Output (stdout):
 *   JSON: { ok: boolean, layer0: { ok: boolean, errors: AjvError[] } }
 */

import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import Ajv from 'ajv';
import addFormats from 'ajv-formats';

function usageAndExit(code = 1) {
  // eslint-disable-next-line no-console
  console.error('Usage: node learn-plan-validator.js <plan-json-path>');
  process.exit(code);
}

function repoRootFromHere() {
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  return path.resolve(__dirname, '../../../../');
}

function loadJson(p) {
  return JSON.parse(readFileSync(p, 'utf8'));
}

function parseArgs(argv) {
  let planPath = null;
  let profilePath = null;

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--profile') {
      profilePath = argv[i + 1] ?? null;
      i += 1;
      continue;
    }
    if (arg.startsWith('--profile=')) {
      profilePath = arg.slice('--profile='.length) || null;
      continue;
    }
    if (!planPath && !arg.startsWith('--')) planPath = arg;
  }

  return { planPath, profilePath };
}

function createValidator(schema) {
  const ajv = new Ajv({ allErrors: true, strict: false });
  addFormats(ajv);
  return ajv.compile(schema);
}

function validateDag(dependencyGraph) {
  const nodes = Array.isArray(dependencyGraph?.nodes) ? dependencyGraph.nodes : [];
  const edges = Array.isArray(dependencyGraph?.edges) ? dependencyGraph.edges : [];
  const nodeSet = new Set(nodes);

  const errors = [];
  for (const e of edges) {
    if (!e || typeof e !== 'object') continue;
    if (!nodeSet.has(e.from)) errors.push({ message: `Edge.from not in nodes: ${e.from}` });
    if (!nodeSet.has(e.to)) errors.push({ message: `Edge.to not in nodes: ${e.to}` });
  }

  const adj = new Map();
  for (const n of nodes) adj.set(n, []);
  for (const e of edges) {
    if (!e || typeof e !== 'object') continue;
    if (!adj.has(e.from)) adj.set(e.from, []);
    adj.get(e.from).push(e.to);
  }

  const visiting = new Set();
  const visited = new Set();
  const parent = new Map();

  let cycle = null;

  const dfs = (node) => {
    visiting.add(node);
    for (const next of adj.get(node) ?? []) {
      if (cycle) return;
      if (visiting.has(next)) {
        // Reconstruct a simple cycle path.
        const path = [next];
        let cur = node;
        while (cur && cur !== next) {
          path.push(cur);
          cur = parent.get(cur);
        }
        path.push(next);
        cycle = path.reverse();
        return;
      }
      if (!visited.has(next)) {
        parent.set(next, node);
        dfs(next);
      }
    }
    visiting.delete(node);
    visited.add(node);
  };

  for (const n of nodes) {
    if (!visited.has(n)) dfs(n);
    if (cycle) break;
  }

  if (cycle) errors.push({ message: `Cycle detected: ${cycle.join(' -> ')}` });

  return {
    ok: errors.length === 0,
    cycle,
    errors
  };
}

function fingerprintProfile(profile) {
  const payload = {
    profile_id: profile?.profile_id ?? null,
    experience_level: profile?.experience_level ?? null,
    known_topics: Array.isArray(profile?.known_topics)
      ? profile.known_topics.map((t) => ({ topic_id: t?.topic_id, proficiency: t?.proficiency }))
      : []
  };

  return createHash('sha256').update(JSON.stringify(payload)).digest('hex').slice(0, 12);
}

function validateProfilePlan(profile, plan) {
  const warnings = [];

  if (profile?.profile_id && plan?.profile_id && profile.profile_id !== plan.profile_id) {
    warnings.push({
      type: 'profile_id_mismatch',
      message: `Plan.profile_id (${plan.profile_id}) does not match active profile (${profile.profile_id})`
    });
  }

  const highProficiency = new Set(
    (Array.isArray(profile?.known_topics) ? profile.known_topics : [])
      .filter((t) => typeof t?.proficiency === 'number' && t.proficiency >= 0.8)
      .map((t) => t.topic_id)
      .filter(Boolean)
  );

  for (const kp of Array.isArray(plan?.knowledge_points) ? plan.knowledge_points : []) {
    const refs = Array.isArray(kp?.topic_refs) ? kp.topic_refs : [];
    const overlap = refs.filter((r) => highProficiency.has(r));
    if (overlap.length > 0) {
      warnings.push({
        type: 'high_proficiency_topic',
        knowledge_point_id: kp?.id ?? null,
        topics: overlap,
        message: `Knowledge point references topics you are already proficient in (>=0.8): ${overlap.join(', ')}`
      });
    }
  }

  return {
    ok: true, // warning-only layer
    profile_fingerprint: fingerprintProfile(profile),
    warnings
  };
}

function main() {
  const { planPath, profilePath } = parseArgs(process.argv.slice(2));
  if (!planPath) usageAndExit(1);

  const repoRoot = repoRootFromHere();
  const schemaPath = path.join(repoRoot, '.claude/workflows/cli-templates/schemas/learn-plan.schema.json');

  const plan = loadJson(planPath);
  const schema = loadJson(schemaPath);
  const validate = createValidator(schema);

  const layer0Ok = Boolean(validate(plan));
  const layer1 = layer0Ok ? validateDag(plan.dependency_graph) : { ok: false, cycle: null, errors: [] };
  const ok = layer0Ok && layer1.ok;
  const layer2 =
    profilePath && layer0Ok && layer1.ok
      ? validateProfilePlan(loadJson(profilePath), plan)
      : { ok: true, profile_fingerprint: null, warnings: [] };

  const out = {
    ok,
    layer0: {
      ok: layer0Ok,
      errors: validate.errors ?? []
    },
    layer1,
    layer2
  };

  // eslint-disable-next-line no-console
  console.log(JSON.stringify(out, null, 0));
  process.exitCode = ok ? 0 : 1;
}

try {
  main();
} catch (err) {
  const out = {
    ok: false,
    layer0: {
      ok: false,
      errors: [{ message: err?.message ?? String(err) }]
    }
  };
  // eslint-disable-next-line no-console
  console.log(JSON.stringify(out, null, 0));
  process.exitCode = 1;
}
