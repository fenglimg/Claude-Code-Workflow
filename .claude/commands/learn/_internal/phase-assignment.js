/**
 * Phase assignment helpers for learn plans (DAG-based).
 *
 * Notes:
 * - Levels are 0-based (root nodes are level 0).
 * - Consumers can map levels to 1-based phase numbers.
 */

/**
 * Compute 0-based topological "depth" levels for each node in a DAG.
 *
 * @param {{ nodes?: string[], edges?: Array<{from: string, to: string}> }} dependencyGraph
 * @returns {Record<string, number>}
 */
export function computeTopologicalLevels(dependencyGraph) {
  const nodes = Array.isArray(dependencyGraph?.nodes) ? dependencyGraph.nodes : [];
  const edges = Array.isArray(dependencyGraph?.edges) ? dependencyGraph.edges : [];

  /** @type {Map<string, string[]>} */
  const outgoing = new Map();
  /** @type {Map<string, number>} */
  const inDegree = new Map();

  const ensureNode = (id) => {
    if (!outgoing.has(id)) outgoing.set(id, []);
    if (!inDegree.has(id)) inDegree.set(id, 0);
  };

  for (const n of nodes) ensureNode(String(n));
  for (const e of edges) {
    if (!e || typeof e !== 'object') continue;
    if (!e.from || !e.to) continue;
    const from = String(e.from);
    const to = String(e.to);
    ensureNode(from);
    ensureNode(to);
    outgoing.get(from).push(to);
    inDegree.set(to, (inDegree.get(to) || 0) + 1);
  }

  /** @type {Record<string, number>} */
  const levels = {};

  const queue = [];
  for (const [id, deg] of inDegree.entries()) {
    if ((deg || 0) === 0) {
      queue.push(id);
      levels[id] = 0;
    }
  }

  while (queue.length > 0) {
    const cur = queue.shift();
    const curLevel = levels[cur] ?? 0;
    for (const nxt of outgoing.get(cur) || []) {
      // The longest-path depth in a DAG can be computed by relaxing edges in topo order.
      levels[nxt] = Math.max(levels[nxt] ?? 0, curLevel + 1);
      inDegree.set(nxt, (inDegree.get(nxt) || 0) - 1);
      if ((inDegree.get(nxt) || 0) === 0) queue.push(nxt);
    }
  }

  // Best-effort: if the graph is cyclic or nodes were missing, default remaining to level 0.
  for (const id of inDegree.keys()) {
    if (typeof levels[id] !== 'number') levels[id] = 0;
  }

  return levels;
}

/**
 * @param {number} num
 * @param {number} total
 * @returns {string}
 */
export function getPhaseNameByNumber(num, total) {
  const n = Number(num);
  const t = Number(total);

  // Always prefer ending with "Mastery" when total < 5.
  const presets = {
    1: ['Foundation'],
    2: ['Foundation', 'Mastery'],
    3: ['Foundation', 'Core Concepts', 'Mastery'],
    4: ['Foundation', 'Core Concepts', 'Advanced Topics', 'Mastery'],
    5: ['Foundation', 'Core Concepts', 'Advanced Topics', 'Specialization', 'Mastery']
  };

  const names = presets[t] || presets[5];
  return names[n - 1] || `Phase ${n}`;
}

/**
 * @param {Array<Record<string, any>>} knowledgePoints
 * @param {{ nodes?: string[], edges?: Array<{from: string, to: string}> }} dependencyGraph
 * @returns {{ knowledgePoints: Array<Record<string, any>>, phases: Array<Record<string, any>> }}
 */
export function assignPhases(knowledgePoints, dependencyGraph) {
  const kps = Array.isArray(knowledgePoints) ? knowledgePoints : [];

  const nodes =
    Array.isArray(dependencyGraph?.nodes) && dependencyGraph.nodes.length
      ? dependencyGraph.nodes
      : kps.map((kp) => kp?.id).filter(Boolean);
  const edges = Array.isArray(dependencyGraph?.edges) ? dependencyGraph.edges : [];

  const levels = computeTopologicalLevels({ nodes, edges });
  const levelValues = Object.values(levels);
  const maxLevel = levelValues.length ? Math.max(...levelValues) : 0;

  const rawPhaseCount = Math.max(1, maxLevel + 1);
  const phaseCount = Math.min(rawPhaseCount, 5);
  const levelsPerPhase = Math.max(1, Math.ceil((maxLevel + 1) / phaseCount));

  const updated = kps.map((kp) => {
    const id = kp?.id;
    const level = typeof levels[id] === 'number' ? levels[id] : 0;
    const phase = Math.floor(level / levelsPerPhase) + 1;
    return { ...kp, phase };
  });

  const phases = [];
  for (let i = 1; i <= phaseCount; i += 1) {
    const ids = updated.map((kp) => (kp?.phase === i ? kp?.id : null)).filter(Boolean);
    phases.push({
      phase_number: i,
      phase_name: getPhaseNameByNumber(i, phaseCount),
      knowledge_point_ids: ids,
      description: `Auto-assigned phase ${i} of ${phaseCount} (levelsPerPhase=${levelsPerPhase})`,
      status: i === 1 ? 'active' : 'locked'
    });
  }

  return { knowledgePoints: updated, phases };
}
